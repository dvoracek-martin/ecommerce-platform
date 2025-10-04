import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompactGalleryComponent } from './compact-gallery.component';

describe('GalleryBoxComponent', () => {
  let component: CompactGalleryComponent;
  let fixture: ComponentFixture<CompactGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompactGalleryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompactGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
