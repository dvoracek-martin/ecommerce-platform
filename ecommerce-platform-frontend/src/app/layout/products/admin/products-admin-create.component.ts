import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
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
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  get mediaControls(): FormArray {
    return this.productForm.get('media') as FormArray;
  }

  get allergensControls(): FormArray {
    return this.productForm.get('allergens') as FormArray;
  }

  get allergenFormControls(): FormControl[] {
    return this.allergensControls.controls as FormControl[];
  }

  get tagsControls(): FormArray {
    return this.productForm.get('tagDTOS') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.productForm.get('tagIds') as FormControl;
  }

  // --- Media Handling ---

  ngOnInit() {
    this.initForm();
    this.loadCategories();
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      priority: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      active: [false],
      weightGrams: [0],
      tagIds: [[]],
      media: this.fb.array([])
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.snackBar.open('Error loading categories', 'Close', {duration: 3000, panelClass: ['error-snackbar']});
        }
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

  // --- Allergens Handling ---

  removeMedia(index: number): void {
    this.mediaControls.removeAt(index);
  }

  dropMedia(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  addAllergen(): void {
    this.allergensControls.push(this.fb.control('', Validators.required));
  }

  removeAllergen(index: number): void {
    this.allergensControls.removeAt(index);
  }

  // --- Tags Handling ---

  onSave(): void {
    if (this.productForm.invalid) {
      // Mark all form controls as touched to display validation errors
      this.productForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;
    const payload: CreateProductDTO = this.productForm.value;

    this.productService.createProduct([payload])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  openCancelDialog(): void {
    if (this.productForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) {
          this.router.navigate(['/admin/categories']);
        }
      });
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  // --- Form Submission ---

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => this.allTags = tags,
        error: _ => this.snackBar.open('Error loading tags', 'Close', {duration: 3000, panelClass: ['error-snackbar']})
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

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Product created successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/products']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create product', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }
}
