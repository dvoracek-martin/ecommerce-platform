import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subject } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { HeaderComponent } from '../../layout/header/header.component';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  standalone: false,
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent implements OnDestroy {
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
    private headerComponent: HeaderComponent,
    private customerService: CustomerService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Please fix validation errors.', 'Close', { duration: 5000 });
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => this.handleLoginSuccess(),
      error: (err) => this.handleLoginError(err)
    });
  }

  private handleLoginSuccess(): void {
    this.loginSuccess.emit();

    this.cartService.mergeGuestCart().subscribe({
      next: () => console.log('Cart merged'),
      error: () => console.log('Cart merge failed')
    });

    this.headerComponent.ngOnInit();
    this.loading = false;
  }

  private handleLoginError(err: any): void {
    this.snackBar.open('Login failed. Please check your credentials.', 'Close', { duration: 5000 });
    this.loading = false;
  }
}
