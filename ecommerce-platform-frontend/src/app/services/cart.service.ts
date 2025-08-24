// src/app/services/cart.service.ts
import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, of, throwError, forkJoin} from 'rxjs';
import {catchError, tap, switchMap, map} from 'rxjs/operators';
import {isPlatformBrowser} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ResponseProductDTO} from "../dto/product/response-product-dto";
import {AuthService} from '../auth/auth.service';
import {ProductService} from "./product.service";

export interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
  product?: ResponseProductDTO;
}

export interface Cart {
  id: number;
  username: string;
  items: CartItem[];
  totalPrice: number;
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
    private productService: ProductService // Inject the ProductService
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

  // A helper method to calculate the total price and update the cart.
  private calculateAndSetTotalPrice(cart: Cart): void {
    const totalPrice = cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    cart.totalPrice = totalPrice;
    this._cart.next(cart);
  }

  /** ==================== GUEST CART HELPERS ==================== */
  private loadGuestCartFromStorage(): void {
    const items = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const guestCart: Cart = {id: 0, username: 'guest', items: items, totalPrice: 0};
    this.calculateAndSetTotalPrice(guestCart);
  }

  private saveGuestCart(items: CartItem[]) {
    if (this.isBrowser) {
      const simpleItems = items.map(item => ({productId: item.productId, quantity: item.quantity}));
      localStorage.setItem('guest_cart', JSON.stringify(simpleItems));
    }
  }

  /** ==================== AUTHENTICATED CART HELPERS ==================== */
  private loadUserCart(): void {
    if (!this.authService.isTokenValid()) {
      this.showSnackbar('Please log in to view your cart.', 'warning');
      this._cart.next({id: 0, username: 'guest', items: [], totalPrice: 0});
      return;
    }

    this.http.get<Cart>(this.apiUrl)
      .pipe(
        // Switch to a new observable that fetches product details
        switchMap(cart => {
          if (!cart || !cart.items || cart.items.length === 0) {
            return of(cart);
          }
          const productObservables = cart.items.map(item =>
            this.productService.getProductById(item.productId).pipe(
              map(product => ({...item, product})),
              catchError(() => of({...item, product: undefined})) // In case a product is not found
            )
          );
          return forkJoin(productObservables).pipe(
            map(itemsWithProducts => ({...cart, items: itemsWithProducts}))
          );
        }),
        tap(cart => {
          this.calculateAndSetTotalPrice(cart);
        }),
        catchError(error => {
          this.showSnackbar('Failed to load cart. Please try again.', 'error');
          console.error('Failed to load user cart:', error);
          this._cart.next({id: 0, username: 'guest', items: [], totalPrice: 0});
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'warning'): void {
    let panelClass = [];
    if (type === 'success') {
      panelClass = ['success-snackbar'];
    } else if (type === 'error') {
      panelClass = ['error-snackbar'];
    } else if (type === 'warning') {
      panelClass = ['warning-snackbar'];
    }
    this.snackBar.open(message, 'Close', {duration: 3000, panelClass: panelClass});
  }

  /** ==================== PUBLIC METHODS ==================== */

  getCart(): Observable<Cart | null> {
    return this._cart.asObservable();
  }

  addItem(item: CartItem): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.post<Cart>(`${this.apiUrl}/add`, {productId: item.productId, quantity: item.quantity})
        .pipe(
          switchMap(cart => {
            if (!cart || !cart.items || cart.items.length === 0) {
              return of(cart);
            }
            // Fetch the product details for the newly updated cart
            const productObservables = cart.items.map(cartItem =>
              this.productService.getProductById(cartItem.productId).pipe(
                map(product => ({...cartItem, product})),
                catchError(() => of({...cartItem, product: undefined}))
              )
            );
            return forkJoin(productObservables).pipe(
              map(itemsWithProducts => ({...cart, items: itemsWithProducts}))
            );
          }),
          tap(cart => {
            this.calculateAndSetTotalPrice(cart);
            this.showSnackbar('Item added to cart!', 'success');
          }),
          catchError(error => {
            this.showSnackbar('Failed to add item to cart.', 'error');
            console.error('Failed to add item to user cart:', error);
            return throwError(() => error);
          })
        );
    } else {
      const currentCart = this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0};
      const existingItem = currentCart.items.find(ci => ci.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        currentCart.items.push(item);
      }
      this.saveGuestCart(currentCart.items);
      this.calculateAndSetTotalPrice(currentCart);
      return of(currentCart);
    }
  }

