import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import {ResponseProductDTO} from '../../../dto/product/response-product-dto';
import {NgForOf, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-fullscreen-gallery',
  templateUrl: './full-screen-gallery.component.html',
  imports: [
    NgIf,
    MatIcon
  ],
  styleUrls: ['./full-screen-gallery.component.scss']
})
export class FullscreenGalleryComponent {
  @Input() product!: ResponseProductDTO;
  @Input() activeSlideIndex: number = 0;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() slideChange = new EventEmitter<number>();
  @Output() prevSlide = new EventEmitter<void>();
  @Output() nextSlide = new EventEmitter<void>();

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    if (event.key === 'Escape') {
      this.onClose();
    } else if (event.key === 'ArrowLeft') {
      this.onPrevSlide();
    } else if (event.key === 'ArrowRight') {
      this.onNextSlide();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onPrevSlide(): void {
    this.prevSlide.emit();
  }

  onNextSlide(): void {
    this.nextSlide.emit();
  }

  onGoToSlide(index: number): void {
    this.slideChange.emit(index);
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
