import {Component, OnDestroy, OnInit} from '@angular/core';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ProductService} from '../../../services/product.service';
import {Router} from '@angular/router';
import {CartService} from '../../../services/cart.service';
import {CartItemType} from '../../../dto/cart/cart-item-type';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  standalone: false,
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productService.getActiveProductsForDisplayInProducts().subscribe({
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
    this.activeSlideIndices = [];
    this.products.forEach((product, idx) => {
      this.activeSlideIndices[idx] = 0;
      const mediaCount = product.media?.length || 0;
      this.startCarousel(idx, mediaCount);
    });
  }

  startCarousel(index: number, mediaCount: number): void {
    if (mediaCount <= 1) return;
    this.intervals[index] = setInterval(() => {
      this.nextSlide(index, mediaCount);
    }, 5000);
  }

  nextSlide(index: number, mediaCount: number): void {
    this.activeSlideIndices[index] = (this.activeSlideIndices[index] + 1) % mediaCount;
  }

  setActiveSlide(index: number, slideIndex: number): void {
    this.activeSlideIndices[index] = slideIndex;
    clearInterval(this.intervals[index]);
    this.startCarousel(index, this.products[index].media.length);
  }

  addToCart(product: ResponseProductDTO): void {
    this.cartService.addItem({
      itemId: product.id!,
      quantity: 1,
      product: product,
      cartItemType: CartItemType.PRODUCT
    }).subscribe({
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  trackById(_idx: number, item: ResponseProductDTO): number {
    return item.id!;
  }

  trackByObjectKey(_idx: number, item: { contentType: string; base64Data: string; objectKey: string }): string {
    return item.objectKey;
  }

  goToProduct(product: ResponseProductDTO) {
    const slug = this.slugify(product.name);
    this.router.navigate([`/products/${product.id}/${slug}`]);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
