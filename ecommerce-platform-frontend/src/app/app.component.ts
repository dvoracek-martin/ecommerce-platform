import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {AuthService} from './auth/auth.service';
import {Router} from '@angular/router';
import {SearchService} from './services/search.service';
import {forkJoin, Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, debounceTime, map, switchMap} from 'rxjs/operators';
import {SearchResultDTO} from './dto/search/search-result-dto';
import {ResponseCategoryDTO} from './dto/category/response-category-dto';
import {ResponseProductDTO} from './dto/product/response-product-dto';
import {ResponseMixtureDTO} from './dto/mixtures/response-mixture-dto';
import {ResponseTagDTO} from './dto/tag/response-tag-dto';
import {Cart, CartItem, CartService} from './services/cart.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProductService} from "./services/product.service";
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from './shared/confirmation-dialog.component';
import {MixtureService} from './services/mixture.service';
import {CartItemType} from './dto/cart/cart-item-type';
import {CustomerService} from './services/customer.service';
import {Customer} from './dto/customer/customer-dto';
import {HttpClient} from '@angular/common/http';

interface CartItemWithDetails extends CartItem {
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
  optimisticQuantity?: number;
  updating?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ecommerce-platform-frontend';

  languages = [
    {code: 'de', name: 'Deutsch', icon: 'flag_ch'},
    {code: 'fr', name: 'Français', icon: 'flag_ch'},
    {code: 'en', name: 'English', icon: 'flag_us'},
    {code: 'cs', name: 'Česky', icon: 'flag_cz'},
    {code: 'es', name: 'Español', icon: 'flag_es'}
  ];
  selectedLanguage = this.languages[0];

  isPopupOpen = false;

  searchQuery = '';
  searchResults: SearchResultDTO | null = null;
  showResults = false;
  isSearchFocused = false;
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  cart: Cart | null = null;
  cartItemsWithDetails: CartItemWithDetails[] = [];
  totalCartItemCount$: Observable<number>;
  private cartSubscription!: Subscription;

  isCartPreviewOpen = false;
  private closeCartPreviewTimeout: any = null;
  private cartPreviewCloseDelay = 300;

  @ViewChild('cartButton', {read: ElementRef}) cartButtonRef!: ElementRef<HTMLElement>;

  constructor(
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public authService: AuthService,
    private router: Router,
    private searchService: SearchService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private dialog: MatDialog,
    private customerService: CustomerService,
    private http: HttpClient,
  ) {
    ['us', 'ch', 'cz', 'es'].forEach(code =>
      this.matIconRegistry.addSvgIcon(
        `flag_${code}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/flags/${code}.svg`)
      )
    );

    translate.addLangs(this.languages.map(l => l.code));

    const browserLang = (navigator.language || 'de').split('-')[0];
    translate.setDefaultLang(browserLang);
    this.setLanguage(/en|de|fr|cs|es/.test(browserLang) ? browserLang : 'de');
    this.listenToCartChanges();
    translate.setDefaultLang('de');


