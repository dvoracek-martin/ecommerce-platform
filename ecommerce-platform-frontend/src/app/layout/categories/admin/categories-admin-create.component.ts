import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../../../services/category.service';
import { CreateCategoryDTO } from '../../../dto/category/create-category-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import {ResponseMediaDTO} from '../../../dto/category/response-media-dto';

@Component({
  selector: 'app-categories-admin-create',
  templateUrl: './categories-admin-create.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-create.component.scss']
})
export class CategoriesAdminCreateComponent implements OnInit {
  categoryForm!: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      categoryType: ['', Validators.required],
      description: [''],
      uploadMediaDTOs: this.fb.array([])
    });
  }

  private createMediaGroup(media?: ResponseMediaDTO): FormGroup {
    return this.fb.group({
      base64Data: [media?.base64Data || ''],
      objectKey: [media?.objectKey || ''],
      contentType: [media?.contentType || ''],
      preview: [media ? `data:${media.contentType};base64,${media.base64Data}` : '']
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
      objectKey: [`categories/${Date.now()}_${file.name}`],
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

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  onSave(): void {
    if (this.categoryForm.invalid) return;

    this.saving = true;
    const payload: CreateCategoryDTO = this.categoryForm.value;

    this.categoryService.createCategories([payload]).subscribe({
      next: () => this.handleSaveSuccess(),
      error: (err) => this.handleSaveError(err)
    });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.router.navigate(['/admin/categories']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    // TODO: show error notification
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
      if (confirmed) this.router.navigate(['/admin/categories']);
    });
  }
}
