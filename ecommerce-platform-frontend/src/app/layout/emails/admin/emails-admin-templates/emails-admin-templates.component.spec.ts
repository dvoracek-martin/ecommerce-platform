import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailsAdminTemplatesComponent } from './emails-admin-templates.component';

describe('EmailsComponent', () => {
  let component: EmailsAdminTemplatesComponent;
  let fixture: ComponentFixture<EmailsAdminTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmailsAdminTemplatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailsAdminTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
