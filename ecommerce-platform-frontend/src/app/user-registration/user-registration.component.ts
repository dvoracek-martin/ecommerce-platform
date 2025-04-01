import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  standalone: false,
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  loading = false;
  // This flag is true if the password and confirmPassword fields do not match.
  passwordMismatch = false;
  private registrationUrl = 'http://localhost:8080/api/user/v1/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^\S+$/) // no whitespace
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^\S+$/) // no whitespace
      ]],
      confirmPassword: ['', Validators.required]
    });

    // Subscribe to changes on both password fields to update the mismatch flag.
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
    // Even if the form is valid individually, we prevent submission if passwords don't match.
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
      username: this.registrationForm.get('username')?.value.trim(),
      email: this.registrationForm.get('email')?.value.trim(),
      password: this.registrationForm.get('password')?.value
    };

    this.http.post(this.registrationUrl, payload).subscribe({
      next: () => {
        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
        this.registrationForm.reset();
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Registration failed: ' + (err.error?.message || err.statusText), 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
