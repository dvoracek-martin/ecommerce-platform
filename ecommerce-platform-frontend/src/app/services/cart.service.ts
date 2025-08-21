// src/app/services/cart.service.ts
import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseProductDTO} from "../dto/product/response-product-dto";
import {isPlatformBrowser} from '@angular/common';

export interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
}

export interface Cart {
  id: number;
  username: string;
  items: CartItem[];
}

@Injectable({providedIn: 'root'})
export class CartService {
  private apiUrl = 'http://localhost:8080/api/cart/v1';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /** Check if user is logged in */
  private isLoggedIn(): boolean {
    return this.isBrowser && !!localStorage.getItem('access_token');
  }

  /** ==================== GUEST CART HELPERS ==================== */
  private getGuestCart(): Cart {
    if (!this.isBrowser) return {id: 0, username: 'guest', items: []};
    const items = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    return {id: 0, username: 'guest', items};
  }

  private saveGuestCart(items: CartItem[]) {
    if (this.isBrowser) {
      localStorage.setItem('guest_cart', JSON.stringify(items));
    }
  }

  /** ==================== PUBLIC METHODS ==================== */

  getCart(): Observable<Cart> {
    if (this.isLoggedIn()) {
      return this.http.get<Cart>(this.apiUrl);
    } else {
      return new Observable<Cart>(observer => {
        observer.next(this.getGuestCart());
        observer.complete();
      });
    }
  }

  addItem(item: CartItem): Observable<Cart> {
    if (this.isLoggedIn()) {
      return this.http.post<Cart>(`${this.apiUrl}/add`, item);
    } else {
      const cart = this.getGuestCart();
      const existingItem = cart.items.find(ci => ci.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.items.push(item);
      }
      this.saveGuestCart(cart.items);
      return new Observable<Cart>(observer => {
        observer.next(cart);
        observer.complete();
      });
    }
  }

  updateItem(productId: number, quantity: number): Observable<Cart> {
    if (this.isLoggedIn()) {
      return this.http.post<Cart>(`${this.apiUrl}/update?productId=${productId}&quantity=${quantity}`, {});
    } else {
      const cart = this.getGuestCart();
      const item = cart.items.find(ci => ci.productId === productId);
      if (item) item.quantity = quantity;
      this.saveGuestCart(cart.items);
      return new Observable<Cart>(observer => {
        observer.next(cart);
        observer.complete();
      });
    }
  }

  removeItem(productId: number): Observable<Cart> {
    if (this.isLoggedIn()) {
      return this.http.delete<Cart>(`${this.apiUrl}/remove/${productId}`);
    } else {
      let cart = this.getGuestCart();
      cart.items = cart.items.filter(ci => ci.productId !== productId);
      this.saveGuestCart(cart.items);
      return new Observable<Cart>(observer => {
        observer.next(cart);
        observer.complete();
      });
    }
  }

  /** Add product to cart with optional quantity (default 1) */
  addProduct(product: ResponseProductDTO, quantity: number = 1): Observable<Cart> {
    return this.addItem({productId: product.id, quantity});
  }

  /** Merge guest cart into user cart after login */
  mergeGuestCart(): Observable<Cart> {
    if (!this.isBrowser) return new Observable<Cart>(observer => observer.complete());

    const guestCart: CartItem[] = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    if (!guestCart.length) return new Observable<Cart>(observer => observer.complete());

    return new Observable<Cart>(observer => {
      let completed = 0;
      let mergedCart: Cart | null = null;

      guestCart.forEach(item => {
        this.addItem(item).subscribe({
          next: cart => {
            mergedCart = cart;
          },
          error: err => console.error('Failed to merge guest item', err),
          complete: () => {
            completed++;
            if (completed === guestCart.length) {
              // Po merge smažeme guest_cart
              localStorage.removeItem('guest_cart');
              observer.next(mergedCart!);
              observer.complete();
            }
          }
        });
      });
    });
  }

}
