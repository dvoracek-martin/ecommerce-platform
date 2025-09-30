import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ProductService} from '../../../services/product.service';
import {MixtureService} from '../../../services/mixture.service';
import {CartItem, CartService} from '../../../services/cart.service';
import {Router} from '@angular/router';
import {CategoryService} from '../../../services/category.service';
import {ResponseCategoryDTO} from '../../../dto/category/response-category-dto';
import {forkJoin} from 'rxjs';
import {CartItemType} from '../../../dto/cart/cart-item-type';
import {CreateMixtureDTO} from '../../../dto/mixtures/create-mixture-dto';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TagService} from '../../../services/tag.service';

interface ProductSummary {
  product: ResponseProductDTO;
  count: number;
  totalPrice: number;
}

@Component({
  selector: 'app-mixing',
  templateUrl: './mixing.component.html',
  styleUrls: ['./mixing.component.scss'],
  standalone: false
})
export class MixingComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  categories: ResponseCategoryDTO[] = [];
  productsByCategory: { [categoryId: number]: ResponseProductDTO[] } = {};
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: { [productId: number]: number } = {};
  private intervals: { [productId: number]: any } = {};
  isAddingToCart = false;

  mixedProducts: (ResponseProductDTO | null)[] = new Array(9).fill(null);

  addingProductId: number | null = null;
  mixtureName: string = 'Custom Mixture';
  isEditingName: boolean = false;
  private readonly defaultMixtureName = 'Custom Mixture';

  showInfoPopup: boolean = false;
  selectedProduct: ResponseProductDTO | null = null;

  activeCategoryIndex = 0;
  premiumCategoryId: number | null = null;
  lastRemovedIndex: number | null = null;

  @ViewChild('nameInput') nameInput!: ElementRef;
  @ViewChild('mixingContainer') mixingContainer!: ElementRef;

  constructor(
    private productService: ProductService,
    private mixtureService: MixtureService,
    private cartService: CartService,
    private categoryService: CategoryService,
    private router: Router,
    private snackBar: MatSnackBar,
    private tagService: TagService
  ) {
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    Object.values(this.intervals).forEach(i => clearInterval(i));
  }

  /** LOAD PRODUCTS & CATEGORIES */
  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.categoryService.getActiveCategoriesForMixing().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.getPremiumCategoryId();

        const requests = categories.map(cat => this.productService.getActiveProductsForMixingByCategoryId(cat.id));
        forkJoin(requests).subscribe({
          next: (results) => {
            categories.forEach((cat, index) => {
              this.productsByCategory[cat.id] = results[index];
            });
            this.initializeCarousels();
            this.isLoading = false;
            this.translateCategories();
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

  /** PREMIUM CATEGORY */
  getPremiumCategoryId(): void {
    if (this.categories.length > 0) {
      const highestPriorityCategory = this.categories.reduce((prev, current) =>
        (prev.priority > current.priority) ? prev : current
      );
      this.premiumCategoryId = highestPriorityCategory.id;
    }
  }

  /** CAROUSEL INITIALIZATION */
  initializeCarousels(): void {
    Object.values(this.intervals).forEach(i => clearInterval(i));
    this.intervals = {};
    this.activeSlideIndices = {};

    this.categories.forEach(category => {
      const products = this.productsByCategory[category.id];
      if (!products) return;
      products.forEach(product => {
        this.activeSlideIndices[product.id] = 0;
        const mediaCount = product.media?.length || 0;
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

  /** TRACKBY */
  trackById(_idx: number, item: ResponseProductDTO): number {
    return item.id;
  }

  trackByMixtureIndex(_idx: number, item: any): number {
    return _idx;
  }

  trackBySummaryProductId(_idx: number, summary: ProductSummary): number {
    return summary.product.id;
  }

  /** MIXING GRID LOGIC */
  isAddButtonDisabled(product: ResponseProductDTO): boolean {
    const isPremiumProduct = product.categoryId === this.premiumCategoryId;
    if (isPremiumProduct) {
      return this.mixedProducts[4] !== null;
    } else {
      const nonPremiumCount = this.mixedProducts.filter((item, index) => item !== null && index !== 4).length;
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
      if (this.mixedProducts[premiumSpotIndex]) return;
      this.mixedProducts[premiumSpotIndex] = product;
    } else {
      let targetIndex = this.lastRemovedIndex !== null && this.mixedProducts[this.lastRemovedIndex] === null && this.lastRemovedIndex !== premiumSpotIndex
        ? this.lastRemovedIndex
        : this.mixedProducts.findIndex((item, index) => item === null && index !== premiumSpotIndex);
      if (targetIndex > -1) {
        this.mixedProducts[targetIndex] = product;
        this.lastRemovedIndex = null;
      } else return;
    }

    this.addingProductId = product.id;
    setTimeout(() => this.addingProductId = null, 1000);
  }

  removeProductFromMixture(index: number): void {
    if (index >= 0 && index < this.mixedProducts.length) {
      this.mixedProducts.splice(index, 1, null);
      this.lastRemovedIndex = index;
    }
  }

  calculateTotalPrice(): number {
    return this.mixedProducts.reduce((sum, product) => sum + (product?.price || 0), 0);
  }

  getProductsByCategoryInMixture(): { [categoryName: string]: ProductSummary[] } {
    const groupedProducts: { [categoryName: string]: ProductSummary[] } = {};
    const categoryMap = new Map<number, string>(this.categories.map(cat => [cat.id, cat.translatedName]));

    this.mixedProducts.forEach(product => {
      if (!product) return;
      const categoryName = categoryMap.get(product.categoryId) || 'Uncategorized';
      if (!groupedProducts[categoryName]) groupedProducts[categoryName] = [];
      const existing = groupedProducts[categoryName].find(p => p.product.id === product.id);
      if (existing) {
        existing.count++;
        existing.totalPrice += product.price!;
      } else {
        groupedProducts[categoryName].push({product, count: 1, totalPrice: product.price!});
      }
    });
    return groupedProducts;
  }

  /** MIXTURE NAME EDIT */
  editName() {
    this.isEditingName = true;

    // Use setTimeout to ensure the input is rendered before selecting text
    setTimeout(() => {
      if (this.nameInput && this.nameInput.nativeElement) {
        this.nameInput.nativeElement.select();
      }
    });
  }

  saveName() {
    this.isEditingName = false;
  }

  /** Check if name is default */
  isDefaultName(): boolean {
    return this.mixtureName === this.defaultMixtureName ||
      this.mixtureName.trim() === '' ||
      this.mixtureName === 'Your Mixture';
  }

  /** PRODUCT INFO POPUP */
  showProductInfo(product: ResponseProductDTO): void {
    this.translateProduct(product);
    this.selectedProduct = product;
    this.showInfoPopup = true;
  }

  closePopup(): void {
    this.showInfoPopup = false;
    this.selectedProduct = null;
  }

  /** CATEGORY NAVIGATION */
  prevCategory(): void {
    if (this.activeCategoryIndex > 0) {
      this.activeCategoryIndex--;
      this.scrollToTop();
    }
  }

  nextCategory(): void {
    if (this.activeCategoryIndex < this.categories.length - 1) {
      this.activeCategoryIndex++;
      this.scrollToTop();
    }
  }

  jumpToCategoryAndScroll(index: number): void {
    if (index >= 0 && index < this.categories.length) {
      this.activeCategoryIndex = index;
      this.scrollToTop();
    }
  }

  addMixtureToCart(): void {
    // Check if name is default
    if (this.isDefaultName()) {
      this.snackBar.open('Please give your mixture a unique name', 'OK', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      this.editName(); // Focus on editing the name
      return;
    }

    const mixtureProducts = this.mixedProducts.filter(p => p !== null) as ResponseProductDTO[];
    if (mixtureProducts.length === 0) return;

    // Set loading state
    this.isAddingToCart = true;
    const createMixtureRequest: CreateMixtureDTO = {
      localizedFields: null,
      name: this.mixtureName,
      price: this.calculateTotalPrice(),
      categoryId: this.premiumCategoryId || 0,
      productIds: mixtureProducts.map(p => p.id),
      weightGrams: undefined,
      tagIds: [],
      priority: 0,
      active: false,
      media: [],
      displayInProducts: false,
    };
    this.mixtureService.saveMixture(createMixtureRequest).subscribe({
      next: responseMixtureDTO => {
        const cartItem: CartItem = {
          itemId: responseMixtureDTO.id!,
          quantity: 1,
          mixture: responseMixtureDTO,
          cartItemType: CartItemType.MIXTURE
        };
        this.cartService.addItem(cartItem).subscribe({
          next: () => {
            this.isAddingToCart = false; // Reset loading state
            this.snackBar.open('Mixture added to cart successfully!', 'OK', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            // Navigate to cart page after successful addition
            this.router.navigate(['/cart']);
          },
          error: err => {
            console.error('Failed to add mixture to cart:', err);
            this.isAddingToCart = false; // Reset loading state
            this.snackBar.open('Failed to add mixture to cart', 'OK', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      },
      error: err => {
        console.error('Failed to save mixture:', err);
        this.isAddingToCart = false;
        this.snackBar.open('Failed to create mixture', 'OK', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  scrollToTop(): void {
    // For modern browsers
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback for older browsers
      this.scrollToTopFallback();
    }
  }

// Fallback for browsers that don't support smooth scrolling
  scrollToTopFallback(): void {
    const scrollDuration = 500; // Duration in milliseconds
    const scrollStep = -window.scrollY / (scrollDuration / 15);

    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 15);
  }

  getNonNullMixedProductsCount(): number {
    return this.mixedProducts.filter(p => p !== null).length;
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  private translateCategories() {
    this.categories.forEach(category => {
      category.translatedName = this.categoryService.getLocalizedName(category);
      category.translatedDescription = this.categoryService.getLocalizedDescription(category);
      category.translatedUrl = this.categoryService.getLocalizedUrl(category);

      this.productsByCategory[category.id].forEach(product => {
        product.translatedName = this.productService.getLocalizedName(product);
        product.translatedDescription = this.productService.getLocalizedDescription(product);
      });
    });
  }

  private translateProduct(product: ResponseProductDTO) {
    product.translatedName = this.productService.getLocalizedName(product);
    product.translatedDescription = this.productService.getLocalizedDescription(product);
    product.translatedUrl = this.productService.getLocalizedUrl(product);
    product.responseTagDTOS.forEach(tag => {
      this.tagService.getTagById(tag.id).subscribe(responseTagDTO => {
        tag.translatedName = this.tagService.getLocalizedName(responseTagDTO);
      });
    });
  }
}
