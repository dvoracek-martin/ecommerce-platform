import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-auth-popup',
  templateUrl: './auth-popup.component.html',
  standalone: false,
  styleUrls: ['./auth-popup.component.scss']
})
export class AuthPopupComponent {
  @Output() closePopup = new EventEmitter<void>();
  isRegisterMode = false;

  switchToRegister(): void {
    this.isRegisterMode = true;
  }

  switchToLogin(): void {
    this.isRegisterMode = false;
  }

  // Tato metoda se volá po úspěšném loginu nebo registraci a zavře popup.
  onSuccess(): void {
    this.closePopup.emit();
  }
}
