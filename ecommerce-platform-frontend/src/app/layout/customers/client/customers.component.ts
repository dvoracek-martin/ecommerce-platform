import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormGroupDirective, ValidatorFn, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../../auth/auth.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {CustomerService} from '../../../services/customer.service';
import {CustomerAddress} from '../../../dto/customer/customer-address-dto';
import {CustomerBillingAddress} from '../../../dto/customer/custommer-billing-address-dto';
import {Customer} from '../../../dto/customer/customer-dto';
import {MatDialog} from '@angular/material/dialog';
import {Subject, takeUntil} from 'rxjs';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';

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
export class CustomersComponent implements OnInit, OnDestroy {
  customerForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  saving = false;
  savingPassword = false;
  readonly DEFAULT_COUNTRY = 'Switzerland';
  showBillingAddress = false;
  initialBillingAddress: CustomerBillingAddress | null = null;
  initialAddress: CustomerAddress | null = null;
  private readonly destroy$ = new Subject<void>();

  languages = [
    {code: 'en', name: 'English', icon: 'flag_us'},
    {code: 'de', name: 'Deutsch', icon: 'flag_ch'},
    {code: 'fr', name: 'Français', icon: 'flag_ch'},
    {code: 'cs', name: 'Česky', icon: 'flag_cz'},
    {code: 'es', name: 'Español', icon: 'flag_es'}
  ];
  selectedLanguage = this.languages[0];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private customerService: CustomerService,
    private dialog: MatDialog
  ) {
    ['ch', 'cz', 'us', 'es'].forEach(code =>
      this.matIconRegistry.addSvgIcon(
        `flag_${code}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/flags/${code}.svg`)
      )
    );
    this.initializeForms();
  }

  ngOnInit(): void {
    if (!this.authService.isTokenValid()) {
      this.handleUnauthorized();
      return;
    }
    this.loadCustomerData();
    const activeLang = this.translate.currentLang || 'en';
    this.selectedLanguage = this.languages.find(l => l.code === activeLang) ?? this.languages[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLanguageChange(langCode: string): void {
    if (!langCode) return;
    this.translate.use(langCode).subscribe({
      next: () => {
        const lang = this.languages.find(l => l.code === langCode);
        if (lang) this.selectedLanguage = lang;
        this.customerForm.patchValue({preferredLanguage: langCode});
        this.customerService.setUserLanguage(langCode);
      },
      error: err => console.error('Error loading translations:', err)
    });
  }

  onSave(): void {
    if (!this.customerForm.dirty || this.customerForm.invalid) {
      this.showSnackbar('ERRORS.FIX_FORM', 'error-snackbar');
      return;
    }
    this.saving = true;
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      const payload = this.createCustomerPayload();
      this.http.put(`http://localhost:8080/api/customers/v1/${userId}`, payload, {
        headers: {'Authorization': `Bearer ${token}`}
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.handleSaveSuccess(),
        error: err => this.handleSaveError(err)
      });
    } else {
      this.saving = false;
    }
  }

  onChangePassword(formDirective: FormGroupDirective): void {
    const passwordGroup = this.passwordForm.get('passwordChange');
    if (!passwordGroup || !passwordGroup.dirty || passwordGroup.invalid) {
      this.showSnackbar('ERRORS.FIX_FORM', 'error-snackbar');
      passwordGroup.markAllAsTouched();
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
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.handlePasswordChangeSuccess(formDirective),
        error: err => this.handlePasswordChangeError(err, userId)
      }).add(() => (this.savingPassword = false));
    }
  }

  onCancel(): void {
    if (this.customerForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Changes', message: 'Are you sure you want to discard your changes?', warn: true}
      }).afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.router.navigate(['/dashboard']);
        }
      });
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private initializeForms(): void {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      preferredLanguage: ['en'],
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
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^\S+$/)]],
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
          billingAddress.get(controlName)?.clearValidators();
          billingAddress.get(controlName)?.reset();
        });
      } else {
        if (this.initialBillingAddress) billingAddress.patchValue(this.initialBillingAddress);
        billingAddress.get('firstName')?.setValidators(Validators.required);
        billingAddress.get('lastName')?.setValidators(Validators.required);
        billingAddress.get('street')?.setValidators(Validators.required);
        billingAddress.get('houseNumber')?.setValidators(Validators.required);
        billingAddress.get('city')?.setValidators(Validators.required);
        billingAddress.get('zipCode')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
        billingAddress.get('country')?.setValidators(Validators.required);
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
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: customer => this.handleCustomerDataSuccess(customer),
        error: err => this.handleError(err)
      });
    }
  }

  private handleCustomerDataSuccess(customer: Customer): void {
    this.initialBillingAddress = customer.billingAddress;
    this.initialAddress = customer.address;
    this.patchFormValues(customer);
    if (customer.preferredLanguage) {
      this.translate.use(customer.preferredLanguage.toLowerCase());
      this.selectedLanguage = this.languages.find(l => l.code === customer.preferredLanguage.toLowerCase()) ?? this.languages[0];
    }
    this.loading = false;
  }

  private patchFormValues(customer: Customer): void {
    const sameBillingAddress = this.isBillingAddressSameAsShipping(customer, this.customerForm.value);
    this.customerForm.patchValue({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      preferredLanguage: customer.preferredLanguage || this.selectedLanguage.code,
      address: {...customer.address},
      sameBillingAddress: sameBillingAddress,
      billingAddress: customer.billingAddress || {}
    });
    this.showBillingAddress = !sameBillingAddress;
  }

  private isBillingAddressSameAsShipping(customer: Customer, formValue: any): boolean {
    if (!customer.billingAddress && formValue.sameBillingAddress) return true;
    if (!customer.billingAddress || !customer.address) return false;
    const billingAddress = {
      firstName: customer.billingAddress.firstName,
      lastName: customer.billingAddress.lastName,
      phone: customer.billingAddress.phone,
      street: customer.billingAddress.street,
      houseNumber: customer.billingAddress.houseNumber,
      city: customer.billingAddress.city,
      zipCode: customer.billingAddress.zipCode,
      country: customer.billingAddress.country
    };
    const shippingAddress = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.address.phone,
      street: customer.address.street,
      houseNumber: customer.address.houseNumber,
      city: customer.address.city,
      zipCode: customer.address.zipCode,
      country: customer.address.country
    };

    return JSON.stringify(billingAddress) === JSON.stringify(shippingAddress);
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const newPassword = group.get('newPassword')?.value;
      const confirmNewPassword = group.get('confirmNewPassword')?.value;
      return newPassword && confirmNewPassword && newPassword !== confirmNewPassword ? {mismatch: true} : null;
    };
  }

  private createCustomerPayload() {
    const formValue = this.customerForm.value;
    const useShippingAddress = formValue.sameBillingAddress;
    return {
      email: this.authService.getEmail().trim().toLowerCase(),
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.address.phone,
      preferredLanguage: formValue.preferredLanguage,
      address: {...formValue.address},
      billingAddress: useShippingAddress ? {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.address.phone,
        companyName: null,
        taxId: null,
        ...formValue.address
      } : {...formValue.billingAddress}
    };
  }

  private handleSaveSuccess(): void {
    this.showSnackbar('CUSTOMER.SAVE_SUCCESS');
    this.customerForm.markAsPristine();
    this.saving = false;
    this.router.navigate(['/dashboard']);
  }

  private handleSaveError(err: any): void {
    this.showSnackbar('CUSTOMER.SAVE_ERROR', 'error-snackbar');
    this.saving = false;
    console.error('Error saving customer details:', err);
  }

  private handlePasswordChangeSuccess(formDirective: FormGroupDirective): void {
    this.showSnackbar('CUSTOMER.PASSWORD_CHANGE_SUCCESS');
    formDirective.resetForm();
    this.router.navigate(['/dashboard']);
  }

  private handlePasswordChangeError(err: any, userId: string): void {
    const errorKey = err.status === 401 ? 'CUSTOMER.INCORRECT_PASSWORD' : 'CUSTOMER.PASSWORD_CHANGE_ERROR';
    this.showSnackbar(errorKey, 'error-snackbar');
    console.error(`Password change failed for ${userId}:`, err);
  }

  private showSnackbar(translationKey: string, panelClass: string = ''): void {
    this.snackBar.open(
      this.translate.instant(translationKey),
      this.translate.instant('COMMON.CLOSE'),
      {duration: 5000, panelClass: panelClass ? [panelClass] : []}
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
