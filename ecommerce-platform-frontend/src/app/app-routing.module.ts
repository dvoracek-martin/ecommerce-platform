import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './layout/welcome/welcome.component';
import { UserRegistrationComponent } from './auth/user-registration/user-registration.component';
import { AuthPopupComponent } from './auth/auth-popup/auth-popup.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent }, // Výchozí welcome page
  { path: 'register', component: UserRegistrationComponent },
  // Pokud potřebujete samostatnou routu pro auth-popup, můžete ji mít, ale v našem případě ji ovládáme přímo v AppComponent
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
