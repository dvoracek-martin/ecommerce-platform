// src/app/app.component.ts
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { SearchService } from './services/search.service';
import { Subject, Subscription, forkJoin, of, Observable } from 'rxjs';
import { debounceTime, switchMap, catchError, map } from 'rxjs/operators';
import { SearchResultDTO } from './dto/search/search-result-dto';
import { ResponseCategoryDTO } from './dto/category/response-category-dto';
import { ResponseProductDTO } from './dto/product/response-product-dto';
import { ResponseMixtureDTO } from './dto/mixtures/response-mixture-dto';
import { ResponseTagDTO } from './dto/tag/response-tag-dto'
import { Cart, CartItem, CartService } from './services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from "./services/product.service";
import { MatDialog } from '@angular/material/dialog'; // Import MatDialog
import { ConfirmationDialogComponent } from './shared/confirmation-dialog.component'; // Import the new dialog component

interface CartItemWithProduct extends CartItem {
  product?: ResponseProductDTO;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ecommerce-platform-frontend';

  // Language selection
  languages = [
    { code: 'en', name: 'English', icon: 'flag_us' },
    { code: 'de', name: 'Deutsch', icon: 'flag_ch' },
    { code: 'fr', name: 'Français', icon: 'flag_ch' },
    { code: 'cs', name: 'Česky', icon: 'flag_cz' },
    { code: 'es', name: 'Español', icon: 'flag_es' }
  ];
  selectedLanguage = this.languages[0];

  // Authentication popup
  isPopupOpen = false;

  // Search state
  searchQuery = '';
  searchResults: SearchResultDTO;
  showResults = false;
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;
  private cartSubscription: Subscription;

  // Cart state
  cart: Cart | null = null;
  cartItemsWithProducts: CartItemWithProduct[] = [];
  totalCartItemCount$: Observable<number>;

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
    private dialog: MatDialog // Inject MatDialog
  ) {
    // Register SVG icons
    ['us', 'ch', 'cz', 'es'].forEach(code =>
      this.matIconRegistry.addSvgIcon(
        `flag_${code}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/flags/${code}.svg`)
      )
    );

    // Setup translations
    translate.addLangs(this.languages.map(l => l.code));
    translate.setDefaultLang('en');
    const browserLang = translate.getBrowserLang() || 'en';
    this.setLanguage(/en|de|fr|cs|es/.test(browserLang) ? browserLang : 'en');

    // Start listening to cart changes as soon as the component is constructed.
    this.listenToCartChanges();
  }

  ngOnInit(): void {
    // Subscription to isAuthenticated$ is not needed here if it's already handled in CartService
    this.authService.isAuthenticated$.subscribe();

    this.totalCartItemCount$ = this.cartService.cart$.pipe(
      map(cart => cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0)
    );

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
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    this.searchSubject.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  goToCategory(category: ResponseCategoryDTO): void {
    this.showResults = false;
    this.router.navigate([`/categories/${category.id}`]);
  }

  goToProduct(product: ResponseProductDTO) {
    this.showResults = false;
    this.router.navigate([`/products/${product.id}`]);
  }

  goToMixture(mixture: ResponseMixtureDTO) {
    this.showResults = false;
    this.router.navigate([`/mixtures/${mixture.id}`]);
  }

  goToTag(tag: ResponseTagDTO) {
    this.showResults = false;
    this.router.navigate([`/tags/${tag.id}`]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideSearch = target.closest('.search-container');
    if (!clickedInsideSearch) {
      this.searchQuery = '';
      this.showResults = false;
    }
  }

  changeLanguage(code: string): void {
    this.setLanguage(code);
  }

  private setLanguage(code: string) {
    this.translate.use(code);
    this.selectedLanguage = this.languages.find(l => l.code === code)! || this.selectedLanguage;
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

  // ---------------- CART METHODS ----------------
  listenToCartChanges(): void {
    this.cartSubscription = this.cartService.getCart().pipe(
      switchMap(cart => {
        this.cart = cart;
        if (!cart || !cart.items || cart.items.length === 0) {
          this.cartItemsWithProducts = [];
          return of([]);
        }

        const productObservables = cart.items.map(item =>
          this.productService.getProductById(item.productId).pipe(
            catchError(() => {
              this.showSnackbar(`Failed to load product details for an item.`, 'warning');
              return of(null);
            })
          )
        );
        return forkJoin(productObservables).pipe(
          map(products => {
            return cart.items.map((item, index) => {
              const product = products[index];
              return product ? { ...item, product } : item;
            });
          })
        );
      })
    ).subscribe(itemsWithProducts => {
      this.cartItemsWithProducts = itemsWithProducts as CartItemWithProduct[];
    }, err => {
      console.error('Failed to load cart with product details', err);
      this.cart = { id: 0, username: '', items: [], totalPrice: 0 };
      this.cartItemsWithProducts = [];
    });
  }

  // New method to update item quantity
  updateItemQuantity(item: CartItemWithProduct, action: 'increase' | 'decrease'): void {
    const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity < 1) {
      this.removeItem(item.productId);
    } else {
      this.cartService.updateItem(item.productId, newQuantity).subscribe(
        () => {
          this.showSnackbar('Item quantity updated!', 'success');
        },
        error => {
          this.showSnackbar('Failed to update item quantity.', 'error');
          console.error('Update quantity error:', error);
        }
      );
    }
  }

  // Adjusted removeItem method to include a confirmation dialog
  removeItem(productId: number | undefined): void {
    if (productId === undefined) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: {
        title: this.translate.instant('DIALOG.CONFIRM_DELETE_TITLE'),
        message: this.translate.instant('DIALOG.CONFIRM_DELETE_MESSAGE')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cartService.removeItem(productId).subscribe(
          () => {
            this.showSnackbar('Item removed from cart!', 'success');
          },
          error => {
            this.showSnackbar('Failed to remove item.', 'error');
            console.error('Remove item error:', error);
          }
        );
      }
    });
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning'): void {
    let panelClass = [];
    if (type === 'success') {
      panelClass = ['success-snackbar'];
    } else if (type === 'error') {
      panelClass = ['error-snackbar'];
    } else if (type === 'warning') {
      panelClass = ['warning-snackbar'];
    }
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  getItemTotal(item: CartItemWithProduct): number {
    return (item.product?.price || 0) * item.quantity;
  }
}
