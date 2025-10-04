import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import {BaseUpdateOrResponseDTO} from '../../../dto/base/base-update-or-response.dto';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-card-gallery',
  templateUrl: './card-gallery.component.html',
  imports: [
    MatIcon,
    TranslatePipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./card-gallery.component.scss']
})
export class CardGalleryComponent<T extends BaseUpdateOrResponseDTO> implements OnInit, OnDestroy {
  @Input() item!: T;
  @Input() itemIndex!: number;
  @Input() activeSlideIndex: number = 0;
  @Input() showActions: boolean = true;
  @Input() aspectRatio: string = '4/5'; // Default aspect ratio for products
  @Output() slideChange = new EventEmitter<{index: number, slideIndex: number}>();
  @Output() itemClick = new EventEmitter<T>();

  private interval: any;

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  startCarousel(): void {
    if (!this.item?.media || this.item.media.length <= 1) return;
    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      this.autoAdvanceSlide();
    }, 5000);
  }

  private autoAdvanceSlide(): void {
    if (!this.item?.media) return;
    const nextIndex = (this.activeSlideIndex + 1) % this.item.media.length;
    this.slideChange.emit({ index: this.itemIndex, slideIndex: nextIndex });
  }

  onPrevSlide(event: Event): void {
    event.stopPropagation();
    if (!this.item?.media) return;
    const prevIndex = (this.activeSlideIndex - 1 + this.item.media.length) % this.item.media.length;
    this.slideChange.emit({ index: this.itemIndex, slideIndex: prevIndex });
    this.restartCarousel();
  }

  onNextSlide(event: Event): void {
    event.stopPropagation();
    if (!this.item?.media) return;
    const nextIndex = (this.activeSlideIndex + 1) % this.item.media.length;
    this.slideChange.emit({ index: this.itemIndex, slideIndex: nextIndex });
    this.restartCarousel();
  }

  onGoToSlide(slideIndex: number, event: Event): void {
    event.stopPropagation();
    this.slideChange.emit({ index: this.itemIndex, slideIndex });
    this.restartCarousel();
  }

  onItemClick(): void {
    this.itemClick.emit(this.item);
  }

  private restartCarousel(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.startCarousel();
    }
  }
}
