import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';

interface PasswordStrength {
  score: number;
  text: string;
  class: string;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: false,
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  saving = false;
  hidePassword = true;
  hideConfirmPassword = true;
  passwordStrength: PasswordStrength = { score: 0, text: '', class: '' };
  isPasswordStrong = false;
  token: string;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.showError('RESET_PASSWORD.TOKEN_MISSING');
      this.router.navigate(['/']);
      return;
    }

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator() });

    this.resetForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordStrength();
    });
  }

  checkPasswordStrength(): void {
    const password = this.resetForm.get('newPassword')?.value;

    if (!password) {
      this.passwordStrength = { score: 0, text: '', class: '' };
      this.isPasswordStrong = false;
      return;
    }

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_VERY_WEAK',
        class: 'very-weak'
      };
      this.isPasswordStrong = false;
    } else if (score <= 2) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_WEAK',
        class: 'weak'
      };
      this.isPasswordStrong = false;
    } else if (score <= 3) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_FAIR',
        class: 'fair'
      };
      this.isPasswordStrong = false;
    } else if (score <= 4) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_GOOD',
        class: 'good'
      };
      this.isPasswordStrong = true;
    } else {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_STRONG',
        class: 'strong'
      };
      this.isPasswordStrong = true;
    }
  }

  getStrengthClass(barNumber: number): string {
    if (barNumber <= this.passwordStrength.score) {
      return this.passwordStrength.class;
    }
    return '';
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const password = group.get('newPassword')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
    };
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.showError('ERRORS.FIX_FORM');
      return;
    }

    this.saving = true;

    const payload = {
      token: this.token,
      newPassword: this.resetForm.value.newPassword
    };

    this.http.post('/api/users/v1/reset-password', payload,
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.resetForm.reset();
        this.showSuccess('RESET_PASSWORD.SUCCESS');
        // Redirect to login after success
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        this.handleError(err);
      }
    }).add(() => {
      this.saving = false;
    });
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  private handleError(err: any): void {
    let errorMessage;

    if (err.status === 400) {
      errorMessage = this.translate.instant('RESET_PASSWORD.TOKEN_INVALID_OR_EXPIRED');
    } else if (err.status === 410) {
      errorMessage = this.translate.instant('RESET_PASSWORD.TOKEN_EXPIRED');
    } else if (err.status === 404) {
      errorMessage = this.translate.instant('RESET_PASSWORD.TOKEN_NOT_FOUND');
    } else {
      errorMessage = err.error?.message || this.translate.instant('RESET_PASSWORD.ERROR');
    }

    this.showError(errorMessage);
  }

  private showError(message: string): void {
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
