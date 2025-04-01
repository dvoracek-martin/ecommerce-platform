import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  standalone: false,
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit {
  @Output() registerSuccess = new EventEmitter<void>();
  registrationForm!: FormGroup;
  loading = false;
  passwordMismatch = false;
  private registrationUrl = 'http://localhost:8080/api/user/v1/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService
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
    });

    this.registrationForm.get('password')?.valueChanges.subscribe(() => {
      this.checkPasswordMismatch();
    });
    this.registrationForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordMismatch();
    });
  }

  private checkPasswordMismatch(): void {
    const password = this.registrationForm.get('password')?.value;
    const confirmPassword = this.registrationForm.get('confirmPassword')?.value;
    this.passwordMismatch = password && confirmPassword && password !== confirmPassword;
  }

  onSubmit(): void {
    if (this.passwordMismatch) {
      this.snackBar.open('Passwords do not match.', 'Close', { duration: 3000 });
      return;
    }
    if (this.registrationForm.invalid) {
      this.snackBar.open('Please fix the errors in the form.', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const payload = {
      username: this.registrationForm.get('email')?.value.trim(),
      email: this.registrationForm.get('email')?.value.trim(),
      credentials: [
        {
          type: 'password',
          value: this.registrationForm.get('password')?.value
        }
      ]
    };

    this.http.post(this.registrationUrl, payload).subscribe({
      next: () => {
        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
        this.authenticateUserAfterRegistration();
      },
      error: (err) => {
        this.handleRegistrationError(err);
      }
    });
  }

  private authenticateUserAfterRegistration(): void {
    const username = this.registrationForm.get('email')?.value.trim();
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
        this.registrationForm.reset();
        this.loading = false;
      },
      error: (err) => {
        this.handleTokenError(err);
      }
    });
  }

  private handleRegistrationError(err: any): void {
    this.snackBar.open('Registration failed: ' + (err.error?.message || err.statusText), 'Close', { duration: 3000 });
    this.loading = false;
  }

  private handleTokenError(err: any): void {
    this.snackBar.open('Failed to retrieve access token: ' + (err.error?.message || err.statusText), 'Close', { duration: 3000 });
    this.loading = false;
  }
}
