import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationLocalizationAdminComponent } from './configuration-localization-admin.component';

describe('ConfigurationAdminComponent', () => {
  let component: ConfigurationLocalizationAdminComponent;
  let fixture: ComponentFixture<ConfigurationLocalizationAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationLocalizationAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationLocalizationAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
