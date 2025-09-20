import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, forkJoin, Observable, of, throwError} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {isPlatformBrowser} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ResponseProductDTO} from "../dto/product/response-product-dto";
import {AuthService} from '../auth/auth.service';
import {ProductService} from "./product.service";
import {ResponseMixtureDTO} from '../dto/mixtures/response-mixture-dto';
import {CartItemType} from '../dto/cart/cart-item-type';
import {MixtureService} from './mixture.service';

export interface CartItem {
  id?: number;
  itemId: number;
  quantity: number;
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
  cartItemType: CartItemType;
}

export interface Cart {
  id: number;
  username: string;
  items: CartItem[];
  totalPrice: number;
  discount?: number;
  discountCode?: string;
}

@Injectable({providedIn: 'root'})
export class CartService {
  private apiUrl = 'http://localhost:8080/api/cart/v1';
  private isBrowser: boolean;
  private _cart = new BehaviorSubject<Cart | null>(null);
  readonly cart$ = this._cart.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private productService: ProductService,
    private mixtureService: MixtureService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.authService.isAuthenticated$.subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.loadUserCart();
        } else {
          this.loadGuestCartFromStorage();
        }
      });
    }
  }

  /**
   * Public method to get the current value of the cart without subscribing.
   * This is safe because it only exposes the value from the private BehaviorSubject.
   */
  public getCurrentCartValue(): Cart | null {
    return this._cart.getValue();
  }

  private calculateAndSetTotalPrice(cart: Cart): void {
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product?.price || item.mixture?.price || 0;
      return sum + price * item.quantity;
    }, 0);
    cart.totalPrice = subtotal - (cart.discount || 0);
  }

  private loadGuestCartFromStorage(): void {
    try {
      const guestCartData = JSON.parse(localStorage.getItem('guest_cart') || '{}');
      const guestCart: Cart = {
        id: 0,
        username: 'guest',
        items: guestCartData.items || [],
        totalPrice: 0,
        discount: guestCartData.discount || 0,
        discountCode: guestCartData.discountCode
      };
      this.enrichCartAndSetState(guestCart);
    } catch (e) {
      const items = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      const guestCart: Cart = {id: 0, username: 'guest', items: items, totalPrice: 0, discount: 0};
      this.enrichCartAndSetState(guestCart);
    }
  }

  private saveGuestCart(cart: Cart): void {
    if (this.isBrowser) {
      const simpleItems = cart.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        cartItemType: item.cartItemType
      }));
      const guestCartData = {
        items: simpleItems,
        discount: cart.discount,
        discountCode: cart.discountCode
      };
      localStorage.setItem('guest_cart', JSON.stringify(guestCartData));
    }
  }

  private loadUserCart(): void {
    if (!this.authService.isTokenValid()) {
      this.showSnackbar('Please log in to view your cart.', 'warning');
      this._cart.next({id: 0, username: 'guest', items: [], totalPrice: 0, discount: 0});
      return;
    }
    this.http.get<Cart>(this.apiUrl)
      .pipe(
        switchMap(cart => this.enrichCartWithDetails(cart)),
        tap(cart => {
          this._cart.next(cart);
        }),
        catchError(error => {
          this.showSnackbar('Failed to load cart. Please try again.', 'error');
          console.error('Failed to load user cart:', error);
          this._cart.next({id: 0, username: 'guest', items: [], totalPrice: 0, discount: 0});
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  private enrichCartWithDetails(cart: Cart): Observable<Cart> {
    if (!cart || !cart.items || cart.items.length === 0) {
      return of(cart);
    }
    const detailObservables = cart.items.map(item => {
      if (item.cartItemType === CartItemType.PRODUCT) {
        return this.productService.getProductById(item.itemId).pipe(
          map(product => ({...item, product})),
          catchError(() => of({...item, product: undefined}))
        );
      } else if (item.cartItemType === CartItemType.MIXTURE) {
        return this.mixtureService.getMixtureById(item.itemId).pipe(
          map(mixture => ({...item, mixture})),
          catchError(() => of({...item, mixture: undefined}))
        );
      }
      return of(item);
    });
    return forkJoin(detailObservables).pipe(
      map(itemsWithDetails => {
        const enrichedCart = {...cart, items: itemsWithDetails as any[]};
        this.calculateAndSetTotalPrice(enrichedCart);
        return enrichedCart;
      })
    );
  }

  private enrichCartAndSetState(cart: Cart): void {
    if (!cart || !cart.items || cart.items.length === 0) {
      this._cart.next(cart);
      this.calculateAndSetTotalPrice(cart);
      return;
    }
    const detailObservables = cart.items.map(item => {
      if (item.cartItemType === CartItemType.PRODUCT) {
        return this.productService.getProductById(item.itemId).pipe(
          map(product => ({...item, product})),
          catchError(() => of({...item, product: undefined}))
        );
      } else if (item.cartItemType === CartItemType.MIXTURE) {
        return this.mixtureService.getMixtureById(item.itemId).pipe(
          map(mixture => ({...item, mixture})),
          catchError(() => of({...item, mixture: undefined}))
        );
      }
      return of(item);
    });
    forkJoin(detailObservables).pipe(
      map(itemsWithDetails => ({...cart, items: itemsWithDetails as any[]}))
    ).subscribe(
      (enrichedCart) => {
        this._cart.next(enrichedCart);
        this.calculateAndSetTotalPrice(enrichedCart);
      },
      (error) => {
        console.error('Failed to enrich cart with details:', error);
        this._cart.next({id: 0, username: '', items: [], totalPrice: 0});
      }
    );
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    let panelClass = [];
    if (type === 'success') panelClass = ['success-snackbar'];
    else if (type === 'error') panelClass = ['error-snackbar'];
    else if (type === 'warning') panelClass = ['warning-snackbar'];
    else if (type === 'info') panelClass = ['info-snackbar'];
    this.snackBar.open(message, 'Close', {duration: 3000, panelClass});
  }

  getCart(): Observable<Cart | null> {
    return this._cart.asObservable();
  }

  addItem(item: CartItem): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.post<Cart>(`${this.apiUrl}/add`, item)
        .pipe(
          switchMap(cart => this.enrichCartWithDetails(cart)),
          tap(cart => {
            this._cart.next(cart);
            this.showSnackbar('Item added to cart!', 'success');
          }),
          catchError(error => {
            this.showSnackbar('Failed to add item to cart.', 'error');
            console.error('Failed to add item to user cart:', error);
            return throwError(() => error);
          })
        );
    } else {
      const currentCart = this._cart.getValue() || {
        id: 0,
        username: 'guest',
        items: [],
        totalPrice: 0,
        discount: 0
      };
      const existingItem = currentCart.items.find(ci =>
        ci.itemId === item.itemId && ci.cartItemType === item.cartItemType
      );
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        currentCart.items.push(item);
      }
      this.saveGuestCart(currentCart);
      this.enrichCartAndSetState(currentCart);
      this.showSnackbar('Item added to cart!', 'success');
      return of(currentCart);
    }
  }

  updateItem(itemId: number, quantity: number, cartItemType: CartItemType): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      const currentCart = this._cart.getValue();
      if (currentCart) {
        return this.http.post<Cart>(`${this.apiUrl}/update?itemId=${itemId}&quantity=${quantity}&cartItemType=${cartItemType}`, {})
          .pipe(
            switchMap(cart => this.enrichCartWithDetails(cart)),
            tap(cart => {
              this._cart.next(cart);
              this.showSnackbar('Cart item quantity updated!', 'success');
            }),
            catchError(error => {
              this.showSnackbar('Failed to update item quantity.', 'error');
              console.error('Failed to update user cart item:', error);
              this.enrichCartAndSetState(this._cart.getValue()!);
              return throwError(() => error);
            })
          );
      }
      return throwError(() => new Error('Item not found in cart.'));
    } else {
      const currentCart = this._cart.getValue() || {
        id: 0,
        username: 'guest',
        items: [],
        totalPrice: 0,
        discount: 0
      };
      const newItems = currentCart.items.map(item =>
        item.itemId === itemId && item.cartItemType === cartItemType
          ? {...item, quantity}
          : item
      );
      const newCart = {...currentCart, items: newItems};
      this.saveGuestCart(newCart);
      this.enrichCartAndSetState(newCart);
      this.showSnackbar('Cart updated!', 'success');
      return of(newCart);
    }
  }

  removeItem(itemId: number): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      const currentCart = this._cart.getValue();
      if (currentCart) {
        return this.http.delete<Cart>(`${this.apiUrl}/remove/${itemId}`)
          .pipe(
            switchMap(cart => this.enrichCartWithDetails(cart)),
            tap(cart => {
              this._cart.next(cart);
              this.showSnackbar('Item removed from cart!', 'success');
            }),
            catchError(error => {
              this.showSnackbar('Failed to remove item from cart.', 'error');
              console.error('Failed to remove item from user cart:', error);
              this.enrichCartAndSetState(this._cart.getValue()!);
              return throwError(() => error);
            })
          );
      }
      return throwError(() => new Error('Cart not found.'));
    } else {
      const currentCart = this._cart.getValue() || {
        id: 0,
        username: 'guest',
        items: [],
        totalPrice: 0,
        discount: 0
      };
      currentCart.items = currentCart.items.filter(item => item.itemId !== itemId);
      this.saveGuestCart(currentCart);
      this.enrichCartAndSetState(currentCart);
      this.showSnackbar('Item removed from cart!', 'success');
      return of(currentCart);
    }
  }

  applyDiscount(code: string): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.post<Cart>(`${this.apiUrl}/apply-discount`, {code})
        .pipe(
          switchMap(cart => this.enrichCartWithDetails(cart)),
          tap(cart => {
            this._cart.next(cart);
            this.showSnackbar('Discount applied successfully!', 'success');
          }),
          catchError(error => {
            this.showSnackbar('Failed to apply discount.', 'error');
            console.error('Failed to apply discount:', error);
            return throwError(() => error);
          })
        );
    } else {
      const currentCart = this._cart.getValue() || {
        id: 0,
        username: 'guest',
        items: [],
        totalPrice: 0,
        discount: 0
      };
      const subtotal = currentCart.items.reduce((sum, item) => {
        const price = item.product?.price || item.mixture?.price || 0;
        return sum + price * item.quantity;
      }, 0);
      currentCart.discount = subtotal * 0.2;
      currentCart.discountCode = code;
      this.saveGuestCart(currentCart);
      this.enrichCartAndSetState(currentCart);
      this.showSnackbar('Discount applied successfully!', 'success');
      return of(currentCart);
    }
  }

  removeDiscount(): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.delete<Cart>(`${this.apiUrl}/remove-discount`)
        .pipe(
          switchMap(cart => this.enrichCartWithDetails(cart)),
          tap(cart => {
            this._cart.next(cart);
            this.showSnackbar('Discount removed', 'info');
          }),
          catchError(error => {
            this.showSnackbar('Failed to remove discount.', 'error');
            console.error('Failed to remove discount:', error);
            return throwError(() => error);
          })
        );
    } else {
      const currentCart = this._cart.getValue() || {
        id: 0,
        username: 'guest',
        items: [],
        totalPrice: 0,
        discount: 0
      };
      currentCart.discount = 0;
      delete currentCart.discountCode;
      this.saveGuestCart(currentCart);
      this.enrichCartAndSetState(currentCart);
      this.showSnackbar('Discount removed', 'info');
      return of(currentCart);
    }
  }

  mergeGuestCart(): Observable<Cart> {
    const guestCartData = JSON.parse(localStorage.getItem('guest_cart') || '{}');
    const guestItems = guestCartData.items || [];
    if (guestItems.length === 0) {
      return of(this._cart.getValue() as Cart);
    }
    return this.http.post<Cart>(`${this.apiUrl}/merge`, guestItems)
      .pipe(
        switchMap(cart => this.enrichCartWithDetails(cart)),
        tap(cart => {
          this._cart.next(cart);
          if (this.isBrowser) {
            localStorage.removeItem('guest_cart');
          }
          this.showSnackbar('Guest cart merged successfully!', 'success');
        }),
        catchError(error => {
          this.showSnackbar('Failed to merge guest cart.', 'error');
          console.error('Failed to merge guest cart:', error);
          return throwError(() => error);
        })
      );
  }

  clearCart(): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.delete<Cart>(`${this.apiUrl}/clear`)
        .pipe(
          switchMap(cart => this.enrichCartWithDetails(cart)),
          tap(cart => {
            this._cart.next(cart);
            this.showSnackbar('Cart cleared successfully!', 'success');
          }),
          catchError(error => {
            this.showSnackbar('Failed to clear cart.', 'error');
            console.error('Failed to clear user cart:', error);
            return throwError(() => error);
          })
        );
    } else {
      if (this.isBrowser) {
        localStorage.removeItem('guest_cart');
      }
      const emptyCart: Cart = {
        id: 0,
        username: 'guest',
        items: [],
        totalPrice: 0,
        discount: 0
      };
      this.enrichCartAndSetState(emptyCart);
      this.showSnackbar('Guest cart cleared successfully!', 'success');
      return of(emptyCart);
    }
  }
}
