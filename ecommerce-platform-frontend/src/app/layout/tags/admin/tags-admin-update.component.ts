import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';

import {TagService} from '../../../services/tag.service';
import {CategoryService} from '../../../services/category.service';
import {ProductService} from '../../../services/product.service';
import {MixtureService} from '../../../services/mixture.service';

import {UpdateTagDTO} from '../../../dto/tag/update-tag-dto';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-tags-admin-update',
  templateUrl: './tags-admin-update.component.html',
  styleUrls: ['./tags-admin-update.component.scss'],
  standalone: false
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

  onSave(): void {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving = true;
    const payload: UpdateTagDTO = {
      id: this.tagId,
      ...this.tagForm.value,
    };

    this.tagService.updateTag(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.tagForm.markAsPristine(); // Reset dirty state
          this.snackBar.open('Tag updated successfully!', 'Close', {duration: 3000});
          this.router.navigate(['/admin/tags']);
        },
        error: err => {
          this.saving = false;
          console.error('Update failed:', err);
          this.snackBar.open('Failed to update tag', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }

  openDeleteDialog(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Tag',
        message: 'This will permanently delete the tag.',
        warn: true
      }
    }).afterClosed().subscribe(ok => {
      if (ok) this.deleteTag();
    });
  }

  openCancelDialog(): void {
    if (this.tagForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) this.router.navigate(['/admin/tags']);
      });
    } else {
      this.router.navigate(['/admin/tags']);
    }
  }

  private initForm(): void {
    this.tagForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: [0, [Validators.required, Validators.min(0)]],
      active: [true],
      categoryIds: [[]],
      productIds: [[]],
      mixtureIds: [[]],
      url:['', [Validators.required, Validators.minLength(3)]],
    });
  }

  private loadRelations(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: data => this.allCategories = data, error: () => this.allCategories = [] });

    this.productService.getAllProductsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: data => this.allProducts = data, error: () => this.allProducts = [] });

    this.mixtureService.getAllMixturesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: data => this.allMixtures = data, error: () => this.allMixtures = [] });
  }

  private loadTag(): void {
    this.tagService.getTagById(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tag => {
          this.tagForm.patchValue({
            id: tag.id,
            name: tag.name,
            description: tag.description,
            priority: tag.priority,
            active: tag.active,
            url: tag.url,
            categoryIds: tag.categories.map(c => c.id),
            productIds: tag.products.map(p => p.id),
            mixtureIds: tag.mixtures.map(m => m.id)
          });
          this.loading = false;
        },
        error: err => {
          console.error('Failed to load tag:', err);
          this.loading = false;
          this.snackBar.open('Failed to load tag. Please try again later.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/admin/tags']);
        }
      });
  }

  private deleteTag(): void {
    this.tagService.deleteTag(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Tag deleted successfully!', 'Close', {duration: 3000});
          this.router.navigate(['/admin/tags']);
        },
        error: err => {
          console.error('Delete failed:', err);
          this.snackBar.open('Failed to delete tag.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }
}
