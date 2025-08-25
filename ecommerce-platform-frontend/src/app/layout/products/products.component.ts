// src/app/components/products/products.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ResponseProductDTO } from '../../dto/product/response-product-dto';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  standalone: false,
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, OnDestroy {
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

    this.productService.getAllProducts().subscribe({
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
    this.startCarousel(index, this.products[index].media .length);
  }

  addToCart(product: ResponseProductDTO): void {
    this.cartService.addItem({ productId: product.id!, quantity: 1, product: product }).subscribe({
      next: () => {
        console.log(`${product.name} added to cart`);
      },
      error: (err) => {
        console.error('Failed to add to cart', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  trackById(_idx: number, item: ResponseProductDTO): number {
    return item.id;
  }

  trackByObjectKey(_idx: number, item: { contentType: string; base64Data: string; objectKey: string }): string {
    return item.objectKey;
  }

  goToProduct(product: ResponseProductDTO) {
    this.router.navigate([`/products/${product.id}`]);
  }
}
