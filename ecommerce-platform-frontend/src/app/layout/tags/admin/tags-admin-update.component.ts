import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subject, takeUntil} from 'rxjs';

import {TagService} from '../../../services/tag.service';
import {CategoryService} from '../../../services/category.service';
import {ProductService} from '../../../services/product.service';
import {MixtureService} from '../../../services/mixture.service';

import {UpdateTagDTO} from '../../../dto/tag/update-tag-dto';
import {ConfirmationDialogComponent} from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import {ConfigurationService} from '../../../services/configuration.service';
import {LocaleMapperService} from '../../../services/locale-mapper.service';
import {ResponseLocaleDto} from '../../../dto/configuration/response-locale-dto';
import {LocalizedFieldDTO} from '../../../dto/base/localized-field-dto';
import {MediaDTO} from '../../../dto/media/media-dto';
import {ResponseTagDTO} from '../../../dto/tag/response-tag-dto';

@Component({
  selector: 'app-tags-admin-update',
  templateUrl: './tags-admin-update.component.html',
  styleUrls: ['./tags-admin-update.component.scss'],
  standalone: false
})
export class TagsAdminUpdateComponent implements OnInit, OnDestroy {
  tagForm!: FormGroup;
  saving = false;
  loading = true;
  tagId!: number;

  allCategories: any[] = [];
  allProducts: any[] = [];
  allMixtures: any[] = [];

