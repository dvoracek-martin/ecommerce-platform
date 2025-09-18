import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {CustomerService} from '../../../services/customer.service';
import {Customer} from '../../../dto/customer/customer-dto';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Component({
  selector: 'app-customers-admin-list',
  templateUrl: './customers-admin-list.component.html',
  styleUrls: ['./customers-admin-list.component.scss'],
  standalone: false,
})
export class CustomersAdminListComponent implements OnInit {
  dataSource = new MatTableDataSource<Customer>();
  displayedColumns: string[] = ['id', 'firstName', 'lastName', 'email', 'preferredLanguage', 'actions'];

  searchControl = new FormControl('');
  emailSearchControl = new FormControl('');

  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    if (paginator) this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) this.dataSource.sort = sort;
  }

  constructor(
    private customerService: CustomerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.setupSearchFilter();
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        this.applyFilter(value || '');
      });

    this.emailSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        this.applyEmailFilter(value || '');
      });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filterPredicate = (data: Customer, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      return (
        (data.id || '').toLowerCase().includes(searchStr) ||
        (data.firstName || '').toLowerCase().includes(searchStr) ||
        (data.lastName || '').toLowerCase().includes(searchStr) ||
        (data.email || '').toLowerCase().includes(searchStr) ||
        (data.preferredLanguage || '').toLowerCase().includes(searchStr)
      );
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  applyEmailFilter(filterValue: string): void {
    this.dataSource.filterPredicate = (data: Customer, filter: string): boolean => {
      return data.email?.toLowerCase().includes(filter.toLowerCase()) || false;
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = null;

    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.dataSource.data = customers;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load customers.';
        this.isLoading = false;
        console.error('Error fetching customers:', err);
      }
    });
  }

  viewCustomerDetails(customerId?: string): void {
    if (!customerId) return;
    this.router.navigate(['/admin/customers/detail', customerId]);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.applyFilter('');
  }

  clearEmailSearch(): void {
    this.emailSearchControl.setValue('');
    this.applyFilter('');
  }
}
