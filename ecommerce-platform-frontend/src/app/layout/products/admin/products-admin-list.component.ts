import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { MediaDTO } from '../../../dto/media/media-dto';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ProductService} from '../../../services/product.service'; // Assuming you'll reuse this

@Component({
  selector: 'app-products-admin-list',
  templateUrl: './products-admin-list.component.html',
  standalone: false,
  styleUrls: ['./products-admin-list.component.scss']
})
export class ProductsAdminListComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];

  constructor(
    private productService: ProductService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProductsAdmin().subscribe({
      next: (data) => {
        this.products = data;
        this.initializeCarousels();
        this.isLoading = false;
        this.error = null;
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

  startCarousel(productIndex: number, mediaCount: number): void {
    if (mediaCount <= 1) return;
    this.intervals[productIndex] = setInterval(() => {
      this.nextSlide(productIndex, mediaCount);
    }, 5000);
  }

  nextSlide(productIndex: number, mediaCount: number): void {
    this.activeSlideIndices[productIndex] =
      (this.activeSlideIndices[productIndex] + 1) % mediaCount;
  }

  setActiveSlide(productIndex: number, slideIndex: number): void {
    this.activeSlideIndices[productIndex] = slideIndex;
    clearInterval(this.intervals[productIndex]);
    this.startCarousel(productIndex, this.products[productIndex].media.length);
  }

  trackById(_idx: number, item: ResponseProductDTO): number {
    return item.id;
  }

  trackByObjectKey(_idx: number, item: MediaDTO): string {
    return item.objectKey;
  }

  openDeleteDialog(productId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteProduct(productId);
      }
    });
  }

  private deleteProduct(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  navigateToUpdate(productId: number): void {
    this.router.navigate([`/admin/products/update/${productId}`]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/products/create']);
  }
}
