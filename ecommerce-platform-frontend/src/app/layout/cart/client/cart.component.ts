import { Component, OnDestroy, OnInit } from '@angular/core';
import { Cart, CartItem, CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { CartItemType } from '../../../dto/cart/cart-item-type';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {ResponseMixtureDTO} from '../../../dto/mixtures/response-mixture-dto';

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
  isLoading = true; // Start with loading state
  isCartLoaded = false; // New flag to track when data is ready
  CartItemType = CartItemType;
  private cartSubscription!: Subscription;

  // Discount code properties
  discountCode: string = '';

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
    this.isCartLoaded = false;

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
              optimisticQuantity: existingItem?.optimisticQuantity ?? item.quantity,
              updating: existingItem?.updating ?? false
            } as CartItemWithDetails;
          }))
        );
      })
    ).subscribe({
      next: (itemsWithDetails) => {
        this.isLoading = false;
        this.isCartLoaded = true;
        this.cartItemsWithDetails = itemsWithDetails as CartItemWithDetails[];
      },
      error: (err) => {
        this.isLoading = false;
        this.isCartLoaded = true;
        console.error('Failed to load cart with details', err);
        this.cart = { id: 0, username: '', items: [], totalPrice: 0, discount: 0 };
        this.cartItemsWithDetails = [];
      }
    });
  }

  onQuantityChange(event: Event, item: CartItemWithDetails) {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value, 10);

    if (isNaN(quantity) || quantity < 0) {
      input.value = (item.optimisticQuantity ?? item.quantity).toString();
      return;
    }

    this.updateQuantity(item.itemId, quantity, item.cartItemType);
  }

  updateQuantity(itemId: number, newQuantity: any, cartItemType: CartItemType) {
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;

    const item = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
    if (!item || quantity === null || isNaN(quantity) || quantity === (item.optimisticQuantity ?? item.quantity) || quantity < 0) {
      return;
    }

    if (quantity === 0) {
      this.removeItem(itemId);
      return;
    }

    item.optimisticQuantity = quantity;
    item.updating = true;
    this.cartItemsWithDetails = [...this.cartItemsWithDetails];

    this.cartService.updateItem(itemId, quantity, cartItemType)
      .pipe(
        finalize(() => {
          const found = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
          if (found) {
            found.updating = false;
            this.cartItemsWithDetails = [...this.cartItemsWithDetails];
          }
        })
      )
      .subscribe(
        () => {
          const found = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
          if (found) {
            found.quantity = quantity;
            found.optimisticQuantity = undefined;
            found.updating = false;
            this.cartItemsWithDetails = [...this.cartItemsWithDetails];
          }
          this.showSnackbar(this.translate.instant('CART.QUANTITY_UPDATE_SUCCESS') || 'Quantity updated successfully!', 'success');
        },
        error => {
          const found = this.cartItemsWithDetails.find(i => i.itemId === itemId && i.cartItemType === cartItemType);
          if (found) {
            found.optimisticQuantity = undefined;
            found.updating = false;
            this.cartItemsWithDetails = [...this.cartItemsWithDetails];
          }
          this.showSnackbar(this.translate.instant('CART.QUANTITY_UPDATE_FAIL') || 'Failed to update quantity.', 'error');
          console.error('Update quantity error:', error);
        }
      );
  }

  removeItem(itemId: number | undefined): void {
    if (itemId === undefined) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      panelClass: 'light-dialog-container',
      data: {
        title: this.translate.instant('DIALOG.CONFIRM_DELETE_TITLE'),
        message: this.translate.instant('DIALOG.CONFIRM_DELETE_MESSAGE')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const index = this.cartItemsWithDetails.findIndex(i => i.itemId === itemId);
      if (index === -1) {
        this.cartService.removeItem(itemId).subscribe(
          () => this.showSnackbar(this.translate.instant('CART.ITEM_REMOVED') || 'Item removed from cart!', 'success'),
          err => {
            this.showSnackbar(this.translate.instant('CART.ITEM_REMOVE_FAIL') || 'Failed to remove item.', 'error');
            console.error('Remove item error:', err);
          }
        );
        return;
      }

      const removedItem = this.cartItemsWithDetails[index];
      removedItem.updating = true;
      this.cartItemsWithDetails = [...this.cartItemsWithDetails];

      const newArray = [...this.cartItemsWithDetails];
      const idx = newArray.findIndex(i => i.itemId === itemId);
      let removedSnapshot: CartItemWithDetails | null = null;
      if (idx !== -1) {
        removedSnapshot = newArray.splice(idx, 1)[0];
      }
      this.cartItemsWithDetails = newArray;

      this.cartService.removeItem(itemId).pipe(
        finalize(() => {})
      ).subscribe(
        () => {
          this.showSnackbar(this.translate.instant('CART.ITEM_REMOVED') || 'Item removed from cart!', 'success');
        },
        error => {
          if (removedSnapshot) {
            const reverted = [...this.cartItemsWithDetails];
            const insertIndex = Math.min(index, reverted.length);
            removedSnapshot.updating = false;
            reverted.splice(insertIndex, 0, removedSnapshot);
            this.cartItemsWithDetails = reverted;
          }
          this.showSnackbar(this.translate.instant('CART.ITEM_REMOVE_FAIL') || 'Failed to remove item.', 'error');
          console.error('Remove item error:', error);
        }
      );
    });
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

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substr(0, maxLength) + '...';
  }

  applyDiscount(): void {
    if (this.discountCode.trim() && !this.isDiscountApplied()) {
      this.cartService.applyDiscount(this.discountCode).subscribe(
        () => {
          this.discountCode = '';
        },
        error => {
          console.error('Failed to apply discount:', error);
        }
      );
    } else if (this.isDiscountApplied()) {
      this.showSnackbar('Discount already applied', 'warning');
    } else {
      this.showSnackbar('Please enter a discount code', 'warning');
    }
  }

  removeDiscount(): void {
    this.cartService.removeDiscount().subscribe(
      () => {},
      error => {
        console.error('Failed to remove discount:', error);
      }
    );
  }

  isDiscountApplied(): boolean {
    return this.cart?.discount !== undefined && this.cart.discount > 0;
  }

  getDiscountedTotal(): number {
    const subtotal = this.getCartTotal();
    const discount = this.cart?.discount || 0;
    return subtotal - discount;
  }

  getCartTotal(): number {
    return this.cartItemsWithDetails.reduce(
      (sum, item) => sum + this.getItemTotal(item),
      0
    );
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    let panelClass: string[] = [];
    if (type === 'success') panelClass = ['success-snackbar'];
    else if (type === 'error') panelClass = ['error-snackbar'];
    else if (type === 'warning') panelClass = ['warning-snackbar'];
    else if (type === 'info') panelClass = ['info-snackbar'];

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass
    });
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