  updateItem(productId: number, quantity: number): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.post<Cart>(`${this.apiUrl}/update?productId=${productId}&quantity=${quantity}`, {})
        .pipe(
          switchMap(cart => {
            if (!cart || !cart.items || cart.items.length === 0) {
              return of(cart);
            }
            const productObservables = cart.items.map(cartItem =>
              this.productService.getProductById(cartItem.productId).pipe(
                map(product => ({...cartItem, product})),
                catchError(() => of({...cartItem, product: undefined}))
              )
            );
            return forkJoin(productObservables).pipe(
              map(itemsWithProducts => ({...cart, items: itemsWithProducts}))
            );
          }),
          tap(cart => {
            this.calculateAndSetTotalPrice(cart);
            this.showSnackbar('Cart item quantity updated!', 'success');
          }),
          catchError(error => {
            this.showSnackbar('Failed to update cart item.', 'error');
            console.error('Failed to update user cart item:', error);
            return throwError(() => error);
          })
        );
    } else {
      const currentCart = this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0};
      const item = currentCart.items.find(ci => ci.productId === productId);
      if (item) {
        item.quantity = quantity;
        this.saveGuestCart(currentCart.items);
        this.calculateAndSetTotalPrice(currentCart);
        this.showSnackbar('Guest cart item quantity updated!', 'success');
      }
      return of(currentCart);
    }
  }

  removeItem(productId: number): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.delete<Cart>(`${this.apiUrl}/remove/${productId}`)
        .pipe(
          switchMap(cart => {
            if (!cart || !cart.items || cart.items.length === 0) {
              return of(cart);
            }
            const productObservables = cart.items.map(cartItem =>
              this.productService.getProductById(cartItem.productId).pipe(
                map(product => ({...cartItem, product})),
                catchError(() => of({...cartItem, product: undefined}))
              )
            );
            return forkJoin(productObservables).pipe(
              map(itemsWithProducts => ({...cart, items: itemsWithProducts}))
            );
          }),
          tap(cart => {
            this.calculateAndSetTotalPrice(cart);
            this.showSnackbar('Item removed from cart!', 'success');
          }),
          catchError(error => {
            this.showSnackbar('Failed to remove item from cart.', 'error');
            console.error('Failed to remove item from user cart:', error);
            return throwError(() => error);
          })
        );
    } else {
      const currentCart = this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0};
      currentCart.items = currentCart.items.filter(ci => ci.productId !== productId);
      this.saveGuestCart(currentCart.items);
      this.calculateAndSetTotalPrice(currentCart);
      this.showSnackbar('Item removed from guest cart!', 'success');
      return of(currentCart);
    }
  }

  addProduct(product: ResponseProductDTO, quantity: number = 1): Observable<Cart> {
    if (product.id === undefined || product.id === null) {
      this.showSnackbar('Cannot add product to cart: Product ID is missing.', 'error');
      return throwError(() => new Error('Product ID is missing.'));
    }
    const cartItem: CartItem = {productId: product.id, quantity, product};
    return this.addItem(cartItem);
  }

  mergeGuestCart(): Observable<Cart> {
    if (!this.isBrowser || !this.authService.isTokenValid()) {
      return of(this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0});
    }

    const guestCartItems: CartItem[] = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    if (!guestCartItems.length) {
      this.loadUserCart();
      return of(this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0});
    }

    return new Observable<Cart>(observer => {
      let completed = 0;
      guestCartItems.forEach(item => {
        this.addItem(item).subscribe({
          next: cart => {
            completed++;
            if (completed === guestCartItems.length) {
              localStorage.removeItem('guest_cart');
              this.showSnackbar('Guest cart merged successfully!', 'success');
              this.loadUserCart();
              observer.next(cart);
              observer.complete();
            }
          },
          error: err => {
            console.error('Failed to merge guest item', err);
            completed++;
            if (completed === guestCartItems.length) {
              observer.error(err);
            }
          }
        });
      });
    });
  }
}
