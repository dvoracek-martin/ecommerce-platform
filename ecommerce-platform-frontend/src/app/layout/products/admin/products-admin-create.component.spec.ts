import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsAdminCreateComponent } from './products-admin-create.component';

describe('ProductsAdminCreateComponent', () => {
  let component: ProductsAdminCreateComponent;
  let fixture: ComponentFixture<ProductsAdminCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductsAdminCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsAdminCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
