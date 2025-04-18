import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MixingAdminComponent } from './mixing-admin.component';

describe('MixingComponent', () => {
  let component: MixingAdminComponent;
  let fixture: ComponentFixture<MixingAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MixingAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MixingAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
