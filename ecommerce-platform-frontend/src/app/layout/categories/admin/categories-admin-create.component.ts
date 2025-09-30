// src/app/components/categories-admin-create/categories-admin-create.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../services/category.service';
import { TagService } from '../../../services/tag.service';
import { CreateCategoryDTO } from '../../../dto/category/create-category-dto';
import { ResponseTagDTO } from '../../../dto/tag/response-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { ConfigurationService } from '../../../services/configuration.service';
import { ResponseLocaleDto } from '../../../dto/configuration/response-locale-dto';
import { LocaleMapperService } from '../../../services/locale-mapper.service';
import { MediaDTO } from '../../../dto/media/media-dto';
import { LocalizedFieldDTO } from '../../../dto/base/localized-field-dto';

@Component({
  selector: 'app-categories-admin-create',
  templateUrl: './categories-admin-create.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-create.component.scss']
})
export class CategoriesAdminCreateComponent implements OnInit, OnDestroy {
  categoryForm!: FormGroup;
  saving = false;
  allTags: ResponseTagDTO[] = [];
  private readonly destroy$ = new Subject<void>();
  usedLocales: ResponseLocaleDto[] = [];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {}

  get mediaControls(): FormArray {
    return this.categoryForm.get('media') as FormArray;
  }

  ngOnInit() {
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
          this.loadTags();
        },
        error: () => {
          this.usedLocales = [{ languageCode: 'en', regionCode: 'US', translatedName: 'English' }];
          this.initForm();
          this.loadTags();
        }
      });
  }

  private initForm(): void {
    const formConfig: any = {
      priority: [0, [Validators.required, Validators.min(0)]],
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
  }

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => {
          this.allTags = tags
          this.translateTags();
        },
        error: () => this.snackBar.open('Error loading tags', 'Close', { duration: 3000 })
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.mediaControls.push(this.createMediaGroup(reader, file));
      reader.readAsDataURL(file);
    });
  }

  private createMediaGroup(reader: FileReader, file: File): FormGroup {
    const base64 = (reader.result as string).split(',')[1];
    return this.fb.group({
      base64Data: [base64],
      objectKey: [`${Date.now()}_${file.name}`],
      contentType: [file.type],
      preview: [reader.result]
    });
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  openMediaDeleteDialog(i: number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Delete Media', message: 'Really delete this media?', warn: true }
    }).afterClosed().subscribe(ok => {
      if (ok) this.mediaControls.removeAt(i);
    });
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', { duration: 5000 });
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

    // Build main payload
    const category: CreateCategoryDTO = {
      localizedFields: localizedFields,
      priority: this.categoryForm.get('priority')?.value,
      active: this.categoryForm.get('active')?.value,
      media: this.categoryForm.get('media')?.value as MediaDTO[],
      tagIds: this.categoryForm.get('tagIds')?.value.map((t: ResponseTagDTO) => t.id),
      mixable: this.categoryForm.get('mixable')?.value,
    };

    this.categoryService.createCategory(category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: err => this.handleSaveError(err)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Category created successfully!', 'Close', { duration: 3000 });
    this.router.navigate(['/admin/categories']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create category', 'Close', { duration: 5000 });
  }

  openCancelDialog(): void {
    if (this.categoryForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: { title: 'Cancel Update', message: 'Discard changes?', warn: true }
      }).afterClosed().subscribe(ok => {
        if (ok) this.router.navigate(['/admin/categories']);
      });
    } else {
      this.router.navigate(['/admin/categories']);
    }
  }

  private translateTags() {
    this.allTags.forEach(tags => {
      tags.translatedName = this.tagService.getLocalizedName(tags);
      tags.translatedDescription = this.tagService.getLocalizedDescription(tags);
      tags.translatedUrl = this.tagService.getLocalizedUrl(tags);
    });
  }
}
