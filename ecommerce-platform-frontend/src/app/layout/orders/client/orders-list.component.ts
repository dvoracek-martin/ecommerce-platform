import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { OrderService } from '../../../services/order.service';
import { ResponseOrderDTO } from '../../../dto/order/response-order-dto';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
  standalone: false,
})
export class OrdersListComponent implements OnInit {
  dataSource = new MatTableDataSource<ResponseOrderDTO>();
  displayedColumns: string[] = ['id', 'orderDate', 'shippingMethod', 'paymentMethod', 'finalTotal', 'actions'];

  isLoading = true;
  error: string | null = null;

  // Assign paginator when it becomes available
  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  // Assign sort when it becomes available
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor(
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService
  ) {}

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
    this.router.navigate([`/orders/${orderId}`]);
  }

  downloadInvoice(orderId: number): void {
    this.orderService.downloadInvoice(orderId).subscribe({
      next: (response: any) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${orderId}.pdf`;
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

  navigateHome(): void {
    this.router.navigate(['/']);
  }
}
