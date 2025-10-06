import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfigurationService} from '../../../../services/configuration.service';
import {ResponseLocaleDto} from '../../../../dto/configuration/response-locale-dto';
import {RequestAppSettingsDto} from '../../../../dto/configuration/request-app-settings-dto';
import {switchMap} from 'rxjs/operators';
import {LocaleMapperService} from '../../../../services/locale-mapper.service';
import {ConfirmationDialogComponent} from '../../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-configuration-admin',
  templateUrl: './configuration-localization-admin.component.html',
  standalone: false,
  styleUrls: ['./configuration-localization-admin.component.scss']
})
export class ConfigurationLocalizationAdminComponent implements OnInit, OnDestroy {

  configurationForm!: FormGroup;
  saving = false;
  private readonly destroy$ = new Subject<void>();
  private appSettingsId?: number;

  inUseLocales: ResponseLocaleDto[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configurationService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
  }

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  private loadData() {
    this.configurationService.getInUseLocales()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(locales => {
          this.inUseLocales = locales;
          return this.configurationService.getLastAppSettings();
        })
      )
      .subscribe({
        next: (settings) => {
          this.appSettingsId = settings.id;

          // patch form values
          this.configurationForm.patchValue({
            id: settings.id,
            theme: settings.theme,
            updatedAt: settings.updatedAt,
            currency: settings.currency,
            defaultLocale: settings.defaultLocale
          });

          // usedLocales selection
          const selected = this.inUseLocales.filter(locale =>
            settings.usedLocales.some(u => u.id === locale.id)
          );
          this.configurationForm.get('usedLocales')?.setValue(selected);

          // ensure defaultLocale is in usedLocales
          if (settings.defaultLocale) {
            const isInUsed = selected.some(u => u.id === settings.defaultLocale.id);
            if (!isInUsed) {
              // if defaultLocale is not in usedLocales, set as first from usedLocales
              this.configurationForm.get('defaultLocale')?.setValue(selected[0] || null);
            }
          }
        },
        error: (err) => {
          console.error('Error loading configuration data:', err);
          this.snackBar.open('Error loading configuration data', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.configurationForm = this.fb.group({
      id: [null],
      theme: ['', Validators.required],
      updatedAt: [new Date().toISOString(), Validators.required],
      usedLocales: [[], Validators.required],
      defaultLocale: [null, Validators.required],
      currency: ['', Validators.required]
    });
  }

  onSave(): void {
    if (this.configurationForm.invalid) {
      this.configurationForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;
    const payload: RequestAppSettingsDto = this.configurationForm.value;

    if (this.appSettingsId) {
      this.configurationService.updateConfiguration(this.appSettingsId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.snackBar.open('Settings updated successfully!', 'Close', {duration: 3000});
            window.location.reload();
          },
          error: (err) => {
            this.saving = false;
            console.error('Update failed:', err);
            this.snackBar.open('Failed to update settings', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      this.saving = false;
      this.snackBar.open('No existing settings to update.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onCancel(): void {
    if (this.configurationForm?.dirty) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'COMMON.CANCEL_CONFIRM_TITLE',
          message: 'COMMON.CANCEL_CONFIRM_MESSAGE',
          warn: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result)
          this.router.navigate([`/admin/configuration/emails`]);
      });
    } else {
      this.router.navigate([`/admin/configuration/emails`]);
    }
  }

  compareLocales = (a: ResponseLocaleDto, b: ResponseLocaleDto) => a && b ? a.id === b.id : a === b;

  translateLocale(locale: ResponseLocaleDto) {
    return this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode);
  }
}
