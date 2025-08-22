import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../../../services/category.service';
import { TagService } from '../../../services/tag.service';
import { CreateCategoryDTO } from '../../../dto/category/create-category-dto';
import { ResponseTagDTO } from '../../../dto/tag/response-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { ResponseMediaDTO } from '../../../dto/category/response-media-dto';

@Component({
  selector: 'app-categories-admin-create',
  templateUrl: './categories-admin-create.component.html',
  standalone: false,
  styleUrls: ['./categories-admin-create.component.scss']
})
export class CategoriesAdminCreateComponent implements OnInit {
  categoryForm!: FormGroup;
  saving = false;
  allTags: ResponseTagDTO[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private tagService: TagService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadTags();
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required, Validators.minLength(3)],
      description: [''],
      priority: [0, [Validators.required]],
      active: [false],
      // new multi-select of tag IDs
      tagIds: [[]],
      uploadMediaDTOs: this.fb.array([])
    });
  }

  private loadTags() {
    this.tagService.getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tags => this.allTags = tags,
        // error: () => this.dialog.open(ConfirmationDialogComponent, {
        //   data: { title: 'Error', message: 'Could not load tags.', warn: true }
        // })
      });
  }

  get mediaControls(): FormArray {
    return this.categoryForm.get('uploadMediaDTOs') as FormArray;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    Array.from(input.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.mediaControls.push(this.createMediaGroup(reader, file));
      reader.readAsDataURL(file);
    });
  }

  private createMediaGroup(reader: FileReader, file: File): FormGroup {
    const base64 = (reader.result as string).split(',')[1];
    return this.fb.group({
      base64Data: [base64],
      objectKey: [`${Date.now()}_${file.name}`],
      contentType: [file.type],
      preview: [reader.result]
    });
  }

  openMediaDeleteDialog(i: number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Delete Media', message: 'Really delete this media?', warn: true }
    }).afterClosed().subscribe(ok => {
      if (ok) this.mediaControls.removeAt(i);
    });
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.mediaControls.controls, event.previousIndex, event.currentIndex);
  }

  onSave(): void {
    if (this.categoryForm.invalid) return;

    this.saving = true;
    const payload: CreateCategoryDTO = this.categoryForm.value;
    // payload now has name, description, tagIds: number[], uploadMediaDTOs

    this.categoryService.createCategories([payload])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/admin/categories']);
        },
        error: err => {
          this.saving = false;
          console.error('Creation failed:', err);
          this.dialog.open(ConfirmationDialogComponent, {
            data: { title: 'Error', message: 'Could not create category.', warn: true }
          });
        }
      });
  }

  openCancelDialog(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Cancel Creation', message: 'Discard changes?', warn: true }
    }).afterClosed().subscribe(ok => {
      if (ok) this.router.navigate(['/admin/categories']);
    });
  }
}
