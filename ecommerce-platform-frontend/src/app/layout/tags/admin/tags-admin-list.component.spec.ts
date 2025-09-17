import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TagsAdminListComponent} from './tags-admin-list.component';

describe('TagsAdminListComponent', () => {
  let component: TagsAdminListComponent;
  let fixture: ComponentFixture<TagsAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TagsAdminListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TagsAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
