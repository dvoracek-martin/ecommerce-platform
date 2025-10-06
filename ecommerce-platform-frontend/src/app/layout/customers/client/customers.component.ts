import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormGroupDirective, ValidatorFn, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../../services/auth.service';
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
import {ConfigurationService} from '../../../services/configuration.service';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {LocaleMapperService} from '../../../services/locale-mapper.service';

interface PasswordStrength {
  score: number;
  text: string;
  class: string;
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

  locales: ResponseLocaleDto[] = [];
  selectedLanguage?: ResponseLocaleDto;
  languageChanged = false;

  // Password visibility and strength properties
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  passwordStrength: PasswordStrength = { score: 0, text: '', class: '' };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translateService: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private customerService: CustomerService,
    private dialog: MatDialog,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    if (!this.authService.isTokenValid()) {
      this.handleUnauthorized();
      return;
    }

    // Load locales from last app settings (usedLocales) instead of getInUseLocales()
    this.configurationService.getLastAppSettingsWithCache()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.locales = settings.usedLocales || [];
          const defaultLocale = settings.defaultLocale;
          const preferredLangId = this.customerForm.value.preferredLanguageId;
          if (preferredLangId) {
            // match saved preferred language with available locales
            this.selectedLanguage = this.locales.find(l => l.id === preferredLangId) || defaultLocale;
          } else {
            // fallback to defaultLocale if user has no preferred language
            this.selectedLanguage = defaultLocale || this.locales[0];
            this.customerForm.patchValue({preferredLanguageId: this.selectedLanguage?.id});
          }

          if (this.selectedLanguage) {
            this.translateService.use(this.selectedLanguage.languageCode.toLowerCase());
          }
        },
        error: err => console.error('Error loading app settings:', err)
      });

    this.loadCustomerData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLanguageChange(langId: number): void {
    const lang = this.locales.find(l => l.id === langId);
    if (!lang) return;

    this.translateService.use(lang.languageCode.toLowerCase()).subscribe({
      next: () => {
        this.selectedLanguage = lang;
        this.customerForm.patchValue({preferredLanguageId: lang.id});
        this.customerService.setUserLanguage(lang.languageCode.toLowerCase());
        this.languageChanged = true;
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
      this.http.put(`/api/customers/v1/${userId}`, payload, {
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
        `/api/users/v1/${userId}/password`,
        {currentPassword, newPassword},
        {
          headers: {'Authorization': `Bearer ${token}`}
        }
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

  // Password strength methods matching user registration component
  checkPasswordStrength(): void {
    const password = this.passwordForm.get('passwordChange.newPassword')?.value;

    if (!password) {
      this.passwordStrength = { score: 0, text: '', class: '' };
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
    } else if (score <= 2) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_WEAK',
        class: 'weak'
      };
    } else if (score <= 3) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_FAIR',
        class: 'fair'
      };
    } else if (score <= 4) {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_GOOD',
        class: 'good'
      };
    } else {
      this.passwordStrength = {
        score,
        text: 'USER_REGISTRATION.PASSWORD_STRONG',
        class: 'strong'
      };
    }
  }

  getStrengthClass(barNumber: number): string {
    if (barNumber <= this.passwordStrength.score) {
      return this.passwordStrength.class;
    }
    return '';
  }

  hasMinLength(): boolean {
    const password = this.passwordForm.get('passwordChange.newPassword')?.value;
    return password && password.length >= 8;
  }

  hasNoSpaces(): boolean {
    const password = this.passwordForm.get('passwordChange.newPassword')?.value;
    return password && /^\S+$/.test(password);
  }

  passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get('passwordChange.newPassword')?.value;
    const confirmPassword = this.passwordForm.get('passwordChange.confirmNewPassword')?.value;
    return newPassword && confirmPassword && newPassword === confirmPassword;
  }

  private initializeForms(): void {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      preferredLanguageId: [],
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

    // Check password strength on every change
    this.passwordForm.get('passwordChange.newPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordStrength();
    });
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

    if (userId) {
      this.customerService.getById(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: customer => this.handleCustomerDataSuccess(customer),
          error: err => this.handleError(err)
        });
    }
  }

  private handleCustomerDataSuccess(customer: Customer): void {
    this.initialBillingAddress = customer.billingAddress;
    this.initialAddress = customer.address;
    this.patchFormValues(customer);

    if (customer.preferredLanguageId && this.locales.length > 0) {
      this.selectedLanguage = this.locales.find(l => l.id === customer.preferredLanguageId) || this.selectedLanguage;
      if (this.selectedLanguage) {
        this.translateService.use(this.selectedLanguage.languageCode.toLowerCase());
      }
    }

    this.loading = false;
  }

  private patchFormValues(customer: Customer): void {
    const sameBillingAddress = this.isBillingAddressSameAsShipping(customer, this.customerForm.value);
    this.customerForm.patchValue({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      preferredLanguage: customer.preferredLanguageId || this.selectedLanguage?.id,
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
      preferredLanguageId: formValue.preferredLanguageId,
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
      this.translateService.instant(translationKey),
      this.translateService.instant('COMMON.CLOSE'),
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

  translateLocale(locale: ResponseLocaleDto) {
    return this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode);
  }
}
