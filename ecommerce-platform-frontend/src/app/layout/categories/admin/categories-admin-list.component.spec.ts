import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CategoriesAdminListComponent} from './categories-admin-list.component';

describe('CategoriesAdminListComponent', () => {
  let component: CategoriesAdminListComponent;
  let fixture: ComponentFixture<CategoriesAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoriesAdminListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CategoriesAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