    this.totalCartItemCount$ = this.cartService.cart$.pipe(
      map(cart => cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0)
    );
  }

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(debounceTime(300)).subscribe(q => {
      if (q.trim().length > 1) {
        this.searchService.search(q).subscribe(res => {
          this.searchResults = res;
          this.showResults = true;
        });
      } else {
        this.searchResults = null;
        this.showResults = false;
      }
    });
    // if userId is present, then set his preferred language, otherwise set browser's default language
    this.setPreferredLanguage();

    // subscribe to changes if the user changes language
    this.customerService.userLanguage$.subscribe(lang => {
      this.translate.use(lang).subscribe(() => {
        const selected = this.languages.find(l => l.code === lang);
        if (selected) {
          this.selectedLanguage = selected;
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
    if (this.cartSubscription) this.cartSubscription.unsubscribe();
    this.cancelCloseCartPreview();
    this.searchSubject.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchFocus(): void {
    this.isSearchFocused = true;
    if (this.searchQuery.trim().length > 1) {
      this.showResults = true;
    }
  }

  onSearchBlur(): void {
  }

  onSearchBackdropClick(): void {
    this.isSearchFocused = false;
    this.showResults = false;
  }

  goToCategory(category: ResponseCategoryDTO): void {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/categories/${category.id}`]);
  }

  goToProduct(product: ResponseProductDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/products/${product.id}`]);
  }

  goToMixture(mixture: ResponseMixtureDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/mixtures/${mixture.id}`]);
  }

  goToTag(tag: ResponseTagDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/tags/${tag.id}`]);
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  navigateToMixtures(): void {
    this.router.navigate(['/mixtures']);
  }

  navigateToSales(): void {
    this.router.navigate(['/sales']);
  }

  navigateToAboutUs(): void {
    this.router.navigate(['/about']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideSearch = target.closest('.search-container');
    if (!clickedInsideSearch && !this.isSearchFocused) {
      this.searchQuery = '';
      this.showResults = false;
    }
  }

  changeLanguage(code: string): void {
    this.setLanguage(code);
  }

  private setLanguage(code?: string) {
    const validCode = code && ['en', 'de', 'fr', 'cs', 'es'].includes(code) ? code : 'de';
    this.translate.use(validCode);
    this.selectedLanguage = this.languages.find(l => l.code === validCode)!;
  }

  navigateToRoot(): void {
    this.router.navigate(['/']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/customer']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToAdminCategories(): void {
    this.router.navigate(['/admin/categories']);
  }

  navigateToAdminProducts(): void {
    this.router.navigate(['/admin/products']);
  }

  navigateToAdminMixtures(): void {
    this.router.navigate(['/admin/mixtures']);
  }

  navigateToAdminCustomers(): void {
    this.router.navigate(['/admin/customers']);
  }

  navigateToAdminOrders(): void {
    this.router.navigate(['/admin/orders']);
  }

  navigateToAdminTags(): void {
    this.router.navigate(['/admin/tags']);
  }

  onUserIconClick(): void {
    if (!this.authService.isTokenValid()) this.isPopupOpen = true;
  }

  closeAuthPopup(): void {
    this.isPopupOpen = false;
  }

  getCartTotal(): number {
    return this.cartItemsWithDetails.reduce((total, item) => {
      return total + this.getItemTotal(item);
    }, 0);
  }

  listenToCartChanges(): void {
    this.cartSubscription = this.cartService.getCart().pipe(
      switchMap(cart => {
        this.cart = cart;
        if (!cart?.items?.length) {
          this.cartItemsWithDetails = [];
          return of([]);
        }

        const detailObservables = cart.items.map(item => {
          if (item.cartItemType === CartItemType.PRODUCT) {
            return this.productService.getProductById(item.itemId).pipe(
              map(product => ({...item, product})),
              catchError(() => {
                this.showSnackbar(`Failed to load product details for an item.`, 'warning');
                return of({...item, product: undefined});
              })
            );
          } else if (item.cartItemType === CartItemType.MIXTURE) {
            return this.mixtureService.getMixtureById(item.itemId).pipe(
              map(mixture => ({...item, mixture})),
              catchError(() => {
                this.showSnackbar(`Failed to load mixture details for an item.`, 'warning');
                return of({...item, mixture: undefined});
              })
            );
          }
          return of(item);
        });

        return forkJoin(detailObservables).pipe(
          map(items => items.map(item => {
            const existingItem = this.cartItemsWithDetails.find(i => i.itemId === item.itemId);
            return {
              ...item,
              optimisticQuantity: existingItem?.optimisticQuantity ?? item.quantity,
              updating: existingItem?.updating ?? false
            };
          }))
        );
      })
    ).subscribe(itemsWithDetails => {
      this.cartItemsWithDetails = itemsWithDetails;
    }, err => {
      console.error('Failed to load cart with details', err);
      this.cart = {id: 0, username: '', items: [], totalPrice: 0};
      this.cartItemsWithDetails = [];
    });
  }

  onCartButtonMouseEnter(): void {
    this.cancelCloseCartPreview();
    this.isCartPreviewOpen = true;
  }

  onCartButtonMouseLeave(): void {
    this.scheduleCloseCartPreview();
  }

  onCartPreviewMouseEnter(): void {
    this.cancelCloseCartPreview();
  }

  onCartPreviewMouseLeave(): void {
    this.scheduleCloseCartPreview();
  }

  private scheduleCloseCartPreview(): void {
    this.cancelCloseCartPreview();
    this.closeCartPreviewTimeout = setTimeout(() => {
      this.isCartPreviewOpen = false;
    }, this.cartPreviewCloseDelay);
  }

  private cancelCloseCartPreview(): void {
    if (this.closeCartPreviewTimeout) {
      clearTimeout(this.closeCartPreviewTimeout);
      this.closeCartPreviewTimeout = null;
    }
  }

  updateItemQuantity(item: CartItemWithDetails, action: 'increase' | 'decrease'): void {
    const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;

    if (newQuantity < 1) {
      this.removeItem(item.itemId);
      return;
    }

    // Optimistic update
    const updatedItems = this.cartItemsWithDetails.map(i =>
      i.itemId === item.itemId
        ? {...i, optimisticQuantity: newQuantity, updating: true}
        : i
    );
    this.cartItemsWithDetails = updatedItems;

    // Server update
    this.cartService.updateItem(item.itemId, newQuantity, item.cartItemType).subscribe(
      () => {
        // Update with server response
        const finalItems = this.cartItemsWithDetails.map(i =>
          i.itemId === item.itemId
            ? {...i, quantity: newQuantity, optimisticQuantity: undefined, updating: false}
            : i
        );
        this.cartItemsWithDetails = finalItems;
      },
      error => {
        // Revert on error
        const revertedItems = this.cartItemsWithDetails.map(i =>
          i.itemId === item.itemId
            ? {...i, optimisticQuantity: undefined, updating: false}
            : i
        );
        this.cartItemsWithDetails = revertedItems;
        this.showSnackbar('Failed to update item quantity.', 'error');
        console.error('Update quantity error:', error);
      }
    );
  }

  onQuantityChange(event: Event, item: CartItemWithDetails): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);

    if (newQuantity === 0) {
      this.removeItem(item.itemId);
      return;
    }

    if (isNaN(newQuantity) || newQuantity < 0) {
      input.value = item.quantity.toString();
      return;
    }

    // Optimistic update
    const updatedItems = this.cartItemsWithDetails.map(i =>
      i.itemId === item.itemId
        ? {...i, optimisticQuantity: newQuantity, updating: true}
        : i
    );
    this.cartItemsWithDetails = updatedItems;

    // Server update
    this.cartService.updateItem(item.itemId, newQuantity, item.cartItemType).subscribe(
      () => {
        const finalItems = this.cartItemsWithDetails.map(i =>
          i.itemId === item.itemId
            ? {...i, quantity: newQuantity, optimisticQuantity: undefined, updating: false}
            : i
        );
        this.cartItemsWithDetails = finalItems;
      },
      error => {
        const revertedItems = this.cartItemsWithDetails.map(i =>
          i.itemId === item.itemId
            ? {...i, optimisticQuantity: undefined, updating: false}
            : i
        );
        this.cartItemsWithDetails = revertedItems;
        input.value = item.quantity.toString();
        this.showSnackbar('Failed to update item quantity.', 'error');
        console.error('Update quantity error:', error);
      }
    );
  }

  removeItem(itemId: number | undefined): void {
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
        this.cartItemsWithDetails = this.cartItemsWithDetails.filter(item => item.itemId !== itemId);

        this.cartService.removeItem(itemId).subscribe(
          () => this.showSnackbar('Item removed from cart!', 'success'),
          error => {
            // Re-add item on error
            this.listenToCartChanges(); // Reload cart items
            this.showSnackbar('Failed to remove item.', 'error');
            console.error('Remove item error:', error);
          }
        );
      }
    });
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning'): void {
    let panelClass: string[] = [];
    if (type === 'success') panelClass = ['success-snackbar'];
    else if (type === 'error') panelClass = ['error-snackbar'];
    else if (type === 'warning') panelClass = ['warning-snackbar'];

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass
    });
  }

  goToCart(): void {
    this.isCartPreviewOpen = false;
    this.router.navigate(['/cart']);
  }

  getItemTotal(item: CartItemWithDetails): number {
    const quantity = item.optimisticQuantity !== undefined ? item.optimisticQuantity : item.quantity;
    const price = item.product?.price || item.mixture?.price || 0;
    return price * quantity;
  }

  navigateToOrders() {
    this.router.navigate(['/orders']);
  }

  setPreferredLanguage(): void {
    const userId = this.authService.getUserId();
    const token = this.authService.token;
    if (userId && token) {
      this.http.get<Customer>(`http://localhost:8080/api/customers/v1/${userId}`, {
        headers: {'Authorization': `Bearer ${token}`}
      }).subscribe({
        next: (customer: Customer) => {
          this.selectedLanguage = this.languages.find(l => l.code === customer.preferredLanguage)! || this.selectedLanguage;
          this.translate.use(customer.preferredLanguage);
        },
        error: (err) => {
          console.error('Failed to fetch customer data:', err);
        }
      });
    } else {
      const browserLang = (navigator.language || 'de').split('-')[0];
      this.translate.setDefaultLang(browserLang);
      this.translate.use(browserLang);
      this.selectedLanguage = this.languages.find(l => l.code === browserLang)! || this.selectedLanguage;
    }
  }
}
