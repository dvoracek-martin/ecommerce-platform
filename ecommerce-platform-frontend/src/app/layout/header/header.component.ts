import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {AuthService} from '../../auth/auth.service';
import {SearchService} from '../../services/search.service';
import {ResponseCategoryDTO} from '../../dto/category/response-category-dto';
import {ResponseProductDTO} from '../../dto/product/response-product-dto';
import {ResponseMixtureDTO} from '../../dto/mixtures/response-mixture-dto';
import {ResponseTagDTO} from '../../dto/tag/response-tag-dto';
import {ConfirmationDialogComponent} from '../../shared/confirmation-dialog/confirmation-dialog.component';
import {Customer} from '../../dto/customer/customer-dto';
import {CustomerService} from '../../services/customer.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: false,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
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

    // Subscribe to the cart service to know when loading is complete
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.isLoadingCart = false;
    });

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isCartPreviewOpen = false;
        this.cancelCloseCartPreview();
      }
    });

    this.setPreferredLanguage();
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
    if (this.routerSubscription) this.routerSubscription.unsubscribe(); // FIX: Unsubscribe from router events
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
        console.error('Update quantity error:', error);
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
      if (currentItem) {
        input.value = currentItem.quantity.toString();
      }
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
        console.error('Update quantity error:', error);
      }
    );
  }

  isItemLoading(item: CartItem): boolean {
    const key = `${item.itemId}-${item.cartItemType}`;
    return this.loadingItems.get(key) || false;
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

  goToProductFromCart(product: ResponseProductDTO): void {
    console.log('Navigating to product from cart:', product.id);
    this.router.navigate([`/products/${product.id}`]);
  }
}
