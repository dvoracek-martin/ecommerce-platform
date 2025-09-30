import {Component, OnDestroy, OnInit} from '@angular/core';
import {CategoryService} from '../../../services/category.service';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  standalone: false,
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: ResponseCategoryDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];

  constructor(private categoryService: CategoryService) {
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

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
    this.activeSlideIndices[catIndex] =
      (this.activeSlideIndices[catIndex] + 1) % mediaCount;
  }

  setActiveSlide(catIndex: number, slideIndex: number): void {
    this.activeSlideIndices[catIndex] = slideIndex;
    clearInterval(this.intervals[catIndex]);
    this.startCarousel(catIndex, this.categories[catIndex].media.length);
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  trackById(_idx: number, item: ResponseCategoryDTO): number {
    return item.id;
  }

  /** trackBy for media slides */
  trackByObjectKey(_idx: number, item: {
    contentType: string,
    base64Data: string,
    objectKey: string
  }): string {
    return item.objectKey;
  }
}
