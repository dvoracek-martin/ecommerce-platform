import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsAdminComponent } from './tags-admin.component';

describe('TagsAdminComponent', () => {
  let component: TagsAdminComponent;
  let fixture: ComponentFixture<TagsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TagsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
