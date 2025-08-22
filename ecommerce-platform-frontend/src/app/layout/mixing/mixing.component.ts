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

  mixedProducts: ResponseProductDTO[] = [];

  // New property for animation
  addingProductId: number | null = null;
  // New property for editable mixture name
  mixtureName: string = 'Your Mixture';
  isEditingName: boolean = false;

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

        const requests = categories.map(cat =>
          this.productService.getAllProductsByCategoryId(cat.id)
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            categories.forEach((cat, index) => {
              this.productsByCategory[cat.id] = results[index];
            });

            this.initializeCarousels();
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
    if (mediaCount <= 1) return;
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

  activeCategoryIndex = 0;

  nextCategory() {
    if (this.activeCategoryIndex < this.categories.length - 1) {
      this.activeCategoryIndex++;
    }
  }

  prevCategory() {
    if (this.activeCategoryIndex > 0) {
      this.activeCategoryIndex--;
    }
  }

  trackByObjectKey(_idx: number, item: {
    contentType: string,
    base64Data: string,
    objectKey: string
  }): string {
    return item.objectKey;
  }

  addProductToMixture(product: ResponseProductDTO): void {
    if (this.mixedProducts.length < 12) {
      this.mixedProducts.push(product);

      this.addingProductId = product.id;
      setTimeout(() => {
        this.addingProductId = null;
      }, 800);

    } else {
      console.log('The mixture grid is full!');
    }
  }

  removeProductFromMixture(productId: number): void {
    this.mixedProducts = this.mixedProducts.filter(p => p.id !== productId);
  }

  calculateTotalPrice(): number {
    return this.mixedProducts.reduce((sum, product) => sum + (product.price || 0), 0);
  }

  // New method to get products grouped by category
  getProductsByCategoryInMixture(): { [categoryName: string]: ResponseProductDTO[] } {
    const groupedProducts: { [categoryName: string]: ResponseProductDTO[] } = {};
    const categoryMap = new Map<number, string>(this.categories.map(cat => [cat.id, cat.name]));

    this.mixedProducts.forEach(product => {
      const categoryName = categoryMap.get(product.categoryId) || 'Uncategorized';
      if (!groupedProducts[categoryName]) {
        groupedProducts[categoryName] = [];
      }
      groupedProducts[categoryName].push(product);
    });

    return groupedProducts;
  }

  // New methods for name editing
  editName() {
    this.isEditingName = true;
  }

  saveName() {
    this.isEditingName = false;
    // You could save the name to a backend here if needed
  }
}
