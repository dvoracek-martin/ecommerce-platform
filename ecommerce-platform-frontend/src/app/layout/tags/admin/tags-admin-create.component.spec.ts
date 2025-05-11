import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsAdminCreateComponent } from './tags-admin-create.component';

describe('TagsAdminComponent', () => {
  let component: TagsAdminCreateComponent;
  let fixture: ComponentFixture<TagsAdminCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TagsAdminCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsAdminCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
