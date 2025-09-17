import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CategoriesAdminUpdateComponent} from './categories-admin-update.component';

describe('CategoriesAdminUpdateComponent', () => {
  let component: CategoriesAdminUpdateComponent;
  let fixture: ComponentFixture<CategoriesAdminUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoriesAdminUpdateComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CategoriesAdminUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
