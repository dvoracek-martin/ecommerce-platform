import { Component, OnInit } from '@angular/core';
import { Cart, CartItem, CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { ResponseMixtureDTO } from '../../../dto/mixtures/response-mixture-dto';
import { CartItemType } from '../../../dto/cart/cart-item-type';

interface CartItemWithDetails extends CartItem {
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  standalone: false,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  cartItemsWithDetails: CartItemWithDetails[] = [];
  isLoading = false;
  CartItemType = CartItemType; // Make CartItemType available in template

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    this.isLoading = true;
    this.cartService.getCart()
      .pipe(
        switchMap(cart => {
          this.cart = cart;

          if (!cart.items?.length) {
            this.cartItemsWithDetails = [];
            return of([]);
          }

          const detailObservables = cart.items.map(item => {
            if (item.cartItemType === CartItemType.PRODUCT) {
              return this.productService.getProductById(item.itemId)
                .pipe(
                  map(product => ({...item, product})),
                  catchError(() => of({...item, product: undefined}))
                );
            } else if (item.cartItemType === CartItemType.MIXTURE) {
              return this.mixtureService.getMixtureById(item.itemId)
                .pipe(
                  map(mixture => ({...item, mixture})),
                  catchError(() => of({...item, mixture: undefined}))
                );
            }
            return of(item);
          });

          return forkJoin(detailObservables);
        })
      )
      .subscribe((itemsWithDetails: any[]) => {
        this.cartItemsWithDetails = itemsWithDetails as CartItemWithDetails[];
        this.isLoading = false;
      }, () => this.isLoading = false);
  }

  updateQuantity(itemId: number, newQuantity: any, cartItemType: CartItemType) {
    // Convert to number if it's a string
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;

    const item = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
    if (!item) {
      return;
    }
    if (quantity === null || isNaN(quantity)) {
      return;
    }

    if (quantity === 0) {
      if (window.confirm('Do you want to remove this item from your cart?')) {
        this.removeItem(itemId);
      } else {
        return;
      }
      return;
    }
    if (quantity < 0) {
      return;
    }

    item.quantity = quantity;
    this.cartService.updateItem(itemId, quantity, cartItemType)
      .subscribe(() => this.loadCart());
  }

  removeItem(itemId: number) {
    this.cartService.removeItem(itemId).subscribe(() => this.loadCart());
  }

  goToProduct(productId: number) {
    this.router.navigate([`/products/${productId}`]);
  }

  goToMixture(mixtureId: number) {
    this.router.navigate([`/mixtures/${mixtureId}`]);
  }

  getItemTotal(item: CartItemWithDetails): number {
    const price = item.product?.price || item.mixture?.price || 0;
    return price * item.quantity;
  }

  getCartTotal(): number {
    return this.cartItemsWithDetails.reduce(
      (sum, item) => sum + this.getItemTotal(item),
      0
    );
  }

  // New method to handle checkout
  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  // Truncate text method to replace the pipe
  truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substr(0, maxLength) + '...';
  }
}
