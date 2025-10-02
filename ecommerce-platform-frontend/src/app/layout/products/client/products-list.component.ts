import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { CartItemType } from '../../../dto/cart/cart-item-type';
import { TagService } from '../../../services/tag.service';
import { CategoryService } from '../../../services/category.service';
import { ResponseCategoryDTO } from '../../../dto/category/response-category-dto';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatChipListbox } from '@angular/material/chips';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  standalone: false
})
export class ProductsListComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  filteredProducts: ResponseProductDTO[] = [];
  displayedProducts: ResponseProductDTO[] = [];
  categories: ResponseCategoryDTO[] = [];
  isLoading = true;
  isLoadingMore = false;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];
  private destroy$ = new Subject<void>();

  // Pagination
  private readonly PRODUCTS_PER_PAGE = 5;
  private currentPage = 1;
  private allProductsLoaded = false;

  // View & Filter State
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;
  selectedProduct: ResponseProductDTO | null = null;
  showQuickView = false;

  // Filters
  searchControl = new FormControl('');
  selectedCategoryIds: number[] = [];
  currentSort = 'name_asc';
  wishlistItems: number[] = [];
  availableTags: any[] = [];

  @ViewChild('categoryChipList') categoryChipList!: MatChipListbox;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private tagService: TagService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadAvailableTags();
    this.setupSearchFilter();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;
    this.currentPage = 1;
    this.allProductsLoaded = false;

    this.productService.getActiveProductsForDisplayInProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = [...this.products];
        this.initializeCarousels();
        this.translateProducts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  loadMoreProducts(): void {
    if (this.isLoadingMore || this.allProductsLoaded) return;

    this.isLoadingMore = true;

    // Simulate API call delay - in real implementation, you might call a paginated API
    setTimeout(() => {
      this.currentPage++;
      this.updateDisplayedProducts();
      this.isLoadingMore = false;
    }, 500);
  }

  private updateDisplayedProducts(): void {
    const startIndex = 0;
    const endIndex = this.currentPage * this.PRODUCTS_PER_PAGE;

    if (endIndex >= this.filteredProducts.length) {
      this.displayedProducts = [...this.filteredProducts];
      this.allProductsLoaded = true;
    } else {
      this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
    }

    // Initialize carousels for newly loaded products
    this.initializeCarouselsForDisplayedProducts();
  }

  private initializeCarouselsForDisplayedProducts(): void {
    // Only initialize carousels for newly added products
    const newProductsStartIndex = (this.currentPage - 1) * this.PRODUCTS_PER_PAGE;

    for (let i = newProductsStartIndex; i < this.displayedProducts.length; i++) {
      const product = this.displayedProducts[i];
      const productIndex = i;

      this.activeSlideIndices[productIndex] = 0;
      const mediaCount = product.media?.length || 0;
      this.startCarousel(productIndex, mediaCount);
    }
  }

  get hasMoreProducts(): boolean {
    return !this.allProductsLoaded && this.filteredProducts.length > this.displayedProducts.length;
  }

  loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.translateCategories();
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    });
  }

  loadAvailableTags(): void {
    this.tagService.getAllTags().subscribe({
      next: (tags) => {
        this.availableTags = tags.map(tag => ({
          ...tag,
          translatedName: this.tagService.getLocalizedName(tag),
          selected: false
        }));
      },
      error: (err) => {
        console.error('Failed to load tags', err);
      }
    });
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // Category Filter Methods
  onCategoryFilterChange(): void {
    if (this.categoryChipList) {
      const selectedChips = this.categoryChipList.value as number[];
      this.selectedCategoryIds = selectedChips || [];
    }
    this.applyFilters();
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  getSelectedCategories(): ResponseCategoryDTO[] {
    return this.categories.filter(category =>
      this.selectedCategoryIds.includes(category.id)
    );
  }

  removeCategoryFilter(categoryId: number): void {
    this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    if (this.categoryChipList) {
      this.categoryChipList.value = this.selectedCategoryIds;
    }
    this.applyFilters();
  }

  // Tag Filter Methods
  toggleTagFilter(tag: any): void {
    tag.selected = !tag.selected;
    this.applyFilters();
  }

  isTagSelected(tag: any): boolean {
    return tag.selected || false;
  }

  getSelectedTags(): any[] {
    return this.availableTags.filter(tag => tag.selected);
  }

  removeTagFilter(tag: any): void {
    tag.selected = false;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    const searchTerm = (this.searchControl.value || '').toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.translatedName.toLowerCase().includes(searchTerm) ||
        product.translatedDescription.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (this.selectedCategoryIds.length > 0) {
      filtered = filtered.filter(product => {
        return this.selectedCategoryIds.includes(product.categoryId);
      });
    }

    // Apply tag filter
    const selectedTags = this.availableTags.filter(tag => tag.selected);
    if (selectedTags.length > 0) {
      const selectedTagIds = selectedTags.map(tag => tag.id);
      filtered = filtered.filter(product =>
        product.responseTagDTOS?.some(tag =>
          selectedTagIds.includes(tag.id)
        )
      );
    }

    // Apply sorting
    filtered = this.sortProducts(filtered);

    this.filteredProducts = filtered;
    this.currentPage = 1;
    this.allProductsLoaded = false;
    this.updateDisplayedProducts();
  }

  sortProducts(products: ResponseProductDTO[]): ResponseProductDTO[] {
    const sorted = [...products];

    switch (this.currentSort) {
      case 'name_asc':
        return sorted.sort((a, b) => a.translatedName.localeCompare(b.translatedName));
      case 'name_desc':
        return sorted.sort((a, b) => b.translatedName.localeCompare(a.translatedName));
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'newest':
        return sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
      default:
        return sorted;
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategoryIds = [];
    this.availableTags = this.availableTags.map(tag => ({ ...tag, selected: false }));
    this.currentSort = 'name_asc';
    this.showFilters = false;

    if (this.categoryChipList) {
      this.categoryChipList.value = [];
    }

    this.applyFilters();
  }

  clearFilters(): void {
    this.clearAllFilters();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchControl.value ||
      this.selectedCategoryIds.length > 0 ||
      this.availableTags.some(tag => tag.selected);
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.searchControl.value) count++;
    if (this.selectedCategoryIds.length > 0) count++;
    if (this.availableTags.some(tag => tag.selected)) count++;
    return count;
  }

  // Sorting Methods
  onSortChange(event: any): void {
    this.currentSort = event.target.value;
    this.applyFilters();
  }

  // View Methods
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Carousel Methods
  initializeCarousels(): void {
    this.activeSlideIndices = [];
    this.updateDisplayedProducts();
  }

  startCarousel(productIndex: number, mediaCount: number): void {
    if (mediaCount <= 1) return;
    if (this.intervals[productIndex]) clearInterval(this.intervals[productIndex]);
    this.intervals[productIndex] = setInterval(() => {
      this.nextSlide(productIndex, mediaCount);
    }, 5000);
  }

  nextSlide(index: number, mediaCount: number): void {
    this.activeSlideIndices[index] = (this.activeSlideIndices[index] + 1) % mediaCount;
  }

  setActiveSlide(index: number, slideIndex: number): void {
    this.activeSlideIndices[index] = slideIndex;
    clearInterval(this.intervals[index]);
    this.startCarousel(index, this.displayedProducts[index]?.media?.length || 0);
  }

  // Product Actions
  addToCart(product: ResponseProductDTO): void {
    this.cartService.addItem({
      itemId: product.id!,
      quantity: 1,
      product: product,
      cartItemType: CartItemType.PRODUCT
    }).subscribe({
      next: () => {
        console.log('Product added to cart');
      },
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  addToWishlist(product: ResponseProductDTO): void {
    const productId = product.id!;
    if (this.isInWishlist(product)) {
      this.wishlistItems = this.wishlistItems.filter(id => id !== productId);
    } else {
      this.wishlistItems.push(productId);
    }
  }

  isInWishlist(product: ResponseProductDTO): boolean {
    return this.wishlistItems.includes(product.id!);
  }

  quickView(product: ResponseProductDTO): void {
    this.selectedProduct = product;
    this.showQuickView = true;
  }

  closeQuickView(): void {
    this.showQuickView = false;
    this.selectedProduct = null;
  }

  // Navigation
  goToProduct(product: ResponseProductDTO): void {
    const slug = this.productService.slugify(product.translatedName);
    this.router.navigate([`/products/${product.id}/${slug}`]);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  // Translation
  private translateProducts(): void {
    this.products.forEach(product => {
      product.translatedName = this.productService.getLocalizedName(product);
      product.translatedDescription = this.productService.getLocalizedDescription(product);
      product.translatedUrl = this.productService.getLocalizedUrl(product);
      product.responseTagDTOS.forEach(tag => {
        this.tagService.getTagById(tag.id).subscribe(responseTagDTO => {
          tag.translatedName = this.tagService.getLocalizedName(responseTagDTO);
        });
      });
    });
  }

  private translateCategories(): void {
    this.categories.forEach(category => {
      category.translatedName = this.categoryService.getLocalizedName(category);
      category.translatedDescription = this.categoryService.getLocalizedDescription(category);
    });
  }

  // Utilities
  trackById(_idx: number, item: ResponseProductDTO): number {
    return item.id!;
  }

  trackByObjectKey(_idx: number, item: { contentType: string; base64Data: string; objectKey: string }): string {
    return item.objectKey;
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
    this.destroy$.next();
    this.destroy$.complete();
  }
}
