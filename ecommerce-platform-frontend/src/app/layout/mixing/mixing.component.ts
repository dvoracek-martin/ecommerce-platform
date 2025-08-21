import {Component, OnDestroy, OnInit} from '@angular/core';
import {ResponseProductDTO} from '../../dto/product/response-product-dto';
import {ProductService} from '../../services/product.service';
import {Router} from '@angular/router';
import {CategoryService} from '../../services/category.service';
import {ResponseCategoryDTO} from '../../dto/category/response-category-dto';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-mixing',
  standalone: false,
  templateUrl: './mixing.component.html',
  styleUrl: './mixing.component.scss'
})
export class MixingComponent implements OnInit {
  products: ResponseProductDTO[] = [];
  categories: ResponseCategoryDTO[] = [];
  productsByCategory: { [categoryId: number]: ResponseProductDTO[] } = {};
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: { [productId: number]: number } = {};
  private intervals: { [productId: number]: any } = {};

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;

        // create array of requests
        const requests = categories.map(cat =>
          this.productService.getAllProductsByCategoryId(cat.id)
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            // Map each category ID to its products
            categories.forEach((cat, index) => {
              this.productsByCategory[cat.id] = results[index];
            });

            this.initializeCarousels(); // if you adapt it to use productsByCategory
            this.isLoading = false;
          },
          error: (err) => {
            this.error = err.message || 'Failed to load products';
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.message || 'Failed to load categories';
        this.isLoading = false;
      }
    });
  }

  initializeCarousels(): void {
    // Clear existing intervals
    Object.values(this.intervals).forEach(i => clearInterval(i));
    this.intervals = {};
    this.activeSlideIndices = {};

    this.categories.forEach(category => {
      const products = this.productsByCategory[category.id];
      if (!products) return;

      products.forEach(product => {
        this.activeSlideIndices[product.id] = 0;
        const mediaCount = product.responseMediaDTOs?.length || 0;
        this.startCarousel(product.id, mediaCount);
      });
    });
  }
  startCarousel(productId: number, mediaCount: number): void {
    if (mediaCount <= 1) return; // no carousel needed
    this.intervals[productId] = setInterval(() => {
      this.nextSlide(productId, mediaCount);
    }, 5000);
  }

  nextSlide(productId: number, mediaCount: number): void {
    this.activeSlideIndices[productId] =
      (this.activeSlideIndices[productId] + 1) % mediaCount;
  }

  setActiveSlide(productId: number, slideIndex: number, mediaCount: number): void {
    this.activeSlideIndices[productId] = slideIndex;
    clearInterval(this.intervals[productId]);
    this.startCarousel(productId, mediaCount);
  }


  trackById(_idx: number, item: ResponseProductDTO): number {
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

