import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailsAdminSendComponent } from './emails-admin-send.component';

describe('EmailsAdminSendComponent', () => {
  let component: EmailsAdminSendComponent;
  let fixture: ComponentFixture<EmailsAdminSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmailsAdminSendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailsAdminSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
