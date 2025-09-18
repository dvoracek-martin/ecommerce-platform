import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersAdminListComponent } from './orders-admin-list.component';

describe('OrdersComponent', () => {
  let component: OrdersAdminListComponent;
  let fixture: ComponentFixture<OrdersAdminListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdersAdminListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
