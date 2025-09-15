// src/app/components/categories-admin-create/categories-admin-create.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CategoryService} from '../../../services/category.service';
import {TagService} from '../../../services/tag.service';
import {CreateCategoryDTO} from '../../../dto/category/create-category-dto';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog.component';
import {Subject, takeUntil} from 'rxjs';

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

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.initForm();
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: [0, [Validators.required, Validators.min(0)]],
      active: [false],
      tagIds: [[]],
      media: this.fb.array([])
    });
  }

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => this.allTags = tags,
        error: () => this.snackBar.open('Error loading tags', 'Close', {duration: 3000, panelClass: ['error-snackbar']})
      });
  }

  get mediaControls(): FormArray {
    return this.categoryForm.get('media') as FormArray;
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

  openMediaDeleteDialog(i: number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Media', message: 'Really delete this media?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) this.mediaControls.removeAt(i);
    });
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;
    const payload: CreateCategoryDTO = this.categoryForm.value;

    this.categoryService.createCategories([payload])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: err => this.handleSaveError(err)
      });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Category created successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/categories']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create category', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }

  openCancelDialog(): void {
    if (this.categoryForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) {
          this.router.navigate(['/admin/categories']);
        }
      });
    } else {
      this.router.navigate(['/admin/categories']);
    }
  }
}
