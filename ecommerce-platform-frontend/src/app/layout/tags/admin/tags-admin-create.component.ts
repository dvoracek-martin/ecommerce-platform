import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TagService } from '../../../services/tag.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { CreateTagDTO } from '../../../dto/tag/create-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { MediaDTO } from '../../../dto/media/media-dto';

@Component({
  selector: 'app-tags-admin-create',
  templateUrl: './tags-admin-create.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-create.component.scss']
})
export class TagsAdminCreateComponent implements OnInit, OnDestroy {
  tagForm!: FormGroup;
  saving = false;
  allCategories: any[] = [];
  allProducts: any[] = [];
  allMixtures: any[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.tagForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: [0, [Validators.required, Validators.min(0)]],
      active: [false],
      media: this.fb.array([]),
      // The following fields are for relationships and can be left for future implementation
      categoryIds: [[]],
      productIds: [[]],
      mixtureIds: [[]]
    });
  }

  get mediaControls(): FormArray {
    return this.tagForm.get('media') as FormArray;
  }

  onSave(): void {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      return;
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

  // Renamed to match the category component
  openCancelDialog(): void {
    if (this.tagForm.dirty) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'COMMON.CANCEL_CONFIRM_TITLE',
          message: 'COMMON.CANCEL_CONFIRM_MESSAGE',
          warn: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.router.navigate(['/admin/tags']);
      });
    } else {
      this.router.navigate(['/admin/tags']);
    }
  }
}
