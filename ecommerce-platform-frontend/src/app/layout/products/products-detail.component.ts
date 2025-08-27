import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ResponseProductDTO } from '../../dto/product/response-product-dto';
import {CurrencyPipe, NgForOf, NgIf} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-products-detail',
  templateUrl: 'products-detail.component.html',
  imports: [
    NgIf,
    NgForOf,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatChipsModule,
    CurrencyPipe
  ],
  styleUrls: ['products-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product?: ResponseProductDTO;
  loading = true;
  error = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const productId = +params['id'];
      if (isNaN(productId)) {
        this.error = 'Invalid product ID';
        this.loading = false;
        return;
      }
      this.loadProduct(productId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProductById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: product => {
        this.product = product;
        this.loading = false;
      },
      error: () => {
        this.error = 'Product not found or error loading product';
        this.loading = false;
      }
    });
  }

  backToList() {
    this.router.navigate(['/products']);
  }

  addToCart() {
    // Here you would typically add the product to a cart service
    this.snackBar.open('Added to cart!', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });

    // Example implementation:
    // this.cartService.addToCart(this.product, 1);
  }
}
