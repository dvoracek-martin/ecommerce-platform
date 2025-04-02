import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './layout/welcome/welcome.component';
import { UserRegistrationComponent } from './auth/user-registration/user-registration.component';
import { CustomerDetailComponent } from './layout/customer-detail/customer-detail.component';
import { AuthGuard } from './auth/auth.guard';
import {ResetPasswordComponent} from './auth/reset-password/reset-password.component';

const routes: Routes = [
  { path: 'customer', component: CustomerDetailComponent, canActivate: [AuthGuard] },  // Moved up
  { path: 'register', component: UserRegistrationComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', component: WelcomeComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
