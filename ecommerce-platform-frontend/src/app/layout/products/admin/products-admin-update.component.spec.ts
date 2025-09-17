import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ProductsAdminUpdateComponent} from './products-admin-update.component';

describe('ProductsAdminUpdateComponent', () => {
  let component: ProductsAdminUpdateComponent;
  let fixture: ComponentFixture<ProductsAdminUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductsAdminUpdateComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProductsAdminUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
