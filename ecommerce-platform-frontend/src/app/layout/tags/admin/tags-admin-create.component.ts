import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TagService } from '../../../services/tag.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { MixtureService } from '../../../services/mixture.service';
import { CreateTagDTO } from '../../../dto/tag/create-tag-dto';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-tags-admin-create',
  templateUrl: './tags-admin-create.component.html',
  standalone: false,
  styleUrls: ['./tags-admin-create.component.scss']
})
export class TagsAdminCreateComponent implements OnInit {
  tagForm!: FormGroup;
  saving = false;
  allCategories = [];
  allProducts = [];
  allMixtures = [];

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRelations();
  }

  private initForm(): void {
    this.tagForm = this.fb.group({
      name: ['', Validators.required],
      categories: [[]],
      products: [[]],
      mixtures: [[]]
    });
  }

  private loadRelations(): void {
    this.categoryService.getAllCategoriesAdmin().subscribe(data => this.allCategories = data);
    this.productService.getAllProductsAdmin().subscribe(data => this.allProducts = data);
    this.mixtureService.getAllMixturesAdmin().subscribe(data => this.allMixtures = data);
  }

  onSave(): void {
    if (this.tagForm.invalid) return;
    this.saving = true;

    const dto: CreateTagDTO = this.tagForm.value;
    this.tagService.createTags([dto]).subscribe({
      next: () => this.router.navigate(['/admin/tags']),
      error: () => this.saving = false
    });
  }

  onCancel(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'COMMON.CANCEL_CONFIRM_TITLE',
        message: 'COMMON.CANCEL_CONFIRM_MESSAGE'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.router.navigate(['/admin/tags']);
    });
  }
}
