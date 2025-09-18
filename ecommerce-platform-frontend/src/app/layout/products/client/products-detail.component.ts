import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { CartItemType } from '../../../dto/cart/cart-item-type';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.error = 'Product not found';
      this.loading = false;
      return;
    }
    this.loadProduct(+productId);
  }

  loadProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;
        this.startCarousel();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load product';
        this.loading = false;
      }
    });
  }

  startCarousel() {
    if (!this.product?.media || this.product.media.length <= 1) return;
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 5000);
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
    // Pause carousel when gallery is open
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  closeGallery() {
    this.isGalleryOpen = false;
    // Resume carousel when gallery is closed
    this.startCarousel();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isGalleryOpen) {
      if (event.key === 'Escape') {
        this.closeGallery();
      } else if (event.key === 'ArrowLeft') {
        this.prevSlide();
      } else if (event.key === 'ArrowRight') {
        this.nextSlide();
      }
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
      next: () => console.log(`${this.product?.name} added to cart`),
      error: (err) => console.error('Failed to add to cart', err)
    });
  }

  backToList() {
    this.router.navigate(['/products']);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}
