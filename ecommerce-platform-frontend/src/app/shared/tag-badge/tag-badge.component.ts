import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ResponseTagDTO } from '../../dto/tag/response-tag-dto';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-tag-badge',
  templateUrl: './tag-badge.component.html',
  imports: [
    MatIcon,
    MatTooltip,
    NgIf
  ],
  styleUrls: ['./tag-badge.component.scss']
})
export class TagBadgeComponent {
  @Input() tag!: ResponseTagDTO;
  @Output() tagClicked = new EventEmitter<ResponseTagDTO>();

  onTagClick(event: Event): void {
    event.stopPropagation();
    this.tagClicked.emit(this.tag);
  }
}
