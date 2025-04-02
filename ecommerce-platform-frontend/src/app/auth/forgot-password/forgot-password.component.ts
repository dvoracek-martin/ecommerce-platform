import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  standalone: false,
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  @Output() close = new EventEmitter<void>(); // For successful close
  @Output() cancel = new EventEmitter<void>(); // New event for cancel
  forgotForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
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
    if (this.forgotForm.invalid) return;

    this.loading = true;
    const email = this.forgotForm.value.email;

    this.http.post('http://localhost:8080/api/user/v1/forgot-password', { email })
      .subscribe({
        next: () => {
          this.snackBar.open('Password reset link sent to your email', 'Close', { duration: 5000 });
          this.close.emit();
        },
        error: (err) => {
          this.snackBar.open('Failed to send reset link. Please try again.', 'Close', { duration: 5000 });
        }
      })
      .add(() => this.loading = false);
  }
}
