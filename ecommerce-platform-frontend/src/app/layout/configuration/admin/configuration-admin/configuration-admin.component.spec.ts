import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationAdminComponent } from './configuration-admin.component';

describe('ConfigurationAdminComponent', () => {
  let component: ConfigurationAdminComponent;
  let fixture: ComponentFixture<ConfigurationAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
