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
    private productService: ProductService
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

  private calculateAndSetTotalPrice(cart: Cart): void {
    const totalPrice = cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    cart.totalPrice = totalPrice;
    this._cart.next(cart);
  }

  private loadGuestCartFromStorage(): void {
    const items = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const guestCart: Cart = {id: 0, username: 'guest', items: items, totalPrice: 0};
    this.calculateAndSetTotalPrice(guestCart);
  }

  private saveGuestCart(items: CartItem[]) {
    if (this.isBrowser) {
      const simpleItems = items.map(item => ({productId: item.itemId, quantity: item.quantity}));
      localStorage.setItem('guest_cart', JSON.stringify(simpleItems));
    }
  }

  private loadUserCart(): void {
    if (!this.authService.isTokenValid()) {
      this.showSnackbar('Please log in to view your cart.', 'warning');
      this._cart.next({id: 0, username: 'guest', items: [], totalPrice: 0});
      return;
    }

    this.http.get<Cart>(this.apiUrl)
      .pipe(
        switchMap(cart => {
          if (!cart || !cart.items || cart.items.length === 0) {
            return of(cart);
          }
          const productObservables = cart.items.map(item =>
            this.productService.getProductById(item.itemId).pipe(
              map(product => ({...item, product})),
              catchError(() => of({...item, product: undefined}))
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

  getCart(): Observable<Cart | null> {
    return this._cart.asObservable();
  }

  addItem(item: CartItem): Observable<Cart> {
    if (this.authService.isTokenValid()) {
      return this.http.post<Cart>(`${this.apiUrl}/add`, item)
        .pipe(
          switchMap(cart => {
            if (!cart || !cart.items || cart.items.length === 0) return of(cart);

            const productObservables = cart.items.map(cartItem =>
              this.productService.getProductById(cartItem.itemId).pipe(
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
      const existingItem = currentCart.items.find(ci => ci.itemId === item.itemId);
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
      const currentCart = this._cart.getValue();
      if (currentCart) {
        const item = currentCart.items.find(i => i.itemId === productId);
        if (item) {
          const oldQuantity = item.quantity;
          item.quantity = quantity;
          this.calculateAndSetTotalPrice(currentCart);

          return this.http.post<Cart>(`${this.apiUrl}/update?productId=${productId}&quantity=${quantity}`, {})
            .pipe(
              tap(() => this.showSnackbar('Cart item quantity updated!', 'success')),
              catchError(error => {
                this.showSnackbar('Failed to update item quantity.', 'error');
                console.error('Failed to update user cart item:', error);
                if (item) {
                  item.quantity = oldQuantity;
                  this.calculateAndSetTotalPrice(currentCart);
                }
                return throwError(() => error);
              })
            );
        }
      }
      return throwError(() => new Error('Item not found in cart.'));
    } else {
      const currentCart = this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0};
      const item = currentCart.items.find(ci => ci.itemId === productId);
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
      const currentCart = this._cart.getValue();
      if (currentCart) {
        const itemToRemove = currentCart.items.find(i => i.itemId === productId);
        const oldItems = [...currentCart.items];
        currentCart.items = currentCart.items.filter(i => i.itemId !== productId);
        this.calculateAndSetTotalPrice(currentCart);

        return this.http.delete<Cart>(`${this.apiUrl}/remove/${productId}`)
          .pipe(
            tap(() => this.showSnackbar('Item removed from cart!', 'success')),
            catchError(error => {
              this.showSnackbar('Failed to remove item from cart.', 'error');
              console.error('Failed to remove item from user cart:', error);
              if (itemToRemove) {
                currentCart.items = oldItems;
                this.calculateAndSetTotalPrice(currentCart);
              }
              return throwError(() => error);
            })
          );
      }
      return throwError(() => new Error('Cart not found.'));
    } else {
      const currentCart = this._cart.getValue() || {id: 0, username: 'guest', items: [], totalPrice: 0};
      currentCart.items = currentCart.items.filter(item => item.itemId !== productId);
      this.saveGuestCart(currentCart.items);
      this.calculateAndSetTotalPrice(currentCart);
      this.showSnackbar('Item removed from cart!', 'success');
      return of(currentCart);
    }
  }

  mergeGuestCart(): Observable<Cart> {
    const guestCartItems = JSON.parse(localStorage.getItem('guest_cart') || '[]');

    if (guestCartItems.length === 0) {
      return of(this._cart.getValue() as Cart);
    }

    return this.http.post<Cart>(`${this.apiUrl}/merge-guest-cart`, guestCartItems)
      .pipe(
        switchMap(cart => {
          if (!cart || !cart.items || cart.items.length === 0) {
            return of(cart);
          }
          const productObservables = cart.items.map(cartItem =>
            this.productService.getProductById(cartItem.itemId).pipe(
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
}