  private destroy$ = new Subject<void>();
  usedLocales: ResponseLocaleDto[] = [];
  private tag: ResponseTagDTO;

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private mixtureService: MixtureService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigurationService,
    private localeMapperService: LocaleMapperService,
  ) {
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.tagId = +params['id'];
        this.initTabs();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initTabs() {
    this.configService.getLastAppSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.usedLocales = settings.usedLocales.map(locale => ({
            ...locale,
            translatedName: this.localeMapperService.mapLocale(locale.languageCode, locale.regionCode)
          }));
          this.initForm();
          this.loadRelations();
          this.loadTag();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.initForm();
          this.loadRelations();
          this.loadTag();
        }
      });
  }

  onSave(): void {
    if (!this.tagForm || this.tagForm.invalid) {
      this.tagForm?.markAllAsTouched();
      this.snackBar.open('Please correct the highlighted fields.', 'Close', {duration: 5000});
      return;
    }

    this.saving = true;

    // Build localizedFields map according to backend
    const localizedFields: Record<string, LocalizedFieldDTO> = {};
    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      localizedFields[`${locale.languageCode}_${locale.regionCode}`] = {
        name: this.tagForm.get(`name${suffix}`)?.value,
        description: this.tagForm.get(`description${suffix}`)?.value,
        url: this.tagForm.get(`url${suffix}`)?.value
      };
    });

    // Build main payload
    const updateTagDTO: UpdateTagDTO = {
      id: this.tagId,
      localizedFields: localizedFields,
      priority: this.tagForm.get('priority')?.value,
      active: this.tagForm.get('active')?.value,
      media: this.tagForm.get('media')?.value as MediaDTO[],
      translatedName: null,
      translatedDescription: null,
      translatedUrl: null,
      categoryIds: this.tagForm.get('categoryIds')?.value,
      productIds: this.tagForm.get('productIds')?.value,
      mixtureIds: this.tagForm.get('mixtureIds')?.value,
    };

    this.tagService.updateTag(updateTagDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }


  openDeleteDialog(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Tag',
        message: 'This will permanently delete the tag.',
        warn: true
      }
    }).afterClosed().subscribe(ok => {
      if (ok) this.deleteTag();
    });
  }

  openCancelDialog(): void {
    if (this.tagForm.dirty) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {title: 'Cancel Update', message: 'Discard changes?', warn: true}
      }).afterClosed().subscribe(ok => {
        if (ok) this.router.navigate(['/admin/tags']);
      });
    } else {
      this.router.navigate(['/admin/tags']);
    }
  }

  private initForm(): void {
    const formConfig: any = {
      active: [true],
      categoryIds: [[]],
      productIds: [[]],
      mixtureIds: [[]],
      media: this.fb.array([]),
      priority: ['0', [Validators.required, Validators.min(0)]],
    };

    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      formConfig[`name${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
      formConfig[`description${suffix}`] = [''];
      formConfig[`url${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
    });
    this.tagForm = this.fb.group(formConfig);
  }

  private loadRelations(): void {
    this.categoryService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.allCategories = data;
          this.translateCategories();
        }, error: () => this.allCategories = []
      });

    this.productService.getAllProductsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.allProducts = data;
          this.translateProducts();
        }, error: () => this.allProducts = []
      });

    this.mixtureService.getAllMixturesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({next: data => {
        this.allMixtures = data;
        this.translateMixtures();
        }, error: () => this.allMixtures = []});
  }

  private loadTag(): void {
    this.tagService.getTagById(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tag => {
          this.tag = tag;
          this.tagForm.patchValue({
            id: tag.id,
            priority: tag.priority,
            active: tag.active,
            categoryIds: tag.categories.map(c => c.id),
            productIds: tag.products.map(p => p.id),
            mixtureIds: tag.mixtures.map(m => m.id)
          });
          // Set localized fields
          this.usedLocales.forEach(locale => {
            const localeKey = `${locale.languageCode}_${locale.regionCode}`;
            const suffix = `_${locale.languageCode}_${locale.regionCode}`;

            const localizedData = tag.localizedFields?.[localeKey] || {};

            this.tagForm.patchValue({
              [`name${suffix}`]: localizedData['name'] || '',
              [`description${suffix}`]: localizedData['description'] || '',
              [`url${suffix}`]: localizedData['url'] || '',
            });
            this.translateTag();
          });

          this.loading = false;
        },
        error: err => {
          console.error('Failed to load tag:', err);
          this.loading = false;
          this.snackBar.open('Failed to load tag. Please try again later.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/admin/tags']);
        }
      });
  }

  private deleteTag(): void {
    const hasRelations =
      (this.tag.categories && this.tag.categories.length > 0) ||
      (this.tag.products && this.tag.products.length > 0) ||
      (this.tag.mixtures && this.tag.mixtures.length > 0);

    if (hasRelations) {
      const updateTagDTO: UpdateTagDTO = {
        ...this.tag,
        categoryIds: [],
        productIds: [],
        mixtureIds: [],
        localizedFields: this.tag.localizedFields,
        media: this.tag.media,
        translatedName: null,
        translatedDescription: null,
        translatedUrl: null,
      };

      this.tagService.updateTag(updateTagDTO)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.callDelete(),
          error: err => {
            console.error('Failed to remove relations before delete:', err);
            this.snackBar.open('Failed to remove tag relations.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
          }
        });
    } else {
      this.callDelete();
    }
  }

  private callDelete(): void {
    this.tagService.deleteTag(this.tagId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Tag deleted successfully!', 'Close', {duration: 3000});
          this.router.navigate(['/admin/tags']);
        },
        error: err => {
          console.error('Delete failed:', err);
          this.snackBar.open('Failed to delete tag.', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
        }
      });
  }


  private handleSaveSuccess(): void {
    this.saving = false;
    this.snackBar.open('Tag created successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/tags']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Creation failed:', err);
    this.snackBar.open('Failed to create tag', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }

  private translateTag() {
    this.tag.translatedName = this.tagService.getLocalizedName(this.tag);
    this.tag.translatedDescription = this.tagService.getLocalizedDescription(this.tag);
    this.tag.translatedUrl = this.tagService.getLocalizedUrl(this.tag);

  }

  private translateCategories() {
    this.allCategories.forEach(category => {
      console.log('cat ' + JSON.stringify(category));
      this.categoryService.getCategoryById(category.id).subscribe(responseCategoryDTO => {
          category.translatedName = this.categoryService.getLocalizedName(responseCategoryDTO);
        }
      )
    });
  }

  private translateProducts() {
    this.allProducts.forEach(product => {
      this.productService.getProductById(product.id).subscribe(responseProductDTO => {
        product.translatedName = this.productService.getLocalizedName(responseProductDTO);
      })
    });
  }

  private translateMixtures() {
    this.allMixtures.forEach(mixture => {
      this.mixtureService.getMixtureById(mixture.id).subscribe(responseMixtureDTO => {
        mixture.translatedName = this.mixtureService.getLocalizedName(responseMixtureDTO);
      });
    })
  }
}
