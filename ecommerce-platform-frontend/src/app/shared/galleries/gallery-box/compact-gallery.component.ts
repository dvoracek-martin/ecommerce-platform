import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ResponseProductDTO } from '../../../dto/product/response-product-dto';
import {MatIcon} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-compact-gallery',
  templateUrl: './compact-gallery.component.html',
  imports: [
    MatIcon,
    TranslatePipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./compact-gallery.component.scss']
})
export class CompactGalleryComponent {
  @Input() product!: ResponseProductDTO;
  @Input() activeSlideIndex: number = 0;
  @Output() slideChange = new EventEmitter<number>();
  @Output() openGallery = new EventEmitter<void>();
  @Output() prevSlide = new EventEmitter<void>();
  @Output() nextSlide = new EventEmitter<void>();

  onPrevSlide(event: Event): void {
    event.stopPropagation();
    this.prevSlide.emit();
  }

  onNextSlide(event: Event): void {
    event.stopPropagation();
    this.nextSlide.emit();
  }

  onGoToSlide(index: number, event: Event): void {
    event.stopPropagation();
    this.slideChange.emit(index);
  }

  onOpenGallery(event: Event): void {
    event.stopPropagation();
    this.openGallery.emit();
  }
}
