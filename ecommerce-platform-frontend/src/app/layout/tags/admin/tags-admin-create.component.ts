import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TagService} from '../../../services/tag.service';
import {CreateTagDTO} from '../../../dto/tag/create-tag-dto';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {Subject, takeUntil} from 'rxjs';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {ConfigurationService} from '../../../services/configuration.service';
import {LocaleMapperService} from '../../../services/locale-mapper.service';
import {LocalizedFieldDTO} from '../../../dto/base/localized-field-dto';
import {CreateProductDTO} from '../../../dto/product/create-product-dto';
import {MediaDTO} from '../../../dto/media/media-dto';

@Component({
  selector: 'app-tags-admin-create',
  templateUrl: './tags-admin-create.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-create.component.scss']
})
export class TagsAdminCreateComponent implements OnInit, OnDestroy {
  tagForm!: FormGroup;
  saving = false;
  private readonly destroy$ = new Subject<void>();
  usedLocales: ResponseLocaleDto[] = [];

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
  }

  ngOnInit(): void {
    this.initTabs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initTabs() {
    this.configService.getLastAppSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.usedLocales = settings.usedLocales.map(locale => ({
            ...locale,
            translatedName: this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode)
          }));
          this.initForm();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.initForm();
        }
      });
  }


  onSave(): void {
    if (!this.tagForm || this.tagForm.invalid) {
      this.tagForm?.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {duration: 5000});
      return;
    }

    this.saving = true;

    // Build localizedFields map according to backend
    const localizedFields: Record<string, LocalizedFieldDTO> = {};
    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      localizedFields[`${locale.languageCode}_${locale.regionCode}`] = {
        name: this.tagForm.get(`name${suffix}`)?.value,
        description: this.tagForm.get(`description${suffix}`)?.value,
        url: this.tagForm.get(`url${suffix}`)?.value
      };
    });

    // Build main payload
    const tag: CreateTagDTO = {
      localizedFields: localizedFields,
      priority: this.tagForm.get('priority')?.value,
      active: this.tagForm.get('active')?.value,
      media: this.tagForm.get('media')?.value as MediaDTO[],
    };

    this.tagService.createTag(tag)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  openCancelDialog(): void {
    if (this.tagForm.dirty) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'COMMON.CANCEL_CONFIRM_TITLE',
          message: 'COMMON.CANCEL_CONFIRM_MESSAGE',
          warn: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.router.navigate(['/admin/tags']);
      });
    } else {
      this.router.navigate(['/admin/tags']);
    }
  }

  private initForm(): void {
    const formConfig: any = {
      active: [false],
      media: this.fb.array([]),
      priority: ['0', [Validators.required, Validators.min(0)]],
    };

    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      formConfig[`name${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
      formConfig[`description${suffix}`] = [''];
      formConfig[`url${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
    });
    this.tagForm = this.fb.group(formConfig);
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Tag created successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/tags']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create tag', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }
}
