import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {CategoryService} from '../../../services/category.service';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-categories-admin-list',
  templateUrl: './categories-admin-list.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-list.component.scss']
})
export class CategoriesAdminListComponent implements OnInit, OnDestroy {
  categories: ResponseCategoryDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAllCategoriesAdmin().subscribe({
      next: (data) => {
        this.categories = data;
        this.initializeCarousels();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load categories';
        this.isLoading = false;
      }
    });
  }

  initializeCarousels(): void {
    this.activeSlideIndices = [];
    this.categories.forEach((category, idx) => {
      this.activeSlideIndices[idx] = 0;
      const mediaCount = category.responseMediaDTOs?.length || 0;
      this.startCarousel(idx, mediaCount);
    });
  }

  startCarousel(catIndex: number, mediaCount: number): void {
    if (mediaCount <= 1) return;
    this.intervals[catIndex] = setInterval(() => {
      this.nextSlide(catIndex, mediaCount);
    }, 5000);
  }

  nextSlide(catIndex: number, mediaCount: number): void {
    this.activeSlideIndices[catIndex] =
      (this.activeSlideIndices[catIndex] + 1) % mediaCount;
  }

  setActiveSlide(catIndex: number, slideIndex: number): void {
    this.activeSlideIndices[catIndex] = slideIndex;
    clearInterval(this.intervals[catIndex]);
    this.startCarousel(catIndex, this.categories[catIndex].responseMediaDTOs.length);
  }

  trackById(_idx: number, item: ResponseCategoryDTO): number {
    return item.id;
  }

  trackByObjectKey(_idx: number, item: {
    contentType: string,
    base64Data: string,
    objectKey: string
  }): string {
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
      if (result) {
        this.deleteCategory(categoryId);
      }
    });
  }

  private deleteCategory(id: number): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== id);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        // Show error notification
      }
    });
  }

  navigateToUpdate(categoryId: number): void {
    console.log('navigating to update category with ID:', categoryId);
    this.router.navigate([`/admin/categories/update/${categoryId}`]);
  }
}
