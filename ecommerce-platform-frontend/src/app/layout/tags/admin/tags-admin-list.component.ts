import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {TagService} from '../../../services/tag.service';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {CategoryService} from '../../../services/category.service';
import {ProductService} from '../../../services/product.service';
import {MixtureService} from '../../../services/mixture.service';
import {UpdateTagDTO} from '../../../dto/tag/update-tag-dto';

@Component({
  selector: 'app-tags-admin-list',
  templateUrl: './tags-admin-list.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-list.component.scss']
})
export class TagsAdminListComponent implements OnInit, OnDestroy {
  tags: ResponseTagDTO[] = [];
  filteredTags: ResponseTagDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  searchControl = new FormControl('');
  activeSeControl = new FormControl(false);
  private intervals: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private categoryService: CategoryService,
    private productService: ProductService,
    private mixtureService: MixtureService,
  ) {
  }

  ngOnInit(): void {
    this.loadTags();
    this.setupSearchFilter();
    this.activeSeControl.valueChanges.subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const searchValue = (this.searchControl.value || '').toLowerCase().trim();
    const onlyActive = this.activeSeControl.value;

    this.filteredTags = this.tags.filter(tag => {
      const matchesSearch = tag.translatedName.toLowerCase().includes(searchValue);
      const matchesActive = onlyActive ? tag.active === true : true;
      return matchesSearch && matchesActive;
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tags = data;
          this.filteredTags = [...this.tags];
          this.translateTags();
          this.translateCategories();
          this.translateProducts();
          this.translateMixtures();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load tags';
          this.isLoading = false;
          this.snackBar.open('Failed to load tags.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }


  trackById(_idx: number, item: ResponseTagDTO): number {
    return item.id;
  }

  navigateToUpdate(tagId: number): void {
    this.router.navigate([`/admin/tags/update/${tagId}`]);
  }

  openDeleteDialog(tagId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'TAGS.ADMIN.DELETE_TITLE',
        message: 'TAGS.ADMIN.DELETE_CONFIRM'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) this.deleteTag(tagId);
      });
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/tags/create']);
  }

  private deleteTag(id: number): void {
    const tag = this.tags.find(t => t.id === id);
    if (!tag) return;

    const hasRelations =
      (tag.categories && tag.categories.length > 0) ||
      (tag.products && tag.products.length > 0) ||
      (tag.mixtures && tag.mixtures.length > 0);

    if (hasRelations) {
      const updateTagDTO: UpdateTagDTO = {
        ...tag,
        categoryIds: [],
        productIds: [],
        mixtureIds: [],
        localizedFields: tag.localizedFields,
        media: tag.media,
        translatedName: null,
        translatedDescription: null,
        translatedUrl: null,
      };

      this.tagService.updateTag(updateTagDTO)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.callDelete(id),
          error: err => {
            console.error('Failed to remove relations before delete:', err);
            this.snackBar.open('Failed to remove tag relations.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
          }
        });
    } else {
      this.callDelete(id);
    }
  }

  private callDelete(id: number): void {
    this.tagService.deleteTag(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tags = this.tags.filter(t => t.id !== id);
          this.filteredTags = this.filteredTags.filter(p => p.id !== id);
          this.snackBar.open('Tag deleted successfully.', 'Close', {duration: 3000});
        },
        error: err => {
          console.error('Delete failed:', err);
          this.snackBar.open('Failed to delete tag.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }


  private translateTags() {
    this.tags.forEach(tag => {
      tag.translatedName = this.tagService.getLocalizedName(tag);
      tag.translatedDescription = this.tagService.getLocalizedDescription(tag);
      tag.translatedUrl = this.tagService.getLocalizedUrl(tag);
    });
  }


  private translateCategories() {
    this.tags.forEach(tag => {
      tag.categories.forEach(category => {
        this.categoryService.getCategoryById(category.id).subscribe(responseCategoryDTO => {
            category.translatedName = this.categoryService.getLocalizedName(responseCategoryDTO);
            category.translatedDescription = this.categoryService.getLocalizedDescription(responseCategoryDTO);
            category.translatedUrl = this.categoryService.getLocalizedUrl(responseCategoryDTO);
          }
        )
      });
    });
  }

  private translateProducts() {
    this.tags.forEach(tag => {
      tag.products.forEach(product => {
        this.productService.getProductById(product.id).subscribe(responseProductDTO => {
          product.translatedName = this.productService.getLocalizedName(responseProductDTO);
          product.translatedDescription = this.productService.getLocalizedDescription(responseProductDTO);
          product.translatedUrl = this.productService.getLocalizedUrl(responseProductDTO);
        })
      });
    });
  }

  private translateMixtures() {
    this.tags.forEach(tag => {
      tag.mixtures.forEach(mixture => {
        this.mixtureService.getMixtureById(mixture.id).subscribe(responseMixtureDTO => {
          mixture.translatedName = this.mixtureService.getLocalizedName(responseMixtureDTO);
          mixture.translatedDescription = this.mixtureService.getLocalizedDescription(responseMixtureDTO);
          mixture.translatedUrl = this.mixtureService.getLocalizedUrl(responseMixtureDTO);
        });
      })
    });
  }
}
