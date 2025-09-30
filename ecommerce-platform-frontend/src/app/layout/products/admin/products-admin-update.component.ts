import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';

import {ProductService} from '../../../services/product.service';
import {CategoryService} from '../../../services/category.service';
import {TagService} from '../../../services/tag.service';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';

import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {ConfigurationService} from '../../../services/configuration.service';
import {LocaleMapperService} from '../../../services/locale-mapper.service';
import {LocalizedFieldDTO} from '../../../dto/base/localized-field-dto';
import {CreateProductDTO} from '../../../dto/product/create-product-dto';
import {MediaDTO} from '../../../dto/media/media-dto';
import {UpdateProductDTO} from '../../../dto/product/update-product-dto';

@Component({
  selector: 'app-products-admin-update',
  templateUrl: './products-admin-update.component.html',
  standalone: false,
  styleUrls: ['./products-admin-update.component.scss']
})
export class ProductsAdminUpdateComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  saving = false;

  categories: ResponseCategoryDTO[] = [];
  allTags: ResponseTagDTO[] = [];
  usedLocales: ResponseLocaleDto[] = [];
  private productId!: number;
  private initialMediaKeys: string[] = [];
  private readonly destroy$ = new Subject<void>();
  formInitialized = false;
  private product: ResponseProductDTO;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
  }

  get mediaControls(): FormArray {
    return this.productForm?.get('media') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.productForm?.get('tagIds') as FormControl;
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productId = +params['id'];
      this.initTabs();
    });
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
          this.loadCategories();
          this.loadProduct();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.initForm();
          this.loadTags();
          this.loadCategories();
          this.loadProduct();
        }
      });
  }

  onFileSelected(event: Event): void {
    if (!this.productForm) return;

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.mediaControls.push(this.fb.group({
          base64Data: [base64],
          objectKey: [`${Date.now()}_${file.name}`],
          contentType: [file.type],
          preview: [reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
    this.productForm.markAsDirty();
  }

  removeMedia(i: number) {
    this.mediaControls.removeAt(i);
    this.productForm.markAsDirty();
  }

  dropMedia(e: CdkDragDrop<any[]>) {
    if (!this.productForm) return;

    moveItemInArray(this.mediaControls.controls, e.previousIndex, e.currentIndex);
    this.productForm.markAsDirty();
  }

  openMediaDeleteDialog(i: number) {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Media', message: 'Delete this media?', warn: true}
    });
    ref.afterClosed().subscribe(ok => ok && this.removeMedia(i));
  }

  openDeleteDialog(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Category', message: 'Permanently delete?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) this.productService.deleteProduct(this.productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.snackBar.open('Category deleted successfully.', 'Close', {duration: 3000});
          this.router.navigate(['/admin/categories']);
        });
    });
  }

  onSave(): void {
    if (!this.productForm || this.productForm.invalid) {
      this.productForm?.markAllAsTouched();
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
        name: this.productForm.get(`name${suffix}`)?.value,
        description: this.productForm.get(`description${suffix}`)?.value,
        url: this.productForm.get(`url${suffix}`)?.value
      };
    });

    // Build main payload
    const updateProductDTO: UpdateProductDTO = {
      localizedFields: localizedFields,
      id: this.productId,
      priority: this.productForm.get('priority')?.value,
      active: this.productForm.get('active')?.value,
      media: this.productForm.get('media')?.value as MediaDTO[],
      tagIds: this.productForm.get('tagIds')?.value,
      mixable: this.productForm.get('mixable')?.value,
      displayInProducts: this.productForm.get('displayInProducts')?.value,
      price: this.productForm.get('price')?.value,
      weightGrams: this.productForm.get('weightGrams')?.value,
      categoryId: this.productForm.get('categoryId')?.value,
      translatedName: null,
      translatedDescription: null,
      translatedUrl: null
    };

    this.productService.updateProduct(updateProductDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  cancel(): void {
    if (this.productForm?.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) this.router.navigate(['/admin/products']);
      });
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  // Renamed to match the category component
  openCancelDialog(): void {
    if (this.productForm?.dirty) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'COMMON.CANCEL_CONFIRM_TITLE',
          message: 'COMMON.CANCEL_CONFIRM_MESSAGE',
          warn: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.router.navigate(['/admin/products']);
      });
    } else {
      this.router.navigate(['/admin/products']);
    }
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

  private translateCategories() {
    this.categories.forEach(category => {
      category.translatedName = this.categoryService.getLocalizedName(category);
      category.translatedDescription = this.categoryService.getLocalizedDescription(category);
      category. translatedUrl = this.categoryService.getLocalizedUrl(category);
    });
  }

  private loadTags(): void {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => {
          this.allTags = tags;
          this.translateTags();
        },
        error: () => this.snackBar.open('Error loading tags', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        })
      });
  }

  private loadProduct(): void {
    this.productService.getProductByIdAdmin(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: p => this.patchForm(p),
        error: () => {
          this.snackBar.open('Error loading product', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/admin/products']);
        }
      });
  }

  private patchForm(responseProductDTO: ResponseProductDTO): void {
    if (!this.productForm) return;

    // Set non-localized fields
    this.productForm.patchValue({
      price: responseProductDTO.price,
      weightGrams: responseProductDTO.weightGrams,
      categoryId: responseProductDTO.categoryId,
      priority: responseProductDTO.priority,
      active: responseProductDTO.active,
      mixable: responseProductDTO.mixable,
      displayInProducts: responseProductDTO.displayInProducts
    });

    // Set localized fields
    this.usedLocales.forEach(locale => {
      const localeKey = `${locale.languageCode}_${locale.regionCode}`;
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;

      const localizedData = responseProductDTO.localizedFields?.[localeKey] || {};

      this.productForm.patchValue({
        [`name${suffix}`]: localizedData['name'] || '',
        [`description${suffix}`]: localizedData['description'] || '',
        [`url${suffix}`]: localizedData['url'] || '',
      });
    });

    // Tags
    const existingTagIds = responseProductDTO.responseTagDTOS.map(t => t.id);
    this.tagIdsControl.setValue(existingTagIds);

    // Media
    responseProductDTO.media.forEach(media => {
      this.mediaControls.push(this.fb.group({
        base64Data: [media.base64Data],
        objectKey: [media.objectKey],
        contentType: [media.contentType],
        preview: [`data:${media.contentType};base64,${media.base64Data}`]
      }));
      this.initialMediaKeys.push(media.objectKey);
    });

    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Product updated successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/products']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to update product', 'Close', {duration: 5000});
  }

  private translateTags() {
    this.allTags.forEach(tag => {
      tag.translatedName = this.tagService.getLocalizedName(tag);
      tag.translatedDescription = this.tagService.getLocalizedDescription(tag);
      tag.translatedUrl = this.tagService.getLocalizedUrl(tag);
    });
  }
}
