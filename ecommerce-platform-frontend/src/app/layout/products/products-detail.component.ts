import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {ProductService} from '../../services/product.service';
import {ResponseProductDTO} from '../../dto/product/response-product-dto';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';


@Component({
  selector: 'app-products-detail',
  templateUrl: 'products-detail.component.html',
  imports: [
    NgIf,
    NgForOf,
    NgOptimizedImage
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
    private productService: ProductService
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
}
