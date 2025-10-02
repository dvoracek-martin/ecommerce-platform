import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormGroupDirective, ValidatorFn, Validators} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {CustomerService} from '../../../services/customer.service';
import {CustomerAddress} from '../../../dto/customer/customer-address-dto';
import {CustomerBillingAddress} from '../../../dto/customer/custommer-billing-address-dto';
import {Customer} from '../../../dto/customer/customer-dto';
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
export class CustomersAdminDetailComponent implements OnInit, OnDestroy, AfterViewInit {
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
  customerId: string | null = null;
  languageChanged = false;

  locales: ResponseLocaleDto[] = [];
  selectedLanguage: ResponseLocaleDto | null = null;

  // FIX: Use setters for Paginator and Sort to guarantee they are linked
  // as soon as they are available in the view.
  private sort!: MatSort;
  private paginator!: MatPaginator;

  @ViewChild(MatSort) set ordersSort(sort: MatSort) {
    this.sort = sort;
    if (this.ordersDataSource) {
      this.ordersDataSource.sort = this.sort;
    }
  }

  @ViewChild(MatPaginator) set ordersPaginator(paginator: MatPaginator) {
    this.paginator = paginator;
    if (this.ordersDataSource) {
      this.ordersDataSource.paginator = this.paginator;
    }
  }

