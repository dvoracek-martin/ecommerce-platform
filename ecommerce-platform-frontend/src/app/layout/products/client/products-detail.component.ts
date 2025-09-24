import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { CartItemType } from '../../../dto/cart/cart-item-type';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products-detail',
  templateUrl: './products-detail.component.html',
  standalone: false,
  styleUrls: ['./products-detail.component.scss']
})
export class ProductsDetailComponent implements OnInit, OnDestroy {
  product: ResponseProductDTO | null = null;
  loading = true;
  error: string | null = null;
  activeSlideIndex = 0;
  isGalleryOpen = false;
  private interval: any;
  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('id');
        this.loading = true;
        if (!productId) {
          this.error = 'Product not found';
          this.loading = false;
          return new Promise<ResponseProductDTO | null>(resolve => resolve(null));
        }
        return this.productService.getProductById(+productId);
      })
    ).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;

        // Slug for SEO
        const slugParam = this.route.snapshot.paramMap.get('slug');
        const correctSlug = this.product ? this.slugify(this.product.name) : '';
        if (slugParam !== correctSlug) {
          this.router.navigate([`/products/${this.product?.id}/${correctSlug}`], { replaceUrl: true });
        }

        if (this.interval) clearInterval(this.interval);
        this.startCarousel();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load product';
        this.loading = false;
        this.product = null;
      }
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }

  startCarousel() {
    if (!this.product?.media || this.product.media.length <= 1) return;
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

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
    if (this.routeSub) this.routeSub.unsubscribe();
  }
}
