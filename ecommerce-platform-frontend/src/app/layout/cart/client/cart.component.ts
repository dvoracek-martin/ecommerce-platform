import { Component, OnInit, OnDestroy } from '@angular/core';
import { Cart, CartItem, CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { ResponseMixtureDTO } from '../../../dto/mixtures/response-mixture-dto';
import { CartItemType } from '../../../dto/cart/cart-item-type';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CartItemWithDetails extends CartItem {
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
  optimisticQuantity?: number;
  updating?: boolean;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  standalone: false,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  cartItemsWithDetails: CartItemWithDetails[] = [];
  isLoading = false;
  CartItemType = CartItemType;
  private cartSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private router: Router,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCart() {
    this.isLoading = true;

    // Use the same approach as the app component
    this.cartSubscription = this.cartService.getCart().pipe(
      switchMap(cart => {
        this.cart = cart;
        if (!cart?.items?.length) {
          this.cartItemsWithDetails = [];
          return of([]);
        }

        const detailObservables = cart.items.map(item => {
          if (item.cartItemType === CartItemType.PRODUCT) {
            return this.productService.getProductById(item.itemId).pipe(
              map(product => ({ ...item, product })),
              catchError(() => {
                this.showSnackbar(`Failed to load product details for an item.`, 'warning');
                return of({ ...item, product: undefined });
              })
            );
          } else if (item.cartItemType === CartItemType.MIXTURE) {
            return this.mixtureService.getMixtureById(item.itemId).pipe(
              map(mixture => ({ ...item, mixture })),
              catchError(() => {
                this.showSnackbar(`Failed to load mixture details for an item.`, 'warning');
                return of({ ...item, mixture: undefined });
              })
            );
          }
          return of(item);
        });

        return forkJoin(detailObservables).pipe(
          map(items => items.map(item => {
            const existingItem = this.cartItemsWithDetails.find(i => i.itemId === item.itemId);
            return {
              ...item,
              optimisticQuantity: existingItem?.optimisticQuantity || item.quantity,
              updating: existingItem?.updating || false
            };
          }))
        );
      })
    ).subscribe(itemsWithDetails => {
      this.cartItemsWithDetails = itemsWithDetails;
      this.isLoading = false;
    }, err => {
      console.error('Failed to load cart with details', err);
      this.cart = { id: 0, username: '', items: [], totalPrice: 0 };
      this.cartItemsWithDetails = [];
      this.isLoading = false;
    });
  }

  // New method to handle input changes
  onQuantityChange(event: Event, item: CartItemWithDetails) {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value, 10);

    if (isNaN(quantity) || quantity < 0) {
      // Reset to current value if invalid
      input.value = (item.optimisticQuantity ?? item.quantity).toString();
      return;
    }

    this.updateQuantity(item.itemId, quantity, item.cartItemType);
  }

  updateQuantity(itemId: number, newQuantity: any, cartItemType: CartItemType) {
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;

    const item = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
    if (!item) {
      return;
    }
    if (quantity === null || isNaN(quantity)) {
      return;
    }

    // Check if quantity is the same as current to prevent duplicate calls
    const currentQuantity = item.optimisticQuantity !== undefined ? item.optimisticQuantity : item.quantity;
    if (quantity === currentQuantity) {
      return;
    }

    if (quantity === 0) {
      // Directly call removeItem without showing confirmation dialog here
      // The confirmation will be handled in removeItem
      this.removeItem(itemId);
      return;
    }
    if (quantity < 0) {
      return;
    }

    // Optimistic update
    item.optimisticQuantity = quantity;
    item.updating = true;

    this.cartService.updateItem(itemId, quantity, cartItemType)
      .subscribe(
        () => {
          // Success: update the actual quantity
          item.quantity = quantity;
          item.optimisticQuantity = undefined;
          item.updating = false;

          // Reload cart to ensure consistency with app component
          this.loadCart();
        },
        error => {
          // Error: revert the optimistic update
          item.optimisticQuantity = undefined;
          item.updating = false;
          this.showSnackbar('Failed to update quantity.', 'error');
          console.error('Update quantity error:', error);
        }
      );
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
        // Optimistic removal
        this.cartItemsWithDetails = this.cartItemsWithDetails.filter(item => item.itemId !== itemId);

        this.cartService.removeItem(itemId).subscribe(
          () => {
            this.showSnackbar('Item removed from cart!', 'success');
            // Reload cart to ensure consistency with app component
            this.loadCart();
          },
          error => {
            // Re-add item on error
            this.loadCart(); // Reload cart items
            this.showSnackbar('Failed to remove item.', 'error');
            console.error('Remove item error:', error);
          }
        );
      }
    });
  }

  // Helper method to show confirmation dialog
  private showConfirmationDialog(callback: () => void): void {
    if (this.dialog && typeof this.dialog.open === 'function') {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '300px',
        data: {
          title: this.translate.instant('DIALOG.CONFIRM_DELETE_TITLE'),
          message: this.translate.instant('DIALOG.CONFIRM_DELETE_MESSAGE')
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          callback();
        }
      });
    } else {
      const message = this.translate?.instant('DIALOG.CONFIRM_DELETE_MESSAGE') || 'Are you sure you want to delete this item?';
      if (confirm(message)) {
        callback();
      }
    }
  }

  goToProduct(productId: number) {
    this.router.navigate([`/products/${productId}`]);
  }

  goToMixture(mixtureId: number) {
    this.router.navigate([`/mixtures/${mixtureId}`]);
  }

  getItemTotal(item: CartItemWithDetails): number {
    const quantity = item.optimisticQuantity !== undefined ? item.optimisticQuantity : item.quantity;
    const price = item.product?.price || item.mixture?.price || 0;
    return price * quantity;
  }

  getCartTotal(): number {
    return this.cartItemsWithDetails.reduce(
      (sum, item) => sum + this.getItemTotal(item),
      0
    );
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substr(0, maxLength) + '...';
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

  navigateHome() {
    this.router.navigate(['/']);
  }
}
