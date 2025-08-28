import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  standalone: false,
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  loginForm: FormGroup;
  loading = false;

  private readonly keycloakTokenUrl = 'http://localhost:9090/realms/ecommerce-platform/protocol/openid-connect/token';
  private readonly clientId = 'ecommerce-platform-client';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private cartService: CartService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Please fix validation errors.', 'Close', { duration: 5000 });
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loginSuccess.emit();

        // Merge cart after successful login
        this.cartService.mergeGuestCart().subscribe({
          next: () => {
            this.snackBar.open('Guest cart merged successfully.', 'Close', { duration: 5000 });
          },
          error: () => {
            this.snackBar.open('Login successful, but failed to merge guest cart.', 'Close', { duration: 5000 });
          }
        });
      },
      error: () => {
        // Error handling is already done in the AuthService
      }
    }).add(() => this.loading = false);
  }
}
