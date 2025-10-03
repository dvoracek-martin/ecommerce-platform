import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {CustomerService} from '../../../services/customer.service';
import {Customer} from '../../../dto/customer/customer-dto';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, switchMap, map} from 'rxjs/operators';
import {CustomerStateService} from '../../../services/customer-state.service';
import {LocaleMapperService} from '../../../services/locale-mapper.service';
import {ConfigurationService} from '../../../services/configuration.service';
import {Subject, of, forkJoin} from 'rxjs';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-customers-admin-list',
  templateUrl: './customers-admin-list.component.html',
  styleUrls: ['./customers-admin-list.component.scss'],
  standalone: false,
})
export class CustomersAdminListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<Customer>();
  displayedColumns: string[] = ['customer', 'email', 'preferredLanguage', 'status', 'actions']; // Added status column

  private readonly destroy$ = new Subject<void>();
  searchControl = new FormControl('');
  emailSearchControl = new FormControl('');

  inUseLocales: ResponseLocaleDto[] = [];
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private customerService: CustomerService,
    private customerState: CustomerStateService,
    private router: Router,
    private localeMapperService: LocaleMapperService,
    private configurationService: ConfigurationService,
    public translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadConfigurationAndCustomers();
    this.setupSearchFilter();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadConfigurationAndCustomers(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      settings: this.configurationService.getLastAppSettings(),
      customers: this.customerService.getAll()
    }).subscribe({
      next: ({ settings, customers }) => {
        this.inUseLocales = settings.usedLocales || [];

        // Process customers with language mapping
        this.processCustomers(customers);
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private processCustomers(customers: Customer[]): void {
    const processedCustomers = customers.map(customer => {
      const locale = this.inUseLocales.find(l => l.id === customer.preferredLanguageId);
      const languageLabel = locale ?
        this.localeMapperService.mapLocaleByLocaleSync(locale) :
        customer.preferredLanguageId || 'Unknown';

      return {
        ...customer,
        preferredLanguage: languageLabel,
        // Ensure active property exists, default to true if undefined
        active: customer.active !== undefined ? customer.active : true
      };
    });

    this.dataSource.data = processedCustomers;

    // Set initial filter predicate
    this.setupInitialFilterPredicate();
  }

  private setupInitialFilterPredicate(): void {
    this.dataSource.filterPredicate = this.createGeneralFilterPredicate();
  }

  private createGeneralFilterPredicate(): (data: Customer, filter: string) => boolean {
    return (data: Customer, filter: string): boolean => {
      if (!filter) return true;

      const searchStr = filter.toLowerCase();
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase().trim();
      const language = data.preferredLanguageId;

      return (
        (data.id || '').toLowerCase().includes(searchStr) ||
        fullName.includes(searchStr) ||
        (data.email || '').toLowerCase().includes(searchStr)
        // ||
        // (language || '').includes(searchStr)
      );
    };
  }

  private createEmailFilterPredicate(): (data: Customer, filter: string) => boolean {
    return (data: Customer, filter: string): boolean => {
      if (!filter) return true;
      return (data.email || '').toLowerCase().includes(filter.toLowerCase());
    };
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.dataSource.filterPredicate = this.createGeneralFilterPredicate();
        this.dataSource.filter = (value || '').trim().toLowerCase();
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });

    this.emailSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.dataSource.filterPredicate = this.createEmailFilterPredicate();
        this.dataSource.filter = (value || '').trim().toLowerCase();
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });
  }

  viewCustomerDetails(customerId?: string): void {
    if (customerId) {
      this.customerState.setSelectedCustomer(customerId);
      this.router.navigate(['/admin/customers/detail']);
    }
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.dataSource.filter = '';
  }

  clearEmailSearch(): void {
    this.emailSearchControl.setValue('');
    this.dataSource.filter = '';
  }

  private handleError(error: any): void {
    this.error = error.message || 'Failed to load customers.';
    this.isLoading = false;
    console.error('Error in customers component:', error);

    // Ensure dataSource is in a valid state even on error
    this.dataSource.data = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
