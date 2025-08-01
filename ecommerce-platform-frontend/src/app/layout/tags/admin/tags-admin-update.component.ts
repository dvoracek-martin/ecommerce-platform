// src/app/components/tags-admin-update/tags-admin-update.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { TagService } from '../../../services/tag.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { UpdateTagDTO } from '../../../dto/tag/update-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';

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
    private dialog: MatDialog
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
      name: ['', Validators.required],
      categories: [[]],
      products: [[]],
      mixtures: [[]]
    });
  }

  private loadRelations(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.allCategories = data);

    this.productService.getAllProductsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.allProducts = data);

    this.mixtureService.getAllMixturesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.allMixtures = data);
  }

  private loadTag(): void {
    this.tagService.getTagById(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tag => {
          this.tagForm.patchValue({
            name: tag.name,
            categories: tag.categories.map(c => c.id),
            products: tag.products.map(p => p.id),
            mixtures: tag.mixtures.map(m => m.id)
          });
          this.loading = false;
        },
        error: err => {
          console.error('Failed to load tag:', err);
          this.loading = false;
        }
      });
  }

  onSave(): void {
    if (this.tagForm.invalid) return;

    this.saving = true;
    const payload: UpdateTagDTO = { id: this.tagId, ...this.tagForm.value };

    this.tagService.updateTag(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/admin/tags']);
        },
        error: err => {
          this.saving = false;
          console.error('Update failed:', err);
        }
      });
  }

  openCancelDialog(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Discard Changes',
        message: 'Are you sure you want to discard unsaved changes?',
        warn: true
      }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.router.navigate(['/admin/tags']);
    });
  }
}
