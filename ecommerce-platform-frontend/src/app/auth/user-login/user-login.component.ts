import {Component, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthService} from '../auth.service';
import {CartService} from '../../services/cart.service';

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
      this.snackBar.open('Please fix validation errors.', 'Close', {duration: 5000});
      return;
    }

    this.loading = true;
    const {email, password} = this.loginForm.value;

    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.clientId);
    body.set('username', email.trim().toLowerCase());
    body.set('password', password);

    this.http.post(this.keycloakTokenUrl, body.toString(), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).subscribe({
      next: (response: any) => {
        this.authService.storeToken(response);
        // Merge guest cart
        this.cartService.mergeGuestCart().subscribe({
          next: () => {
            this.snackBar.open('Login successful! Guest cart merged.', 'Close', {duration: 5000});
            this.loginSuccess.emit();
          },
          error: () => {
            this.snackBar.open('Login successful, but failed to merge guest cart.', 'Close', {duration: 5000});
            this.loginSuccess.emit();
          }
        });
      },
      error: (err) => {
        const errorMessage = err.error?.error_description || err.statusText;
        this.snackBar.open(`Login failed: ${errorMessage}`, 'Close', {duration: 5000});
      }
    }).add(() => this.loading = false);
  }
}
