import {Component, EventEmitter, Output} from '@angular/core';
import {AuthService} from '../../services/auth.service';

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
  isRegistrationComplete = false;

  switchToRegister(event: Event): void {
    event.preventDefault();
    this.isRegisterMode = true;
    this.showForgotPassword = false;
    this.isRegistrationComplete = false;
  }

  switchToLogin(event?: Event): void {
    if (event) event.preventDefault();
    this.isRegisterMode = false;
    this.showForgotPassword = false;
    this.isRegistrationComplete = false;
  }

  onSuccess(): void {
    this.closePopup.emit();
  }

  onRegisterSuccess(): void {
    this.isRegistrationComplete = true;
    setTimeout(() => {
      this.closePopup.emit();
    }, 30000);
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
