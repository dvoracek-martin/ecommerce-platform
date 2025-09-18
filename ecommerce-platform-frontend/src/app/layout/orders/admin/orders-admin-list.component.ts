import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {OrderService} from '../../../services/order.service';
import {ResponseOrderDTO} from '../../../dto/order/response-order-dto';
import {AuthService} from '../../../auth/auth.service';
import {OrderStateService} from '../../../services/order-state.service';
import {OrderStatus} from '../../../dto/order/order-status';
import {HttpResponse} from '@angular/common/http';
import {CustomerService} from '../../../services/customer.service';
import {forkJoin, Observable} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {Customer} from '../../../dto/customer/customer-dto';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

interface OrderWithCustomer extends ResponseOrderDTO {
  userEmail?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  invoiceId?: string;
}

@Component({
  selector: 'app-order-list-admin',
  templateUrl: './orders-admin-list.component.html',
  styleUrls: ['./orders-admin-list.component.scss'],
  standalone: false,
})
export class OrdersAdminListComponent implements OnInit {
  dataSource = new MatTableDataSource<OrderWithCustomer>();
  displayedColumns: string[] = ['invoiceId', 'orderDate', 'userEmail', 'userLastName', 'userFirstName', 'shippingMethod', 'paymentMethod', 'finalTotal', 'status', 'actions'];

  searchControl = new FormControl('');
  invoiceIdSearchControl = new FormControl('');
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
    private customerService: CustomerService
  ) {
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadOrders();
        this.setupSearchFilter();
      } else {
        this.isLoading = false;
        this.error = 'You must be logged in to view orders.';
      }
    });
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.applyFilter(value || '');
      });

    this.invoiceIdSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.applyInvoiceIdFilter(value || '');
      });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyInvoiceIdFilter(filterValue: string): void {
    this.dataSource.filterPredicate = (data: OrderWithCustomer, filter: string) => {
      return data.invoiceId?.includes(filter) || false;
    };

    this.dataSource.filter = filterValue.trim();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  sortByColumn(column: string): void {
    if (!this.dataSource.sort) return;

    const sortState: Sort = {
      active: column,
      direction: this.getNextSortDirection(column)
    };

    this.dataSource.sort.active = sortState.active;
    this.dataSource.sort.direction = sortState.direction;
    this.dataSource.sort.sortChange.emit(sortState);
  }

  getNextSortDirection(column: string): 'asc' | 'desc' | '' {
    if (!this.dataSource.sort || this.dataSource.sort.active !== column) {
      return 'asc';
    }

    switch (this.dataSource.sort.direction) {
      case 'asc': return 'desc';
      case 'desc': return '';
      default: return 'asc';
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getAll().subscribe({
      next: (orders) => {
        if (!orders || orders.length === 0) {
          this.dataSource.data = [];
          this.isLoading = false;
          return;
        }

        // Set up custom sorting for the data source
        this.dataSource.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'invoiceId': return item.invoiceId || '';
            case 'userEmail': return item.userEmail || '';
            case 'userLastName': return item.userLastName || '';
            case 'userFirstName': return item.userFirstName || '';
            case 'shippingMethod': return item.shippingMethod;
            case 'paymentMethod': return item.paymentMethod;
            case 'finalTotal': return item.finalTotal || 0;
            case 'status': return item.status || '';
            default: return item[property as keyof OrderWithCustomer] as string;
          }
        };

        // Set up custom filtering for the data source
        this.dataSource.filterPredicate = (data: OrderWithCustomer, filter: string): boolean => {
          const searchStr = filter.toLowerCase();
          return (
            (data.invoiceId || '').toLowerCase().includes(searchStr) ||
            (data.userEmail || '').toLowerCase().includes(searchStr) ||
            (data.userFirstName || '').toLowerCase().includes(searchStr) ||
            (data.userLastName || '').toLowerCase().includes(searchStr) ||
            data.shippingMethod.toLowerCase().includes(searchStr) ||
            data.paymentMethod.toLowerCase().includes(searchStr) ||
            (data.finalTotal || 0).toString().includes(searchStr) ||
            (data.status || '').toLowerCase().includes(searchStr) ||
            data.orderDate.toString().toLowerCase().includes(searchStr)
          );
        };

        // Fetch customer info for each order
        const customerObservables: Observable<Customer>[] = orders.map(order =>
          this.customerService.getById(order.customerId).pipe(
            catchError(err => {
              console.error(`Failed to load customer ${order.customerId}`, err);
              return [ { firstName: null, lastName: null, email: null, preferredLanguage: 'en' } as Customer ];
            })
          )
        );

        forkJoin(customerObservables).subscribe(customers => {
          const ordersWithCustomer: OrderWithCustomer[] = orders.map((order, idx) => {
            const customer = customers[idx];
            const orderDate = new Date(order.orderDate);
            const year = orderDate.getFullYear();
            // Generate invoice ID using year and orderYearOrderCounter
            const invoiceId = `${year}${order.orderYearOrderCounter.toString().padStart(5, '0')}`;

            return {
              ...order,
              userEmail: customer.email,
              userFirstName: customer.firstName,
              userLastName: customer.lastName,
              invoiceId: invoiceId
            };
          });

          this.dataSource.data = ordersWithCustomer;
          this.isLoading = false;
        });
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders.';
        this.isLoading = false;
        console.error('Error fetching orders:', err);
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    this.orderState.setSelectedOrder(orderId);
    this.router.navigate(['/admin/orders/detail']);
  }

  downloadInvoice(order: OrderWithCustomer): void {
    // Use the customer ID from the order, not the admin's ID
    const customerId = order.customerId;
    this.orderService.downloadInvoice(customerId, order.id).subscribe({
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
      case this.OrderStatus.CREATED: return 'status-created';
      case this.OrderStatus.PENDING: return 'status-pending';
      case this.OrderStatus.CONFIRMED: return 'status-confirmed';
      case this.OrderStatus.SHIPPED: return 'status-shipped';
      case this.OrderStatus.DELIVERED: return 'status-delivered';
      case this.OrderStatus.FINISHED: return 'status-finished';
      case this.OrderStatus.REJECTED: return 'status-rejected';
      case this.OrderStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }

  getStatusText(status?: OrderStatus): string {
    return status?.toUpperCase() || '';
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.applyFilter('');
  }

  clearInvoiceSearch(): void {
    this.invoiceIdSearchControl.setValue('');
    // Reset to default filter predicate
    this.dataSource.filterPredicate = (data: OrderWithCustomer, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      return (
        (data.invoiceId || '').toLowerCase().includes(searchStr) ||
        (data.userEmail || '').toLowerCase().includes(searchStr) ||
        (data.userFirstName || '').toLowerCase().includes(searchStr) ||
        (data.userLastName || '').toLowerCase().includes(searchStr) ||
        data.shippingMethod.toLowerCase().includes(searchStr) ||
        data.paymentMethod.toLowerCase().includes(searchStr) ||
        (data.finalTotal || 0).toString().includes(searchStr) ||
        (data.status || '').toLowerCase().includes(searchStr) ||
        data.orderDate.toString().toLowerCase().includes(searchStr)
      );
    };
    this.dataSource.filter = '';
  }
}
