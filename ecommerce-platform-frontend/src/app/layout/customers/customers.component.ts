import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormGroupDirective, ValidatorFn, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../auth/auth.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {animate, state, style, transition, trigger} from '@angular/animations';

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address?: Address | null;
  billingAddress?: BillingAddress | null;
}

interface Address {
  street: string | null;
  phone: string | null;
  houseNumber: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
}

interface BillingAddress {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  taxId: string | null;
  phone: string | null;
  street: string | null;
  houseNumber: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  standalone: false,
  animations: [
    trigger('slideDown', [
      state('void', style({height: '0', opacity: 0, overflow: 'hidden'})),
      state('*', style({height: '*', opacity: 1})),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class CustomersComponent implements OnInit {
  customerForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  saving = false;
  savingPassword = false;
  readonly DEFAULT_COUNTRY = 'Switzerland';
  showBillingAddress = false;
  initialBillingAddress: BillingAddress | null = null;
  initialAddress: Address | null = null;

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
    this.matIconRegistry.addSvgIcon(
      'flag_ch',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/ch.svg')
    );

    this.initializeForms();
  }

  ngOnInit(): void {
    if (!this.authService.isTokenValid()) {
      this.handleUnauthorized();
      return;
    }

    this.loadCustomerData();
  }

  onSave(): void {
    if (this.customerForm.invalid) {
      this.showSnackbar('ERRORS.FIX_FORM');
      return;
    }

    this.saving = true;
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      const payload = this.createCustomerPayload();

      this.http.put(`http://localhost:8080/api/customers/v1/${userId}`, payload, {
        headers: {'Authorization': `Bearer ${token}`}
      }).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
    } else {
      this.saving = false;
    }
  }

  onChangePassword(formDirective: FormGroupDirective): void {
    const passwordGroup = this.passwordForm.get('passwordChange');

    if (!passwordGroup || passwordGroup.invalid) {
      this.showSnackbar('ERRORS.FIX_FORM');
      return;
    }

    this.savingPassword = true;
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      const {currentPassword, newPassword} = passwordGroup.value;

      this.http.put(
        `http://localhost:8080/api/users/v1/${userId}/password`,
        {currentPassword, newPassword},
        {headers: {'Authorization': `Bearer ${token}`}}
      ).subscribe({
        next: () => this.handlePasswordChangeSuccess(formDirective),
        error: (err) => this.handlePasswordChangeError(err, userId)
      }).add(() => {
        this.savingPassword = false;
      });
    }
  }

  private initializeForms(): void {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      address: this.fb.group({
        phone: ['', [Validators.pattern(/^\+?[0-9\s-]+$/)]],
        street: ['', Validators.required],
        houseNumber: ['', Validators.required],
        city: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
        country: [this.DEFAULT_COUNTRY, Validators.required]
      }),
      sameBillingAddress: [true],
      billingAddress: this.fb.group({
        firstName: [''],
        lastName: [''],
        companyName: [''],
        taxId: ['', [Validators.pattern(/^[A-Za-z0-9]+$/)]],
        street: [''],
        houseNumber: [''],
        city: [''],
        zipCode: [''],
        country: [this.DEFAULT_COUNTRY],
        phone: ['', [Validators.pattern(/^\+?[0-9\s-]+$/)]]
      })
    });

