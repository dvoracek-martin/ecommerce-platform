// src/app/layout/orders/client/orders-list.component.ts
import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {OrderService} from '../../../services/order.service';
import {ResponseOrderDTO} from '../../../dto/order/response-order-dto';
import {AuthService} from '../../../auth/auth.service';
import {OrderStateService} from '../../../services/order-state.service';
import {OrderStatus} from '../../../dto/order/order-status';
import {HttpResponse} from '@angular/common/http';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  standalone: false,
})
export class OrderListComponent implements OnInit {
  dataSource = new MatTableDataSource<ResponseOrderDTO>();
  displayedColumns: string[] = ['id', 'orderDate', 'shippingMethod', 'paymentMethod', 'finalTotal', 'status', 'actions'];

  OrderStatus = OrderStatus;
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    if (paginator) this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) this.dataSource.sort = sort;
  }

  constructor(
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService,
    private orderState: OrderStateService,
  ) {
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadOrders();
      } else {
        this.isLoading = false;
        this.error = 'You must be logged in to view your orders.';
      }
    });
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    const customerId = this.authService.getCurrentUserId();

    if (!customerId) {
      this.error = 'User not authenticated.';
      this.isLoading = false;
      return;
    }

    this.orderService.getOrdersByUserId(customerId).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders.';
        this.isLoading = false;
        console.error('Error fetching orders:', err);
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    // Pass orderId internally via service instead of URL
    this.orderState.setSelectedOrder(orderId);
    this.router.navigate(['/orders/detail']);
  }

  downloadInvoice(orderId: number): void {
    const customerId = this.authService.getCurrentUserId();
    this.orderService.downloadInvoice(customerId, orderId).subscribe({
      next: (response: HttpResponse<ArrayBuffer>) => {
        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `invoice_${orderId}.pdf`; // Default fallback

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch != null && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const blob = new Blob([response.body!], {type: 'application/pdf'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Use extracted filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading invoice:', err);
      }
    });
  }

  getStatusClass(status?: OrderStatus): string {
    switch (status) {
      case this.OrderStatus.CREATED:
        return 'status-created';
      case this.OrderStatus.PENDING:
        return 'status-pending';
      case this.OrderStatus.CONFIRMED:
        return 'status-confirmed';
      case this.OrderStatus.SHIPPED:
        return 'status-shipped';
      case this.OrderStatus.DELIVERED:
        return 'status-delivered';
      case this.OrderStatus.FINISHED:
        return 'status-finished';
      case this.OrderStatus.REJECTED:
        return 'status-rejected';
      case this.OrderStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status?: OrderStatus): string {
    return status?.toUpperCase() || '';
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }
}
