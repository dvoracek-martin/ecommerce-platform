import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetailAdminComponent } from './order-detail-admin.component';

describe('OrderDetailComponent', () => {
  let component: OrderDetailAdminComponent;
  let fixture: ComponentFixture<OrderDetailAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderDetailAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderDetailAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
