import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { TagService } from '../../../services/tag.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { UpdateTagDTO } from '../../../dto/tag/update-tag-dto';
import { MediaDTO } from '../../../dto/media/media-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tags-admin-update',
  templateUrl: './tags-admin-update.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-update.component.scss']
})
export class TagsAdminUpdateComponent implements OnInit, OnDestroy {
  tagForm!: FormGroup;
  saving = false;
  loading = true;
  tagId!: number;

  allCategories: any[] = [];
  allProducts: any[] = [];
  allMixtures: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // React to route param changes
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.tagId = +params['id'];
        this.initForm();
        this.loadRelations();
        this.loadTag();
      });
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
      active: [true],
      media: this.fb.array([]),
      categoryIds: [[]],
      productIds: [[]],
      mixtureIds: [[]]
    });
  }

  get mediaControls(): FormArray {
    return this.tagForm.get('media') as FormArray;
  }

  private loadRelations(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        data => this.allCategories = data,
        error => this.snackBar.open('Error loading categories', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      );

    this.productService.getAllProductsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        data => this.allProducts = data,
        error => this.snackBar.open('Error loading products', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      );

    this.mixtureService.getAllMixturesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        data => this.allMixtures = data,
        error => this.snackBar.open('Error loading mixtures', 'Close', { duration: 3000, panelClass: ['error-snackbar'] })
      );
  }

  private loadTag(): void {
    this.tagService.getTagById(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tag => {
          this.tagForm.patchValue({
            name: tag.name,
            description: tag.description,
            priority: tag.priority,
            active: tag.active,
            categoryIds: tag.categories.map(c => c.id),
            productIds: tag.products.map(p => p.id),
            mixtureIds: tag.mixtures.map(m => m.id)
          });
          this.initMedia(tag.media);
          this.loading = false;
        },
        error: err => {
          console.error('Failed to load tag:', err);
          this.loading = false;
          this.snackBar.open('Failed to load tag. Please try again later.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          this.router.navigate(['/admin/tags']);
        }
      });
  }

  private initMedia(media: MediaDTO[]): void {
    media.forEach(m => {
      // The backend sends base64 data directly, so we can use it as a preview.
      // We must prefix it with the correct data URI scheme.
      const preview = `data:${m.contentType};base64,${m.base64Data}`;
      this.mediaControls.push(this.fb.group({
        base64Data: [m.base64Data],
        objectKey: [m.objectKey],
        contentType: [m.contentType],
        preview: [preview]
      }));
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
          objectKey: [`${Date.now()}_${file.name}`],
          contentType: [file.type],
          preview: [reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  openMediaDeleteDialog(i: number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Delete Media', message: 'Really delete this media?', warn: true }
    }).afterClosed().subscribe(ok => {
      if (ok) this.mediaControls.removeAt(i);
    });
  }

  onSave(): void {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      return;
    }

    this.saving = true;
    const payload: UpdateTagDTO = {
      id: this.tagId,
      ...this.tagForm.value,
      media: this.tagForm.value.media.map((m: any) => ({
        base64Data: m.base64Data,
        objectKey: m.objectKey,
        contentType: m.contentType
      }))
    };

    this.tagService.updateTag(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Tag updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/tags']);
        },
        error: err => {
          this.saving = false;
          console.error('Update failed:', err);
          this.snackBar.open('Failed to update tag', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }

  /**
   * Opens a confirmation dialog before attempting to delete the tag.
   */
  openDeleteDialog(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Tag',
        message: 'This will permanently delete the tag.',
        warn: true
      }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this.deleteTag();
      }
    });
  }

  /**
   * Deletes the tag via the service and handles the response.
   */
  private deleteTag(): void {
    this.tagService.deleteTag(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Tag deleted successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/tags']);
        },
        error: err => {
          console.error('Delete failed:', err);
          this.snackBar.open('Failed to delete tag.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }

  openCancelDialog(): void {
    if (this.tagForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: { title: 'Cancel Update', message: 'Discard changes?', warn: true }
      }).afterClosed().subscribe(ok => {
        if (ok) {
          this.router.navigate(['/admin/tags']);
        }
      });
    } else {
      this.router.navigate(['/admin/tags']);
    }
  }
}
