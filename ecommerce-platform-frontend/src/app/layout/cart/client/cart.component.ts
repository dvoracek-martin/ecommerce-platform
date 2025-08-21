import { Component, OnInit } from '@angular/core';
import { Cart, CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  standalone: false,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = false;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: cart => {
        this.cart = cart;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  addItem(productId: number, quantity = 1) {
    this.cartService.addItem({ productId, quantity }).subscribe(cart => this.cart = cart);
  }

  removeItem(productId: number) {
    this.cartService.removeItem(productId).subscribe(cart => this.cart = cart);
  }

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateItem(productId, quantity).subscribe(cart => this.cart = cart);
  }
}
