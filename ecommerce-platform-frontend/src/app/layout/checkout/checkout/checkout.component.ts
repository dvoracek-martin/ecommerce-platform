import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../auth/auth.service';
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

interface CartItemWithDetails extends CartItem {
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
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

interface Customer {
  id?: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  address?: Address | null;
  billingAddress?: BillingAddress | null;
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
  currentStep = 1;
  totalSteps = 3;
  isLoggedIn = false;
  orderComplete = false;
  orderId: string | null = null;
  readonly DEFAULT_COUNTRY = 'Switzerland';
  showBillingAddress = false;
  private initialBillingAddress: BillingAddress | null = null;
  private initialAddress: Address | null = null;


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
    private domSanitizer: DomSanitizer
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
        // Initialize all controls here explicitly, without required validators
        // These validators will be set dynamically in setupBillingAddressValidation
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
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.fetchUserData();
        this.customerForm.patchValue({
          email: this.authService.getEmail()
        });
      }
    });
    this.loadCart();
    this.setupBillingAddressValidation();
  }

  fetchUserData(): void {
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
      // Do NOT directly patch sameBillingAddress here, let the valueChanges subscription handle it.
      // This ensures the validators are set up correctly based on the patched value.
      billingAddress: customer.billingAddress ? customer.billingAddress : {
        firstName: '', lastName: '', companyName: '', taxId: '',
        street: '', houseNumber: '', city: '', zipCode: '', country: this.DEFAULT_COUNTRY,
        phone: ''
      }
    });

    // Explicitly set the sameBillingAddress value to trigger its valueChanges subscription
    // This is critical for applying correct validators after initial data load.
    this.customerForm.get('sameBillingAddress')?.setValue(sameBillingAddress, {emitEvent: true});

    // Force an update on the entire form's validity after patching
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
    this.customerForm.get('sameBillingAddress')?.valueChanges.subscribe(checked => {
      this.showBillingAddress = !checked;
      const billingAddressGroup = this.customerForm.get('billingAddress') as FormGroup;

      // Define all controls in billingAddressGroup for easier iteration
      const billingControls = [
        'firstName', 'lastName', 'phone', 'street', 'houseNumber', 'city',
        'zipCode', 'country', 'companyName', 'taxId'
      ];

      if (checked) {
        // Clear validators and reset values when same as shipping
        billingControls.forEach(controlName => {
          const control = billingAddressGroup.get(controlName);
          control?.clearValidators();
          // Reset to initial value if available, otherwise clear to empty string
          if (this.initialBillingAddress && this.initialBillingAddress[controlName as keyof BillingAddress]) {
            control?.reset(this.initialBillingAddress[controlName as keyof BillingAddress]);
          } else {
            control?.reset(''); // Reset to empty string
          }
          control?.updateValueAndValidity();
        });
      } else {
        // Apply validators and patch values when different
        if (this.initialBillingAddress) {
          billingAddressGroup.patchValue(this.initialBillingAddress);
        } else {
          // Reset to default empty state if no initial billing address data
          billingAddressGroup.reset({
            firstName: '', lastName: '', companyName: '', taxId: '',
            street: '', houseNumber: '', city: '', zipCode: '', country: this.DEFAULT_COUNTRY,
            phone: ''
          });
        }

        // Apply REQUIRED validators for core billing address fields
        billingAddressGroup.get('firstName')?.setValidators(Validators.required);
        billingAddressGroup.get('lastName')?.setValidators(Validators.required);
        billingAddressGroup.get('street')?.setValidators(Validators.required);
        billingAddressGroup.get('houseNumber')?.setValidators(Validators.required);
        billingAddressGroup.get('city')?.setValidators(Validators.required);
        billingAddressGroup.get('zipCode')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
        billingAddressGroup.get('country')?.setValidators(Validators.required);

        // Apply PATTERN validators (these are not 'required' by themselves)
        billingAddressGroup.get('phone')?.setValidators([Validators.pattern(/^\+?[0-9\s-]+$/)]);
        billingAddressGroup.get('taxId')?.setValidators([Validators.pattern(/^[A-Za-z0-9]+$/)]);


        // Update validity for all billing controls AFTER setting their validators
        billingControls.forEach(controlName => {
          billingAddressGroup.get(controlName)?.updateValueAndValidity();
        });
      }
      // CRITICAL: Force the entire customerForm to re-evaluate its validity
      this.customerForm.updateValueAndValidity();
    });
  }


  login(): void {
    this.router.navigate(['/login'], {
      queryParams: {returnUrl: this.router.url}
    });
  }

  loadCart(): void {
    this.cartService.getCart().subscribe(cart => {
      // Check if cart is null or undefined
      if (!cart) {
        this.cartItems = [];
        this.cartTotal = 0;
      } else {
        this.cartItems = cart.items || [];
        this.cartTotal = cart.totalPrice || 0;
      }

      this.shippingCost = this.cartTotal > 50 ? 0 : 9.99;
      this.finalTotal = this.cartTotal + this.shippingCost;
    }, error => {
      console.error('Error loading cart:', error);
      this.cartItems = [];
      this.cartTotal = 0;
      this.shippingCost = 0;
      this.finalTotal = 0;
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      // Use isCurrentStepValid() instead of customerForm.invalid
      if (!this.isCurrentStepValid()) {
        this.customerForm.markAllAsTouched();
        this.showSnackbar('CHECKOUT.FIX_FORM_ERRORS');
        return;
      }
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      return;
    }

    if (this.currentStep === 1 && step === 2) {
      // Use isCurrentStepValid() instead of customerForm.invalid
      if (!this.isCurrentStepValid()) {
        this.customerForm.markAllAsTouched();
        this.showSnackbar('CHECKOUT.COMPLETE_STEP_ONE');
        return;
      }
    }

    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  placeOrder(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.showSnackbar('CHECKOUT.FIX_FORM_ERRORS');
      console.error('Customer form is invalid. Cannot place order.');
      return;
    }

    const orderData = {
      customer: this.createCustomerPayload(),
      items: this.cartItems,
      total: this.finalTotal,
      status: 'confirmed'
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.orderId = order.id;
        this.orderComplete = true;
        this.cartService.clearCart().subscribe();
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        this.showSnackbar('CHECKOUT.PLACE_ORDER_ERROR');
      }
    });
  }

  private createCustomerPayload(): Customer {
    const formValue = this.customerForm.value;
    const useShippingAddressForBilling = formValue.sameBillingAddress;

    const customerPayload: Customer = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      address: { ...formValue.address },
      billingAddress: null
    };

    if (useShippingAddressForBilling) {
      customerPayload.billingAddress = {
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
      };
    } else {
      customerPayload.billingAddress = {
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
      };
    }

    return customerPayload;
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      // Check only step 1 fields
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
      // For step 2, check the entire form including terms agreement
      return this.customerForm.valid;
    }

    return true;
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  viewOrder(): void {
    if (this.orderId) {
      this.router.navigate(['/orders', this.orderId]);
    }
  }

  private showSnackbar(translationKey: string): void {
    this.snackBar.open(
      this.translate.instant(translationKey),
      this.translate.instant('COMMON.CLOSE'),
      {duration: 5000}
    );
  }
}
