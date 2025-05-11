import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TagService } from '../../../services/tag.service';
import { UpdateTagDTO } from '../../../dto/tag/update-tag-dto';
import { ResponseTagDTO } from '../../../dto/tag/response-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-tags-admin-update',
  templateUrl: './tags-admin-update.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-update.component.scss']
})
export class TagsAdminUpdateComponent implements OnInit {
  tagForm!: FormGroup;
  saving = false;
  loading = true;
  tagId!: number;

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.tagId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadTag();
  }

  private initForm(): void {
    this.tagForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      color: ['#3f51b5', Validators.required],
      icon: ['tag', Validators.required],
      imageUrl: ['']
    });
  }

  private loadTag(): void {
    this.tagService.getTagById(this.tagId).subscribe({
      next: (tag) => {
        this.tagForm.patchValue({
          name: tag.name,
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load tag:', err);
        this.loading = false;
        // Show error notification
      }
    });
  }

  onSave(): void {
    if (this.tagForm.invalid) return;

    this.saving = true;
    const payload: UpdateTagDTO = {
      id: this.tagId,
      ...this.tagForm.value
    };

    this.tagService.updateTag(payload).subscribe({
      next: () => this.handleSaveSuccess(),
      error: (err) => this.handleSaveError(err)
    });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.router.navigate(['/admin/tags']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Tag update failed:', err);
    // Show error notification
  }

  openCancelDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Discard Changes',
        message: 'Are you sure you want to discard unsaved changes?',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.router.navigate(['/admin/tags']);
    });
  }
}
