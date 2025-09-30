import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormGroupDirective, ValidatorFn, Validators} from '@angular/forms';
import {HttpClient, HttpResponse} from '@angular/common/http';
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
import {CustomerStateService} from '../../../services/customer-state.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {OrderService} from '../../../services/order.service';
import {OrderStateService} from '../../../services/order-state.service';
import {ResponseOrderDTO} from '../../../dto/order/response-order-dto';
import {ConfigurationService} from '../../../services/configuration.service';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {LocaleMapperService} from '../../../services/locale-mapper.service';

interface ClientOrder extends ResponseOrderDTO {
  invoiceId?: string;
}

@Component({
  selector: 'app-customers-admin-detail',
  templateUrl: './customers-admin-detail.component.html',
  styleUrls: ['./customers-admin-detail.component.scss'],
  standalone: false,
  animations: [
    trigger('slideDown', [
      state('void', style({height: '0', opacity: 0, overflow: 'hidden'})),
      state('*', style({height: '*', opacity: 1})),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class CustomersAdminDetailComponent implements OnInit, OnDestroy {
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
  ordersDataSource = new MatTableDataSource<ClientOrder>();
  ordersDisplayedColumns: string[] = ['invoiceId', 'orderDate', 'shippingMethod', 'paymentMethod', 'finalTotal', 'status', 'actions'];
  isOrdersLoading = true;
  ordersError: string | null = null;
  customerId: string;
  languageChanged = false;

  locales: ResponseLocaleDto[] = [];

  @ViewChild(MatSort) ordersSort!: MatSort;
  @ViewChild(MatPaginator) ordersPaginator!: MatPaginator;

  inUseLocales = [];
  selectedLanguage = this.inUseLocales[0];
  protected customer: Customer;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private customerService: CustomerService,
    private dialog: MatDialog,
    private customerState: CustomerStateService,
    private orderService: OrderService,
    private orderState: OrderStateService,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
    public translateService: TranslateService,
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Load last app settings to get locales and default locale
    this.configurationService.getLastAppSettings()
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
            this.selectedLanguage = defaultLocale;
            this.customerForm.patchValue({ preferredLanguageId: this.selectedLanguage?.id });
          }

          if (this.selectedLanguage) {
            this.translateService.use(this.selectedLanguage.languageCode.toLowerCase());
          }

          // align inUseLocales with usedLocales from settings
          this.inUseLocales = this.locales;
          const activeLang = this.translateService.currentLang || this.selectedLanguage.languageCode.toLowerCase();
          this.selectedLanguage = this.inUseLocales.find(
            l => l.languageCode.toLowerCase() === activeLang
          ) || this.inUseLocales[0];
        },
        error: err => console.error('Error loading app settings:', err)
      });

    this.customerId = this.customerState.getSelectedCustomer();
    this.loadCustomerData(this.customerId);
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.customerState.clearSelectedCustomer();
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
    const token = this.authService.token;

    if (this.customerId && token) {
      const payload = this.createCustomerPayload();
      this.http.put(`http://localhost:8080/api/customers/v1/admin/${this.customerId}`, payload, {
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
      const {newPassword} = passwordGroup.value;
      this.http.put(
        `http://localhost:8080/api/users/v1/admin/${userId}/password`,
        {newPassword},
        {headers: {'Authorization': `Bearer ${token}`}}
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.handlePasswordChangeSuccess(formDirective),
        error: err => this.handlePasswordChangeError(err, userId)
      }).add(() => (this.savingPassword = false));
    }
  }

  private initializeForms(): void {
    this.customerForm = this.fb.group({
      email: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      preferredLanguageId: [''],
      address: this.fb.group({
        phone: ['', [Validators.pattern(/^\+?[0-9\s-]+$/)]],
        street: ['', Validators.required],
        houseNumber: ['', Validators.required],
        city: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
        country: [this.DEFAULT_COUNTRY, Validators.required]
      }),
      active: [true],
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

  private loadCustomerData(customerId: string): void {
    const token = this.authService.token;

    this.http.get<Customer>(`http://localhost:8080/api/customers/v1/admin/${customerId}`, {
      headers: {'Authorization': `Bearer ${token}`}
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: customer => this.handleCustomerDataSuccess(customer),
      error: err => this.handleError(err)
    });
  }


  private handleCustomerDataSuccess(customer: Customer): void {
    this.customer = customer;
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
      email: customer.email || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      preferredLanguageId: customer.preferredLanguageId || this.selectedLanguage.code,
      address: {...customer.address},
      sameBillingAddress: sameBillingAddress,
      billingAddress: customer.billingAddress || {},
      active: customer.active
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
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.address.phone,
      active: formValue.active,
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
    this.router.navigate(['/admin/customers']);
  }

  private handleSaveError(err: any): void {
    this.showSnackbar('CUSTOMER.SAVE_ERROR', 'error-snackbar');
    this.saving = false;
    console.error('Error saving customer details:', err);
  }

  private handlePasswordChangeSuccess(formDirective: FormGroupDirective): void {
    this.showSnackbar('CUSTOMER.PASSWORD_CHANGE_SUCCESS');
    formDirective.resetForm();
    this.router.navigate(['/admin/customers']);
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

  private loadOrders(): void {
    this.isOrdersLoading = true;
    this.ordersError = null;
    this.customerId = this.customerState.getSelectedCustomer();
    if (!this.customerId) {
      this.isOrdersLoading = false;
      return;
    }
    this.orderService.getByCustomerId(this.customerId).subscribe({
      next: (orders) => {
        if (!orders || orders.length === 0) {
          this.ordersDataSource.data = [];
          this.isOrdersLoading = false;
          return;
        }
        this.ordersDataSource.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'invoiceId':
              return item.invoiceId || '';
            case 'shippingMethod':
              return item.shippingMethod;
            case 'paymentMethod':
              return item.paymentMethod;
            case 'finalTotal':
              return item.finalTotal || 0;
            case 'status':
              return item.status || '';
            default:
              return item[property as keyof ClientOrder] as string;
          }
        };

        const ordersWithInvoice: ClientOrder[] = orders.map(order => {
          const orderDate = new Date(order.orderDate);
          const year = orderDate.getFullYear();
          const invoiceId = `${year}${order.orderYearOrderCounter.toString().padStart(5, '0')}`;
          return {...order, invoiceId};
        });

        this.ordersDataSource.data = ordersWithInvoice;
        this.ordersDataSource.sort = this.ordersSort;
        this.ordersDataSource.paginator = this.ordersPaginator;
        this.isOrdersLoading = false;
      },
      error: (err) => {
        this.ordersError = err.message || 'Failed to load orders.';
        this.isOrdersLoading = false;
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    this.orderState.setSelectedOrder(orderId);
    this.router.navigate(['/admin/orders/detail']);
  }

  downloadOrderInvoice(order: ClientOrder): void {
    if (!this.customer?.id) return;

    this.orderService.downloadInvoice(this.customer.id.toString(), order.id).subscribe({
      next: (response: HttpResponse<ArrayBuffer>) => {
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `invoice_${order.invoiceId}.pdf`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch != null && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const blob = new Blob([response.body!], {type: 'application/pdf'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading invoice:', err);
      }
    });
  }

  getOrderStatusClass(status?: string): string {
    switch (status) {
      case 'CREATED':
        return 'status-created';
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PROCESSING':
        return 'status-processing';
      case 'SHIPPED':
        return 'status-shipped';
      case 'DELIVERED':
        return 'status-delivered';
      case 'FINISHED':
        return 'status-finished';
      case 'REJECTED':
        return 'status-rejected';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getOrderStatusText(status?: string): string {
    return status?.toUpperCase() || '';
  }

  navigateBackToList() {
    this.router.navigate(['/admin/customers']);
  }


  translateLocale(locale: ResponseLocaleDto) {
    return this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode);
  }
}
