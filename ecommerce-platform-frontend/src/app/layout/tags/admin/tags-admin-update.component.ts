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
import * as emoji from "unicode-emoji";
import {BaseEmoji} from "unicode-emoji";

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

  // Icon selector properties
  showIconSelector = false;
  iconSearchTerm = '';
  filteredIcons: string[] = [];
  filteredEmojis: BaseEmoji[] = [];
  selectedIcon: string = '';
  activeIconTab: number = 0; // 0 for material icons, 1 for emojis

  // Track manual URL changes
  private manualUrlChanges: Set<string> = new Set();

  // Material icons list (common icons)
  private materialIcons: string[] = [
    'home', 'shopping_cart', 'favorite', 'search', 'menu', 'close', 'settings',
    'person', 'email', 'phone', 'location_on', 'star', 'check', 'arrow_back',
    'arrow_forward', 'add', 'delete', 'edit', 'save', 'cancel', 'download',
    'upload', 'visibility', 'visibility_off', 'lock', 'lock_open', 'info',
    'warning', 'error', 'help', 'notifications', 'account_circle', 'group',
    'business', 'school', 'local_offer', 'category', 'tag', 'label',
    'local_grocery_store', 'restaurant', 'local_cafe', 'local_bar',
    'directions_car', 'flight', 'hotel', 'local_hospital', 'fitness_center',
    'movie', 'music_note', 'book', 'computer', 'smartphone', 'headphones',
    'camera', 'gamepad', 'sports_esports', 'palette', 'brush', 'photo_camera',
    'videocam', 'mic', 'volume_up', 'hearing', 'lightbulb', 'battery_charging_full',
    'wifi', 'bluetooth', 'usb', 'memory', 'sd_card', 'sim_card', 'router',
    'laptop', 'tablet', 'watch', 'devices', 'power', 'power_off', 'security',
    'fingerprint', 'key', 'vpn_key', 'cloud', 'cloud_download', 'cloud_upload',
    'folder', 'folder_open', 'attachment', 'link', 'insert_drive_file',
    'insert_photo', 'audiotrack', 'movie_creation', 'text_fields', 'format_align_left',
    'format_align_center', 'format_align_right', 'format_bold', 'format_italic',
    'format_underlined', 'format_color_text', 'format_size', 'insert_emoticon',
    'sentiment_satisfied', 'sentiment_dissatisfied', 'mood', 'mood_bad',
    'whatshot', 'thumb_up', 'thumb_down', 'share', 'flag', 'bookmark',
    'schedule', 'today', 'event', 'alarm', 'timer', 'watch_later', 'update',
    'history', 'schedule_send', 'query_builder', 'av_timer', 'hourglass_empty',
    'hourglass_full', 'language', 'translate', 'spellcheck', 'text_format',
    'format_list_bulleted', 'format_list_numbered', 'strikethrough_s',
    'vertical_align_bottom', 'vertical_align_top', 'vertical_align_center',
    'format_clear', 'space_bar', 'format_line_spacing', 'format_indent_increase',
    'format_indent_decrease', 'format_quote', 'format_list_checks', 'format_color_fill',
    'format_paint', 'format_shapes', 'brush', 'highlight', 'gesture', 'pen',
    'format_size', 'insert_chart', 'insert_chart_outlined', 'bar_chart',
    'show_chart', 'pie_chart', 'bubble_chart', 'multiline_chart', 'scatter_plot',
    'show_chart', 'timeline', 'money', 'euro', 'monetization_on', 'attach_money',
    'credit_card', 'account_balance', 'account_balance_wallet', 'receipt',
    'point_of_sale', 'shopping_basket', 'store', 'storefront', 'local_shipping',
    'local_shipping', 'directions_bike', 'directions_bus', 'directions_car',
    'directions_railway', 'directions_boat', 'flight', 'local_taxi', 'pedestrian',
    'traffic', 'map', 'navigation', 'pin_drop', 'place', 'my_location',
    'local_parking', 'local_gas_station', 'local_car_wash', 'local_atm',
    'local_convenience_store', 'local_florist', 'local_pharmacy', 'local_pizza',
    'local_printshop', 'local_movies', 'local_library', 'local_activity'
  ];

  // Emoji list (full from library)
  private emojis: BaseEmoji[] = emoji.getEmojis();

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
    this.filteredIcons = [...this.materialIcons];
    this.filteredEmojis = [...this.emojis];
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

  // Color picker method - UPDATED to mark form dirty
  onColorChange(event: any): void {
    const color = event.target.value;
    this.tagForm.patchValue({ color });
    this.markFormDirty(); // Mark form as dirty when color changes
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
          this.setupNameUrlSync();
          this.loadRelations();
          this.loadTag();
        },
        error: () => {
          this.usedLocales = [{languageCode: 'en', regionCode: 'US', translatedName: 'English'}];
          this.initForm();
          this.setupNameUrlSync();
          this.loadRelations();
          this.loadTag();
        }
      });
  }

  private setupNameUrlSync(): void {
    this.usedLocales.forEach(locale => {
      const nameControl = this.tagForm.get(`name_${locale.languageCode}_${locale.regionCode}`);
      const urlControl = this.tagForm.get(`url_${locale.languageCode}_${locale.regionCode}`);

      if (nameControl && urlControl) {
        nameControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(name => {
          const localeKey = `${locale.languageCode}_${locale.regionCode}`;

          // Only auto-fill URL if it hasn't been manually changed for this locale
          if (!this.manualUrlChanges.has(localeKey) && name && name.trim()) {
            const normalizedUrl = this.normalizeName(name);
            urlControl.setValue(normalizedUrl, { emitEvent: false });
          }
        });

        // Track manual URL changes
        urlControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(url => {
          const localeKey = `${locale.languageCode}_${locale.regionCode}`;
          if (url && url.trim()) {
            this.manualUrlChanges.add(localeKey);
          }
        });
      }
    });
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  // Check if a string is an emoji
  isEmoji(str: string): boolean {
    if (!str) return false;
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;
    return emojiRegex.test(str);
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

    // Build main payload with new properties
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
      color: this.tagForm.get('color')?.value,
      icon: this.tagForm.get('icon')?.value,
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

  // Icon selector methods
  openIconSelector(): void {
    this.selectedIcon = this.tagForm.get('icon')?.value || '';
    this.showIconSelector = true;
    this.iconSearchTerm = '';
    this.activeIconTab = 0;
    this.filterIcons();
    this.filterEmojis();
  }

  closeIconSelector(): void {
    this.showIconSelector = false;
    this.iconSearchTerm = '';
    this.filteredIcons = [...this.materialIcons];
    this.filteredEmojis = [...this.emojis];
  }

  filterIcons(): void {
    if (!this.iconSearchTerm) {
      this.filteredIcons = [...this.materialIcons];
    } else {
      const searchTerm = this.iconSearchTerm.toLowerCase();
      this.filteredIcons = this.materialIcons.filter(icon =>
        icon.toLowerCase().includes(searchTerm)
      );
    }
  }

  filterEmojis(): void {
    if (!this.iconSearchTerm) {
      this.filteredEmojis = [...this.emojis];
    } else {
      const searchTerm = this.iconSearchTerm.toLowerCase();
      this.filteredEmojis = this.emojis.filter(e =>
        e.description.toLowerCase().includes(searchTerm) ||
        e.emoji.toLowerCase().includes(searchTerm)
      );
    }
  }

  selectIcon(icon: string | BaseEmoji): void {
    if (typeof icon === 'string') {
      this.selectedIcon = icon;
    } else {
      this.selectedIcon = icon.emoji;
    }
  }

  // UPDATED to mark form dirty
  confirmIconSelection(): void {
    if (this.selectedIcon) {
      this.tagForm.patchValue({ icon: this.selectedIcon });
      this.markFormDirty(); // Mark form as dirty when icon changes
    }
    this.closeIconSelector();
  }

  onIconTabChange(index: number): void {
    this.activeIconTab = index;
    this.iconSearchTerm = '';
    if (index === 0) {
      this.filterIcons();
    } else {
      this.filterEmojis();
    }
  }

  onIconSearchChange(): void {
    if (this.activeIconTab === 0) {
      this.filterIcons();
    } else {
      this.filterEmojis();
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
      color: ['#3498db', [Validators.required]],
      icon: [''] // No longer required
    };

    this.usedLocales.forEach(locale => {
      const suffix = `_${locale.languageCode}_${locale.regionCode}`;
      formConfig[`name${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
      formConfig[`description${suffix}`] = [''];
      formConfig[`url${suffix}`] = ['', [Validators.required, Validators.minLength(3)]];
    });
    this.tagForm = this.fb.group(formConfig);
  }

  // Helper method to mark form as dirty
  private markFormDirty(): void {
    if (this.tagForm) {
      this.tagForm.markAsDirty();
    }
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
      .subscribe({
        next: data => {
          this.allMixtures = data;
          this.translateMixtures();
        }, error: () => this.allMixtures = []
      });
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
            mixtureIds: tag.mixtures.map(m => m.id),
            color: tag.color || '#3498db',
            icon: tag.icon || ''
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
        color: this.tag.color,
        icon: this.tag.icon
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
    this.snackBar.open('Tag updated successfully!', 'Close', {duration: 3000});
    this.router.navigate(['/admin/tags']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    console.error('Update failed:', err);
    this.snackBar.open('Failed to update tag', 'Close', {duration: 5000, panelClass: ['error-snackbar']});
  }

  private translateTag() {
    this.tag.translatedName = this.tagService.getLocalizedName(this.tag);
    this.tag.translatedDescription = this.tagService.getLocalizedDescription(this.tag);
    this.tag.translatedUrl = this.tagService.getLocalizedUrl(this.tag);
  }

  private translateCategories() {
    this.allCategories.forEach(category => {
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
