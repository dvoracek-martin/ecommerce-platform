import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';
import {TagService} from '../../../services/tag.service';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog.component';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Component({
  selector: 'app-tags-admin-list',
  templateUrl: './tags-admin-list.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-list.component.scss']
})
export class TagsAdminListComponent implements OnInit, OnDestroy {
  tags: ResponseTagDTO[] = [];
  filteredTags: ResponseTagDTO[] = [];
  isLoading = true;
  error: string | null = null;
  activeSlideIndices: number[] = [];
  searchControl = new FormControl('');
  activeSeControl = new FormControl(true);
  private intervals: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.loadTags();
    this.setupSearchFilter();
    this.activeSeControl.valueChanges.subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.intervals.forEach(i => clearInterval(i));
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearchFilter(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const searchValue = (this.searchControl.value || '').toLowerCase().trim();
    const onlyActive = this.activeSeControl.value;

    this.filteredTags = this.tags.filter(tag => {
      const matchesSearch = tag.name.toLowerCase().includes(searchValue);
      const matchesActive = onlyActive ? tag.active === true : true;
      return matchesSearch && matchesActive;
    });

    this.initializeCarousels();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tags = data;
          this.filteredTags = [...this.tags];
          this.initializeCarousels();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load tags';
          this.isLoading = false;
          this.snackBar.open('Failed to load tags.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }

  initializeCarousels(): void {
    this.activeSlideIndices = [];
    this.filteredTags.forEach((tag, idx) => {
      this.activeSlideIndices[idx] = 0;
      const mediaCount = tag.media?.length || 0;
      this.startCarousel(idx, mediaCount);
    });
  }

  startCarousel(tagIndex: number, mediaCount: number): void {
    if (mediaCount <= 1) return;
    this.intervals[tagIndex] = setInterval(() => {
      this.nextSlide(tagIndex, mediaCount);
    }, 5000);
  }

  nextSlide(tagIndex: number, mediaCount: number): void {
    this.activeSlideIndices[tagIndex] =
      (this.activeSlideIndices[tagIndex] + 1) % mediaCount;
  }

  setActiveSlide(tagIndex: number, slideIndex: number): void {
    this.activeSlideIndices[tagIndex] = slideIndex;
    clearInterval(this.intervals[tagIndex]);
    this.startCarousel(tagIndex, this.filteredTags[tagIndex].media.length);
  }

  trackById(_idx: number, item: ResponseTagDTO): number {
    return item.id;
  }

  trackByObjectKey(_idx: number, item: {
    contentType: string,
    base64Data: string,
    objectKey: string
  }): string {
    return item.objectKey;
  }

  navigateToUpdate(tagId: number): void {
    this.router.navigate([`/admin/tags/update/${tagId}`]);
  }

  openDeleteDialog(tagId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'TAGS.ADMIN.DELETE_TITLE',
        message: 'TAGS.ADMIN.DELETE_CONFIRM'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) this.deleteTag(tagId);
      });
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/tags/create']);
  }

  private deleteTag(id: number): void {
    this.tagService.deleteTag(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tags = this.tags.filter((t) => t.id !== id);
          this.filteredTags = this.filteredTags.filter(p => p.id !== id);
          this.snackBar.open('Tag deleted successfully.', 'Close', {duration: 3000});
        },
        error: (err) => {
          console.error('Delete failed:', err);
          this.snackBar.open('Failed to delete tag.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }
}
