import {Component, OnDestroy, OnInit} from '@angular/core';
import {ResponseProductDTO} from '../../dto/product/response-product-dto';
import {ProductService} from '../../services/product.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})

export class ProductsComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];

  constructor(
    private categoryService: ProductService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

    this.categoryService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.initializeCarousels();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  initializeCarousels(): void {
    this.activeSlideIndices = []; // Reset
    this.products.forEach((category, idx) => {
      this.activeSlideIndices[idx] = 0;
      const mediaCount = category.responseMediaDTOs?.length || 0;
      this.startCarousel(idx, mediaCount);
    });
  }

// In startCarousel()
  startCarousel(catIndex: number, mediaCount: number): void {
    if (mediaCount <= 1) return; // No carousel needed
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
    this.startCarousel(catIndex, this.products[catIndex].responseMediaDTOs.length);
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
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

  goToProduct(product: ResponseProductDTO) {
    this.router.navigate([`/products/${product.id}`]);
  }
}

