import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ResponseTagDTO } from '../../../dto/tag/response-tag-dto';
import { TagService } from '../../../services/tag.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-tags-admin-list',
  templateUrl: './tags-admin-list.component.html',
  standalone: false, // Keeping this as per your last request
  styleUrls: ['./tags-admin-list.component.scss']
})
export class TagsAdminListComponent implements OnInit, OnDestroy {
  tags: ResponseTagDTO[] = [];
  isLoading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tags = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load tags';
          this.isLoading = false;
          this.snackBar.open('Failed to load tags.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
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
        if (confirmed) {
          this.deleteTag(tagId);
        }
      });
  }

  private deleteTag(id: number): void {
    this.tagService.deleteTag(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tags = this.tags.filter((t) => t.id !== id);
          this.snackBar.open('Tag deleted successfully.', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Delete failed:', err);
          this.snackBar.open('Failed to delete tag.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }

  trackById(_idx: number, item: ResponseTagDTO): number {
    return item.id;
  }
}
