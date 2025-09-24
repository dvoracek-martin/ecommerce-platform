import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {NavigationStart, Router} from '@angular/router';
import {Observable, Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {SearchResultDTO} from '../../dto/search/search-result-dto';
import {CartItem, CartService} from '../../services/cart.service';
import {AuthService} from '../../auth/auth.service';
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
  isCartPreviewOpen = false;
  private closeCartPreviewTimeout: any = null;
  private cartPreviewCloseDelay = 300;
  loadingItems = new Map<string, boolean>();
  isLoadingCart = true;
  private cartSubscription!: Subscription;
  private routerSubscription!: Subscription;

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
  ) {
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
        this.cancelCloseCartPreview();
      }
    });

    this.customerService.userLanguage$.subscribe(lang => {
      if (lang) {
        this.translate.use(lang).subscribe(() => {
          const selected = this.languages.find(l => l.languageCode === lang);
          if (selected) {
            this.selectedLanguage = selected;
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
    this.searchSubject.complete();
  }

  private loadAppSettings(): void {
    this.configurationService.getLastAppSettings().subscribe({
      next: (settings) => {
        this.languages = settings.usedLocales && settings.usedLocales.length > 0
          ? settings.usedLocales
          : [settings.defaultLocale];

        const userId = this.authService.getUserId();
        const token = this.authService.token;

        if (userId && token) {
          this.setPreferredLanguageForUser(this.languages);
        } else {

          this.selectedLanguage = settings.defaultLocale;
          this.translate.use(settings.defaultLocale.languageCode);
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
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (customer: Customer) => {
        const lang = locales.find(l => l.id === customer.preferredLanguageId)
          || locales[0];
        this.selectedLanguage = lang;
        this.translate.use(lang.languageCode);
      },
      error: () => {
        this.selectedLanguage = locales[0];
        this.translate.use(locales[0].languageCode);
      }
    });
  }


  changeLanguage(code: string): void {
    const lang = this.languages.find(l => l.languageCode === code);
    if (!lang) return;

    this.selectedLanguage = lang;
    this.translate.use(lang.languageCode);

    if (this.authService.isTokenValid()) {
      this.persistUserLanguage(lang.languageCode);
    }
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


  private setLanguage(code: string) {
    const lang = this.languages.find(l => l.languageCode === code) || this.languages[0];
    this.selectedLanguage = lang;
    this.translate.use(lang.languageCode);
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

  navigateToProducts(product: ResponseProductDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/products/${product.id}`]);
  }

  navigateToMixtures(mixture: ResponseMixtureDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/mixtures/${mixture.id}`]);
  }

  goToTag(tag: ResponseTagDTO) {
    this.showResults = false;
    this.isSearchFocused = false;
    this.router.navigate([`/tags/${tag.id}`]);
  }

  // private setDefaultBrowserLanguage(usedLocales: ResponseLocaleDto[]) {
  //   const browserLang = (navigator.language || 'de').split('-')[0];
  //   const lang = usedLocales.find(l => l.languageCode === browserLang) || usedLocales[0];
  //   if (lang) this.selectedLanguage = lang;
  //   if (lang) this.translate.use(lang.languageCode);
  // }

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

  navigateToAdminConfiguration() {
    this.router.navigate([`/admin/configuration`]);
  }

  onUserIconClick(): void {
    if (!this.authService.isTokenValid()) this.isPopupOpen = true;
  }

  closeAuthPopup(): void {
    this.isPopupOpen = false;
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
  }

  goToProductFromCart(product: ResponseProductDTO): void {
    this.router.navigate([`/products/${product.id}`]);
  }
}
