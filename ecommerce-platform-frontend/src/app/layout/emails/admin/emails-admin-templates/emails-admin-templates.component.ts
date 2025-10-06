import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';

import {EmailService} from '../../../../services/email.service';
import {ConfigurationService} from '../../../../services/configuration.service';
import {LocaleMapperService} from '../../../../services/locale-mapper.service';
import {ConfirmationDialogComponent} from '../../../../shared/confirmation-dialog/confirmation-dialog.component';

import {EmailDTO} from '../../../../dto/email/email-dto';
import {ResponseLocaleDto} from '../../../../dto/configuration/response-locale-dto';
import {LocalizedFieldDTO} from '../../../../dto/base/localized-field-dto';
import {EmailObjectsEnum} from '../../../../dto/email/email-objects-enum';
import {EmailGetOrDeleteEvent} from '../../../../dto/email/email-get-or-delete-event';
import {ResponseEmailDTO} from '../../../../dto/email/response-email-dto';

@Component({
  selector: 'app-configuration-emails-admin',
  templateUrl: './emails-admin-templates.component.html',
  standalone: false,
  styleUrls: ['./emails-admin-templates.component.scss']
})
export class EmailsAdminTemplatesComponent implements OnInit, OnDestroy {
  emailForm!: FormGroup;
  saving = false;
  showPreview = false;
  loadedEmail: ResponseEmailDTO | null = null;
  lastLoaded: string | null = null;

  usedLocales: ResponseLocaleDto[] = [];
  emailTypes = Object.values(EmailObjectsEnum);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private emailService: EmailService,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadLocales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const formConfig: any = {
      emailType: ['', Validators.required],
      showPreview: [false]
    };

    // Initialize form controls for all locales (will be populated when locales are loaded)
    this.emailForm = this.fb.group(formConfig);
  }

  private loadLocales(): void {
    this.configService.getLastAppSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.usedLocales = settings.usedLocales.map(locale => ({
            ...locale,
            translatedName: this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode)
          }));
          this.addLocaleControls();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.addLocaleControls();
        }
      });
  }

  private addLocaleControls(): void {
    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      // Using 'name' for subject and 'description' for body to match LocalizedFieldDTO
      this.emailForm.addControl(`name${suffix}`, this.fb.control('', Validators.required));
      this.emailForm.addControl(`description${suffix}`, this.fb.control('', Validators.required));
    });
  }

  onEmailTypeChange(): void {
    const selectedEmailType = this.emailForm.get('emailType')?.value;
    if (selectedEmailType) {
      this.loadEmailData(selectedEmailType);
    } else {
      this.clearFormData();
    }
  }

  private loadEmailData(emailType: EmailObjectsEnum): void {
    const request: EmailGetOrDeleteEvent = {
      objectType: emailType
    };

    this.emailService.getEmail(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ResponseEmailDTO) => {
          this.loadedEmail = response;
          this.patchFormWithEmailData(response);
          this.lastLoaded = new Date().toLocaleString();
        },
        error: (error) => {
          console.error('Error loading email data:', error);
          // If no existing data found, clear the form for new entry
          this.clearFormData();
          this.loadedEmail = null;
          this.snackBar.open('No existing email template found. Creating new one.', 'Close', {
            duration: 3000,
            panelClass: ['info-snackbar']
          });
        }
      });
  }

  private patchFormWithEmailData(responseEmailDTO: ResponseEmailDTO): void {
    const formValues: any = {};

    this.usedLocales.forEach(locale => {
      const localeKey = `${locale.languageCode}_${locale.regionCode}`;
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;

      // Safely access the localized data for this locale
      const localizedData = responseEmailDTO.localizedFields?.[localeKey];

      if (localizedData) {
        // If data exists for this locale, use it
        formValues[`name${suffix}`] = localizedData.name || '';
        formValues[`description${suffix}`] = localizedData.description || '';
      } else {
        // If no data exists for this locale, clear the fields
        formValues[`name${suffix}`] = '';
        formValues[`description${suffix}`] = '';
      }
    });

    console.log('Patching form with values:', formValues);
    console.log('Response data:', responseEmailDTO);

    // Patch all form values at once
    this.emailForm.patchValue(formValues);
    this.emailForm.markAsPristine();
  }

  private clearFormData(): void {
    const formValues: any = {};

    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      formValues[`name${suffix}`] = '';
      formValues[`description${suffix}`] = '';
    });

    this.emailForm.patchValue(formValues);
    this.loadedEmail = null;
    this.lastLoaded = null;
  }

  onPreviewToggle(): void {
    this.showPreview = this.emailForm.get('showPreview')?.value;
  }

  onSave(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;
    const emailType = this.emailForm.get('emailType')?.value;

    // Build localizedFields map using LocalizedFieldDTO
    const localizedFields: { [key: string]: LocalizedFieldDTO } = {};
    this.usedLocales.forEach(locale => {
      const localeKey = `${locale.languageCode}_${locale.regionCode}`;
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;

      const nameValue = this.emailForm.get(`name${suffix}`)?.value;
      const descriptionValue = this.emailForm.get(`description${suffix}`)?.value;

      // Create LocalizedFieldDTO with required name field
      localizedFields[localeKey] = {
        name: nameValue || '', // Ensure name is never null/undefined
        description: descriptionValue
        // url is optional and not used for emails
      };
    });

    const emailDTO: EmailDTO = {
      emailType: emailType,
      localizedFields: localizedFields
    };

    console.log('Saving email data:', emailDTO);

    this.emailService.createOrUpdateEmailAdmin(emailDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Email template saved successfully!', 'Close', {duration: 3000});
    this.emailForm.markAsPristine();

    // Reload the data to show the updated version
    const currentEmailType = this.emailForm.get('emailType')?.value;
    if (currentEmailType) {
      this.loadEmailData(currentEmailType);
    }
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Save failed:', err);
    this.snackBar.open('Failed to save email template', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  openCancelDialog(): void {
    if (this.emailForm?.dirty) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'COMMON.CANCEL_CONFIRM_TITLE',
          message: 'COMMON.CANCEL_CONFIRM_MESSAGE',
          warn: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.router.navigate(['/admin/configuration']);
      });
    } else {
      this.router.navigate(['/admin/configuration']);
    }
  }
}
