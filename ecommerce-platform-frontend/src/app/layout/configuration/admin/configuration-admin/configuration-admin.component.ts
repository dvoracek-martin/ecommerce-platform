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

@Component({
  selector: 'app-configuration-admin',
  templateUrl: './configuration-admin.component.html',
  standalone: false,
  styleUrls: ['./configuration-admin.component.scss']
})
export class ConfigurationAdminComponent implements OnInit, OnDestroy {

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


// v ngOnInit
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
              // pokud defaultLocale není v usedLocales, nastavíme jako první z usedLocales
              this.configurationForm.get('defaultLocale')?.setValue(selected[0] || null);
            }
          }
        },
        error: (err) => {
          console.error('Error loading configuration data:', err);
          this.snackBar.open('Error loading configuration data', 'Close', {duration: 3000});
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
      usedLocales: [[]],
      defaultLocale: [null, Validators.required],
      currency: ['', Validators.required]
    });
  }

  private loadInUseLocales() {
    this.configurationService.getInUseLocales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locales) => {
          this.inUseLocales = locales;

          const used: ResponseLocaleDto[] = this.configurationForm.value.usedLocales || [];
          const selected = this.inUseLocales.filter(locale =>
            used.some(u => u.id === locale.id)
          );
          this.configurationForm.get('usedLocales')?.setValue(selected);
        },
        error: (error) => {
          console.error('Error loading locales:', error);
          this.snackBar.open('Error loading in use locales', 'Close', {duration: 3000});
        }
      });
  }

  private loadLastAppSettings() {
    this.configurationService.getLastAppSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.appSettingsId = settings.id;

          this.configurationForm.patchValue({
            id: settings.id,
            theme: settings.theme,
            updatedAt: settings.updatedAt,
            usedLocales: settings.usedLocales
          });

          const selected = this.inUseLocales.filter(locale =>
            settings.usedLocales.some(u => u.id === locale.id)
          );
          this.configurationForm.get('usedLocales')?.setValue(selected);
        },
        error: (error) => {
          console.error('Error loading last app settings:', error);
          this.snackBar.open('Error loading app settings', 'Close', {duration: 3000});
        }
      });
  }

  onSave(): void {
    if (this.configurationForm.invalid) {
      this.configurationForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {duration: 5000});
      this.router.navigate(['/`']);
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
            this.snackBar.open('Error saving settings', 'Close', {duration: 3000});
            console.error(err);
          }
        });
    } else {
      this.saving = false;
      this.snackBar.open('No existing settings to update.', 'Close', {duration: 3000});
    }
  }

  compareLocales = (a: ResponseLocaleDto, b: ResponseLocaleDto) => a && b ? a.id === b.id : a === b;

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  translateLocale(locale: ResponseLocaleDto) {
    return this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode);
  }
}
