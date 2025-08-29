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
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  cartItemsWithDetails: CartItemWithDetails[] = [];
  isLoading = false;
  CartItemType = CartItemType;

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
                  map(product => ({...item, product, optimisticQuantity: item.quantity, updating: false})),
                  catchError(() => of({...item, product: undefined, optimisticQuantity: item.quantity, updating: false}))
                );
            } else if (item.cartItemType === CartItemType.MIXTURE) {
              return this.mixtureService.getMixtureById(item.itemId)
                .pipe(
                  map(mixture => ({...item, mixture, optimisticQuantity: item.quantity, updating: false})),
                  catchError(() => of({...item, mixture: undefined, optimisticQuantity: item.quantity, updating: false}))
                );
            }
            return of({...item, optimisticQuantity: item.quantity, updating: false});
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
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;

    const item = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
    if (!item) {
      return;
    }
    if (quantity === null || isNaN(quantity)) {
      return;
    }

    if (quantity === 0) {
      this.showConfirmationDialog(() => {
        this.removeItem(itemId);
      });
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
          () => this.showSnackbar('Item removed from cart!', 'success'),
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
      // ✅ fallback bezpečně s null coalescing
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
