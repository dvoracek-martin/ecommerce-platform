import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailResendDialogComponent } from './email-resend-dialog.component';

describe('EmailResendDialogComponent', () => {
  let component: EmailResendDialogComponent;
  let fixture: ComponentFixture<EmailResendDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmailResendDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailResendDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
