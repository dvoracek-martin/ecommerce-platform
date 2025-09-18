import {Component, OnDestroy, OnInit} from '@angular/core';
import {forkJoin, of, Subscription} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {ResponseMixtureDTO} from '../../../dto/mixtures/response-mixture-dto';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {CartItemDTO} from '../../../dto/cart/cart-item-dto';
import {ResponseOrderDTO} from '../../../dto/order/response-order-dto';
import {OrderService} from '../../../services/order.service';
import {ProductService} from '../../../services/product.service';
import {MixtureService} from '../../../services/mixture.service';
import {CartItemType} from '../../../dto/cart/cart-item-type';
import {OrderStatus} from '../../../dto/order/order-status';
import {Router} from '@angular/router';
import {OrderStateService} from '../../../services/order-state.service';
import {AuthService} from '../../../auth/auth.service';
import {HttpResponse} from '@angular/common/http';
import {UpdateOrderDTO} from '../../../dto/order/update-order-dto';
import {MatSnackBar} from '@angular/material/snack-bar';

interface OrderItemWithDetails extends CartItemDTO {
  product?: ResponseProductDTO;
  mixture?: ResponseMixtureDTO;
  itemPrice?: number;
  itemName?: string;
  loaded: boolean;
}

@Component({
  selector: 'app-order-detail-admin',
  templateUrl: './orders-admin-detail.component.html',
  standalone: false,
  styleUrls: ['./orders-admin-detail.component.scss']
})
export class OrdersAdminDetailComponent implements OnInit, OnDestroy {
  order: ResponseOrderDTO | null = null;
  orderItemsWithDetails: OrderItemWithDetails[] = [];
  isLoading = true;
  isOrderLoaded = false;
  CartItemType = CartItemType;
  OrderStatus = OrderStatus;
  private orderSubscription!: Subscription;
  selectedStatus?: OrderStatus;
  trackingNumber: string = '';
  orderStatuses = Object.values(OrderStatus);

  constructor(
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private orderState: OrderStateService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const orderId = this.orderState.getSelectedOrder();
    if (!orderId) {
      this.router.navigate(['/admin/orders']);
      return;
    }

    this.loadOrder(orderId);
  }

  ngOnDestroy(): void {
    if (this.orderSubscription) this.orderSubscription.unsubscribe();
    this.orderState.clearSelectedOrder();
  }

  loadOrder(orderId: number): void {
    this.isLoading = true;
    this.isOrderLoaded = false;

    this.orderSubscription = this.orderService.getOrderById(orderId).pipe(
      switchMap(order => {
        this.order = order;
        this.selectedStatus = order?.status;
        this.trackingNumber = order?.trackingNumber || '';

        if (!order?.items?.length) return of([]);

        const detailObservables = order.items.map(item => {
          if (item.cartItemType === CartItemType.PRODUCT) {
            return this.productService.getProductById(item.itemId).pipe(
              map(product => ({
                ...item,
                product,
                itemPrice: product.price,
                itemName: product.name,
                loaded: true
              })),
              catchError(() => of({...item, loaded: false}))
            );
          } else if (item.cartItemType === CartItemType.MIXTURE) {
            return this.mixtureService.getMixtureById(item.itemId).pipe(
              map(mixture => ({
                ...item,
                mixture,
                itemPrice: mixture.price,
                itemName: mixture.name,
                loaded: true
              })),
              catchError(() => of({...item, loaded: false}))
            );
          }
          return of({...item, loaded: false});
        });

        return forkJoin(detailObservables);
      })
    ).subscribe({
      next: itemsWithDetails => {
        this.orderItemsWithDetails = itemsWithDetails as OrderItemWithDetails[];
        this.isLoading = false;
        this.isOrderLoaded = true;
      },
      error: err => {
        console.error('Error loading order:', err);
        this.isLoading = false;
        this.isOrderLoaded = true;
      }
    });
  }

