import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {OrderService} from '../../../services/order.service';
import {ResponseOrderDTO} from '../../../dto/order/response-order-dto';
import {OrderStatus} from '../../../dto/order/order-status';
import {AuthService} from '../../../auth/auth.service';
import {HttpResponse} from '@angular/common/http';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {OrderStateService} from '../../../services/order-state.service';
import {Router} from '@angular/router';

interface ClientOrder extends ResponseOrderDTO {
  invoiceId?: string;
}

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  standalone: false,
})
export class OrderListComponent implements OnInit {
  dataSource = new MatTableDataSource<ClientOrder>();
  displayedColumns: string[] = ['invoiceId', 'orderDate', 'shippingMethod', 'paymentMethod', 'finalTotal', 'status', 'actions'];

  searchControl = new FormControl('');
  OrderStatus = OrderStatus;
  isLoading = true;
  error: string | null = null;
  clientId!: string;

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    if (paginator) this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) this.dataSource.sort = sort;
  }

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private orderState: OrderStateService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    if (!this.authService.isTokenValid()) {
      this.error = 'You must be logged in to view your orders.';
      this.isLoading = false;
      return;
    }

    const userId = this.authService.getUserId();
    if (userId) {
      this.clientId = userId;
      this.loadOrders();
      this.setupSearchFilter();
    } else {
      this.error = 'No user ID found. Please log in again.';
      this.isLoading = false;
    }
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        this.applyFilter(value || '');
      });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getByCustomerId(this.clientId).subscribe({
      next: (orders) => {
        if (!orders || orders.length === 0) {
          this.dataSource.data = [];
          this.isLoading = false;
          return;
        }

        this.dataSource.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'invoiceId':
              return item.invoiceId || '';
            case 'shippingMethod':
              return item.shippingMethod;
            case 'paymentMethod':
              return item.paymentMethod;
            case 'finalTotal':
              return item.finalTotal || 0;
            case 'status':
              return item.status || '';
            default:
              return item[property as keyof ClientOrder] as string;
          }
        };

        const ordersWithInvoice: ClientOrder[] = orders.map(order => {
          const orderDate = new Date(order.orderDate);
          const year = orderDate.getFullYear();
          const invoiceId = `${year}${order.orderYearOrderCounter.toString().padStart(5, '0')}`;

          return {...order, invoiceId};
        });

        this.dataSource.data = ordersWithInvoice;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders.';
        this.isLoading = false;
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    this.orderState.setSelectedOrder(orderId);
    this.router.navigate(['/orders/detail']);
  }

  downloadInvoice(order: ClientOrder): void {
    this.orderService.downloadInvoice(this.clientId, order.id).subscribe({
      next: (response: HttpResponse<ArrayBuffer>) => {
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `invoice_${order.invoiceId}.pdf`;

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
        a.download = filename;
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
      case this.OrderStatus.PROCESSING:
        return 'status-processing';
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

  clearSearch(): void {
    this.searchControl.setValue('');
    this.applyFilter('');
  }
}
