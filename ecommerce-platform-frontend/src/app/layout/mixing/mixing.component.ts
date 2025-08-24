import {Component, OnDestroy, OnInit} from '@angular/core';
import {ResponseProductDTO} from '../../dto/product/response-product-dto';
import {ProductService} from '../../services/product.service';
import {Router} from '@angular/router';
import {CategoryService} from '../../services/category.service';
import {ResponseCategoryDTO} from '../../dto/category/response-category-dto';
import {forkJoin} from 'rxjs';
import {ResponseMediaDTO} from '../../dto/media/response-media-dto';
import {TagDTO} from '../../dto/tag/tag-dto';

interface ProductSummary {
  product: ResponseProductDTO;
  count: number;
  totalPrice: number;
}

@Component({
  selector: 'app-mixing',
  standalone: false,
  templateUrl: './mixing.component.html',
  styleUrl: './mixing.component.scss'
})
export class MixingComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  categories: ResponseCategoryDTO[] = [];
  productsByCategory: { [categoryId: number]: ResponseProductDTO[] } = {};
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: { [productId: number]: number } = {};
  private intervals: { [productId: number]: any } = {};

  mixedProducts: (ResponseProductDTO | null)[] = new Array(9).fill(null);

  addingProductId: number | null = null;
  mixtureName: string = 'Your Mixture';
  isEditingName: boolean = false;

  showInfoPopup: boolean = false;
  selectedProduct: ResponseProductDTO | null = null;

  activeCategoryIndex = 0;

  premiumCategoryId: number | null = null;

  lastRemovedIndex: number | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    Object.values(this.intervals).forEach(i => clearInterval(i));
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.getPremiumCategoryId();

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

  getPremiumCategoryId(): void {
    if (this.categories.length > 0) {
      const highestPriorityCategory = this.categories.reduce((prev, current) =>
        (prev.priority > current.priority) ? prev : current
      );
      this.premiumCategoryId = highestPriorityCategory.id;
    }
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

  trackByMixtureIndex(_idx: number, item: any): number {
    return _idx;
  }

  trackBySummaryProductId(_idx: number, summary: ProductSummary): number {
    return summary.product.id;
  }

  nextCategory() {
    if (this.activeCategoryIndex < this.categories.length - 1) {
      this.activeCategoryIndex++;
      this.scrollToTop();
    }
  }

  prevCategory() {
    if (this.activeCategoryIndex > 0) {
      this.activeCategoryIndex--;
      this.scrollToTop();
    }
  }

  jumpToCategoryAndScroll(index: number) {
    this.activeCategoryIndex = index;
    setTimeout(() => {
      this.scrollToTop();
    }, 100);
  }

  scrollToTop(): void {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  }

  trackByObjectKey(_idx: number, item: ResponseMediaDTO): string {
    return item.objectKey;
  }

  isAddButtonDisabled(product: ResponseProductDTO): boolean {
    const isPremiumProduct = product.categoryId === this.premiumCategoryId;

    if (isPremiumProduct) {
      return this.mixedProducts[4] !== null;
    } else {
      let nonPremiumCount = 0;
      for (let i = 0; i < this.mixedProducts.length; i++) {
        if (i !== 4 && this.mixedProducts[i] !== null) {
          nonPremiumCount++;
        }
      }
      return nonPremiumCount >= 8;
    }
  }

  getAddButtonTooltip(product: ResponseProductDTO): string {
    const isPremiumProduct = product.categoryId === this.premiumCategoryId;
    if (isPremiumProduct) {
      return this.mixedProducts[4] !== null ? 'Only one premium product allowed in the grid.' : '';
    } else {
      const nonPremiumSlotsFull = this.mixedProducts.filter((item, index) => item !== null && index !== 4).length >= 8;
      return nonPremiumSlotsFull ? 'All non-premium slots are full.' : '';
    }
  }

  addProductToMixture(product: ResponseProductDTO): void {
    const isPremiumProduct = product.categoryId === this.premiumCategoryId;

    const premiumSpotIndex = 4;

    if (isPremiumProduct) {
      if (this.mixedProducts[premiumSpotIndex]) {
        console.log('Only one premium product can be in the mixture. Remove the current one first.');
        return;
      }
      this.mixedProducts[premiumSpotIndex] = product;
      this.animateAdd(product, 'mixed-card-' + premiumSpotIndex);
    } else {
      let targetIndex = -1;
      if (this.lastRemovedIndex !== null && this.mixedProducts[this.lastRemovedIndex] === null && this.lastRemovedIndex !== premiumSpotIndex) {
        targetIndex = this.lastRemovedIndex;
        this.lastRemovedIndex = null;
      } else {
        targetIndex = this.mixedProducts.findIndex((item, index) => item === null && index !== premiumSpotIndex);
      }

      if (targetIndex > -1) {
        this.mixedProducts[targetIndex] = product;
        this.animateAdd(product, `mixed-card-${targetIndex}`);
      } else {
        console.log('The mixture grid is full! (excluding the premium spot)');
        return; // Early exit if no space is found
      }
    }

    this.addingProductId = product.id;
    setTimeout(() => {
      this.addingProductId = null;
    }, 1000);
  }

  private animateAdd(product: ResponseProductDTO, targetElementId: string): void {
    const sourceElement = document.getElementById('product-card-' + product.id);
    const targetElement = document.getElementById(targetElementId);

    if (sourceElement && targetElement) {
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      const clone = sourceElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.top = `${sourceRect.top}px`;
      clone.style.left = `${sourceRect.left}px`;
      clone.style.width = `${sourceRect.width}px`;
      clone.style.height = `${sourceRect.height}px`;
      clone.style.zIndex = '1000';
      clone.classList.add('animating-clone');

      document.body.appendChild(clone);

      const translateX = targetRect.left - sourceRect.left;
      const translateY = targetRect.top - sourceRect.top;

      setTimeout(() => {
        clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${targetRect.width / sourceRect.width})`;
        clone.style.opacity = '0.5';
      }, 50);

      setTimeout(() => {
        document.body.removeChild(clone);
      }, 800);
    }
  }

  removeProductFromMixture(index: number): void {
    if (index > -1 && index < this.mixedProducts.length) {
      const targetElement = document.getElementById(`mixed-card-${index}`);
      if (targetElement) {
        const productElement = targetElement.querySelector('.mixed-product-image, .mixed-product-name');
        if (productElement) {
          (productElement as HTMLElement).style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
          (productElement as HTMLElement).style.transform = 'scale(0.5)';
          (productElement as HTMLElement).style.opacity = '0';
        }

        setTimeout(() => {
          this.mixedProducts.splice(index, 1, null);
          this.lastRemovedIndex = index;
        }, 400);
      } else {
        this.mixedProducts.splice(index, 1, null);
        this.lastRemovedIndex = index;
      }
    }
  }

  calculateTotalPrice(): number {
    return this.mixedProducts.reduce((sum, product) => sum + (product?.price || 0), 0);
  }

  getProductsByCategoryInMixture(): { [categoryName: string]: ProductSummary[] } {
    const groupedProducts: { [categoryName: string]: ProductSummary[] } = {};
    const categoryMap = new Map<number, string>(this.categories.map(cat => [cat.id, cat.name]));

    this.mixedProducts.forEach(product => {
      if (!product) return;
      const categoryName = categoryMap.get(product.categoryId) || 'Uncategorized';
      if (!groupedProducts[categoryName]) {
        groupedProducts[categoryName] = [];
      }

      const existingProduct = groupedProducts[categoryName].find(p => p.product.id === product.id);
      if (existingProduct) {
        existingProduct.count++;
        existingProduct.totalPrice += product.price;
      } else {
        groupedProducts[categoryName].push({
          product: product,
          count: 1,
          totalPrice: product.price
        });
      }
    });

    return groupedProducts;
  }

  editName() {
    this.isEditingName = true;
  }

  saveName() {
    this.isEditingName = false;
  }

  showProductInfo(product: ResponseProductDTO): void {
    this.selectedProduct = product;
    this.showInfoPopup = true;
  }

  closePopup(): void {
    this.showInfoPopup = false;
    this.selectedProduct = null;
  }

  getCategoryName(categoryId: number | undefined): string {
    if (!categoryId) return 'N/A';
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  }
}
