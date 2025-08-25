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
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog.component';

import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {HttpErrorResponse} from '@angular/common/http';
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

  private productId!: number;
  private initialMediaKeys: string[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  // getters for FormArrays
  get allergensControls(): FormArray {
    return this.productForm.get('allergens') as FormArray;
  }

  get allergenFormControls(): FormControl[] {
    return this.allergensControls.controls as FormControl[];
  }

  get mediaControls(): FormArray {
    return this.productForm.get('media') as FormArray;
  }

  // convenience getter for tagIds:
  get tagIdsControl(): FormControl {
    return this.productForm.get('tagIds') as FormControl;
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productId = +params['id'];
      this.initForm();
      this.loadCategories();
      this.loadTags();
      this.loadProduct();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- form-array media handlers ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      return;
    }

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

    // Reset the file input to allow re-uploading the same file
    input.value = '';

    // Mark the form as dirty after adding new media items
    this.productForm.markAsDirty();
  }

  removeMedia(i: number) {
    this.mediaControls.removeAt(i);
    // Mark the form as dirty after removing a media item
    this.productForm.markAsDirty();
  }

  dropMedia(e: CdkDragDrop<any[]>) {
    moveItemInArray(this.mediaControls.controls, e.previousIndex, e.currentIndex);
    // Mark the form as dirty after reordering media items
    this.productForm.markAsDirty();
  }

  openMediaDeleteDialog(i: number) {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Media', message: 'Delete this media?', warn: true}
    });
    ref.afterClosed().subscribe(ok => ok && this.removeMedia(i));
  }

  // --- allergens handlers ---
  addAllergen() {
    this.allergensControls.push(this.fb.control('', Validators.required));
  }

  removeAllergen(i: number) {
    this.allergensControls.removeAt(i);
  }

  // --- delete product ---
  openDeleteDialog(): void {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'This will permanently delete the product and all its contents.',
        warn: true
      }
    });
    ref.afterClosed().subscribe(ok => ok && this.deleteProduct());
  }

  // --- submit form ---
  onSave(): void {
    if (this.productForm.invalid) return;
    this.saving = true;

    // compute mediaToDelete
    const currentKeys = this.mediaControls.controls.map(c => c.value.objectKey).filter(k => !!k);
    const mediaToDelete = this.initialMediaKeys.filter(k => !currentKeys.includes(k));

    const payload: UpdateProductDTO = {
      id: this.productId,
      ...this.productForm.value,
      mediaToDelete: mediaToDelete
    };

    this.productService.updateProduct(this.productId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Product updated!', 'Close', {duration: 3000});
          this.router.navigate(['/admin/products']);
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          const msg = err.error?.message || err.message || 'An error occurred';
          this.snackBar.open(`Update failed: ${msg}`, 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }

  cancel(): void {
    if (this.productForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) {
          this.router.navigate(['/admin/products']);
        }
      });
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      price: [null, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      scentProfile: [null],
      botanicalName: [null],
      extractionMethod: [null],
      origin: [null],
      usageInstructions: [null],
      volumeMl: [null],
      warnings: [null],
      medicinalUse: [null],
      weightGrams: [null],
      allergens: this.fb.array([]),
      tagIds: [[]],
      media: this.fb.array([])
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: cats => this.categories = cats,
        error: () => this.snackBar.open('Error loading categories', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        })
      });
  }

  private loadTags(): void {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => this.allTags = tags,
        error: () => this.snackBar.open('Error loading tags', 'Close', {duration: 3000, panelClass: ['error-snackbar']})
      });
  }

  private loadProduct(): void {
    this.productService.getProductByIdAdmin(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: p => this.patchForm(p),
        error: () => {
          this.snackBar.open('Error loading product', 'Close', {duration: 3000, panelClass: ['error-snackbar']});
          this.router.navigate(['/admin/products']);
        }
      });
  }

  private patchForm(p: ResponseProductDTO): void {
    // patch simple fields, including categoryId and price
    this.productForm.patchValue({
      name: p.name,
      description: p.description,
      price: p.price,
      weightGrams: p.weightGrams,
      categoryId: p.categoryId
    });

    // media
    p.media.forEach(m => {
      this.mediaControls.push(this.fb.group({
        base64Data: [m.base64Data],
        objectKey: [m.objectKey],
        contentType: [m.contentType],
        preview: [`data:${m.contentType};base64,${m.base64Data}`]
      }));
      this.initialMediaKeys.push(m.objectKey);
    });

    // tags
    const existingTagIds = p.responseTagDTOS.map(t => t.id);
    this.tagIdsControl.setValue(existingTagIds);
  }

  private deleteProduct() {
    this.productService.deleteProduct(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.router.navigate(['/admin/products']),
        err => console.error('Delete failed', err));
  }
}
