import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-auth-popup',
  templateUrl: './auth-popup.component.html',
  standalone: false,
  styleUrls: ['./auth-popup.component.scss']
})
export class AuthPopupComponent {
  @Output() closePopup = new EventEmitter<void>();
  isRegisterMode = false;
  showForgotPassword = false;

  switchToRegister(event: Event): void {
    event.preventDefault();
    this.isRegisterMode = true;
    this.showForgotPassword = false;
  }

  switchToLogin(event?: Event): void {
    if (event) event.preventDefault();
    this.isRegisterMode = false;
    this.showForgotPassword = false;
  }

  onSuccess(): void {
    this.closePopup.emit();
  }

  openForgotPassword(event?: Event): void {
    if (event) event.preventDefault();
    this.showForgotPassword = true;
    this.isRegisterMode = false;
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.closePopup.emit();
  }
}
