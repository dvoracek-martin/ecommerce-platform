import {Component, OnInit} from '@angular/core';
import {Cart, CartItem, CartService} from '../../../services/cart.service';
import {ProductService} from '../../../services/product.service';
import {forkJoin, of} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';

interface CartItemWithProduct extends CartItem {
  product?: ResponseProductDTO;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  standalone: false,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  cart: Cart | null = null;
  cartItemsWithProducts: CartItemWithProduct[] = [];
  isLoading = false;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router
  ) {
  }

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
            this.cartItemsWithProducts = [];
            return of(null);
          }

          const productObservables = cart.items.map(item =>
            this.productService.getProductById(item.itemId)
              .pipe(catchError(() => of(null)))
          );

          return forkJoin(productObservables);
        })
      )
      .subscribe(products => {
        if (products) {
          this.cartItemsWithProducts = this.cart!.items.map((item, idx) => ({
            ...item,
            product: products[idx] || undefined
          }));
        }
        this.isLoading = false;
      }, () => this.isLoading = false);
  }

  updateQuantity(productId: number, newQuantity: number) {
    const item = this.cartItemsWithProducts.find(i => i.itemId === productId);
    if (!item) {
      return;
    }
    if (newQuantity === null || isNaN(newQuantity)) {
      return;
    }

    if (newQuantity === 0) {
      if (window.confirm('Do you want to remove this item from your cart?')) {
        this.removeItem(productId);
      } else {
        return;
      }
      return;
    }
    if (newQuantity < 0) {
      return;
    }

    item.quantity = newQuantity;
    this.cartService.updateItem(productId, newQuantity)
      .subscribe(() => this.loadCart());
  }


  removeItem(productId: number) {
    this.cartService.removeItem(productId).subscribe(() => this.loadCart());
  }

  goToProduct(productId: number) {
    this.router.navigate([`/products/${productId}`]);
  }

  getItemTotal(item: CartItemWithProduct): number {
    return (item.product?.price || 0) * item.quantity;
  }

  getCartTotal(): number {
    return this.cartItemsWithProducts.reduce(
      (sum, item) => sum + this.getItemTotal(item),
      0
    );
  }
}
