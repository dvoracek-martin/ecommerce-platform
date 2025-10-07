import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EmailService } from '../../../../services/email.service';
import { ResponseEmailLogDTO } from '../../../../dto/email/response-email-log-dto';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigurationService } from '../../../../services/configuration.service';
import { ResponseLocaleDto } from '../../../../dto/configuration/response-locale-dto';

@Component({
  selector: 'app-email-resend-dialog',
  templateUrl: './email-resend-dialog.component.html',
  styleUrls: ['./email-resend-dialog.component.scss'],
  standalone: false
})
export class EmailResendDialogComponent implements OnInit {
  // Define form controls with explicit typing
  subjectControl: FormControl;
  bodyControl: FormControl;
  languageControl: FormControl;
  showPreviewControl: FormControl; // New control for preview toggle
  emailForm: FormGroup;

  isResending = false;
  availableLanguages: string[] = [];
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
    private snackBar: MatSnackBar
  ) {
    // Initialize form controls - make them ENABLED for resend mode
    const isViewMode = data.mode === 'view';

    this.subjectControl = new FormControl(
      { value: data.emailLog.subject || '', disabled: isViewMode },
      [Validators.required, Validators.maxLength(200)]
    );

    this.bodyControl = new FormControl(
      { value: data.emailLog.body || '', disabled: isViewMode },
      [Validators.required, Validators.maxLength(5000)]
    );

    this.languageControl = new FormControl(
      { value: data.emailLog.language || 'en_US', disabled: isViewMode },
      [Validators.required]
    );

    // Initialize preview toggle - default to false to avoid scrollbar initially
    this.showPreviewControl = new FormControl(false);

    // Initialize form group
    this.emailForm = new FormGroup({
      subject: this.subjectControl,
      body: this.bodyControl,
      language: this.languageControl,
      showPreview: this.showPreviewControl
    });
  }

  // ... rest of the component methods remain the same
  ngOnInit(): void {
    this.loadAvailableLanguages();
    this.setAvailableVariables();
  }

  private loadAvailableLanguages(): void {
    this.configurationService.getLastAppSettings().subscribe({
      next: (settings) => {
        this.usedLocales = settings.usedLocales || [];
        this.availableLanguages = this.usedLocales.map(locale =>
          `${locale.languageCode}_${locale.regionCode}`
        );

        // If current language is not in available languages, add it
        if (this.data.emailLog.language && !this.availableLanguages.includes(this.data.emailLog.language)) {
          this.availableLanguages.push(this.data.emailLog.language);
        }

        // Sort languages for better UX
        this.availableLanguages.sort();
      },
      error: (error) => {
        console.error('Failed to load languages:', error);
        // Fallback to common languages
        this.availableLanguages = ['en_US', 'cs_CZ', 'sk_SK', 'de_DE', 'fr_FR', 'en', 'cs', 'sk', 'de', 'fr'];
      }
    });
  }

  private setAvailableVariables(): void {
    // Set variables based on email type
    const variableMap: { [key: string]: string[] } = {
      'REGISTRATION': ['firstName', 'lastName', 'email'],
      'PASSWORD_RESET': ['firstName', 'resetLink'],
      'ORDER_CONFIRMATION': ['firstName', 'orderNumber', 'orderDate', 'totalAmount'],
      'NEWSLETTER': ['firstName'],
      'CUSTOM': ['firstName', 'lastName', 'email']
    };

    this.availableVariables = variableMap[this.data.emailLog.emailType] || ['firstName', 'lastName', 'email'];
  }

  getLanguageDisplayName(language: string): string {
    const languageMap: { [key: string]: string } = {
      'en_US': 'English (US)',
      'cs_CZ': 'Czech (CZ)',
      'sk_SK': 'Slovak (SK)',
      'de_DE': 'German (DE)',
      'fr_FR': 'French (FR)',
      'en': 'English',
      'cs': 'Czech',
      'sk': 'Slovak',
      'de': 'German',
      'fr': 'French'
    };
    return languageMap[language] || language;
  }

  getVariableDisplayName(variable: string): string {
    const variableNames: { [key: string]: string } = {
      'firstName': 'First Name',
      'lastName': 'Last Name',
      'email': 'Email',
      'resetLink': 'Reset Link',
      'orderNumber': 'Order Number',
      'orderDate': 'Order Date',
      'totalAmount': 'Total Amount'
    };
    return variableNames[variable] || variable;
  }

  insertVariable(variable: string): void {
    if (this.isViewMode()) return;

    const variableText = `{{${variable}}}`;
    const currentBody = this.bodyControl.value || '';

    // Get textarea element
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

    // Replace variables with sample values for preview
    return body
      .replace(/{{firstName}}/g, '<span class="variable">[Customer First Name]</span>')
      .replace(/{{lastName}}/g, '<span class="variable">[Customer Last Name]</span>')
      .replace(/{{email}}/g, '<span class="variable">[Customer Email]</span>')
      .replace(/{{resetLink}}/g, '<span class="variable">[Password Reset Link]</span>')
      .replace(/{{orderNumber}}/g, '<span class="variable">[Order #12345]</span>')
      .replace(/{{orderDate}}/g, '<span class="variable">[January 1, 2024]</span>')
      .replace(/{{totalAmount}}/g, '<span class="variable">[$99.99]</span>')
      .replace(/\n/g, '<br>');
  }

  resendEmail(): void {
    if (this.isViewMode() || !this.emailForm.valid) return;

    this.isResending = true;

    const formValue = this.emailForm.value;

    this.emailService.resendEmail(
      this.data.emailLog,
      formValue.subject,
      formValue.body,
      formValue.language
    ).subscribe({
      next: () => {
        this.snackBar.open('Email resent successfully', 'Close', {
          duration: 3000
        });
        this.dialogRef.close('resend');
      },
      error: (error) => {
        console.error('Failed to resend email:', error);
        this.snackBar.open('Failed to resend email', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isResending = false;
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

  getOriginalLanguage(): string {
    return this.getLanguageDisplayName(this.data.emailLog.language);
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
