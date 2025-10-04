import {Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {NavigationStart, Router} from '@angular/router';
import {Observable, Subject, Subscription} from 'rxjs';
import {debounceTime, map} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {SearchResultDTO} from '../../dto/search/search-result-dto';
import {CartItem, CartService} from '../../services/cart.service';
import {AuthService} from '../../services/auth.service';
import {SearchService} from '../../services/search.service';
import {ResponseCategoryDTO} from '../../dto/category/response-category-dto';
import {ResponseProductDTO} from '../../dto/product/response-product-dto';
import {ResponseMixtureDTO} from '../../dto/mixtures/response-mixture-dto';
import {ResponseTagDTO} from '../../dto/tag/response-tag-dto';
import {ConfirmationDialogComponent} from '../../shared/confirmation-dialog/confirmation-dialog.component';
import {Customer} from '../../dto/customer/customer-dto';
import {CustomerService} from '../../services/customer.service';
import {ResponseLocaleDto} from '../../dto/configuration/response-locale-dto';
import {ConfigurationService} from '../../services/configuration.service';
import {LocaleMapperService} from '../../services/locale-mapper.service';
import {isPlatformBrowser} from '@angular/common';
import {ProductService} from '../../services/product.service';
import {CartItemType} from '../../dto/cart/cart-item-type';
import {MixtureService} from '../../services/mixture.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: false,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  title = 'ecommerce-platform-frontend';
  languages: ResponseLocaleDto[] = [];
  selectedLanguage!: ResponseLocaleDto;
  isPopupOpen = false;
  searchQuery = '';
  searchResults: SearchResultDTO | null = null;
  showResults = false;
  isSearchFocused = false;
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;
  totalCartItemCount$: Observable<number>;

  // Cart Preview
  isCartPreviewOpen = false;
  private closeCartPreviewTimeout: any = null;
  private cartPreviewCloseDelay = 300;

  // Navigation Menu
  isMenuOpen = false;
  private closeMenuTimeout: any = null;
  private menuCloseDelay = 300;

  // User Menu
  isUserMenuOpen = false;
  private closeUserMenuTimeout: any = null;
  private userMenuCloseDelay = 300;

  loadingItems = new Map<string, boolean>();
  isLoadingCart = true;
  private cartSubscription!: Subscription;
  private routerSubscription!: Subscription;
  isTranslatingCart = false;
  private readonly ITEMS_PER_COLUMN = 5;
  private readonly COLUMN_WIDTH = 320; // Width of each column in pixels
  private readonly MIN_PANEL_WIDTH = 350; // Minimum panel width

  @ViewChild('cartButton', {read: ElementRef}) cartButtonRef!: ElementRef<HTMLElement>;

  constructor(
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public authService: AuthService,
    private router: Router,
    private searchService: SearchService,
    public cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private customerService: CustomerService,
    private http: HttpClient,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private productService: ProductService,
    private mixtureService: MixtureService,
  ) {
    // Initialize the cart item count observable
    this.totalCartItemCount$ = this.cartService.cart$.pipe(
      map(cart => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => total + item.quantity, 0);
      })
    );
  }

  ngOnInit(): void {
    this.loadAppSettings();

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

    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.isLoadingCart = false;
    });

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isCartPreviewOpen = false;
        this.isMenuOpen = false;
        this.isUserMenuOpen = false;
        this.cancelCloseCartPreview();
        this.cancelCloseMenu();
        this.cancelCloseUserMenu();
      }
    });

    this.customerService.userLanguage$.subscribe(lang => {
      if (lang) {
        this.translate.use(lang).subscribe(() => {
          const selected = this.languages.find(l => l.languageCode === lang);
          if (selected) {
            this.selectedLanguage = selected;
            this.localeMapperService.setCurrentLocale(this.selectedLanguage.languageCode + "_" + this.selectedLanguage.regionCode);
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
    if (this.cartSubscription) this.cartSubscription.unsubscribe();
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
    this.cancelCloseCartPreview();
    this.cancelCloseMenu();
    this.cancelCloseUserMenu();
    this.searchSubject.complete();
  }

  // ===== NAVIGATION MENU =====
  onMenuButtonMouseEnter(): void {
    this.cancelCloseMenu();
    this.isMenuOpen = true;
  }

  onMenuButtonMouseLeave(): void {
    this.scheduleCloseMenu();
  }

  onMenuMouseEnter(): void {
    this.cancelCloseMenu();
  }

  onMenuMouseLeave(): void {
    this.scheduleCloseMenu();
  }

  private scheduleCloseMenu(): void {
    this.cancelCloseMenu();
    this.closeMenuTimeout = setTimeout(() => {
      this.isMenuOpen = false;
    }, this.menuCloseDelay);
  }

  private cancelCloseMenu(): void {
    if (this.closeMenuTimeout) {
      clearTimeout(this.closeMenuTimeout);
      this.closeMenuTimeout = null;
    }
  }

  // ===== CART PREVIEW =====
  onCartButtonMouseEnter(): void {
    this.cancelCloseCartPreview();
    this.isCartPreviewOpen = true;
    this.translateCartItems();
  }

  onCartButtonMouseLeave(): void {
    this.scheduleCloseCartPreview();
  }

  onCartPreviewMouseEnter(): void {
    this.cancelCloseCartPreview();
    this.translateCartItems();
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

  // ===== USER MENU =====
  onUserButtonMouseEnter(): void {
    this.cancelCloseUserMenu();
    this.isUserMenuOpen = true;
  }

  onUserButtonMouseLeave(): void {
    this.scheduleCloseUserMenu();
  }

  onUserMenuMouseEnter(): void {
    this.cancelCloseUserMenu();
  }

  onUserMenuMouseLeave(): void {
    this.scheduleCloseUserMenu();
  }

  private scheduleCloseUserMenu(): void {
    this.cancelCloseUserMenu();
    this.closeUserMenuTimeout = setTimeout(() => {
      this.isUserMenuOpen = false;
    }, this.userMenuCloseDelay);
  }

  private cancelCloseUserMenu(): void {
    if (this.closeUserMenuTimeout) {
      clearTimeout(this.closeUserMenuTimeout);
      this.closeUserMenuTimeout = null;
    }
  }

  // ===== CART COLUMN METHODS =====
  getColumnCount(items: CartItem[]): number {
    if (!items || items.length === 0) return 1;
    return Math.ceil(items.length / this.ITEMS_PER_COLUMN);
  }

  // Distribute items evenly across columns
  getItemsForColumn(items: CartItem[], columnIndex: number): CartItem[] {
    if (!items || items.length === 0) return [];

    const columnCount = this.getColumnCount(items);
    const itemsPerColumn = Math.ceil(items.length / columnCount);
    const startIndex = columnIndex * itemsPerColumn;
    const endIndex = Math.min(startIndex + itemsPerColumn, items.length);

    return items.slice(startIndex, endIndex);
  }

  // Get column indices for template
  getColumnRanges(items: CartItem[]): number[] {
    if (!items || items.length === 0) return [0];

    const columnCount = this.getColumnCount(items);
    return Array.from({ length: columnCount }, (_, i) => i);
  }

  // TrackBy function for columns
  trackByIndex(index: number): number {
    return index;
  }

  // TrackBy function for cart items
  trackCartItem(index: number, item: CartItem): string {
    return `${item.itemId}-${item.cartItemType}-${index}`;
  }

  // Calculate dynamic width based on columns
  getCartPreviewWidth(): number {
    const cart = this.cartService.getCurrentCartValue();
    if (!cart?.items) return this.MIN_PANEL_WIDTH;

    const columnCount = this.getColumnCount(cart.items);
    return Math.max(this.MIN_PANEL_WIDTH, columnCount * this.COLUMN_WIDTH);
  }

  // ===== EXISTING METHODS =====
  private loadAppSettings(): void {
    this.configurationService.getLastAppSettingsWithCache().subscribe({
      next: (settings) => {
        this.languages = settings.usedLocales && settings.usedLocales.length > 0
          ? settings.usedLocales
          : [settings.defaultLocale];
        if (isPlatformBrowser(this.platformId)) {
          const cachedLangCode = localStorage.getItem('preferredLanguage');
          if (cachedLangCode) {
            const cachedLang = this.languages.find(l => l.languageCode === cachedLangCode);
            if (cachedLang) {
              this.selectedLanguage = cachedLang;
              this.translate.use(cachedLang.languageCode);
              this.localeMapperService.setCurrentLocale(this.selectedLanguage.languageCode + "_" + this.selectedLanguage.regionCode);
              return;
            }
          }
        }

        const userId = this.authService.getUserId();
        const token = this.authService.token;

        if (userId && token) {
          this.setPreferredLanguageForUser(this.languages);
        } else {
          this.selectedLanguage = settings.defaultLocale;
          this.translate.use(settings.defaultLocale.languageCode);
          this.localeMapperService.setCurrentLocale(this.selectedLanguage.languageCode + "_" + this.selectedLanguage.regionCode);
        }
      },
      error: (err) => console.error('Failed to load app settings:', err)
    });
  }

  private setPreferredLanguageForUser(locales: ResponseLocaleDto[]) {
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (!userId || !token) return;

    this.http.get<Customer>(`http://localhost:8080/api/customers/v1/${userId}`, {
      headers: {'Authorization': `Bearer ${token}`}
    }).subscribe({
      next: (customer: Customer) => {
        const lang = locales.find(l => l.id === customer.preferredLanguageId)
          || locales[0];
        this.selectedLanguage = lang;
        this.translate.use(lang.languageCode);
        this.localeMapperService.setCurrentLocale(this.selectedLanguage.languageCode + "_" + this.selectedLanguage.regionCode);

        localStorage.setItem('preferredLanguage', lang.languageCode);
      },
      error: () => {
        this.selectedLanguage = locales[0];
        this.translate.use(locales[0].languageCode);
        this.localeMapperService.setCurrentLocale(this.selectedLanguage.languageCode + "_" + this.selectedLanguage.regionCode);

        localStorage.setItem('preferredLanguage', locales[0].languageCode);
      }
    });
  }

  changeLanguage(code: string): void {
    const lang = this.languages.find(l => l.languageCode === code);
    if (!lang) return;

    this.selectedLanguage = lang;
    this.translate.use(lang.languageCode);
    this.localeMapperService.setCurrentLocale(this.selectedLanguage.languageCode + "_" + this.selectedLanguage.regionCode);

    localStorage.setItem('preferredLanguage', lang.languageCode);

    if (this.authService.isTokenValid()) {
      this.persistUserLanguage(lang.languageCode);
    }
    window.location.reload();
  }

  private persistUserLanguage(languageCode: string): void {
    const userId = this.authService.getUserId();
    const token = this.authService.token;
    if (!userId || !token) return;

    this.http.get<Customer>(`http://localhost:8080/api/customers/v1/${userId}`, {
      headers: {'Authorization': `Bearer ${token}`}
    }).subscribe({
      next: (customer) => {
        const updatedCustomer = {...customer, preferredLanguage: languageCode};
        this.http.put(`http://localhost:8080/api/customers/v1/${userId}`, updatedCustomer, {
          headers: {'Authorization': `Bearer ${token}`}
        }).subscribe({
          error: (err) => console.error('Failed to update user language:', err)
        });
      },
      error: (err) => console.error('Failed to fetch user data for language persistence', err)
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchFocus(): void {
    this.isSearchFocused = true;
    if (this.searchQuery.trim().length > 1) this.showResults = true;
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

  navigateToProduct(product: ResponseProductDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/products/${product.id}`]);
  }

  navigateToProducts() {
    this.router.navigate([`/products`]);
  }

  navigateToCategories() {
    this.router.navigate([`/categories`]);
  }

  navigateToMixture(mixture: ResponseMixtureDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/mixture/${mixture.id}`]);
  }

  navigateToMixtures() {
    this.router.navigate([`/mixtures`]);
  }

  navigateToMixing() {
    this.router.navigate([`/mixing`]);
  }

  navigateToSales() {
    this.router.navigate([`/sales`]);
  }

  navigateToAboutUs() {
    this.router.navigate([`/about-us`]);
  }

  navigateToContact() {
    this.router.navigate([`/contact`]);
  }

  navigateToTag(tag: ResponseTagDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/tags/${tag.id}`]);
  }

  navigateToRoot(): void {
    this.router.navigate(['/']);
    this.isMenuOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/customer']);
    this.isUserMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminCategories(): void {
    this.router.navigate(['/admin/categories']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminProducts(): void {
    this.router.navigate(['/admin/products']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminMixtures(): void {
    this.router.navigate(['/admin/mixtures']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminCustomers(): void {
    this.router.navigate(['/admin/customers']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminOrders(): void {
    this.router.navigate(['/admin/orders']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminTags(): void {
    this.router.navigate(['/admin/tags']);
    this.isUserMenuOpen = false;
  }

  navigateToAdminConfiguration() {
    this.router.navigate([`/admin/configuration`]);
    this.isUserMenuOpen = false;
  }

  onUserIconClick(): void {
    if (!this.authService.isTokenValid()) {
      this.isPopupOpen = true;
      this.isUserMenuOpen = false;
    }
  }

  closeAuthPopup(): void {
    this.isPopupOpen = false;
  }

  updateItemQuantity(item: CartItem, action: 'increase' | 'decrease'): void {
    const key = `${item.itemId}-${item.cartItemType}`;
    this.loadingItems.set(key, true);

    const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity < 1) {
      this.removeItem(item.itemId);
      this.loadingItems.delete(key);
      return;
    }

    this.cartService.updateItem(item.itemId, newQuantity, item.cartItemType).subscribe(
      () => {
        this.loadingItems.delete(key);
        this.showSnackbar('Cart item quantity updated!', 'success');
      },
      error => {
        this.loadingItems.delete(key);
        this.showSnackbar('Failed to update item quantity.', 'error');
        console.error(error);
      }
    );
  }

  onQuantityChange(event: Event, item: CartItem): void {
    const key = `${item.itemId}-${item.cartItemType}`;
    this.loadingItems.set(key, true);
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);

    if (newQuantity === 0) {
      this.removeItem(item.itemId);
      this.loadingItems.delete(key);
      return;
    }
    if (isNaN(newQuantity) || newQuantity < 0) {
      const currentCart = this.cartService.getCurrentCartValue();
      const currentItem = currentCart?.items.find(i => i.itemId === item.itemId && i.cartItemType === item.cartItemType);
      if (currentItem) input.value = currentItem.quantity.toString();
      this.loadingItems.delete(key);
      return;
    }

    this.cartService.updateItem(item.itemId, newQuantity, item.cartItemType).subscribe(
      () => {
        this.loadingItems.delete(key);
        this.showSnackbar('Cart item quantity updated!', 'success');
      },
      error => {
        this.loadingItems.delete(key);
        this.showSnackbar('Failed to update item quantity.', 'error');
        console.error(error);
      }
    );
  }

  isItemLoading(item: CartItem): boolean {
    return this.loadingItems.get(`${item.itemId}-${item.cartItemType}`) || false;
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
        this.cartService.removeItem(itemId).subscribe(
          () => this.showSnackbar('Item removed from cart!', 'success'),
          error => {
            this.showSnackbar('Failed to remove item.', 'error');
            console.error(error);
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
    this.snackBar.open(message, 'Close', {duration: 3000, panelClass});
  }

  goToCart(): void {
    this.isCartPreviewOpen = false;
    this.router.navigate(['/cart']);
  }

  navigateToOrders() {
    this.router.navigate(['/orders']);
    this.isUserMenuOpen = false;
  }

  goToProductFromCart(product: ResponseProductDTO): void {
    const slug = this.productService.slugify(product.translatedName);
    this.router.navigate([`/products/${product.id}/${slug}`]);
  }

  onLanguageMenuOpened() {
    this.languages.forEach(lang => {
      lang.translatedName = this.localeMapperService.mapLocale(lang.languageCode, lang.regionCode);
    });
  }

  private translateCartItems(): void {
    if (this.isTranslatingCart) return;

    this.isTranslatingCart = true;
    const currentCart = this.cartService.getCurrentCartValue();

    if (!currentCart?.items) {
      this.isTranslatingCart = false;
      return;
    }

    setTimeout(() => {
      currentCart.items.forEach(item => {
        if (item.cartItemType === CartItemType.PRODUCT && item.product) {
          item.product.translatedName = this.productService.getLocalizedName(item.product);
        } else if (item.cartItemType === CartItemType.MIXTURE && item.mixture) {
          if (Object.keys(item.mixture.localizedFields || {}).length === 0) {
            item.mixture.translatedName = item.mixture.name;
          } else {
            item.mixture.translatedName = this.mixtureService.getLocalizedName(item.mixture);
          }
        }
      });
      this.isTranslatingCart = false;
    }, 0);
  }

  get cartItemsWithDetails(): CartItem[] {
    const currentCart = this.cartService.getCurrentCartValue();
    return currentCart?.items || [];
  }

  getTranslatedItemName(item: CartItem): string {
    if (item.cartItemType === CartItemType.PRODUCT && item.product) {
      return item.product.translatedName || 'Unknown Product';
    } else if (item.cartItemType === CartItemType.MIXTURE && item.mixture) {
      return item.mixture.translatedName || item.mixture.name || 'Unknown Mixture';
    }
    return 'Unknown Item';
  }

  isLanguageMenuOpen(): boolean {
    return false; // This is now handled by Angular Material
  }
}
