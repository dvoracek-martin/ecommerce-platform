import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';

import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { UpdateProductDTO } from '../../../dto/product/update-product-dto';
import { ResponseCategoryDTO } from '../../../dto/category/response-category-dto';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse

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
  private productId!: number;
  private readonly destroy$ = new Subject<void>();
  private initialMediaObjectKeys: string[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      this.initForm();
      this.loadCategories();
      this.loadProduct();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  openDeleteDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'This will permanently delete the product and all its contents.',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.deleteProduct();
    });
  }

  private deleteProduct(): void {
    this.productService.deleteProduct(this.productId).subscribe({
      next: () => this.router.navigate(['/admin/products']),
      error: (err) => console.error('Delete failed:', err)
    });
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
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
      tagDTOS: this.fb.array([]),
      uploadMediaDTOs: this.fb.array([])
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: cats => this.categories = cats,
        error: () => this.snackBar.open('Error loading categories', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      });
  }

  private loadProduct(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getProductById(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: p => this.patchForm(p),
        error: () => {
          this.snackBar.open('Error loading product', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
          this.router.navigate(['/admin/products']);
        }
      });
  }

  private patchForm(p: ResponseProductDTO): void {
    this.productForm.patchValue({
      name: p.name,
      description: p.description,
      price: p.price,
      categoryId: p.categoryId,
      scentProfile: p.scentProfile,
      botanicalName: p.botanicalName,
      extractionMethod: p.extractionMethod,
      origin: p.origin,
      usageInstructions: p.usageInstructions,
      volumeMl: p.volumeMl,
      warnings: p.warnings,
      medicinalUse: p.medicinalUse,
      weightGrams: p.weightGrams
    });

    // Allergens
    p.allergens.forEach(a => this.allergensControls.push(this.fb.control(a)));

    // Tags
    p.tagsDTOs.forEach(tag =>
      this.tagsControls.push(this.fb.group({
        id: [tag.id],
        name: [tag.name, Validators.required],
        description: [tag.description],
        color: [tag.color],
        icon: [tag.icon],
        imageUrl: [tag.imageUrl]
      }))
    );

    // Media
    p.responseMediaDTOs.forEach(media => {
      this.mediaControls.push(this.fb.group({
        base64Data: [media.base64Data],
        objectKey: [media.objectKey],
        contentType: [media.contentType],
        preview: [`data:${media.contentType};base64,${media.base64Data}`]
      }));
      this.initialMediaObjectKeys.push(media.objectKey); // Track initial media
    });
  }

  // --- FormArray getters ---
  get allergensControls(): FormArray {
    return this.productForm.get('allergens') as FormArray;
  }
  get allergenFormControls(): FormControl[] {
    return this.allergensControls.controls as FormControl[];
  }

  get tagsControls(): FormArray {
    return this.productForm.get('tagDTOS') as FormArray;
  }

  get mediaControls(): FormArray {
    return this.productForm.get('uploadMediaDTOs') as FormArray;
  }

  // --- Allergens ---
  addAllergen(): void {
    this.allergensControls.push(this.fb.control('', Validators.required));
  }
  removeAllergen(i: number): void {
    this.allergensControls.removeAt(i);
  }

  // --- Tags ---
  addTag(): void {
    this.tagsControls.push(this.fb.group({
      name: ['', Validators.required],
      description: [''],
      color: [''],
      icon: [''],
      imageUrl: ['']
    }));
  }
  removeTag(i: number): void {
    this.tagsControls.removeAt(i);
  }
  dropTag(e: CdkDragDrop<any[]>): void {
    moveItemInArray(this.tagsControls.controls, e.previousIndex, e.currentIndex);
  }

  // --- Media ---
  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.mediaControls.push(this.fb.group({
          base64Data: [base64],
          objectKey: [`products/${Date.now()}_${file.name}`],
          contentType: [file.type],
          preview: [reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  removeMedia(i: number): void {
    this.mediaControls.removeAt(i);
  }

  dropMedia(e: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, e.previousIndex, e.currentIndex);
  }

  openMediaDeleteDialog(i: number): void {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Delete Media', message: 'Delete this media?', warn: true }
    });
    ref.afterClosed().subscribe(ok => ok && this.removeMedia(i));
  }

  // --- Submit ---
  onSave(): void {
    if (this.productForm.invalid) return;
    this.saving = true;

    const currentMediaObjectKeys = this.mediaControls.controls.map(control => control.value.objectKey).filter(key => !!key);
    const mediaToDelete = this.initialMediaObjectKeys.filter(key => !currentMediaObjectKeys.includes(key));

    const payload: UpdateProductDTO = {
      id: this.productId,
      ...this.productForm.value,
      mediaToDelete: mediaToDelete // Add the list of media to delete to the payload
    };

    this.productService.updateProduct(this.productId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (error) => this.handleSaveError(error)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Product updated!', 'Close', { duration: 3000 });
    this.router.navigate(['/admin/products']);
  }

  private handleSaveError(error: any): void {
    this.saving = false;
    console.error('Update failed:', error);

    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof HttpErrorResponse) {
      errorMessage = `Update failed: ${error.error?.message || error.message || 'Something went wrong.'}`;
    } else {
      errorMessage = `Update failed: ${error.message || 'An unexpected client-side error occurred.'}`;
    }

    this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }
}
