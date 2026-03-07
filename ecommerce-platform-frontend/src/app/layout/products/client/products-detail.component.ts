import {Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ProductService} from '../../../services/product.service';
import {CartService} from '../../../services/cart.service';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {CartItemType} from '../../../dto/cart/cart-item-type';
import {switchMap} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {TagService} from '../../../services/tag.service';
import {CategoryService} from '../../../services/category.service';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-products-detail',
  templateUrl: './products-detail.component.html',
  standalone: false,
  styleUrls: ['./products-detail.component.scss'],
})
export class ProductsDetailComponent implements OnInit, OnDestroy {
  product: ResponseProductDTO | null = null;
  loading = true;
  error: string | null = null;
  activeSlideIndex = 0;
  isGalleryOpen = false;
  private interval: any;
  private routeSub!: Subscription;
  private categoryName: string = 'Category';
  private lastLoadedProductId: number | null = null;
  private slugCorrected = false;

  // Tag icons + i18n tooltip keys
  private tagConfig: { [key: string]: { icon: string, tooltipKey: string } } = {
    'bio': { icon: 'eco', tooltipKey: 'TAGS.TOOLTIP.BIO' },
    'organic': { icon: 'spa', tooltipKey: 'TAGS.TOOLTIP.ORGANIC' },
    'premium': { icon: 'workspace_premium', tooltipKey: 'TAGS.TOOLTIP.PREMIUM' },
    'swiss': { icon: 'flag', tooltipKey: 'TAGS.TOOLTIP.SWISS' },
    'natural': { icon: 'nature', tooltipKey: 'TAGS.TOOLTIP.NATURAL' },
    'vegan': { icon: 'cruelty_free', tooltipKey: 'TAGS.TOOLTIP.VEGAN' },
    'gluten-free': { icon: 'health_and_safety', tooltipKey: 'TAGS.TOOLTIP.GLUTEN_FREE' },
    'sustainable': { icon: 'recycling', tooltipKey: 'TAGS.TOOLTIP.SUSTAINABLE' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private tagService: TagService,
    private categoryService: CategoryService,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('id');

        if (!productId) {
          this.error = this.translate.instant('PRODUCTS.NOT_FOUND');
          this.loading = false;
          return new Promise<ResponseProductDTO | null>(resolve => resolve(null));
        }

        const numericId = +productId;

        // If the product is already loaded and only the slug changed, skip the API call.
        // This prevents the infinite loop: translate → slug mismatch → navigate → paramMap emits → re-fetch → repeat.
        if (this.lastLoadedProductId === numericId && this.product) {
          return new Promise<ResponseProductDTO>(resolve => resolve(this.product!));
        }

        this.loading = true;
        return this.productService.getProductById(numericId);
      })
    ).subscribe({
      next: (data) => {
        if (!data) return;

        const isNewProduct = this.lastLoadedProductId !== data.id;
        this.product = data;
        this.lastLoadedProductId = data.id!;
        this.loading = false;

        if (isNewProduct) {
          this.slugCorrected = false;
          this.translateProduct();
          this.loadCategoryName();

          if (this.interval) clearInterval(this.interval);
          this.startCarousel();

          // Correct the URL slug for SEO (only once per product load)
          this.updateSlugIfNeeded();
        }
      },
      error: (err) => {
        this.error = err.message || this.translate.instant('PRODUCTS.LOAD_FAILED');
        this.loading = false;
        this.product = null;
      }
    });
  }

  private updateSlugIfNeeded(): void {
    if (this.slugCorrected) return; // already corrected, don't loop
    if (!this.product?.translatedName) return;

    const correctSlug = this.slugify(this.product.translatedName);
    if (!correctSlug) return; // never navigate to an empty slug

    const slugParam = this.route.snapshot.paramMap.get('slug');
    if (slugParam !== correctSlug) {
      this.slugCorrected = true; // mark so we don't try again
      this.router.navigate(
        [`/products/${this.product.id}/${correctSlug}`],
        { replaceUrl: true }
      );
    }
  }

  private loadCategoryName(): void {
    if (this.product?.categoryId) {
      this.categoryService.getCategoryById(this.product.categoryId).subscribe({
        next: (category) => {
          this.categoryName = this.categoryService.getLocalizedName(category);
        },
        error: () => {
          this.categoryName = this.translate.instant('PRODUCTS.CATEGORY');
        }
      });
    }
  }

  getCategoryName(): string {
    return this.categoryName;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }

  onTagClick(responseTagDTO: ResponseTagDTO): void {
    if (responseTagDTO && responseTagDTO.translatedUrl) {
      this.router.navigate(['/products'], {
        queryParams: {tags: responseTagDTO.translatedUrl}
      });
    }
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  startCarousel() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.product?.media || this.product.media.length < 1) return;
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.nextSlide(), 5000);
  }

  nextSlide() {
    if (!this.product?.media) return;
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.product.media.length;
  }

  prevSlide() {
    if (!this.product?.media) return;
    this.activeSlideIndex = (this.activeSlideIndex - 1 + this.product.media.length) % this.product.media.length;
  }

  goToSlide(index: number) {
    this.activeSlideIndex = index;
    if (this.interval) {
      clearInterval(this.interval);
      this.startCarousel();
    }
  }

  openGallery() {
    this.isGalleryOpen = true;
    if (this.interval) clearInterval(this.interval);
  }

  closeGallery() {
    this.isGalleryOpen = false;
    this.startCarousel();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isGalleryOpen) {
      if (event.key === 'Escape') this.closeGallery();
      else if (event.key === 'ArrowLeft') this.prevSlide();
      else if (event.key === 'ArrowRight') this.nextSlide();
    }
  }

  addToCart() {
    if (!this.product) return;
    this.cartService.addItem({
      itemId: this.product.id!,
      quantity: 1,
      product: this.product,
      cartItemType: CartItemType.PRODUCT
    }).subscribe({
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  backToList() {
    this.router.navigate(['/products']);
  }

  navigateToCategory(): void {
    if (this.product?.categoryId && this.categoryName) {
      const normalizedCategoryName = this.normalizeName(this.categoryName);
      this.router.navigate(['/products'], {
        queryParams: {categories: normalizedCategoryName}
      });
    }
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  private translateProduct() {
    this.product.translatedName = this.productService.getLocalizedName(this.product);
    this.product.translatedDescription = this.productService.getLocalizedDescription(this.product);
    this.product.translatedUrl = this.productService.getLocalizedUrl(this.product);
    this.product.responseTagDTOS?.forEach(tag => {
      tag.translatedName = this.tagService.getLocalizedName(tag);
      tag.translatedDescription = this.tagService.getLocalizedDescription(tag);
      tag.translatedUrl = this.tagService.getLocalizedUrl(tag);
    });
  }

  getTagTooltip(tagUrlOrName: string): string {
    const key = (tagUrlOrName || '').toLowerCase();
    const config = this.tagConfig[key];
    return config ? this.translate.instant(config.tooltipKey) : '';
  }
}
