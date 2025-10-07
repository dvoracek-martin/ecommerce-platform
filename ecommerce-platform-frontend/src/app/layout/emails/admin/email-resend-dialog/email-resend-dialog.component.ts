import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { EmailService } from '../../../../services/email.service';
import { ConfigurationService } from '../../../../services/configuration.service';
import { LocaleMapperService } from '../../../../services/locale-mapper.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ResponseEmailLogDTO } from '../../../../dto/email/response-email-log-dto';
import { ResponseLocaleDto } from '../../../../dto/configuration/response-locale-dto';
import { EmailSendDTO } from '../../../../dto/email/email-send-dto';

@Component({
  selector: 'app-email-resend-dialog',
  templateUrl: './email-resend-dialog.component.html',
  styleUrls: ['./email-resend-dialog.component.scss'],
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
export class EmailResendDialogComponent implements OnInit {
  emailForm: FormGroup;
  subjectControl: FormControl;
  bodyControl: FormControl;
  languageControl: FormControl;
  showPreviewControl: FormControl;

  isResending = false;
  isInitializing = true;
  showPreview = false;

  usedLocales: ResponseLocaleDto[] = [];
  availableVariables: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      emailLog: ResponseEmailLogDTO,
      mode: 'view' | 'resend'
    },
    private dialogRef: MatDialogRef<EmailResendDialogComponent>,
    private emailService: EmailService,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    const isViewMode = this.data.mode === 'view';

    // FIXED: Correctly map subject to subject and body to body
    this.subjectControl = new FormControl(
      { value: this.data.emailLog.subject || '', disabled: isViewMode },
      [Validators.required, Validators.maxLength(200)]
    );

    this.bodyControl = new FormControl(
      { value: this.data.emailLog.body || '', disabled: isViewMode },
      [Validators.required, Validators.maxLength(5000)]
    );

    this.languageControl = new FormControl(
      { value: this.data.emailLog.language || 'en_US', disabled: isViewMode },
      [Validators.required]
    );

    this.showPreviewControl = new FormControl(false);

    // Initialize form group with correct mappings
    this.emailForm = this.fb.group({
      subject: this.subjectControl,
      body: this.bodyControl,
      language: this.languageControl,
      showPreview: this.showPreviewControl
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.configurationService.getLastAppSettings().subscribe({
      next: (settings) => {
        this.usedLocales = (settings.usedLocales || []).map(locale => ({
          ...locale,
          translatedName: this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode)
        }));

        // Set default language if current one is not available
        const currentLanguage = this.languageControl.value;
        if (!this.usedLocales.some(locale => this.getLocaleString(locale) === currentLanguage)) {
          const defaultLocale = this.usedLocales[0];
          if (defaultLocale) {
            this.languageControl.setValue(this.getLocaleString(defaultLocale));
          }
        }

        this.setAvailableVariables();
        this.isInitializing = false;
      },
      error: (error) => {
        console.error('Failed to load initial data:', error);
        this.isInitializing = false;
        this.snackBar.open('Failed to load configuration data', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private setAvailableVariables(): void {
    const variableMap: { [key: string]: string[] } = {
      'REGISTRATION': ['firstName', 'lastName', 'email'],
      'PASSWORD_RESET': ['firstName', 'resetLink'],
      'ORDER_CONFIRMATION': ['firstName', 'orderNumber', 'orderDate', 'totalAmount'],
      'NEWSLETTER': ['firstName'],
      'CUSTOM': ['firstName', 'lastName', 'email']
    };

    this.availableVariables = variableMap[this.data.emailLog.emailType] || ['firstName', 'lastName', 'email'];
  }

  getLocaleString(locale: ResponseLocaleDto): string {
    return `${locale.languageCode}_${locale.regionCode}`;
  }

  getOriginalLanguageDisplayName(): string {
    const locale = this.usedLocales.find(l =>
      this.getLocaleString(l) === this.data.emailLog.language
    );
    return locale ? locale.translatedName : this.data.emailLog.language;
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

  insertVariable(variable: string): void {
    if (this.isViewMode()) return;

    const variableText = `{{${variable}}}`;
    const currentBody = this.bodyControl.value || '';

    // Get textarea element for cursor position insertion
    const textarea = document.querySelector('textarea[formControlName="body"]') as HTMLTextAreaElement;

    if (textarea && document.activeElement === textarea) {
      // Insert at cursor position
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = currentBody.substring(0, start) + variableText + currentBody.substring(end);
      this.bodyControl.setValue(newBody);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variableText.length;
        textarea.focus();
      });
    } else {
      // Simple insertion at the end
      this.bodyControl.setValue(currentBody + (currentBody ? ' ' : '') + variableText);
    }
  }

  getPreviewBody(): string {
    const body = this.bodyControl.value || '';

    // Replace variables with sample values for preview (same as reference component)
    return body
      .replace(/{{firstName}}/g, '<span class="variable">[Customer First Name]</span>')
      .replace(/{{lastName}}/g, '<span class="variable">[Customer Last Name]</span>')
      .replace(/{{email}}/g, '<span class="variable">[Customer Email]</span>')
      .replace(/{{resetLink}}/g, '<span class="variable">[Reset Link]</span>')
      .replace(/{{orderNumber}}/g, '<span class="variable">[Order Number]</span>')
      .replace(/{{orderDate}}/g, '<span class="variable">[Order Date]</span>')
      .replace(/{{totalAmount}}/g, '<span class="variable">[Total Amount]</span>')
      .replace(/\n/g, '<br>');
  }

  getOriginalBodyForDisplay(): string {
    const body = this.data.emailLog.body || '';
    return body.replace(/\n/g, '<br>');
  }

  onPreviewToggle(): void {
    this.showPreview = this.showPreviewControl.value;
  }

  resendEmail(): void {
    if (this.isViewMode() || !this.canResend()) return;

    this.isResending = true;

    const emailSendData: EmailSendDTO = {
      emailType: this.data.emailLog.emailType,
      subject: this.subjectControl.value,
      body: this.bodyControl.value,
      recipients: [this.data.emailLog.recipient],
      language: this.languageControl.value
      // customerIds is optional and not available in ResponseEmailLogDTO, so we omit it
    };

    this.emailService.sendEmail(emailSendData).subscribe({
      next: () => {
        this.snackBar.open('Email resent successfully', 'Close', {
          duration: 3000
        });
        this.dialogRef.close('resend');
      },
      error: (error) => {
        console.error('Failed to resend email:', error);
        this.isResending = false;

        let errorMessage = 'Failed to resend email';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error occurred while sending email. Please try again later.';
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  isViewMode(): boolean {
    return this.data.mode === 'view';
  }

  canResend(): boolean {
    return !this.isViewMode() &&
      this.emailForm.valid &&
      !this.isResending;
  }

  // Helper methods to safely access form values
  get subject(): string {
    return this.subjectControl.value || '';
  }

  get body(): string {
    return this.bodyControl.value || '';
  }

  get language(): string {
    return this.languageControl.value || '';
  }

  get subjectLength(): number {
    return this.subject.length;
  }

  get bodyLength(): number {
    return this.body.length;
  }
}
