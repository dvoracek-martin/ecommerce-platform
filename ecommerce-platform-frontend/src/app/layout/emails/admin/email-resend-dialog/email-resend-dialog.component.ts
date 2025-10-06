import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EmailService } from '../../../../services/email.service';
import { ResponseEmailLogDTO } from '../../../../dto/email/response-email-log-dto';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  emailForm: FormGroup;

  isResending = false;
  availableLanguages: string[] = ['en_US', 'cs_CZ', 'sk_SK', 'de_DE', 'fr_FR', 'en', 'cs', 'sk', 'de', 'fr'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      emailLog: ResponseEmailLogDTO,
      mode: 'view' | 'resend'
    },
    private dialogRef: MatDialogRef<EmailResendDialogComponent>,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {
    // Initialize form controls with proper typing
    this.subjectControl = new FormControl({
      value: data.emailLog.subject || '',
      disabled: data.mode === 'view'
    }, [Validators.required, Validators.maxLength(200)]);

    this.bodyControl = new FormControl({
      value: data.emailLog.body || '',
      disabled: data.mode === 'view'
    }, [Validators.required, Validators.maxLength(5000)]);

    this.languageControl = new FormControl({
      value: data.emailLog.language || 'en_US',
      disabled: data.mode === 'view'
    }, [Validators.required]);

    // Initialize form group
    this.emailForm = new FormGroup({
      subject: this.subjectControl,
      body: this.bodyControl,
      language: this.languageControl
    });
  }

  ngOnInit(): void {
    // If current language is not in available languages, add it
    if (this.data.emailLog.language && !this.availableLanguages.includes(this.data.emailLog.language)) {
      this.availableLanguages.push(this.data.emailLog.language);
    }
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

  resendEmail(): void {
    if (this.data.mode !== 'resend' || !this.emailForm.valid) return;

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
    return this.data.mode === 'resend' &&
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
}
