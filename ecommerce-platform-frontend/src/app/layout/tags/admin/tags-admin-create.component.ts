import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar
import { TagService } from '../../../services/tag.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { CreateTagDTO } from '../../../dto/tag/create-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { Subject, takeUntil } from 'rxjs'; // Import Subject and takeUntil

@Component({
  selector: 'app-tags-admin-create',
  templateUrl: './tags-admin-create.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-create.component.scss']
})
export class TagsAdminCreateComponent implements OnInit, OnDestroy { // Implement OnDestroy
  tagForm!: FormGroup;
  saving = false;
  allCategories = []; // Assuming these are still used or will be for relationships
  allProducts = [];
  allMixtures = [];
  private readonly destroy$ = new Subject<void>(); // Initialize destroy$

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private categoryService: CategoryService, // Keep if still relevant for loading relations
    private productService: ProductService, // Keep if still relevant for loading relations
    private mixtureService: MixtureService, // Keep if still relevant for loading relations
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRelations(); // Keep if you intend to add relationship fields later
  }

  ngOnDestroy(): void { // Implement ngOnDestroy
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.tagForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]], // Wrapped validator in array
      // Assuming categories, products, mixtures are for future use or relationships,
      // if not, consider removing them from the form group if they are not bound to any fields.
      // If they are to be multi-selects like in category/product, they should be initialized as empty arrays.
      categories: [[]],
      products: [[]],
      mixtures: [[]]
    });
  }

  // Keep loadRelations if you plan to add UI for these relationships
  private loadRelations(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        data => this.allCategories = data,
        error => this.snackBar.open('Error loading categories.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      );
    this.productService.getAllProductsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        data => this.allProducts = data,
        error => this.snackBar.open('Error loading products.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      );
    this.mixtureService.getAllMixturesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        data => this.allMixtures = data,
        error => this.snackBar.open('Error loading mixtures.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      );
  }

  onSave(): void {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched(); // Mark all controls as touched
      this.snackBar.open('Please correct the highlighted fields.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      return; // Prevent saving if form is invalid
    }
    this.saving = true;

    const dto: CreateTagDTO = this.tagForm.value;
    this.tagService.createTags([dto])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Tag created successfully!', 'Close', { duration: 3000 });
    this.router.navigate(['/admin/tags']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create tag', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  onCancel(): void {
    if (this.tagForm.dirty) { // Only show dialog if the form has changes
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'COMMON.CANCEL_CONFIRM_TITLE',
          message: 'COMMON.CANCEL_CONFIRM_MESSAGE',
          warn: true // Add warn property for consistent styling if your dialog uses it
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) this.router.navigate(['/admin/tags']);
      });
    } else {
      this.router.navigate(['/admin/tags']); // Navigate directly if no changes
    }
  }
}
