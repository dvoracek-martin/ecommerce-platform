import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
export class EmailAdminLogsComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<ResponseEmailLogDTO>();
  displayedColumns: string[] = ['emailType', 'recipient', 'language', 'sentAt', 'actions'];

  private readonly destroy$ = new Subject<void>();
  searchControl = new FormControl('');
  emailTypeControl = new FormControl('');

  emailTypes: string[] = ['REGISTRATION', 'PASSWORD_RESET', 'ORDER_CONFIRMATION', 'NEWSLETTER'];
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    public translateService: TranslateService,
    private emailService: EmailService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEmailLogs();
    this.setupSearchFilter();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configure sorting
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'emailType': return item.emailType?.toLowerCase() || '';
        case 'recipient': return item.recipient?.toLowerCase() || '';
        case 'language': return item.language?.toLowerCase() || '';
        case 'sentAt': return new Date(item.sentAt).getTime();
        default: return (item as any)[property];
      }
    };
  }

  loadEmailLogs(): void {
    this.isLoading = true;
    this.error = null;

    this.emailService.getAllEmailLogs().subscribe({
      next: (logs) => {
        this.dataSource.data = logs;
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private setupSearchFilter(): void {
    // General search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.applyFilter();
      });

    // Email type filter
    this.emailTypeControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilter();
      });
  }

  private applyFilter(): void {
    const searchValue = (this.searchControl.value || '').trim().toLowerCase();
    const emailTypeValue = this.emailTypeControl.value || '';

    this.dataSource.filterPredicate = (data: ResponseEmailLogDTO, filter: string) => {
      const filterObject = JSON.parse(filter);
      const searchStr = filterObject.search;
      const emailType = filterObject.emailType;

      // Apply email type filter
      if (emailType && data.emailType !== emailType) {
        return false;
      }

      // Apply search filter
      if (!searchStr) return true;

      return (
        (data.emailType || '').toLowerCase().includes(searchStr) ||
        (data.recipient || '').toLowerCase().includes(searchStr) ||
        (data.language || '').toLowerCase().includes(searchStr) ||
        (data.subject || '').toLowerCase().includes(searchStr)
      );
    };

    this.dataSource.filter = JSON.stringify({
      search: searchValue,
      emailType: emailTypeValue
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewEmailDetails(log: ResponseEmailLogDTO): void {
    const dialogRef = this.dialog.open(EmailResendDialogComponent, {
      width: '600px',
      data: {
        emailLog: log,
        mode: 'view'
      }
    });
  }

  resendEmail(log: ResponseEmailLogDTO): void {
    this.emailService.quickResend(log).subscribe({
      next: () => {
        this.snackBar.open('Email resent successfully', 'Close', {
          duration: 3000
        });
        this.loadEmailLogs(); // Refresh to show new log entry
      },
      error: (error) => {
        console.error('Failed to resend email:', error);
        this.snackBar.open('Failed to resend email', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  openResendDialog(log: ResponseEmailLogDTO): void {
    const dialogRef = this.dialog.open(EmailResendDialogComponent, {
      width: '600px',
      data: {
        emailLog: log,
        mode: 'resend'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'resend') {
        this.loadEmailLogs(); // Refresh the list
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

  getLanguageDisplayName(language: string): string {
    const languageMap: { [key: string]: string } = {
      'en_US': 'English',
      'cs_CZ': 'Czech',
      'sk_SK': 'Slovak',
      'de_DE': 'German',
      'fr_FR': 'French',
      'en': 'English',
      'cs': 'Czech',
      'sk': 'Slovak',
      'de': 'German',
      'fr': 'French'
    };
    return languageMap[language] || language;
  }

  private handleError(error: any): void {
    this.error = error.message || 'Failed to load email logs.';
    this.isLoading = false;
    console.error('Error in email logs component:', error);
    this.dataSource.data = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
