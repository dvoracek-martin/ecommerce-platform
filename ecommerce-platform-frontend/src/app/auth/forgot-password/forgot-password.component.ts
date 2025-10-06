import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  standalone: false,
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  @Output() close = new EventEmitter<void>(); // For successful close
  @Output() cancel = new EventEmitter<void>(); // For cancel/back action
  forgotForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      ]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.showError('ERRORS.FIX_FORM');
      return;
    }

    this.loading = true;
    const email = this.forgotForm.value.email.trim().toLowerCase();

    this.http.post('/api/users/v1/forgot-password', { email })
      .subscribe({
        next: () => {
          this.showSuccess('SUCCESS.RESET_LINK_SENT');
          this.close.emit();
        },
        error: (error) => {
          this.handleError(error);
        }
      })
      .add(() => this.loading = false);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private handleError(error: any): void {
    console.error('Password reset error:', error);

    if (error.status === 404) {
      this.showError('ERRORS.EMAIL_NOT_FOUND');
    } else if (error.status === 429) {
      this.showError('ERRORS.TOO_MANY_REQUESTS');
    } else {
      this.showError('ERRORS.RESET_LINK_FAILED');
    }
  }

  private showError(messageKey: string): void {
    const message = this.translate.instant(messageKey);
    const closeText = this.translate.instant('COMMON.CLOSE');

    this.snackBar.open(message, closeText, {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(messageKey: string): void {
    const message = this.translate.instant(messageKey);
    const closeText = this.translate.instant('COMMON.CLOSE');

    this.snackBar.open(message, closeText, {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
}
