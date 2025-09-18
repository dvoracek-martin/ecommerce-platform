import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {MediaDTO} from '../../../dto/media/media-dto';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {ProductService} from '../../../services/product.service';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';

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
  searchControl = new FormControl('');
  activeSeControl = new FormControl(true);
  private intervals: any[] = [];

  constructor(
    private productService: ProductService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.loadProducts();
    this.setupSearchFilter();
    this.activeSeControl.valueChanges.subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const searchValue = (this.searchControl.value || '').toLowerCase().trim();
    const onlyActive = this.activeSeControl.value;

    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchValue);
      const matchesActive = onlyActive ? product.active === true : true;
      return matchesSearch && matchesActive;
    });

    this.initializeCarousels();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProductsAdmin().subscribe({
      next: data => {
        this.products = data;
        this.filteredProducts = [...this.products];
        this.initializeCarousels();
        this.isLoading = false;
        this.error = null;
      },
      error: err => {
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
      if (result) this.deleteProduct(itemId);
    });
  }

  navigateToUpdate(itemId: number): void {
    this.router.navigate([`/admin/products/update/${itemId}`]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/products/create']);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  private deleteProduct(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.filteredProducts = this.filteredProducts.filter(p => p.id !== id);
        this.snackBar.open('Product deleted successfully.', 'Close', {duration: 3000});
      },
      error: err => console.error('Delete failed:', err)
    });
  }
}
