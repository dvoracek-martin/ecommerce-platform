import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { EmailService } from '../../../../services/email.service';
import { ResponseEmailLogDTO } from '../../../../dto/email/response-email-log-dto';
import { EmailResendDialogComponent } from '../email-resend-dialog/email-resend-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-email-admin-logs',
  templateUrl: './emails-admin-logs.component.html',
  standalone: false,
  styleUrls: ['./emails-admin-logs.component.scss']
})
export class EmailAdminLogsComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource<ResponseEmailLogDTO>([]);
  displayedColumns: string[] = ['emailType', 'recipient', 'language', 'sentAt', 'actions'];

  private readonly destroy$ = new Subject<void>();
  searchControl = new FormControl('');
  emailTypeControl = new FormControl('');

  emailTypes: string[] = ['REGISTRATION', 'PASSWORD_RESET', 'ORDER_CONFIRMATION', 'NEWSLETTER'];
  isLoading = true;
  error: string | null = null;

  private _paginator: MatPaginator | null = null;
  private _sort: MatSort | null = null;

  @ViewChild(MatPaginator) set paginator(p: MatPaginator | null) {
    this._paginator = p;
    this.dataSource.paginator = p ?? undefined;
    if (p) {
      this.applyFilter();
    }
  }

  // <<-- ZDE je klíčová úprava: po přiřazení sortu vynutíme refresh dat, aby se data znovu seřadila
  @ViewChild(MatSort) set matSort(s: MatSort | null) {
    this._sort = s;
    this.dataSource.sort = s ?? undefined;
    if (s) {
      // trigger re-evaluation (filtrování + řazení)
      this.dataSource.data = this.dataSource.data.slice();
    }
  }
  // -->> končí klíčová úprava

  constructor(
    private router: Router,
    public translateService: TranslateService,
    private emailService: EmailService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupSearchFilter();

    // nastavíme sorting accessor hned (funguje nezávisle na instanci MatSort)
    this.dataSource.sortingDataAccessor = (data: ResponseEmailLogDTO, sortHeaderId: string) => {
      const val = (data as any)[sortHeaderId];
      if (val == null || val === undefined) {
        return '';
      }

      if (sortHeaderId === 'sentAt') {
        if (val instanceof Date) {
          return val.getTime();
        }
        if (typeof val === 'number') {
          return val;
        }
        const parsed = Date.parse(String(val));
        return isNaN(parsed) ? String(val).toLowerCase() : parsed;
      }

      return String(val).toLowerCase();
    };

    this.loadEmailLogs();
  }

  ngAfterViewInit(): void {
    // nic zásadního zde (settery ViewChild udělaly práci)
    this.applyFilter();
  }

  private setupSearchFilter(): void {
    this.dataSource.filterPredicate = this.createFilterPredicate();

    const apply = () => this.applyFilter();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(apply);

    this.emailTypeControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(apply);
  }

  private createFilterPredicate() {
    return (data: ResponseEmailLogDTO, filter: string): boolean => {
      if (!filter) {
        return true;
      }

      const parts = filter.split('::');
      const searchStr = (parts[0] || '').trim().toLowerCase();
      const emailTypeFilter = (parts[1] || '').trim().toLowerCase();

      if (emailTypeFilter) {
        const itemType = (data.emailType || '').toString().toLowerCase();
        if (itemType !== emailTypeFilter) {
          return false;
        }
      }

      if (!searchStr) {
        return true;
      }

      const combined = Object.keys(data)
        .map(k => {
          const v = (data as any)[k];
          if (v === null || v === undefined) return '';
          if (typeof v === 'object') {
            try {
              return JSON.stringify(v);
            } catch {
              return String(v);
            }
          }
          return String(v);
        })
        .join(' ')
        .toLowerCase();

      return combined.includes(searchStr);
    };
  }

  private applyFilter(): void {
    const search = (this.searchControl.value || '').toString().trim().toLowerCase();
    const emailType = (this.emailTypeControl.value || '').toString().trim().toLowerCase();
    const filterValue = `${search}::${emailType}`;

    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadEmailLogs(): void {
    this.isLoading = true;
    this.error = null;

    this.emailService.getAllEmailLogs().subscribe({
      next: (logs) => {
        this.dataSource.data = logs || [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  getTranslatedLanguage(languageCode: string): string {
    if (!languageCode) return '-';

    const upperCaseCode = languageCode.toUpperCase();
    const translationKey = `LOCALES.${upperCaseCode}`;
    const translated = this.translateService.instant(translationKey);

    return translated !== translationKey ?
      translated :
      languageCode.charAt(0).toUpperCase() + languageCode.slice(1).toLowerCase();
  }

  getDisplayedRange(): string {
    if (!this._paginator || this.dataSource.filteredData.length === 0) {
      return '0-0';
    }

    const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
    const endIndex = Math.min(
      startIndex + this._paginator.pageSize,
      this.dataSource.filteredData.length
    );

    return `${startIndex + 1}-${endIndex}`;
  }

  viewEmailDetails(log: ResponseEmailLogDTO): void {
    this.dialog.open(EmailResendDialogComponent, {
      width: '900px',
      data: {
        emailLog: log,
        mode: 'view'
      }
    });
  }

  resendEmail(log: ResponseEmailLogDTO): void {
    this.emailService.quickResend(log).subscribe({
      next: () => {
        this.snackBar.open(
          this.translateService.instant('EMAIL_LOGS.RESEND_SUCCESS'),
          'Close',
          { duration: 3000 }
        );
        this.loadEmailLogs();
      },
      error: (error) => {
        console.error('Failed to resend email:', error);
        this.snackBar.open(
          this.translateService.instant('EMAIL_LOGS.RESEND_ERROR'),
          'Close',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  openResendDialog(log: ResponseEmailLogDTO): void {
    const dialogRef = this.dialog.open(EmailResendDialogComponent, {
      width: '900px',
      data: {
        emailLog: log,
        mode: 'resend'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'resend') {
        this.loadEmailLogs();
      }
    });
  }

  navigateToSendEmail(): void {
    this.router.navigate(['/admin/configuration/emails/send']);
  }

  navigateToTemplates(): void {
    this.router.navigate(['/admin/configuration/emails/templates']);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.emailTypeControl.setValue('');
    this.applyFilter();
  }

  private handleError(error: any): void {
    this.error = this.translateService.instant('EMAIL_LOGS.LOAD_ERROR') || 'Failed to load email logs.';
    this.isLoading = false;
    console.error('Error in email logs component:', error);
    this.dataSource.data = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
