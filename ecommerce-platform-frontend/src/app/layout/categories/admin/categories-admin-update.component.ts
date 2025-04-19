import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../services/category.service';
import { UpdateCategoryDTO } from '../../../dto/category/update-category-dto';
import { ResponseCategoryDTO } from '../../../dto/category/response-category-dto';
import { ResponseMediaDTO } from '../../../dto/category/response-media-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop'; // Import HttpErrorResponse

@Component({
  selector: 'app-categories-admin-update',
  templateUrl: './categories-admin-update.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-update.component.scss']
})
export class CategoriesAdminUpdateComponent implements OnInit {
  categoryForm!: FormGroup;
  saving = false;
  categoryId!: number;
  existingMedia: ResponseMediaDTO[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.categoryId = +params['id'];
      this.initForm();
      this.loadCategory();
    });
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      categoryType: ['', Validators.required],
      description: [''],
      uploadMediaDTOs: this.fb.array([])
    });
  }

  private loadCategory(): void {
    this.categoryService.getCategoryById(this.categoryId).subscribe({
      next: (category) => this.patchForm(category),
      error: (err) => console.error('Error loading category:', err)
    });
  }

  private patchForm(category: ResponseCategoryDTO): void {
    this.categoryForm.patchValue({
      name: category.name,
      categoryType: category.categoryType,
      description: category.description
    });

    while (this.mediaControls.length) this.mediaControls.removeAt(0);

    category.responseMediaDTOs?.forEach(media => {
      this.mediaControls.push(this.createMediaGroup(media));
    });
    this.existingMedia = [...(category.responseMediaDTOs || [])];
  }

  private createMediaGroup(media: ResponseMediaDTO): FormGroup {
    return this.fb.group({
      base64Data: [media.base64Data],
      objectKey: [media.objectKey],
      contentType: [media.contentType],
      preview: [`data:${media.contentType};base64,${media.base64Data}`]
    });
  }

  get mediaControls(): FormArray {
    return this.categoryForm.get('uploadMediaDTOs') as FormArray;
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
      objectKey: [`category_${this.categoryId}_${Date.now()}_${file.name}`],
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
    const media = this.mediaControls.at(index).value;
    if (media.objectKey) {
      // Add backend deletion logic here if needed
    }
    this.mediaControls.removeAt(index);
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  onSave(): void {
    if (this.categoryForm.invalid) return;

    this.saving = true;
    const payload: UpdateCategoryDTO = {
      ...this.categoryForm.value,
      id: this.categoryId
    };

    this.categoryService.updateCategory(payload).subscribe({
      next: () => this.handleSaveSuccess(),
      error: (error) => this.handleSaveError(error)
    });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.router.navigate(['/admin/categories']);
    this.snackBar.open('Category updated successfully!', 'Close', { duration: 3000 });
  }

  private handleSaveError(error: any): void {
    this.saving = false;
    console.error('Update failed:', error);

    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) { // HttpStatus.CONFLICT
        if (typeof error.error === 'string') {
          errorMessage = error.error; // Backend sent the error message as a string
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message; // Backend sent a JSON object with a 'message' property
        } else {
          errorMessage = 'Category name already exists.'; // Fallback if no specific message
        }
      } else {
        errorMessage = `Update failed: ${error.error?.message || error.message || 'Something went wrong.'}`;
      }
    } else {
      errorMessage = `Update failed: ${error.message || 'An unexpected client-side error occurred.'}`;
    }

    this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  openDeleteDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Category',
        message: 'This will permanently delete the category and all its contents.',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.deleteCategory();
    });
  }

  private deleteCategory(): void {
    this.categoryService.deleteCategory(this.categoryId).subscribe({
      next: () => this.router.navigate(['/admin/categories']),
      error: (err) => console.error('Delete failed:', err)
    });
  }
}
