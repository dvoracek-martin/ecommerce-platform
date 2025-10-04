import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullScreenGalleryComponent } from './full-screen-gallery.component';

describe('FullScreenGalleryModalComponent', () => {
  let component: FullScreenGalleryComponent;
  let fixture: ComponentFixture<FullScreenGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FullScreenGalleryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullScreenGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
