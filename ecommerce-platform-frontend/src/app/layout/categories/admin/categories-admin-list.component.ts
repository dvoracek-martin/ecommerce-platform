// src/app/components/categories-admin-list/categories-admin-list.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {CategoryService} from '../../../services/category.service';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TagService} from '../../../services/tag.service';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';

@Component({
  selector: 'app-categories-admin-list',
  templateUrl: './categories-admin-list.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-list.component.scss']
})
export class CategoriesAdminListComponent implements OnInit, OnDestroy {
  categories: ResponseCategoryDTO[] = [];
  filteredCategories: ResponseCategoryDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  searchControl = new FormControl('');
  activeSeControl = new FormControl(false);
  private intervals: any[] = [];

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private tagService: TagService
  ) {
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchFilter();
    this.activeSeControl.valueChanges.subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const searchValue = (this.searchControl.value || '').toLowerCase().trim();
    const onlyActive = this.activeSeControl.value;

    this.filteredCategories = this.categories.filter(category => {
      const matchesSearch = (category.translatedName || '').toLowerCase().includes(searchValue);
      const matchesActive = onlyActive ? category.active === true : true;
      return matchesSearch && matchesActive;
    });

    this.initializeCarousels();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAllCategoriesAdmin().subscribe({
      next: data => {
        this.categories = data;
        this.translateCategories();
        this.filteredCategories = [...this.categories];
        this.initializeCarousels();
        this.isLoading = false;
      },
      error: err => {
        this.error = err.message || 'Failed to load categories';
        this.isLoading = false;
      },

    });
  }

  initializeCarousels(): void {
    this.activeSlideIndices = [];
    this.filteredCategories.forEach((category, idx) => {
      this.activeSlideIndices[idx] = 0;
      const mediaCount = category.media?.length || 0;
      this.startCarousel(idx, mediaCount);
    });
  }

  startCarousel(catIndex: number, mediaCount: number): void {
    if (mediaCount <= 1) return;
    if (this.intervals[catIndex]) clearInterval(this.intervals[catIndex]);
    this.intervals[catIndex] = setInterval(() => {
      this.nextSlide(catIndex, mediaCount);
    }, 5000);
  }

  nextSlide(catIndex: number, mediaCount: number): void {
    this.activeSlideIndices[catIndex] = (this.activeSlideIndices[catIndex] + 1) % mediaCount;
  }

  setActiveSlide(catIndex: number, slideIndex: number): void {
    this.activeSlideIndices[catIndex] = slideIndex;
    clearInterval(this.intervals[catIndex]);
    this.startCarousel(catIndex, this.filteredCategories[catIndex].media.length);
  }

  trackById(_idx: number, item: ResponseCategoryDTO): number {
    return item.id;
  }

  trackByObjectKey(_idx: number, item: { contentType: string, base64Data: string, objectKey: string }): string {
    return item.objectKey;
  }

  openDeleteDialog(categoryId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Category',
        message: 'Are you sure you want to delete this category?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.deleteCategory(categoryId);
    });
  }

  navigateToUpdate(categoryId: number): void {
    this.router.navigate([`/admin/categories/update/${categoryId}`]);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/categories/create']);
  }

  private deleteCategory(id: number): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== id);
        this.filteredCategories = this.filteredCategories.filter(c => c.id !== id);
        this.snackBar.open('Category deleted successfully.', 'Close', {duration: 3000});
      },
      error: err => console.error('Delete failed:', err)
    });
  }

  private translateCategories() {
    this.categories.forEach(category => {
      category.translatedName = this.categoryService.getLocalizedName(category);
      category.translatedDescription = this.categoryService.getLocalizedDescription(category);
      category.translatedUrl = this.categoryService.getLocalizedUrl(category);
      category.responseTagDTOS.forEach(tag => {
          tag.translatedName = this.tagService.getLocalizedName(tag);
          tag.translatedDescription = this.tagService.getLocalizedDescription(tag);
          tag.translatedUrl = this.tagService.getLocalizedUrl(tag);
      });
    });
  }

  onTagClick(responseTagDTO: ResponseTagDTO): void {
    console.log(JSON.stringify(responseTagDTO));
    this.router.navigate(['/products'], {
      queryParams: {tags: responseTagDTO.translatedUrl}
    }).then(() => {
    });
  }
}
