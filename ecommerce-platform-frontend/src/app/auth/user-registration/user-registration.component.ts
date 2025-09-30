import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

interface PasswordStrength {
  score: number;
  text: string;
  class: string;
}

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
  hidePassword = true;
  hideConfirmPassword = true;
  passwordStrength: PasswordStrength = { score: 0, text: '', class: '' };
  isPasswordStrong = false;

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
        Validators.minLength(6) // More friendly minimum length
      ]],
      confirmPassword: ['', Validators.required]
    }, {validators: this.passwordMatchValidator()});

    // Check password strength on every change
    this.registrationForm.get('password')?.valueChanges.subscribe(() => {
      this.checkPasswordStrength();
    });
  }

  checkPasswordStrength(): void {
    const password = this.registrationForm.get('password')?.value;

    if (!password) {
      this.passwordStrength = { score: 0, text: '', class: '' };
      this.isPasswordStrong = false;
      return;
    }

    let score = 0;

    // More friendly scoring system
    if (password.length >= 6) score++; // Basic length
    if (password.length >= 8) score++; // Good length
    if (password.length >= 12) score++; // Great length

    // Simple complexity checks (bonus points)
    if (/[A-Z]/.test(password)) score++; // Uppercase letters
    if (/[0-9]/.test(password)) score++; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special characters

    // Determine strength level - More user-friendly approach
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

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.snackBar.open(
        this.translate.instant('ERRORS.FIX_FORM'),
        this.translate.instant('COMMON.CLOSE'),
        {duration: 5000}
      );
      return;
    }

    this.saving = true;
    const payload = {
      username: this.registrationForm.get('email')?.value.trim().toLowerCase(),
      email: this.registrationForm.get('email')?.value.trim().toLowerCase(),
      preferredLanguage: this.translate.currentLang,
      credentials: [
        {
          type: 'password',
          value: this.registrationForm.get('password')?.value
        }
      ],
      active: true
    };

    this.http.post('http://localhost:8080/api/users/v1/create', payload).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('SUCCESS.REGISTRATION_SUCCESS'),
          this.translate.instant('COMMON.CLOSE'),
          {duration: 5000}
        );
        this.authenticateUserAfterRegistration();
      },
      error: (err) => {
        this.snackBar.open(
          this.translate.instant('ERRORS.REGISTRATION_FAILED') + (err.error?.message || err.statusText),
          this.translate.instant('COMMON.CLOSE'),
          {duration: 5000}
        );
        this.saving = false;
      }
    });
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return password && confirmPassword && password !== confirmPassword ? {mismatch: true} : null;
    };
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
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
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
          {duration: 5000}
        );
        this.saving = false;
        this.router.navigate(['/']);
      }
    });
  }
}