    this.passwordForm = this.fb.group({
      passwordChange: this.fb.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^\S+$/)
        ]],
        confirmNewPassword: ['', Validators.required]
      }, {validators: this.passwordMatchValidator()})
    });

    this.setupBillingAddressValidation();
  }

  private setupBillingAddressValidation(): void {
    this.customerForm.get('sameBillingAddress')?.valueChanges.subscribe(checked => {
      this.showBillingAddress = !checked;
      const billingAddress = this.customerForm.get('billingAddress') as FormGroup;

      if (checked) {
        Object.keys(billingAddress.controls).forEach(controlName => {
          const control = billingAddress.get(controlName);
          control?.clearValidators();
          control?.reset();
        });
      } else {
        if (this.initialBillingAddress) {
          billingAddress.patchValue(this.initialBillingAddress);
        } else {
          billingAddress.reset({
            firstName: '',
            lastName: '',
            companyName: '',
            taxId: '',
            street: '',
            houseNumber: '',
            city: '',
            zipCode: '',
            country: this.DEFAULT_COUNTRY,
            phone: ''
          });
        }

        billingAddress.get('street')?.setValidators(Validators.required);
        billingAddress.get('houseNumber')?.setValidators(Validators.required);
        billingAddress.get('city')?.setValidators(Validators.required);
        billingAddress.get('zipCode')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
        billingAddress.get('country')?.setValidators(Validators.required);
        billingAddress.get('phone')?.setValidators([Validators.pattern(/^\+?[0-9\s-]+$/)]);
        billingAddress.get('taxId')?.setValidators([Validators.pattern(/^[A-Za-z0-9]+$/)]);

        billingAddress.updateValueAndValidity();
      }
    });
  }

  private loadCustomerData(): void {
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      this.http.get<Customer>(`http://localhost:8080/api/customers/v1/${userId}`, {
        headers: {'Authorization': `Bearer ${token}`}
      }).subscribe({
        next: (customer) => this.handleCustomerDataSuccess(customer),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleCustomerDataSuccess(customer: Customer): void {
    this.initialBillingAddress = customer.billingAddress;
    this.initialAddress = customer.address;
    this.patchFormValues(customer);
    this.loading = false;
  }

  private patchFormValues(customer: Customer): void {
    const sameBillingAddress = this.isBillingAddressSameAsShipping(customer, this.customerForm.value);

    this.customerForm.patchValue({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.address?.phone || '',
      address: {
        phone: customer.address?.phone || '',
        street: customer.address?.street || '',
        houseNumber: customer.address?.houseNumber || '',
        city: customer.address?.city || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || this.DEFAULT_COUNTRY
      },
      sameBillingAddress: sameBillingAddress,
      billingAddress: customer.billingAddress ? customer.billingAddress : {}
    });

    this.showBillingAddress = !sameBillingAddress;
  }

  private isBillingAddressSameAsShipping(customer: Customer, formValue: any): boolean {
    if (!customer.billingAddress && formValue.sameBillingAddress) {
      return true;
    }
    if (!customer.billingAddress || !customer.address) {
      return false;
    }

    return (
      customer.billingAddress.firstName === customer.firstName &&
      customer.billingAddress.lastName === customer.lastName &&
      customer.billingAddress.phone === customer.address.phone &&
      customer.billingAddress.street === customer.address.street &&
      customer.billingAddress.houseNumber === customer.address.houseNumber &&
      customer.billingAddress.city === customer.address.city &&
      customer.billingAddress.zipCode === customer.address.zipCode &&
      customer.billingAddress.country === customer.address.country
    );
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const newPassword = group.get('newPassword')?.value;
      const confirmNewPassword = group.get('confirmNewPassword')?.value;
      return newPassword && confirmNewPassword && newPassword !== confirmNewPassword
        ? {mismatch: true}
        : null;
    };
  }

  private createCustomerPayload() {
    const formValue = this.customerForm.value;
    const useShippingAddress = formValue.sameBillingAddress;

    return {
      email: this.authService.getEmail().trim().toLowerCase(),
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      address: {...formValue.address},
      billingAddress: useShippingAddress
        ? {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phone: formValue.address.phone,
          companyName: '',
          taxId: '',
          country: formValue.address.country,
          city: formValue.address.city,
          street: formValue.address.street,
          houseNumber: formValue.address.houseNumber,
          zipCode: formValue.address.zipCode
        }
        : {
          firstName: formValue.billingAddress.firstName,
          lastName: formValue.billingAddress.lastName,
          phone: formValue.billingAddress.phone,
          companyName: formValue.billingAddress.companyName,
          taxId: formValue.billingAddress.taxId,
          country: formValue.billingAddress.country,
          city: formValue.billingAddress.city,
          street: formValue.billingAddress.street,
          houseNumber: formValue.billingAddress.houseNumber,
          zipCode: formValue.billingAddress.zipCode
        }
    };
  }

  private handleSaveSuccess(): void {
    this.showSnackbar('CUSTOMER.SAVE_SUCCESS');
    this.saving = false;
  }

  private handleSaveError(err: any): void {
    this.showSnackbar('CUSTOMER.SAVE_ERROR');
    this.saving = false;
    console.error('Error saving customer details:', err);
  }

  private handlePasswordChangeSuccess(formDirective: FormGroupDirective): void {
    this.showSnackbar('CUSTOMER.PASSWORD_CHANGE_SUCCESS');
    formDirective.resetForm();
  }

  private handlePasswordChangeError(err: any, userId: string): void {
    const errorKey = err.status === 401
      ? 'CUSTOMER.INCORRECT_PASSWORD'
      : 'CUSTOMER.PASSWORD_CHANGE_ERROR';

    this.showSnackbar(errorKey);
    console.error(`Password change failed for ${userId}:`, err);
  }

  private showSnackbar(translationKey: string): void {
    this.snackBar.open(
      this.translate.instant(translationKey),
      this.translate.instant('COMMON.CLOSE'),
      {duration: 5000}
    );
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
      console.error('Failed to fetch customer data:', err);
      this.loading = false;
    }
  }
}
