import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersDetailAdminComponent } from './orders-detail-admin.component';

describe('OrderDetailComponent', () => {
  let component: OrdersDetailAdminComponent;
  let fixture: ComponentFixture<OrdersDetailAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdersDetailAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersDetailAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
