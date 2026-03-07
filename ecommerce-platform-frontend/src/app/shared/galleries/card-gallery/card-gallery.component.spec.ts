import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardGalleryComponent } from './card-gallery.component';
import {BaseUpdateOrResponseDTO} from '../../../dto/base/base-update-or-response.dto';

describe('CardGalleryComponent', () => {
  let component: CardGalleryComponent<BaseUpdateOrResponseDTO>;
  let fixture: ComponentFixture<CardGalleryComponent<BaseUpdateOrResponseDTO>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardGalleryComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardGalleryComponent<BaseUpdateOrResponseDTO>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
