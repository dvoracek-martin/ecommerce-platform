import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { Customer } from '../../../../dto/customer/customer-dto';
import { ResponseLocaleDto } from '../../../../dto/configuration/response-locale-dto';
import { CustomerService } from '../../../../services/customer.service';
import { EmailService } from '../../../../services/email.service';
import { ConfigurationService } from '../../../../services/configuration.service';
import { LocaleMapperService } from '../../../../services/locale-mapper.service';
import { EmailObjectsEnum } from '../../../../dto/email/email-objects-enum';
import { EmailSendDTO } from '../../../../dto/email/email-send-dto';
import { EmailGetOrDeleteEvent } from '../../../../dto/email/email-get-or-delete-event';

interface EmailTemplateContent {
  subject: string;
  body: string;
}

interface EmailTemplate {
  type: EmailObjectsEnum;
  localizedFields: { [key: string]: EmailTemplateContent };
  variables: string[];
}

interface ProcessedEmail {
  subject: string;
  body: string;
  recipientEmail: string;
  customerId: string;
}

@Component({
  selector: 'app-emails-admin-send',
  templateUrl: './emails-admin-send.component.html',
  styleUrls: ['./emails-admin-send.component.scss'],
  standalone: false,
  animations: [
    trigger('previewToggle', [
      state('hidden', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('visible', style({
        height: '*',
        opacity: 1,
        overflow: 'visible'
      })),
      transition('hidden <=> visible', [
        animate('400ms ease-in-out')
      ])
    ])
  ]
})
export class EmailsAdminSendComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form Management
  emailForm!: FormGroup;
  showPreview = false;

  // Email Configuration
  selectedEmailType: EmailObjectsEnum | null = null;
  selectedLanguage: string = '';
  emailSubject: string = '';
  emailBody: string = '';

  // Form Controls
  subjectControl = new FormControl('', [Validators.required]);
  bodyControl = new FormControl('', [Validators.required]);

  // Customer Selection
  customerSearchControl = new FormControl();
  selectedCustomers: Customer[] = [];
  allCustomers: Customer[] = [];
  filteredCustomers: Observable<Customer[]>;

  // Available data
  availableEmailTypes: EmailObjectsEnum[] = Object.values(EmailObjectsEnum);

  usedLocales: ResponseLocaleDto[] = [];
  emailTemplates: Map<EmailObjectsEnum, EmailTemplate> = new Map();

  isLoading = false;
  isInitializing = true;
  loadError: string | null = null;
  templatesLoaded = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private customerService: CustomerService,
    private emailService: EmailService,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
    private translateService: TranslateService,
    private snackBar: MatSnackBar
  ) {
    // Setup customer search
    this.filteredCustomers = this.customerSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => this.filterCustomers(value))
    );
  }

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.emailForm = this.fb.group({
      showPreview: [false]
    });
  }

  private loadInitialData(): void {
    this.isInitializing = true;
    this.loadError = null;

    forkJoin({
      settings: this.configurationService.getLastAppSettings(),
      customers: this.customerService.getAll()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ settings, customers }) => {
        this.usedLocales = (settings.usedLocales || []).map(locale => ({
          ...locale,
          translatedName: this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode)
        }));
        this.allCustomers = customers;

        // Set default language to current user's language or first available
        this.selectedLanguage = this.localeMapperService.getCurrentLocale();
        if (!this.usedLocales.some(locale => this.getLocaleString(locale) === this.selectedLanguage)) {
          this.selectedLanguage = this.usedLocales[0] ? this.getLocaleString(this.usedLocales[0]) : 'en_US';
        }

        // Load email templates from backend
        this.loadEmailTemplates();
      },
      error: (error) => {
        console.error('Failed to load initial data:', error);
        this.loadError = 'Failed to load initial data. Please try again.';
        this.isInitializing = false;
        this.snackBar.open('Failed to load initial data', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadEmailTemplates(): void {
    const templateRequests = this.availableEmailTypes.map(type => {
      const request: EmailGetOrDeleteEvent = {
        objectType: type
      };

      return this.emailService.getEmail(request).pipe(
        map(response => ({ type, response, success: true })),
        catchError(error => {
          console.warn(`Failed to load template for ${type}:`, error);
          return of({ type, response: null, success: false });
        }),
        takeUntil(this.destroy$)
      );
    });

    forkJoin(templateRequests).subscribe({
      next: (results) => {
        let successfulLoads = 0;

        results.forEach(({ type, response, success }) => {
          if (success && response) {
            // Convert ResponseEmailDTO to EmailTemplate format
            const localizedFields: { [key: string]: EmailTemplateContent } = {};

            if (response.localizedFields) {
              Object.keys(response.localizedFields).forEach(localeKey => {
                const field = response.localizedFields[localeKey];
                // Map 'name' to subject and 'description' to body as per backend structure
                localizedFields[localeKey] = {
                  subject: field.name || '',
                  body: field.description || ''
                };
              });
            }

            this.emailTemplates.set(type, {
              type: type,
              localizedFields: localizedFields,
              variables: this.getVariablesForType(type)
            });
            successfulLoads++;
          } else {
            // Create empty template for failed loads
            const emptyTemplate: EmailTemplate = {
              type: type,
              localizedFields: {},
              variables: this.getVariablesForType(type)
            };
            this.emailTemplates.set(type, emptyTemplate);
          }
        });

        this.templatesLoaded = successfulLoads > 0;
        this.isInitializing = false;

        if (successfulLoads === 0) {
          this.loadError = 'No email templates could be loaded from the server.';
          this.snackBar.open('No email templates found. Using empty templates.', 'Close', {
            duration: 5000,
            panelClass: ['info-snackbar']
          });
        } else if (successfulLoads < this.availableEmailTypes.length) {
          this.snackBar.open(`Loaded ${successfulLoads} of ${this.availableEmailTypes.length} templates`, 'Close', {
            duration: 3000,
            panelClass: ['info-snackbar']
          });
        } else {
          this.snackBar.open('All email templates loaded successfully', 'Close', {
            duration: 3000
          });
        }

        // Auto-select first email type if templates loaded successfully
        if (this.availableEmailTypes.length > 0) {
          this.selectedEmailType = this.availableEmailTypes[0];
          this.updateEmailContentFromTemplate();
        }
      },
      error: (error) => {
        console.error('Failed to load email templates:', error);
        this.loadError = 'Failed to load email templates. Please try again.';
        this.isInitializing = false;

        // Initialize with empty templates as fallback
        this.initializeEmptyTemplates();
        this.snackBar.open('Using empty email templates due to loading error', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private initializeEmptyTemplates(): void {
    // Create empty templates when backend loading fails
    this.availableEmailTypes.forEach(type => {
      const emptyTemplate: EmailTemplate = {
        type: type,
        localizedFields: {},
        variables: this.getVariablesForType(type)
      };
      this.emailTemplates.set(type, emptyTemplate);
    });
    this.templatesLoaded = false;
  }

  private getVariablesForType(type: EmailObjectsEnum): string[] {
    const variableMap = new Map<EmailObjectsEnum, string[]>([
      [EmailObjectsEnum.REGISTRATION, ['firstName', 'lastName', 'email']],
      [EmailObjectsEnum.PASSWORD_RESET, ['firstName', 'resetLink']],
      [EmailObjectsEnum.ORDER_CONFIRMATION, ['firstName', 'orderNumber', 'orderDate', 'totalAmount']],
      [EmailObjectsEnum.NEWSLETTER, ['firstName']],
      [EmailObjectsEnum.CUSTOM, ['firstName', 'lastName', 'email']]
    ]);

    return variableMap.get(type) || [];
  }

  filterCustomers(value: string | Customer): Observable<Customer[]> {
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value && typeof value === 'object') {
      filterValue = value.email?.toLowerCase() || '';
    }

    return of(this.allCustomers).pipe(
      map(customers => customers.filter(customer =>
          !this.isCustomerSelected(customer) && (
            customer.firstName?.toLowerCase().includes(filterValue) ||
            customer.lastName?.toLowerCase().includes(filterValue) ||
            customer.email?.toLowerCase().includes(filterValue)
          )
      ))
    );
  }

  displayCustomer(customer: Customer): string {
    return customer ? `${customer.firstName} ${customer.lastName} (${customer.email})` : '';
  }

  onCustomerSelect(customer: Customer): void {
    if (!this.isCustomerSelected(customer)) {
      this.selectedCustomers.push(customer);
      this.customerSearchControl.setValue('');
    }
  }

  removeCustomer(customer: Customer): void {
    this.selectedCustomers = this.selectedCustomers.filter(c => c.id !== customer.id);
  }

  isCustomerSelected(customer: Customer): boolean {
    return this.selectedCustomers.some(c => c.id === customer.id);
  }

  clearSelection(): void {
    this.selectedCustomers = [];
  }

  onEmailTypeChange(): void {
    this.updateEmailContentFromTemplate();
  }

  onLanguageChange(): void {
    this.updateEmailContentFromTemplate();
  }

  updateEmailContentFromTemplate(): void {
    if (!this.selectedEmailType || !this.selectedLanguage) {
      this.emailSubject = '';
      this.emailBody = '';
      this.subjectControl.setValue('');
      this.bodyControl.setValue('');
      return;
    }

    const template = this.emailTemplates.get(this.selectedEmailType);
    if (template && template.localizedFields[this.selectedLanguage]) {
      const localizedContent = template.localizedFields[this.selectedLanguage];
      this.emailSubject = localizedContent.subject || '';
      this.emailBody = localizedContent.body || '';
      this.subjectControl.setValue(this.emailSubject);
      this.bodyControl.setValue(this.emailBody);
    } else {
      // No content for selected language, clear the fields
      this.emailSubject = '';
      this.emailBody = '';
      this.subjectControl.setValue('');
      this.bodyControl.setValue('');

      // Show warning if we have the template but not for this language
      if (template && Object.keys(template.localizedFields).length > 0) {
        const availableLanguages = Object.keys(template.localizedFields).join(', ');
        this.snackBar.open(`No content available for ${this.selectedLanguage}. Available: ${availableLanguages}`, 'Close', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
    }
  }

  getEmailTypeDisplayName(type: EmailObjectsEnum): string {
    const displayNames = new Map<EmailObjectsEnum, string>([
      [EmailObjectsEnum.REGISTRATION, 'Registration Welcome'],
      [EmailObjectsEnum.PASSWORD_RESET, 'Password Reset'],
      [EmailObjectsEnum.ORDER_CONFIRMATION, 'Order Confirmation'],
      [EmailObjectsEnum.NEWSLETTER, 'Newsletter'],
      [EmailObjectsEnum.CUSTOM, 'Custom Email']
    ]);

    return displayNames.get(type) || type.toString();
  }

  getLocaleString(locale: ResponseLocaleDto): string {
    return `${locale.languageCode}_${locale.regionCode}`;
  }

  get availableVariables(): string[] {
    if (!this.selectedEmailType) return [];
    const template = this.emailTemplates.get(this.selectedEmailType);
    return template ? template.variables : [];
  }

  hasTemplateContent(): boolean {
    if (!this.selectedEmailType) return false;
    const template = this.emailTemplates.get(this.selectedEmailType);
    return template && Object.keys(template.localizedFields).length > 0;
  }

  insertVariable(variable: string): void {
    const variableText = `{{${variable}}}`;
    const currentBody = this.emailBody || '';

    // Simple insertion at the end - you could enhance this to insert at cursor position
    this.emailBody = currentBody + (currentBody ? ' ' : '') + variableText;
    this.bodyControl.setValue(this.emailBody);
  }

  getPreviewBody(): string {
    if (!this.emailBody) return '';

    // Replace variables with sample values for preview
    return this.emailBody
      .replace(/{{firstName}}/g, '<span class="variable">[Customer First Name]</span>')
      .replace(/{{lastName}}/g, '<span class="variable">[Customer Last Name]</span>')
      .replace(/{{email}}/g, '<span class="variable">[Customer Email]</span>')
      .replace(/{{resetLink}}/g, '<span class="variable">[Reset Link]</span>')
      .replace(/{{orderNumber}}/g, '<span class="variable">[Order Number]</span>')
      .replace(/{{orderDate}}/g, '<span class="variable">[Order Date]</span>')
      .replace(/{{totalAmount}}/g, '<span class="variable">[Total Amount]</span>')
      .replace(/\n/g, '<br>');
  }

  onPreviewToggle(): void {
    this.showPreview = this.emailForm.get('showPreview')?.value;
  }

  canSendEmail(): boolean {
    return this.selectedEmailType !== null &&
      this.selectedCustomers.length > 0 &&
      this.emailSubject.trim() !== '' &&
      this.emailBody.trim() !== '' &&
      this.subjectControl.valid &&
      this.bodyControl.valid &&
      !this.isLoading;
  }

  sendEmail(): void {
    if (!this.canSendEmail()) return;

    this.isLoading = true;

    // Process email content with actual variable replacements for each customer
    const processedEmails = this.processEmailsWithVariables();

    // Send individual emails to each customer with their personalized content
    this.sendIndividualEmails(processedEmails);
  }

  private processEmailsWithVariables(): ProcessedEmail[] {
    return this.selectedCustomers.map(customer => {
      let subject = this.emailSubject;
      let body = this.emailBody;

      // Replace variables with actual customer data
      const variableReplacements = this.getVariableReplacements(customer);

      Object.keys(variableReplacements).forEach(variable => {
        const regex = new RegExp(`{{${variable}}}`, 'g');
        subject = subject.replace(regex, variableReplacements[variable]);
        body = body.replace(regex, variableReplacements[variable]);
      });

      return {
        subject,
        body,
        recipientEmail: customer.email!,
        customerId: customer.id!
      };
    });
  }

  private getVariableReplacements(customer: Customer): { [key: string]: string } {
    const replacements: { [key: string]: string } = {
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || ''
    };

    // Add type-specific variables with default values
    switch (this.selectedEmailType) {
      case EmailObjectsEnum.PASSWORD_RESET:
        // TODO
        // replacements.resetLink = this.generateResetLink(customer);
        break;
      case EmailObjectsEnum.ORDER_CONFIRMATION:
        // replacements.orderNumber = 'N/A';
        // replacements.orderDate = new Date().toLocaleDateString();
        // replacements.totalAmount = 'N/A';
        break;
    }

    return replacements;
  }

  private generateResetLink(customer: Customer): string {
    // In a real application, you would generate a proper reset token and link
    return `https://yourapp.com/reset-password?token=temp_token&email=${encodeURIComponent(customer.email || '')}`;
  }

  private sendIndividualEmails(processedEmails: ProcessedEmail[]): void {
    const emailRequests = processedEmails.map(processedEmail => {
      const emailSendData: EmailSendDTO = {
        emailType: this.selectedEmailType!.toString(),
        subject: processedEmail.subject,
        body: processedEmail.body,
        recipients: [processedEmail.recipientEmail],
        language: this.selectedLanguage,
        customerIds: [processedEmail.customerId]
      };

      return this.emailService.sendEmail(emailSendData).pipe(
        catchError(error => {
          console.error(`Failed to send email to ${processedEmail.recipientEmail}:`, error);
          // Return the error but don't stop other requests
          return of({ success: false, email: processedEmail.recipientEmail, error });
        })
      );
    });

    // Send all emails in parallel
    forkJoin(emailRequests).subscribe({
      next: (results) => {
        this.isLoading = false;

        const successfulSends = results.filter(result => result === null || (result as any).success !== false).length;
        const failedSends = results.filter(result => result && (result as any).success === false).length;

        if (failedSends === 0) {
          this.snackBar.open(`All ${successfulSends} emails sent successfully`, 'Close', {
            duration: 5000
          });
        } else if (successfulSends > 0) {
          this.snackBar.open(`${successfulSends} emails sent successfully, ${failedSends} failed`, 'Close', {
            duration: 5000,
            panelClass: ['warning-snackbar']
          });
        } else {
          this.snackBar.open('All emails failed to send', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }

        // Navigate back to emails configuration
        this.router.navigate(['/admin/configuration/emails']);
      },
      error: (error) => {
        console.error('Error sending emails:', error);
        this.isLoading = false;

        let errorMessage = 'Failed to send emails';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error occurred while sending emails. Please try again later.';
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getVariableDisplayName(variable: string): string {
    const variableNames: { [key: string]: string } = {
      'firstName': 'EMAILS.VARIABLES.FIRST_NAME',
      'lastName': 'EMAILS.VARIABLES.LAST_NAME',
      'email': 'EMAILS.VARIABLES.EMAIL',
      'resetLink': 'EMAILS.VARIABLES.RESET_LINK',
      'orderNumber': 'EMAILS.VARIABLES.ORDER_NUMBER',
      'orderDate': 'EMAILS.VARIABLES.ORDER_DATE',
      'totalAmount': 'EMAILS.VARIABLES.TOTAL_AMOUNT'
    };

    return variableNames[variable] || variable;
  }

  getRecipientEmailsPreview(): string {
    if (this.selectedCustomers.length === 0) return '';

    const maxEmailsToShow = 3;
    const emails = this.selectedCustomers.slice(0, maxEmailsToShow).map(c => c.email);

    if (this.selectedCustomers.length <= maxEmailsToShow) {
      return emails.join(', ');
    } else {
      return emails.join(', ') + ` +${this.selectedCustomers.length - maxEmailsToShow} more`;
    }
  }

  getCustomerLanguage(customer: Customer): string {
    if (customer.preferredLanguageId) {
      const locale = this.usedLocales.find(l => l.id === customer.preferredLanguageId);
      return locale ? locale.translatedName : 'Unknown';
    }
    return 'Default';
  }

  cancel(): void {
    this.router.navigate(['/admin/configuration/emails']);
  }

  retryLoadTemplates(): void {
    this.loadError = null;
    this.isInitializing = true;
    this.loadEmailTemplates();
  }

  navigateToTemplates(): void {
    this.router.navigate(['/admin/configuration/emails/templates']);
  }

  protected readonly Object = Object;
}
