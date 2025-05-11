// tags-admin-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ResponseTagDTO } from '../../../dto/tag/response-tag-dto';
import { TagService } from '../../../services/tag.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-tags-admin-list',
  templateUrl: './tags-admin-list.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-list.component.scss']
})
export class TagsAdminListComponent implements OnInit {
  tags: ResponseTagDTO[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getAllTags().subscribe({
      next: (data) => {
        this.tags = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load tags';
        this.isLoading = false;
      }
    });
  }

  /** Navigate into the edit form for this tag */
  navigateToUpdate(tagId: number): void {
    this.router.navigate([`/admin/tags/update/${tagId}`]);
  }

  /** Ask for confirmation, then delete */
  openDeleteDialog(tagId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'TAGS.ADMIN.DELETE_TITLE',
        message: 'TAGS.ADMIN.DELETE_CONFIRM'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteTag(tagId);
      }
    });
  }

  private deleteTag(id: number): void {
    this.tagService.deleteTag(id).subscribe({
      next: () => {
        this.tags = this.tags.filter((t) => t.id !== id);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        // TODO: show a snackbar/toast here
      }
    });
  }

  trackById(_idx: number, item: ResponseTagDTO): number {
    return item.id;
  }
}
