import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { MediaDTO } from '../../../dto/media/media-dto';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import { ProductService } from '../../../services/product.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-products-admin-list',
  templateUrl: './products-admin-list.component.html',
  standalone: false,
  styleUrls: ['./products-admin-list.component.scss']
})
export class ProductsAdminListComponent implements OnInit, OnDestroy {
  products: ResponseProductDTO[] = [];
  filteredProducts: ResponseProductDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  private intervals: any[] = [];
  searchControl = new FormControl('');

  constructor(
    private productService: ProductService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.setupSearchFilter();
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.applyFilter(value || '');
      });
  }

  applyFilter(filterValue: string): void {
    if (!filterValue) {
      this.filteredProducts = [...this.products];
      return;
    }

    const searchStr = filterValue.toLowerCase().trim();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchStr)
    );
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.applyFilter('');
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProductsAdmin().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = [...this.products];
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
    this.filteredProducts.forEach((product, idx) => {
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
    this.startCarousel(productIndex, this.filteredProducts[productIndex].media.length);
  }

  trackById(_idx: number, item: ResponseProductDTO): number {
    return item.id;
  }

  trackByObjectKey(_idx: number, item: MediaDTO): string {
    return item.objectKey;
  }

  openDeleteDialog(itemId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteProduct(itemId);
      }
    });
  }

  private deleteProduct(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.filteredProducts = this.filteredProducts.filter(p => p.id !== id);
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  navigateToUpdate(itemId: number): void {
    this.router.navigate([`/admin/products/update/${itemId}`]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/products/create']);
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
