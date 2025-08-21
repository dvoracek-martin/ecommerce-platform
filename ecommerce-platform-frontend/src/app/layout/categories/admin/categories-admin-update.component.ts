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
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog.component';

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
  private initialMediaKeys: string[] = [];
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

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      priority: [[Validators.required]],
      active: [false],
      tagIds: [[]],
      uploadMediaDTOs: this.fb.array([])
    });
  }

  get mediaControls(): FormArray {
    return this.categoryForm.get('uploadMediaDTOs') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.categoryForm.get('tagIds') as FormControl;
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
      active: cat.active
    });

    // prefill tags
    const existingIds = cat.tags.map(t => t.id);
    this.tagIdsControl.setValue(existingIds);

    // media
    this.mediaControls.clear();
    (cat.responseMediaDTOs || []).forEach(m => {
      this.mediaControls.push(this.fb.group({
        base64Data: [m.base64Data],
        objectKey: [m.objectKey],
        contentType: [m.contentType],
        preview: [`data:${m.contentType};base64,${m.base64Data}`]
      }));
      this.initialMediaKeys.push(m.objectKey);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.mediaControls.push(this.fb.group({
          base64Data: [base64],
          objectKey: [`categories/${this.categoryId}_${Date.now()}_${file.name}`],
          contentType: [file.type],
          preview: [reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  openMediaDeleteDialog(i: number) {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Media', message: 'Delete this media?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) this.mediaControls.removeAt(i);
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  onSave() {
    if (this.categoryForm.invalid) return;
    this.saving = true;

    const payload: UpdateCategoryDTO = {
      id: this.categoryId,
      ...this.categoryForm.value
    };

    this.categoryService.updateCategory(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Category updated!', 'Close', {duration: 3000});
          this.router.navigate(['/admin/categories']);
        },
        error: err => {
          this.saving = false;
          console.error('Update failed', err);
          this.snackBar.open('Failed to update category', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }

  openDeleteDialog() {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {title: 'Delete Category', message: 'Permanently delete?', warn: true}
    }).afterClosed().subscribe(ok => {
      if (ok) this.categoryService.deleteCategory(this.categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.router.navigate(['/admin/categories']));
    });
  }

  cancel() {
    this.router.navigate(['/admin/categories']);
  }
}
