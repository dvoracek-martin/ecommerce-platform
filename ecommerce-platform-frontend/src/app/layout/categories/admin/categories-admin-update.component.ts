import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';

import {CategoryService} from '../../../services/category.service';
import {TagService} from '../../../services/tag.service';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {UpdateCategoryDTO} from '../../../dto/category/update-category-dto';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {ConfigurationService} from '../../../services/configuration.service';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {LocaleMapperService} from '../../../services/locale-mapper.service';
import {LocalizedFieldDTO} from '../../../dto/base/localized-field-dto';

@Component({
  selector: 'app-categories-admin-update',
  templateUrl: './categories-admin-update.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-update.component.scss']
})
export class CategoriesAdminUpdateComponent implements OnInit, OnDestroy {
  categoryForm!: FormGroup;
  saving = false;
  allTags: ResponseTagDTO[] = [];
  usedLocales: ResponseLocaleDto[] = [];
  private categoryId!: number;
  private readonly destroy$ = new Subject<void>();
  formInitialized = false;
  private category: ResponseCategoryDTO;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private tagService: TagService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
  }

  get mediaControls(): FormArray {
    return this.categoryForm?.get('media') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.categoryForm?.get('tagIds') as FormControl;
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.categoryId = +params['id'];
      this.initTabs();
    });
  }

  ngOnDestroy() {
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
          this.loadTags();
          this.loadCategory();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.initForm();
          this.loadTags();
          this.loadCategory();
        }
      });
  }

  onFileSelected(event: Event): void {
    if (!this.categoryForm) return;

    const input = event.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.mediaControls.push(this.fb.group({
          base64Data: [base64],
          objectKey: [`${this.categoryId}_${Date.now()}_${file.name}`],
          contentType: [file.type],
          preview: [reader.result]
        }));
        this.categoryForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    });
  }

  openMediaDeleteDialog(i: number) {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Media', message: 'Delete this media?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this.mediaControls.removeAt(i);
        this.categoryForm.markAsDirty();
      }
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (!this.categoryForm) return;

    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
    this.categoryForm.markAsDirty();
  }

  onSave() {
    if (!this.categoryForm || this.categoryForm.invalid) {
      this.categoryForm?.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;

    // Build localizedFields map according to backend
    const localizedFields: Record<string, LocalizedFieldDTO> = {};
    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      localizedFields[`${locale.languageCode}_${locale.regionCode}`] = {
        name: this.categoryForm.get(`name${suffix}`)?.value,
        description: this.categoryForm.get(`description${suffix}`)?.value,
        url: this.categoryForm.get(`url${suffix}`)?.value
      };
    });

    const mediaPayload = this.mediaControls.controls.map(ctrl => {
      const value = ctrl.value;
      const mediaItem: any = {
        objectKey: value.objectKey,
        contentType: value.contentType
      };
      if (value.base64Data) {
        mediaItem.base64Data = value.base64Data; // jen nové soubory
      }
      return mediaItem;
    });

    // Build main payload
    const payload: UpdateCategoryDTO = {
      id: this.categoryId,
      localizedFields: localizedFields,
      priority: this.categoryForm.get('priority')?.value,
      active: this.categoryForm.get('active')?.value,
      mixable: this.categoryForm.get('mixable')?.value,
      media: mediaPayload,
      tagIds: this.categoryForm.get('tagIds')?.value,
      translatedName: null,
      translatedDescription: null,
      translatedUrl: null
    };

    this.categoryService.updateCategory(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: err => this.handleSaveError(err)
      });
  }

  openDeleteDialog() {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Category', message: 'Permanently delete?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) this.categoryService.deleteCategory(this.categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.snackBar.open('Category deleted successfully.', 'Close', {duration: 3000});
          this.router.navigate(['/admin/categories']);
        });
    });
  }

  openCancelDialog(): void {
    if (this.categoryForm?.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) {
          this.router.navigate(['/admin/categories']);
        }
      });
    } else {
      this.router.navigate(['/admin/categories']);
    }
  }

  private initForm(): void {
    const formConfig: any = {
      priority: ['0', [Validators.required, Validators.min(0)]],
      active: [false],
      mixable: [false],
      tagIds: [[]],
      media: this.fb.array([]),
    };

    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      formConfig[`name${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
      formConfig[`description${suffix}`] = [''];
      formConfig[`url${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
    });

    this.categoryForm = this.fb.group(formConfig);
    this.formInitialized = true; // Set flag when form is ready
  }

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => {
          this.allTags = tags;
          this.translateTags();
        },
        error: () => this.snackBar.open('Error loading tags', 'Close', {duration: 3000, panelClass: ['error-snackbar']})
      });
  }

  private loadCategory() {
    this.categoryService.getCategoryById(this.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => {
          this.patchForm(c)
          this.category = c;
        },
        error: () => {
          this.snackBar.open('Error loading category', 'Close', {duration: 3000, panelClass: ['error-snackbar']});
          this.router.navigate(['/admin/categories']);
        }
      });
  }

  private patchForm(responseCategoryDTO: ResponseCategoryDTO) {
    if (!this.categoryForm) return;

    // Set non-localized fields
    this.categoryForm.patchValue({
      priority: responseCategoryDTO.priority,
      active: responseCategoryDTO.active,
      mixable: responseCategoryDTO.mixable,
    });

    // Set localized fields
    this.usedLocales.forEach(locale => {
      const localeKey = `${locale.languageCode}_${locale.regionCode}`;
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;

      const localizedData = responseCategoryDTO.localizedFields?.[localeKey] || {};

      this.categoryForm.patchValue({
        [`name${suffix}`]: localizedData['name'] || '',
        [`description${suffix}`]: localizedData['description'] || '',
        [`url${suffix}`]: localizedData['url'] || '',
      });
    });

    // Set tag IDs
    const existingIds = responseCategoryDTO.responseTagDTOS.map(t => t.id);
    this.tagIdsControl.setValue(existingIds);

    // Set media
    this.mediaControls.clear();
    (responseCategoryDTO.media || []).forEach(m => {
      this.mediaControls.push(this.fb.group({
        objectKey: [m.objectKey],
        contentType: [m.contentType],
        preview: [`data:${m.contentType};base64,${m.base64Data || ''}`],
        base64Data: [m.base64Data || null] // existující soubory mohou mít null
      }));
    });

    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.categoryForm.markAsPristine(); // Reset state after a successful save
    this.snackBar.open('Category updated!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/categories']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Update failed', err);
    this.snackBar.open('Failed to update category', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }

  private translateTags() {
    this.allTags.forEach(tags => {
      tags.translatedName = this.tagService.getLocalizedName(tags);
      tags.translatedDescription = this.tagService.getLocalizedDescription(tags);
      tags.translatedUrl = this.tagService.getLocalizedUrl(tags);
    });
  }
}
