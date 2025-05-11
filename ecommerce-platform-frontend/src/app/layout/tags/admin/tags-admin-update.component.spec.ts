import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsAdminUpdateComponent } from './tags-admin-update.component';

describe('TagsAdminUpdateComponent', () => {
  let component: TagsAdminUpdateComponent;
  let fixture: ComponentFixture<TagsAdminUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TagsAdminUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsAdminUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
