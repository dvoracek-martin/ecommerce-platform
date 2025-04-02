import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ValidatorFn, AbstractControl, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../auth/auth.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address?: Address | null;
}

interface Address {
  street: string | null;
  houseNumber: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
}

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  standalone: false,
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  customerForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  saving = false;
  savingPassword = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    // Register the Switzerland flag icon (using 'flag_ch' as the icon name)
    this.matIconRegistry.addSvgIcon(
      'flag_ch',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/ch.svg')
    );

    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      address: this.fb.group({
        street: ['', Validators.required],
        houseNumber: ['', Validators.required],
        city: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
        country: ['Switzerland', Validators.required]
      })
    });
    this.passwordForm = this.fb.group({
      passwordChange: this.fb.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^\S+$/)]],
        confirmNewPassword: ['', Validators.required]
      }, {validators: this.passwordMatchValidator()})
    });
  }

  ngOnInit(): void {
    if (!this.authService.isTokenValid()) {
      this.handleUnauthorized();
      return;
    }

    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      this.http.get<Customer>(`http://localhost:8080/api/customer/v1/${userId}`, {
        headers: {'Authorization': `Bearer ${token}`}
      }).subscribe({
        next: (customer) => {
          this.patchFormValues(customer);
          this.loading = false;
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  private patchFormValues(customer: Customer): void {
    this.customerForm.patchValue({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      address: {
        street: customer.address?.street || '',
        houseNumber: customer.address?.houseNumber || '',
        city: customer.address?.city || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || 'Switzerland'
      }
      // Do not patch passwordChange here.
    });
  }

  // Custom validator for the password change group
  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const newPassword = group.get('newPassword')?.value;
      const confirmNewPassword = group.get('confirmNewPassword')?.value;
      return newPassword && confirmNewPassword && newPassword !== confirmNewPassword ? {mismatch: true} : null;
    };
  }

  onSave(): void {
    if (this.customerForm.invalid) {
      this.snackBar.open(
        this.translate.instant('ERRORS.FIX_FORM'),
        this.translate.instant('COMMON.CLOSE'),
        {duration: 5000}
      );
      return;
    }

    this.saving = true; // This will trigger the loading state
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      const payload = {
        email: this.authService.getEmail().trim().toLowerCase(),
        firstName: this.customerForm.value.firstName,
        lastName: this.customerForm.value.lastName,
        address: {
          country: this.customerForm.value.address.country,
          city: this.customerForm.value.address.city,
          street: this.customerForm.value.address.street,
          houseNumber: this.customerForm.value.address.houseNumber,
          zipCode: this.customerForm.value.address.zipCode
        }
      };

      this.http.put(`http://localhost:8080/api/customer/v1/${userId}`,
        payload,
        {headers: {'Authorization': `Bearer ${token}`}}
      ).subscribe({
        next: () => {
          this.snackBar.open(
            this.translate.instant('CUSTOMER.SAVE_SUCCESS'),
            this.translate.instant('COMMON.CLOSE'),
            {duration: 5000}
          );
          this.saving = false; // Reset saving state
        },
        error: (err) => {
          this.snackBar.open(
            this.translate.instant('CUSTOMER.SAVE_ERROR'),
            this.translate.instant('COMMON.CLOSE'),
            {duration: 5000}
          );
          this.saving = false; // Reset saving state even on error
        }
      });
    } else {
      this.saving = false; // Reset saving state if no user/token
    }
  }

  onChangePassword(): void {
    const passwordGroup = this.passwordForm.get('passwordChange');
    if (!passwordGroup || passwordGroup.invalid) {
      this.snackBar.open(
        this.translate.instant('ERRORS.FIX_FORM'),
        this.translate.instant('COMMON.CLOSE'),
        {duration: 5000}
      );
      return;
    }

    this.savingPassword = true;
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      const payload = {
        currentPassword: passwordGroup.get('currentPassword')?.value,
        newPassword: passwordGroup.get('newPassword')?.value
      };

      this.http.put(
        `http://localhost:8080/api/user/v1/${userId}/password`,
        payload,
        {headers: {'Authorization': `Bearer ${token}`}}
      ).subscribe({
        next: () => {
          this.snackBar.open(
            this.translate.instant('CUSTOMER.PASSWORD_CHANGE_SUCCESS'),
            this.translate.instant('COMMON.CLOSE'),
            {duration: 5000}
          );
          const passwordGroup = this.passwordForm.get('passwordChange');
          if (passwordGroup) {
            passwordGroup.reset({}, { emitEvent: false });
            passwordGroup.markAsPristine();
            passwordGroup.markAsUntouched();

            // Clear individual control states
            ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(controlName => {
              const control = passwordGroup.get(controlName);
              control?.setErrors(null);
              control?.markAsUntouched();
              control?.markAsPristine();
            });

            this.passwordForm.updateValueAndValidity();
          }
          this.savingPassword = false;
        },
        error: (err) => {
          let errorMessage;

          // Handle specific 401 case
          if (err.status === 401) {
            errorMessage = this.translate.instant('CUSTOMER.INCORRECT_PASSWORD');
          }
          // Handle other errors with message or fallback
          else {
            errorMessage = err.error?.message ||
              this.translate.instant('CUSTOMER.PASSWORD_CHANGE_ERROR');
          }

          this.snackBar.open(
            errorMessage,
            this.translate.instant('COMMON.CLOSE'),
            {duration: 5000}
          );
        }
      }).add(() => {
        this.savingPassword = false;
      });
    }
  }

  private handleUnauthorized(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.loading = false;
  }

  private handleError(err: any): void {
    if (err.status === 401) {
      this.handleUnauthorized();
    } else {
      console.error('Failed to fetch customer:', err);
      this.loading = false;
    }
  }
}