  customer: Customer | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private customerService: CustomerService,
    private customerState: CustomerStateService,
    private orderService: OrderService,
    private orderState: OrderStateService,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
    public translateService: TranslateService,
  ) {
    this.customerForm = this.createCustomerForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.customerId = this.customerState.getSelectedCustomer();

    if (!this.customerId) {
      this.showSnackbar('CUSTOMER.NOT_FOUND', 'error-snackbar');
      this.router.navigate(['/admin/customers']);
      return;
    }

    this.loadConfigurationAndCustomer();
    this.setupBillingAddressValidation();
  }

  ngAfterViewInit(): void {
    // FIX: Define data accessors and predicates here once.

    this.ordersDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'invoiceId':
          return item.invoiceId || '';
        case 'orderDate':
          return new Date(item.orderDate).getTime();
        case 'shippingMethod':
          return item.shippingMethod || '';
        case 'paymentMethod':
          return item.paymentMethod || '';
        case 'finalTotal':
          return item.finalTotal || 0;
        case 'status':
          return item.status || '';
        default:
          return (item as any)[property] || '';
      }
    };

    this.ordersDataSource.filterPredicate = (data: ClientOrder, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      return (
        (data.invoiceId || '').toLowerCase().includes(searchStr) ||
        data.shippingMethod.toLowerCase().includes(searchStr) ||
        data.paymentMethod.toLowerCase().includes(searchStr) ||
        (data.finalTotal || 0).toString().includes(searchStr) ||
        (data.status || '').toLowerCase().includes(searchStr) ||
        data.orderDate.toString().toLowerCase().includes(searchStr)
      );
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dateOfBirthControl(): AbstractControl | null {
    return this.customerForm.get('dateOfBirth');
  }

  private loadConfigurationAndCustomer(): void {
    this.loading = true;

    this.configurationService.getLastAppSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.locales = settings.usedLocales || [];
          this.loadCustomerData();
        },
        error: (err) => {
          console.error('Error loading configuration:', err);
          this.loadCustomerData();
        }
      });
  }

  private loadCustomerData(): void {
    if (!this.customerId) return;

    this.customerService.getCustomerById(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customer) => {
          this.handleCustomerDataSuccess(customer);
          this.loadOrders();
        },
        error: (err) => {
          this.handleError(err);
        }
      });
  }

  private handleCustomerDataSuccess(customer: Customer): void {
    this.customer = customer;
    this.initialBillingAddress = customer.billingAddress || null;
    this.initialAddress = customer.address || null;

    this.patchFormValues(customer);

    if (customer.preferredLanguageId && this.locales.length > 0) {
      this.selectedLanguage = this.locales.find(l => l.id === customer.preferredLanguageId) || null;
    }

    this.loading = false;
  }

  private patchFormValues(customer: Customer): void {
    const sameBillingAddress = this.isBillingAddressSameAsShipping(customer);

    this.customerForm.patchValue({
      email: customer.email || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      preferredLanguageId: customer.preferredLanguageId || '',
      dateOfBirth: (customer as any).dateOfBirth || null,
      address: {
        phone: customer.address?.phone || '',
        street: customer.address?.street || '',
        houseNumber: customer.address?.houseNumber || '',
        city: customer.address?.city || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || this.DEFAULT_COUNTRY
      },
      sameBillingAddress: sameBillingAddress,
      billingAddress: customer.billingAddress || {
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
      },
      active: customer.active !== undefined ? customer.active : true
    });

    this.showBillingAddress = !sameBillingAddress;
    this.customerForm.markAsPristine();
  }

  private isBillingAddressSameAsShipping(customer: Customer): boolean {
    if (!customer.billingAddress) return true;
    if (!customer.address) return false;

    const billing = customer.billingAddress;
    const shipping = customer.address;

    return (
      billing.firstName === customer.firstName &&
      billing.lastName === customer.lastName &&
      billing.street === shipping.street &&
      billing.houseNumber === shipping.houseNumber &&
      billing.city === shipping.city &&
      billing.zipCode === shipping.zipCode &&
      billing.country === shipping.country
    );
  }

  private createCustomerForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: [null],
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
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      passwordChange: this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^\S+$/)]],
        confirmNewPassword: ['', Validators.required]
      }, { validators: this.passwordMatchValidator() })
    });
  }

  private setupBillingAddressValidation(): void {
    this.customerForm.get('sameBillingAddress')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        this.showBillingAddress = !checked;
        const billingAddress = this.customerForm.get('billingAddress') as FormGroup;

        if (checked) {
          Object.keys(billingAddress.controls).forEach(controlName => {
            billingAddress.get(controlName)?.clearValidators();
            billingAddress.get(controlName)?.updateValueAndValidity();
          });

          billingAddress.patchValue({
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
        } else {
          billingAddress.get('firstName')?.setValidators(Validators.required);
          billingAddress.get('lastName')?.setValidators(Validators.required);
          billingAddress.get('street')?.setValidators(Validators.required);
          billingAddress.get('houseNumber')?.setValidators(Validators.required);
          billingAddress.get('city')?.setValidators(Validators.required);
          billingAddress.get('zipCode')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
          billingAddress.get('country')?.setValidators(Validators.required);
          billingAddress.updateValueAndValidity();

          if (this.initialBillingAddress) {
            billingAddress.patchValue(this.initialBillingAddress);
          }
        }
      });
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const newPassword = group.get('newPassword')?.value;
      const confirmNewPassword = group.get('confirmNewPassword')?.value;
      return newPassword && confirmNewPassword && newPassword !== confirmNewPassword ?
        { mismatch: true } : null;
    };
  }

  onLanguageChange(langId: number): void {
    const lang = this.locales.find(l => l.id === langId);
    if (!lang) return;

    this.selectedLanguage = lang;
    this.customerForm.patchValue({ preferredLanguageId: lang.id });
    this.languageChanged = true;
  }

  onSave(): void {
    if (this.customerForm.invalid || (!this.customerForm.dirty && !this.languageChanged)) {
      this.showSnackbar('ERRORS.FIX_FORM', 'error-snackbar');
      return;
    }

    this.saving = true;
    const payload = this.createCustomerPayload();

    if (!this.customerId) {
      this.saving = false;
      return;
    }

    this.customerService.updateCustomer(this.customerId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private createCustomerPayload(): any {
    const formValue = this.customerForm.value;
    const useShippingAddress = formValue.sameBillingAddress;

    return {
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      phone: formValue.address.phone,
      active: formValue.active,
      preferredLanguageId: formValue.preferredLanguageId,
      address: { ...formValue.address },
      billingAddress: useShippingAddress ?
        this.createBillingAddressFromShipping(formValue) :
        { ...formValue.billingAddress }
    };
  }

  private createBillingAddressFromShipping(formValue: any): any {
    return {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.address.phone,
      companyName: null,
      taxId: null,
      street: formValue.address.street,
      houseNumber: formValue.address.houseNumber,
      city: formValue.address.city,
      zipCode: formValue.address.zipCode,
      country: formValue.address.country
    };
  }

  private handleSaveSuccess(): void {
    this.showSnackbar('CUSTOMER.SAVE_SUCCESS');
    this.customerForm.markAsPristine();
    this.languageChanged = false;
    this.saving = false;

    this.loadCustomerData();
  }

  private handleSaveError(err: any): void {
    this.showSnackbar('CUSTOMER.SAVE_ERROR', 'error-snackbar');
    this.saving = false;
    console.error('Error saving customer:', err);
  }

  onChangePassword(formDirective: FormGroupDirective): void {
    const passwordGroup = this.passwordForm.get('passwordChange');
    if (!passwordGroup || passwordGroup.invalid || !passwordGroup.dirty) {
      this.showSnackbar('ERRORS.FIX_FORM', 'error-snackbar');
      passwordGroup?.markAllAsTouched();
      return;
    }

    this.savingPassword = true;
    const { newPassword } = passwordGroup.value;

    if (!this.customerId) {
      this.savingPassword = false;
      return;
    }

    this.customerService.changeCustomerPassword(this.customerId, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handlePasswordChangeSuccess(formDirective),
        error: (err) => this.handlePasswordChangeError(err)
      });
  }

  private handlePasswordChangeSuccess(formDirective: FormGroupDirective): void {
    this.showSnackbar('CUSTOMER.PASSWORD_CHANGE_SUCCESS');
    formDirective.resetForm();
    this.passwordForm.reset();
    this.savingPassword = false;
  }

  private handlePasswordChangeError(err: any): void {
    const errorKey = err.status === 401 ? 'CUSTOMER.INCORRECT_PASSWORD' : 'CUSTOMER.PASSWORD_CHANGE_ERROR';
    this.showSnackbar(errorKey, 'error-snackbar');
    this.savingPassword = false;
    console.error('Password change error:', err);
  }

  private loadOrders(): void {
    if (!this.customerId) {
      this.isOrdersLoading = false;
      return;
    }

    this.isOrdersLoading = true;
    this.ordersError = null;

    this.orderService.getByCustomerId(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.handleOrdersSuccess(orders);
        },
        error: (err) => {
          this.handleOrdersError(err);
        }
      });
  }

  private handleOrdersSuccess(orders: ResponseOrderDTO[]): void {
    const ordersWithInvoice: ClientOrder[] = orders.map(order => {
      const orderDate = new Date(order.orderDate);
      const year = orderDate.getFullYear();
      const invoiceId = `${year}${order.orderYearOrderCounter?.toString().padStart(5, '0') || '00000'}`;
      return { ...order, invoiceId };
    });

    // Set the data directly to the dataSource
    this.ordersDataSource.data = ordersWithInvoice;
    this.isOrdersLoading = false;
  }

  private handleOrdersError(err: any): void {
    this.ordersError = err.message || 'Failed to load orders.';
    this.isOrdersLoading = false;
    console.error('Error loading orders:', err);
  }

  viewOrderDetails(orderId: number): void {
    this.orderState.setSelectedOrder(orderId);
    this.router.navigate(['/admin/orders/detail']);
  }

  downloadOrderInvoice(order: ClientOrder): void {
    if (!this.customerId) return;

    this.orderService.downloadInvoice(this.customerId, order.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const blob = new Blob([response], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice_${order.invoiceId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          this.showSnackbar('CUSTOMER.INVOICE_DOWNLOAD_SUCCESS');
        },
        error: (err) => {
          console.error('Error downloading invoice:', err);
          this.showSnackbar('CUSTOMER.INVOICE_DOWNLOAD_ERROR', 'error-snackbar');
        }
      });
  }

  getOrderStatusClass(status?: string): string {
    if (!status) return 'status-unknown';

    switch (status.toUpperCase()) {
      case 'CREATED': return 'status-created';
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'FINISHED': return 'status-finished';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getOrderStatusText(status?: string): string {
    if (!status) return 'UNKNOWN';
    return this.translateService.instant(`ORDER_STATUS.${status.toUpperCase()}`);
  }

  navigateBackToList(): void {
    this.router.navigate(['/admin/customers']);
  }

  translateLocale(locale: ResponseLocaleDto): string {
    return this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode);
  }

  private showSnackbar(translationKey: string, panelClass: string = ''): void {
    const message = this.translateService.instant(translationKey);
    const closeText = this.translateService.instant('COMMON.CLOSE');

    this.snackBar.open(message, closeText, {
      duration: 5000,
      panelClass: panelClass ? [panelClass] : []
    });
  }

  private handleError(err: any): void {
    this.loading = false;
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
    } else if (err.status === 404) {
      this.showSnackbar('CUSTOMER.NOT_FOUND', 'error-snackbar');
      this.router.navigate(['/admin/customers']);
    } else {
      this.showSnackbar('CUSTOMER.LOAD_ERROR', 'error-snackbar');
      console.error('Error loading customer:', err);
    }
  }
}
