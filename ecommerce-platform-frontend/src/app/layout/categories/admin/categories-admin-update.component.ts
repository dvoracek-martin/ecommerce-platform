import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';

import {CategoryService} from '../../../services/category.service';
import {TagService} from '../../../services/tag.service';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {UpdateCategoryDTO} from '../../../dto/category/update-category-dto';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-categories-admin-update',
  templateUrl: './categories-admin-update.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-update.component.scss']
})
export class CategoriesAdminUpdateComponent implements OnInit, OnDestroy {
  categoryForm!: FormGroup;
  saving = false;
  allTags: ResponseTagDTO[] = [];
  private categoryId!: number;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private tagService: TagService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  get mediaControls(): FormArray {
    return this.categoryForm.get('media') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.categoryForm.get('tagIds') as FormControl;
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.categoryId = +params['id'];
      this.initForm();
      this.loadTags();
      this.loadCategory();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.mediaControls.push(this.fb.group({
          base64Data: [base64],
          objectKey: [`${this.categoryId}_${Date.now()}_${file.name}`],
          contentType: [file.type],
          preview: [reader.result]
        }));
        this.categoryForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    });
  }

  openMediaDeleteDialog(i: number) {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Media', message: 'Delete this media?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this.mediaControls.removeAt(i);
        this.categoryForm.markAsDirty();
      }
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
    this.categoryForm.markAsDirty();
  }

  onSave() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;

    // Správně mapujeme media
    const mediaPayload = this.mediaControls.controls.map(ctrl => {
      const value = ctrl.value;
      const mediaItem: any = {
        objectKey: value.objectKey,
        contentType: value.contentType
      };
      if (value.base64Data) {
        mediaItem.base64Data = value.base64Data; // jen nové soubory
      }
      return mediaItem;
    });

    const payload: UpdateCategoryDTO = {
      id: this.categoryId,
      ...this.categoryForm.value,
      media: mediaPayload
    };

    this.categoryService.updateCategory(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: err => this.handleSaveError(err)
      });
  }

  openDeleteDialog() {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Category', message: 'Permanently delete?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) this.categoryService.deleteCategory(this.categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.snackBar.open('Category deleted successfully.', 'Close', {duration: 3000});
          this.router.navigate(['/admin/categories']);
        });
    });
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

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: [0, [Validators.required, Validators.min(0)]],
      active: [false],
      tagIds: [[]],
      media: this.fb.array([]),
      url:['', [Validators.required, Validators.minLength(3)]],
      mixable: [false]
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

  private loadCategory() {
    this.categoryService.getCategoryById(this.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => this.patchForm(c),
        error: () => {
          this.snackBar.open('Error loading category', 'Close', {duration: 3000, panelClass: ['error-snackbar']});
          this.router.navigate(['/admin/categories']);
        }
      });
  }

  private patchForm(cat: ResponseCategoryDTO) {
    this.categoryForm.patchValue({
      name: cat.name,
      description: cat.description,
      priority: cat.priority,
      active: cat.active,
      mixable: cat.mixable,
      url: cat.url
    });

    const existingIds = cat.responseTagDTOS.map(t => t.id);
    this.tagIdsControl.setValue(existingIds);

    this.mediaControls.clear();
    (cat.media || []).forEach(m => {
      this.mediaControls.push(this.fb.group({
        objectKey: [m.objectKey],
        contentType: [m.contentType],
        preview: [`data:${m.contentType};base64,${m.base64Data || ''}`],
        base64Data: [m.base64Data || null] // existující soubory mohou mít null
      }));
    });
    this.categoryForm.markAsPristine(); // Resets the dirty state after loading
    this.categoryForm.markAsUntouched();
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.categoryForm.markAsPristine(); // Reset state after a successful save
    this.snackBar.open('Category updated!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/categories']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Update failed', err);
    this.snackBar.open('Failed to update category', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }
}
