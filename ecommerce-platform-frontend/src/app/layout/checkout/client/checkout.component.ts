import {ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {CartItem, CartService} from '../../../services/cart.service';
import {OrderService} from '../../../services/order.service';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ResponseMixtureDTO} from '../../../dto/mixtures/response-mixture-dto';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {ProductService} from '../../../services/product.service';
import {MixtureService} from '../../../services/mixture.service';
import {CartItemType} from '../../../dto/cart/cart-item-type';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {TermsModalComponent} from '../../../shared/terms-modal/terms-modal.component';
import {CustomerService} from '../../../services/customer.service';
import {OrderStateService} from '../../../services/order-state.service';
import {Customer} from '../../../dto/customer/customer-dto';
import {CustomerBillingAddress} from '../../../dto/customer/custommer-billing-address-dto';
import {CustomerAddress} from '../../../dto/customer/customer-address-dto';
import {HeaderComponent} from '../../header/header.component';
import {LocaleMapperService} from '../../../services/locale-mapper.service';

interface CartItemWithDetails extends CartItem {
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
  optimisticQuantity?: number;
  updating?: boolean;
}


@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: false,
  animations: [
    trigger('slideDown', [
      state('void', style({height: '0', opacity: 0, overflow: 'hidden'})),
      state('*', style({height: '*', opacity: 1})),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class CheckoutComponent implements OnInit {
  @ViewChild('termsModal') termsModal!: TemplateRef<any>;

  currentStep = 1;
  totalSteps = 4;
  isLoggedIn = false;
  orderComplete = false;
  orderId: number;
  readonly DEFAULT_COUNTRY = 'Switzerland';
  showBillingAddress = false;
  private initialBillingAddress: CustomerBillingAddress | null = null;
  private initialAddress: CustomerAddress | null = null;
  isAuthPopupOpen = false;
  CartItemType = CartItemType;
  isCartEmpty: boolean = false;
  isPlacingOrder = false;

  selectedShippingMethod: string = '';
  selectedPaymentMethod: string = '';
  shippingMethods = [
    {id: 'standard', name: 'Standard Shipping', price: 9.99, deliveryTime: '3-5 business days'},
    {id: 'express', name: 'Express Shipping', price: 19.99, deliveryTime: '2-3 business days'},
    {id: 'premium', name: 'Premium Delivery', price: 29.99, deliveryTime: 'Next business day'}
  ];

  paymentMethods = [
    {id: 'credit_card', name: 'Credit Card'},
    {id: 'paypal', name: 'PayPal'},
    {id: 'bank_transfer', name: 'Bank Transfer'}
  ];

  customerForm: FormGroup;
  cartItems: CartItemWithDetails[] = [];
  cartTotal = 0;
  shippingCost = 0;
  finalTotal = 0;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private customerService: CustomerService,
    private orderState: OrderStateService,
    private localeMapperService: LocaleMapperService
  ) {
    this.matIconRegistry.addSvgIcon(
      'flag_ch',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/ch.svg')
    );

    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: this.fb.group({
        phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]+$/)]],
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
        phone: ['', [Validators.pattern(/^\+?[0-9\s-]+$/)]],
        street: [''],
        houseNumber: [''],
        city: [''],
        zipCode: [''],
        country: [this.DEFAULT_COUNTRY]
      }),
      shippingMethod: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.fetchCustomerData();
        this.customerForm.patchValue({
          email: this.authService.getEmail()
        });
        this.isAuthPopupOpen = false;
      }
    });
    this.loadCart();
    this.setupBillingAddressValidation();
  }

  fetchCustomerData(): void {
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (userId && token) {
      this.http.get<Customer>(`http://localhost:8080/api/customers/v1/${userId}`, {
        headers: {'Authorization': `Bearer ${token}`}
      }).subscribe({
        next: (customer: Customer) => {
          this.handleCustomerDataSuccess(customer);
        },
        error: (err) => {
          console.error('Failed to fetch customer data:', err);
          this.showSnackbar('CHECKOUT.FETCH_USER_DATA_ERROR');
          this.customerForm.get('address.country')?.patchValue(this.DEFAULT_COUNTRY);
          this.customerForm.get('billingAddress.country')?.patchValue(this.DEFAULT_COUNTRY);
        }
      });
    } else {
      this.customerForm.get('address.country')?.patchValue(this.DEFAULT_COUNTRY);
      this.customerForm.get('billingAddress.country')?.patchValue(this.DEFAULT_COUNTRY);
    }
  }

  private handleCustomerDataSuccess(customer: Customer): void {
    this.initialBillingAddress = customer.billingAddress;
    this.initialAddress = customer.address;
    this.patchFormValues(customer);
  }

  private patchFormValues(customer: Customer): void {
    const sameBillingAddress = this.isBillingAddressSameAsShipping(customer);

    this.customerForm.patchValue({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || this.authService.getEmail() || '',
      address: {
        phone: customer.address?.phone || '',
        street: customer.address?.street || '',
        houseNumber: customer.address?.houseNumber || '',
        city: customer.address?.city || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || this.DEFAULT_COUNTRY
      },
      billingAddress: customer.billingAddress ? customer.billingAddress : {
        firstName: '', lastName: '', companyName: '', taxId: '',
        street: '', houseNumber: '', city: '', zipCode: '', country: this.DEFAULT_COUNTRY,
        phone: ''
      }
    });

    this.customerForm.get('sameBillingAddress')?.setValue(sameBillingAddress, {emitEvent: true});
    this.customerForm.updateValueAndValidity();
  }

  private isBillingAddressSameAsShipping(customer: Customer): boolean {
    const shippingAddress = customer.address;
    const billingAddress = customer.billingAddress;

    if (!shippingAddress && !billingAddress) {
      return true;
    }
    if (!shippingAddress || !billingAddress) {
      return false;
    }

    return (
      billingAddress.firstName === customer.firstName &&
      billingAddress.lastName === customer.lastName &&
      billingAddress.phone === shippingAddress.phone &&
      billingAddress.street === shippingAddress.street &&
      billingAddress.houseNumber === shippingAddress.houseNumber &&
      billingAddress.city === shippingAddress.city &&
      billingAddress.zipCode === shippingAddress.zipCode &&
      billingAddress.country === shippingAddress.country &&
      (!billingAddress.companyName || billingAddress.companyName === '') &&
      (!billingAddress.taxId || billingAddress.taxId === '')
    );
  }

  private setupBillingAddressValidation(): void {
    this.showBillingAddress = !this.customerForm.get('sameBillingAddress')?.value;

    this.customerForm.get('sameBillingAddress')?.valueChanges.subscribe(checked => {
      this.showBillingAddress = !checked;
      const billingAddressGroup = this.customerForm.get('billingAddress') as FormGroup;

      const billingControls = [
        'firstName', 'lastName', 'phone', 'street', 'houseNumber', 'city',
        'zipCode', 'country', 'companyName', 'taxId'
      ];

      if (checked) {
        // Copy shipping address to billing address
        this.copyShippingToBilling();

        billingControls.forEach(controlName => {
          const control = billingAddressGroup.get(controlName);
          control?.clearValidators();
          control?.updateValueAndValidity();
        });
      } else {
        // Restore original billing address data
        if (this.initialBillingAddress) {
          billingAddressGroup.patchValue(this.initialBillingAddress);
        }

        billingAddressGroup.get('firstName')?.setValidators(Validators.required);
        billingAddressGroup.get('lastName')?.setValidators(Validators.required);
        billingAddressGroup.get('street')?.setValidators(Validators.required);
        billingAddressGroup.get('houseNumber')?.setValidators(Validators.required);
        billingAddressGroup.get('city')?.setValidators(Validators.required);
        billingAddressGroup.get('zipCode')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
        billingAddressGroup.get('country')?.setValidators(Validators.required);
        billingAddressGroup.get('phone')?.setValidators([Validators.pattern(/^\+?[0-9\s-]+$/)]);
        billingAddressGroup.get('taxId')?.setValidators([Validators.pattern(/^[A-Za-z0-9]+$/)]);

        billingControls.forEach(controlName => {
          billingAddressGroup.get(controlName)?.updateValueAndValidity();
        });
      }
      this.customerForm.updateValueAndValidity();
    });
  }

  private copyShippingToBilling(): void {
    const shippingAddress = this.customerForm.get('address')?.value;
    const billingAddress = {
      firstName: this.customerForm.get('firstName')?.value,
      lastName: this.customerForm.get('lastName')?.value,
      companyName: '',
      taxId: '',
      phone: shippingAddress.phone,
      street: shippingAddress.street,
      houseNumber: shippingAddress.houseNumber,
      city: shippingAddress.city,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country
    };

    this.customerForm.get('billingAddress')?.patchValue(billingAddress);
  }

  openTermsModal(): void {
    this.dialog.open(TermsModalComponent, {
      width: '600px',
      maxHeight: '80vh',
      panelClass: 'light-theme-modal',
      backdropClass: 'light-theme-modal-backdrop'
    });
  }

  openAuthPopup(): void {
    this.isAuthPopupOpen = true;
  }

  closeAuthPopup(): void {
    this.isAuthPopupOpen = false;
    if (this.authService.isAuthenticated$) {
      this.fetchCustomerData();
    }
  }

  selectShippingMethod(method: string): void {
    this.selectedShippingMethod = method;
    this.customerForm.get('shippingMethod')?.setValue(method);

    const selectedMethod = this.shippingMethods.find(m => m.id === method);
    if (selectedMethod) {
      this.shippingCost = selectedMethod.price;
      this.finalTotal = this.cartTotal + this.shippingCost;
    }
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    this.customerForm.get('paymentMethod')?.setValue(method);
  }

  loadCart(): void {
    this.cartService.getCart().pipe(
      switchMap(cart => {
        if (!cart || !cart.items || cart.items.length === 0) {
          // Only show empty cart if order is not complete
          if (!this.orderComplete) {
            this.isCartEmpty = true;
          }
          this.cartItems = [];
          this.cartTotal = 0;
          return of([]);
        } else {
          this.isCartEmpty = false;
          this.cartItems = cart.items || [];
          // Calculate cart total from items instead of relying on cart.totalPrice
          this.cartTotal = this.calculateCartTotal(this.cartItems);

          // Load product and mixture details for each item
          const detailObservables = this.cartItems.map(item => {
            if (item.cartItemType === CartItemType.PRODUCT) {
              return this.productService.getProductById(item.itemId).pipe(
                map(product => ({...item, product, optimisticQuantity: item.quantity, updating: false})),
                catchError(() => of({...item, product: undefined, optimisticQuantity: item.quantity, updating: false}))
              );
            } else if (item.cartItemType === CartItemType.MIXTURE) {
              return this.mixtureService.getMixtureById(item.itemId).pipe(
                map(mixture => ({...item, mixture, optimisticQuantity: item.quantity, updating: false})),
                catchError(() => of({...item, mixture: undefined, optimisticQuantity: item.quantity, updating: false}))
              );
            }
            return of({...item, optimisticQuantity: item.quantity, updating: false});
          });

          return forkJoin(detailObservables);
        }
      })
    ).subscribe((itemsWithDetails: any[]) => {
      if (!this.isCartEmpty) {
        this.cartItems = itemsWithDetails as CartItemWithDetails[];
        this.translateCartItems()
        // Recalculate total after loading details
        this.cartTotal = this.calculateCartTotal(this.cartItems);
        this.shippingCost = this.cartTotal > 50 ? 0 : 9.99;
        this.finalTotal = this.cartTotal + this.shippingCost;
      }
    }, error => {
      console.error('Error loading cart:', error);
      // Only show empty cart if order is not complete
      if (!this.orderComplete) {
        this.isCartEmpty = true;
      }
      this.cartItems = [];
      this.cartTotal = 0;
      this.shippingCost = 0;
      this.finalTotal = 0;
    });
  }

  // Add this method to calculate cart total from items
  private calculateCartTotal(items: CartItemWithDetails[]): number {
    return items.reduce((total, item) => {
      const price = item.product?.price || item.mixture?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }

  onQuantityInputChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
      input.value = this.cartItems[index].quantity.toString();
      return;
    }

    this.updateItemQuantity(this.cartItems[index], newQuantity);
  }

  // New method to handle quantity changes on the review page
  changeQuantity(index: number, change: number): void {
    const item = this.cartItems[index];
    const newQuantity = item.quantity + change;

    if (newQuantity > 0) {
      this.updateItemQuantity(item, newQuantity);
    } else {
      this.removeItem(item.itemId, item.cartItemType);
    }
  }

  // Method to update item quantity and handle optimistic updates
  updateItemQuantity(item: CartItemWithDetails, newQuantity: number): void {
    // Optimistic update
    item.optimisticQuantity = newQuantity;
    item.updating = true;

    this.cartService.updateItem(item.itemId, newQuantity, item.cartItemType).subscribe(
      (updatedCart) => {
        // Sync with latest cart data
        const updatedItem = updatedCart.items.find(i =>
          i.itemId === item.itemId && i.cartItemType === item.cartItemType
        );
        if (updatedItem) {
          item.quantity = updatedItem.quantity;
        }
        item.optimisticQuantity = undefined;
        item.updating = false;
        this.recalculateTotals();
      },
      (error) => {
        // Revert on error
        item.optimisticQuantity = undefined;
        item.updating = false;
        this.recalculateTotals();
        this.showSnackbar('CHECKOUT.UPDATE_QUANTITY_ERROR');
      }
    );
  }

  // Method to remove an item from the cart
  removeItem(itemId: number, cartItemType: CartItemType): void {
    if (itemId === undefined) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: {
        title: this.translate.instant('DIALOG.CONFIRM_DELETE_TITLE'),
        message: this.translate.instant('DIALOG.CONFIRM_DELETE_MESSAGE')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Optimistic removal
        this.cartItems = this.cartItems.filter(item => !(item.itemId === itemId && item.cartItemType === cartItemType));

        // Check if cart is now empty
        if (this.cartItems.length === 0) {
          this.isCartEmpty = true;
        }

        this.cartService.removeItem(itemId).subscribe(
          () => {
            this.showSnackbar('CHECKOUT.ITEM_REMOVED');
            this.recalculateTotals();
          },
          error => {
            // Re-add item on error
            this.loadCart(); // Reload cart items
            this.showSnackbar('CHECKOUT.REMOVE_ITEM_ERROR');
            console.error('Remove item error:', error);
          }
        );
      }
    });
  }

  private recalculateTotals(): void {
    this.cartTotal = this.calculateCartTotal(this.cartItems);
    this.shippingCost = this.cartTotal > 50 ? 0 : 9.99;
    this.finalTotal = this.cartTotal + this.shippingCost;
    this.cdRef.detectChanges();
  }

  getItemTotal(item: CartItemWithDetails): number {
    const quantity = item.optimisticQuantity !== undefined ? item.optimisticQuantity : item.quantity;
    const price = item.product?.price || item.mixture?.price || 0;
    return price * quantity;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.isCurrentStepValid()) {
        this.customerForm.markAllAsTouched();
        this.showSnackbar('CHECKOUT.FIX_FORM_ERRORS');
        return;
      }

      if (!this.isLoggedIn && this.customerForm.get('sameBillingAddress')?.value) {
        this.copyShippingToBilling();
      }
    } else if (this.currentStep === 2) {
      if (!this.isCurrentStepValid()) {
        this.customerForm.markAllAsTouched();
        this.showSnackbar('CHECKOUT.SELECT_SHIPPING_PAYMENT');
        return;
      }
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.cdRef.detectChanges();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdRef.detectChanges();
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.cdRef.detectChanges();
      return;
    }

    if (step === 2 && this.currentStep === 1) {
      if (!this.isCurrentStepValid()) {
        this.customerForm.markAllAsTouched();
        this.showSnackbar('CHECKOUT.COMPLETE_STEP_ONE');
        return;
      }
    } else if (step === 3 && this.currentStep === 2) {
      if (!this.isCurrentStepValid()) {
        this.customerForm.markAllAsTouched();
        this.showSnackbar('CHECKOUT.SELECT_SHIPPING_PAYMENT');
        return;
      }
    }

    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.cdRef.detectChanges();
    }
  }

  placeOrder(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.showSnackbar('CHECKOUT.FIX_FORM_ERRORS');
      console.error('Customer form is invalid. Cannot place order.');
      return;
    }

    // Set loading state
    this.isPlacingOrder = true;

    if (!this.isLoggedIn) {
      // For guest users, create a customer profile first
      this.createGuestCustomer().subscribe({
        next: (customer) => {
          // Now create the order with the customer ID
          this.createOrderWithCustomer(customer.id);
        },
        error: (err) => {
          console.error('Failed to create guest customer:', err);
          this.isPlacingOrder = false;
          this.showSnackbar('CHECKOUT.CREATE_CUSTOMER_ERROR');
        }
      });
    } else {
      // For logged-in users, create the order directly
      this.createOrderWithCustomer(this.authService.getUserId());
    }
  }

  private createGuestCustomer(): Observable<any> {
    const formValue = this.customerForm.value;

    const customerData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      address: formValue.address,
      billingAddress: formValue.sameBillingAddress ?
        // Use shipping address for billing if same
        {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phone: formValue.address.phone,
          companyName: '',
          taxId: '',
          street: formValue.address.street,
          houseNumber: formValue.address.houseNumber,
          city: formValue.address.city,
          zipCode: formValue.address.zipCode,
          country: formValue.address.country
        } :
        // Use separate billing address
        formValue.billingAddress
    };

    return this.customerService.createGuestCustomer(customerData);
  }

  private createOrderWithCustomer(customerId: string): void {
    const orderData = {
      customerId: customerId,
      items: this.cartItems.map(item => ({
        itemId: item.itemId,
        cartItemType: item.cartItemType,
        quantity: item.quantity
      })),
      shippingCost: this.shippingCost,
      cartTotal: this.cartTotal,
      finalTotal: this.finalTotal,
      shippingMethod: this.customerForm.get('shippingMethod')?.value,
      paymentMethod: this.customerForm.get('paymentMethod')?.value,
      selectedLocale: this.localeMapperService.getCurrentLocale()
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.orderId = order.id;
        this.orderComplete = true;
        this.isPlacingOrder = false; // Reset loading state

          // Clear the cart after successful order
          this.cartService.clearCart().subscribe(() => {
          // After clearing the cart, we don't want to show the empty cart message
          // because we are in the order complete state
          this.isCartEmpty = false;
          this.cdRef.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        this.isPlacingOrder = false; // Reset loading state
        this.showSnackbar('CHECKOUT.PLACE_ORDER_ERROR');
      }
    });
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      const basicInfoValid = this.customerForm.get('firstName')?.valid &&
        this.customerForm.get('lastName')?.valid &&
        this.customerForm.get('email')?.valid;

      const addressValid = (this.customerForm.get('address') as FormGroup).valid;

      let billingValid = true;
      if (this.showBillingAddress) {
        billingValid = (this.customerForm.get('billingAddress') as FormGroup).valid;
      }

      return basicInfoValid && addressValid && billingValid;
    }

    if (this.currentStep === 2) {
      return this.customerForm.get('shippingMethod')?.valid &&
        this.customerForm.get('paymentMethod')?.valid;
    }

    if (this.currentStep === 3) {
      return this.customerForm.valid;
    }

    return true;
  }

  continueShopping(): void {
    this.router.navigate(['/dashboard']);
  }

  viewOrder(): void {
    this.orderState.setSelectedOrder(this.orderId);
    this.router.navigate(['/orders/detail']);
  }

  private showSnackbar(translationKey: string): void {
    this.snackBar.open(
      this.translate.instant(translationKey),
      this.translate.instant('COMMON.CLOSE'),
      {duration: 5000}
    );
  }

  private translateCartItems() {
    this.cartItems.forEach(cartItem => {
      if (cartItem.cartItemType === CartItemType.PRODUCT && cartItem.product) {
        cartItem.product.translatedName = this.productService.getLocalizedName(cartItem.product);
      } else if (cartItem.cartItemType === CartItemType.MIXTURE && cartItem.mixture) {
        console.log(cartItem.mixture);
        if (Object.keys(cartItem.mixture.localizedFields).length === 0) {
          // customer-created mixtures don't have localized fields
          cartItem.mixture.translatedName = cartItem.mixture.name;
        } else {
          cartItem.mixture.translatedName = this.mixtureService.getLocalizedName(cartItem.mixture);
        }
        cartItem.mixture.products.forEach(product => {
          this.productService.getProductById(product.id).subscribe(responseProductDTO => {
            product.translatedName = this.productService.getLocalizedName(responseProductDTO);
          })
        });
      }
    });
  }
}
