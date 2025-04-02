import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  standalone: false,
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit {
  @Output() registerSuccess = new EventEmitter<void>();
  registrationForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^\S+$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator() });
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
    };
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.snackBar.open(
        this.translate.instant('ERRORS.FIX_FORM'),
        this.translate.instant('COMMON.CLOSE'),
        { duration: 3000 }
      );
      return;
    }

    this.saving = true;
    const payload = {
      username: this.registrationForm.get('email')?.value.trim().toLowerCase(),
      email: this.registrationForm.get('email')?.value.trim().toLowerCase(),
      credentials: [
        {
          type: 'password',
          value: this.registrationForm.get('password')?.value
        }
      ]
    };

    this.http.post('http://localhost:8080/api/user/v1/', payload).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('SUCCESS.REGISTRATION_SUCCESS'),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 3000 }
        );
        this.authenticateUserAfterRegistration();
      },
      error: (err) => {
        this.snackBar.open(
          this.translate.instant('ERRORS.REGISTRATION_FAILED') + (err.error?.message || err.statusText),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 5000 }
        );
        this.saving = false;
      }
    });
  }

  private authenticateUserAfterRegistration(): void {
    const username = this.registrationForm.get('email')?.value.trim().toLowerCase();
    const password = this.registrationForm.get('password')?.value;

    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'ecommerce-platform-client');
    body.set('username', username);
    body.set('password', password);

    this.http.post(
      'http://localhost:9090/realms/ecommerce-platform/protocol/openid-connect/token',
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).subscribe({
      next: (response: any) => {
        this.authService.storeToken(response);
        this.registerSuccess.emit();
        this.router.navigate(['/customer']);
        this.registrationForm.reset();
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(
          this.translate.instant('ERRORS.LOGIN_FAILED') + (err.error?.message || err.statusText),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 5000 }
        );
        this.saving = false;
        this.router.navigate(['/']);
      }
    });
  }
}
