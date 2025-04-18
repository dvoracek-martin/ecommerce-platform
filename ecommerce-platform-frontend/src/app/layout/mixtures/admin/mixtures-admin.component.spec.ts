import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MixturesAdminComponent } from './mixtures-admin.component';

describe('MixturesAdminComponent', () => {
  let component: MixturesAdminComponent;
  let fixture: ComponentFixture<MixturesAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MixturesAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MixturesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
