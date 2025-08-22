import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { CreateProductDTO } from '../../../dto/product/create-product-dto';
import { ResponseCategoryDTO } from '../../../dto/category/response-category-dto';
import { Subject, takeUntil } from 'rxjs';
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
  private readonly destroy$ = new Subject<void>();
  allTags: ResponseTagDTO[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

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
      name: ['', Validators.required, Validators.minLength(3)],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      scentProfile: [null],
      botanicalName: [null],
      extractionMethod: [null],
      origin: [null],
      usageInstructions: [null],
      volumeMl: [null],
      warnings: [null],
      medicinalUse: [''],
      weightGrams: [null],
      allergens: this.fb.array([]),
      tagIds: [[]],
      uploadMediaDTOs: this.fb.array([])
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
          this.snackBar.open('Error loading categories', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
  }

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => this.allTags = tags,
        error: _ => this.snackBar.open('Error loading tags', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      });
  }

  // --- Media Handling ---

  get mediaControls(): FormArray {
    return this.productForm.get('uploadMediaDTOs') as FormArray;
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

  // --- Allergens Handling ---

  get allergensControls(): FormArray {
    return this.productForm.get('allergens') as FormArray;
  }

  get allergenFormControls(): FormControl[] {
    return this.allergensControls.controls as FormControl[];
  }

  addAllergen(): void {
    this.allergensControls.push(this.fb.control('', Validators.required));
  }

  removeAllergen(index: number): void {
    this.allergensControls.removeAt(index);
  }

  // --- Tags Handling ---

  get tagsControls(): FormArray {
    return this.productForm.get('tagDTOS') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.productForm.get('tagIds') as FormControl;
  }

  addTag(): void {
    this.tagsControls.push(this.fb.group({
      name: ['', Validators.required],
      description: [''],
      color: [''],
      icon: [''],
      imageUrl: ['']
    }));
  }

  removeTag(index: number): void {
    this.tagsControls.removeAt(index);
  }

  dropTag(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.tagsControls.controls, event.previousIndex, event.currentIndex);
  }

  // --- Form Submission ---

  onSave(): void {
    if (this.productForm.invalid) return;

    this.saving = true;
    const payload: CreateProductDTO = this.productForm.value;

    this.productService.createProduct([payload])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Product created successfully!', 'Close', { duration: 3000 });
    this.router.navigate(['/admin/products']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create product', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  openCancelDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Cancel Creation',
        message: 'Are you sure you want to discard changes and go back?',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.router.navigate(['/admin/products']);
    });
  }
}
