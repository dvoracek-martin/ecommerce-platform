import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subject } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  standalone: false,
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent implements OnInit, OnDestroy {
  @Output() loginSuccess = new EventEmitter<void>();
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private cartService: CartService,
    private customerService: CustomerService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false] // Added rememberMe control
    });
  }

  ngOnInit(): void {
    this.loadSavedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Please fix validation errors.', 'Close', { duration: 5000 });
      return; // Added return to prevent execution when invalid
    }

    this.loading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.handleLoginSuccess(rememberMe, email);
        // Removed window.location.reload() - we'll handle state updates properly
      },
      error: (err) => this.handleLoginError(err)
    });
  }

  private handleLoginSuccess(rememberMe: boolean, email: string): void {
    // Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    this.loginSuccess.emit();

    this.cartService.mergeGuestCart().subscribe({
      next: () => console.log('Cart merged'),
      error: () => console.log('Cart merge failed')
    });

    this.loading = false;

    // Navigate to home or refresh the page to update auth state
    this.router.navigate(['/']).then(() => {
      // Optional: force a reload if the navigation doesn't update the state
      window.location.reload();
    });
  }

  private handleLoginError(err: any): void {
    this.snackBar.open('Login failed. Please check your credentials.', 'Close', { duration: 5000 });
    this.loading = false;
  }

  private loadSavedCredentials(): void {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true
      });
    }
  }

  onClose(): void {
    this.router.navigate(['/']);
  }
}
