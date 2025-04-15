import { Component, OnInit, OnDestroy } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';

interface ResponseCategoryDTO {
  id: number;
  name: string;
  description: string;
  categoryType: string;
  responseMediaDTOs: ResponseMediaDTO[];
}

interface ResponseMediaDTO {
  base64Data: string;
  objectKey: string;
  contentType: string;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  standalone: false
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: ResponseCategoryDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];

  constructor(private categoryService: CategoryService) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

    this.categoryService.getAllCategories().subscribe({
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
    this.categories.forEach((category, index) => {
      this.activeSlideIndices[index] = 0;
      this.startCarousel(index, category.responseMediaDTOs.length);
    });
  }

  startCarousel(catIndex: number, mediaCount: number): void {
    this.intervals[catIndex] = setInterval(() => {
      this.nextSlide(catIndex, mediaCount);
    }, 5000);
  }

  nextSlide(catIndex: number, mediaCount: number): void {
    this.activeSlideIndices[catIndex] = (this.activeSlideIndices[catIndex] + 1) % mediaCount;
  }

  setActiveSlide(catIndex: number, slideIndex: number): void {
    this.activeSlideIndices[catIndex] = slideIndex;
    // Reset interval when manually changing slide
    clearInterval(this.intervals[catIndex]);
    this.startCarousel(catIndex, this.categories[catIndex].responseMediaDTOs.length);
  }

  ngOnDestroy(): void {
    this.intervals.forEach(interval => clearInterval(interval));
  }
}