  getItemTotal(item: OrderItemWithDetails): number {
    const price = item.itemPrice || item.product?.price || item.mixture?.price || 0;
    return price * item.quantity;
  }

  getOrderSubtotal(): number {
    return this.orderItemsWithDetails.reduce(
      (sum, item) => sum + this.getItemTotal(item),
      0
    );
  }

  getStatusClass(status?: OrderStatus): string {
    switch (status) {
      case this.OrderStatus.CREATED: return 'status-created';
      case this.OrderStatus.PENDING: return 'status-pending';
      case this.OrderStatus.CONFIRMED: return 'status-confirmed';
      case this.OrderStatus.PROCESSING: return 'status-processing';
      case this.OrderStatus.SHIPPED: return 'status-shipped';
      case this.OrderStatus.DELIVERED: return 'status-delivered';
      case this.OrderStatus.FINISHED: return 'status-finished';
      case this.OrderStatus.REJECTED: return 'status-rejected';
      case this.OrderStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }

  getStatusIcon(status?: OrderStatus): string {
    switch (status) {
      case this.OrderStatus.CREATED: return 'add';
      case this.OrderStatus.PENDING: return 'schedule';
      case this.OrderStatus.CONFIRMED: return 'check_circle';
      case this.OrderStatus.PROCESSING: return 'build';
      case this.OrderStatus.SHIPPED: return 'local_shipping';
      case this.OrderStatus.DELIVERED: return 'assignment_turned_in';
      case this.OrderStatus.FINISHED: return 'done_all';
      case this.OrderStatus.REJECTED: return 'cancel';
      case this.OrderStatus.CANCELLED: return 'not_interested';
      default: return 'help';
    }
  }

  getStatusText(status?: string): string {
    return status?.toUpperCase() || '';
  }

  trackByItemId(index: number, item: OrderItemWithDetails): number {
    return item.id;
  }

  formatOrderDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  downloadInvoice(orderId: number): void {
    const customerId = this.authService.getCurrentUserId();
    this.orderService.downloadInvoice(customerId, orderId).subscribe({
      next: (response: HttpResponse<ArrayBuffer>) => {
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `invoice_${orderId}.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch != null && filenameMatch[1]) filename = filenameMatch[1];
        }
        const blob = new Blob([response.body!], {type: 'application/pdf'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error downloading invoice:', err)
    });
  }

  navigateToProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  saveOrderChanges(): void {
    if (!this.order) return;

    const updateOrderDTO: UpdateOrderDTO = {
      id: this.order.id,
      customerId: this.order.customerId,
      items: this.order.items,
      shippingCost: this.order.shippingCost,
      cartTotal: this.order.cartTotal,
      finalTotal: this.order.finalTotal,
      status: this.selectedStatus,
      shippingMethod: this.order.shippingMethod,
      paymentMethod: this.order.paymentMethod,
      orderDate: this.order.orderDate,
      trackingNumber: this.trackingNumber,
      orderYearOrderCounter: this.order.orderYearOrderCounter
    };

    this.orderService.updateOrder(updateOrderDTO).subscribe({
      next: updatedOrder => {
        const snackMessages: string[] = [];
        if (this.order!.status !== updatedOrder.status) {
          snackMessages.push('Order status updated successfully!');
        }
        if (this.order!.trackingNumber !== updatedOrder.trackingNumber) {
          snackMessages.push('Tracking number updated successfully!');
        }

        this.order!.status = updatedOrder.status;
        this.order!.trackingNumber = updatedOrder.trackingNumber;

        snackMessages.forEach(msg => this.snackBar.open(msg, 'Close', { duration: 5000 }));
      },
      error: err => {
        console.error('Failed to update order', err);
        this.snackBar.open('Failed to update order.', 'Close', { duration: 5000 });
      }
    });
  }

  backToList() {
    this.router.navigate(['/admin/orders']);
  }
}
