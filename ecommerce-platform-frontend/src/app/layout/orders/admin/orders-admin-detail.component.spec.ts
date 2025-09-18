import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersAdminDetailComponent } from './orders-admin-detail.component';

describe('OrderDetailComponent', () => {
  let component: OrdersAdminDetailComponent;
  let fixture: ComponentFixture<OrdersAdminDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdersAdminDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersAdminDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
