import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersAdminDetailComponent } from './customers-admin-detail.component';

describe('CustomersDetailComponent', () => {
  let component: CustomersAdminDetailComponent;
  let fixture: ComponentFixture<CustomersAdminDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomersAdminDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomersAdminDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
