import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProductService} from '../../../services/product.service';
import {CategoryService} from '../../../services/category.service';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {CreateProductDTO} from '../../../dto/product/create-product-dto';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {Subject, takeUntil} from 'rxjs';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {TagService} from '../../../services/tag.service';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {ConfigurationService} from '../../../services/configuration.service';
import {LocaleMapperService} from '../../../services/locale-mapper.service';
import {LocalizedFieldDTO} from '../../../dto/base/localized-field-dto';
import {MediaDTO} from '../../../dto/media/media-dto';

@Component({
  selector: 'app-products-admin-create',
  templateUrl: './products-admin-create.component.html',
  standalone: false,
  styleUrls: ['./products-admin-create.component.scss']
})
export class ProductsAdminCreateComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  saving = false;
  categories: ResponseCategoryDTO[] = [];
  allTags: ResponseTagDTO[] = [];
  usedLocales: ResponseLocaleDto[] = [];
  private readonly destroy$ = new Subject<void>();

  // Track manual URL changes
  private manualUrlChanges: Set<string> = new Set();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {}

  get mediaControls(): FormArray {
    return this.productForm?.get('media') as FormArray;
  }

  ngOnInit() {
    this.initTabs();
    this.loadCategories();
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
          this.setupNameUrlSync();
          this.loadTags();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.initForm();
          this.setupNameUrlSync();
          this.loadTags();
        }
      });
  }

  private setupNameUrlSync(): void {
    this.usedLocales.forEach(locale => {
      const nameControl = this.productForm.get(`name_${locale.languageCode}_${locale.regionCode}`);
      const urlControl = this.productForm.get(`url_${locale.languageCode}_${locale.regionCode}`);

      if (nameControl && urlControl) {
        nameControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(name => {
          const localeKey = `${locale.languageCode}_${locale.regionCode}`;

          if (!this.manualUrlChanges.has(localeKey) && name && name.trim()) {
            const normalizedUrl = this.normalizeName(name);
            urlControl.setValue(normalizedUrl, {emitEvent: false});
          }
        });

        urlControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(url => {
          const localeKey = `${locale.languageCode}_${locale.regionCode}`;
          if (url && url.trim()) {
            this.manualUrlChanges.add(localeKey);
          }
        });
      }
    });
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  private initForm(): void {
    const formConfig: any = {
      price: [0, [Validators.required, Validators.min(0)]],
      priority: ['0', [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      active: [false],
      weightGrams: [0, [Validators.min(0.01)]],
      tagIds: [[]],
      media: this.fb.array([]),
      mixable: [false],
      displayInProducts: [false],
    };

    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      formConfig[`name${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
      formConfig[`description${suffix}`] = [''];
      formConfig[`url${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
    });

    this.productForm = this.fb.group(formConfig);
  }

  private loadCategories(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.translateCategories();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.snackBar.open('Error loading categories', 'Close', {duration: 3000, panelClass: ['error-snackbar']});
        }
      });
  }

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => {
          this.allTags = tags;
          this.translateTags();
        },
        error: _ => this.snackBar.open('Error loading tags', 'Close', {duration: 3000, panelClass: ['error-snackbar']})
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.handleFileUpload(reader, file);
      reader.readAsDataURL(file);
    });
  }

  private handleFileUpload(reader: FileReader, file: File): void {
    const base64 = (reader.result as string).split(',')[1];
    this.mediaControls.push(this.fb.group({
      base64Data: [base64],
      objectKey: [`${Date.now()}_${file.name}`],
      contentType: [file.type],
      preview: [reader.result]
    }));
  }

  openMediaDeleteDialog(index: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Media',
        message: 'Are you sure you want to delete this media item?',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.removeMedia(index);
    });
  }

  removeMedia(index: number): void {
    this.mediaControls.removeAt(index);
  }

  dropMedia(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  onSave(): void {
    if (!this.productForm || this.productForm.invalid) {
      this.productForm?.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {duration: 5000});
      return;
    }

    this.saving = true;

    // Build localizedFields map according to backend
    const localizedFields: Record<string, LocalizedFieldDTO> = {};
    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      localizedFields[`${locale.languageCode}_${locale.regionCode}`] = {
        name: this.productForm.get(`name${suffix}`)?.value,
        description: this.productForm.get(`description${suffix}`)?.value,
        url: this.productForm.get(`url${suffix}`)?.value
      };
    });

    // Build main payload
    const product: CreateProductDTO = {
      localizedFields: localizedFields,
      priority: this.productForm.get('priority')?.value,
      active: this.productForm.get('active')?.value,
      media: this.productForm.get('media')?.value as MediaDTO[],
      tagIds: this.productForm.get('tagIds')?.value,
      mixable: this.productForm.get('mixable')?.value,
      displayInProducts: this.productForm.get('displayInProducts')?.value,
      price: this.productForm.get('price')?.value,
      weightGrams: this.productForm.get('weightGrams')?.value,
      categoryId: this.productForm.get('categoryId')?.value,
    };

    this.productService.createProduct(product)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Product created successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/products']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create product', 'Close', {duration: 5000});
  }

  openCancelDialog(): void {
    if (this.productForm?.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Creation', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) {
          this.router.navigate(['/admin/products']);
        }
      });
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  private translateCategories() {
    this.categories.forEach(category => {
      category.translatedName = this.categoryService.getLocalizedName(category);
      category.translatedDescription = this.categoryService.getLocalizedDescription(category);
      category.translatedUrl = this.categoryService.getLocalizedUrl(category);
    });
  }

  private translateTags() {
    this.allTags.forEach(tag => {
      tag.translatedName = this.tagService.getLocalizedName(tag);
      tag.translatedDescription = this.tagService.getLocalizedDescription(tag);
      tag.translatedUrl = this.tagService.getLocalizedUrl(tag);
    });
  }
}
