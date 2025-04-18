import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WelcomeComponent} from './layout/welcome/welcome.component';
import {UserRegistrationComponent} from './auth/user-registration/user-registration.component';
import {CustomerDetailComponent} from './layout/customer-detail/customer-detail.component';
import {AuthGuard} from './auth/auth.guard';
import {ResetPasswordComponent} from './auth/reset-password/reset-password.component';
import {ProductsComponent} from './layout/products/products.component';
import {MixingComponent} from './layout/mixing/mixing.component';
import {CategoriesComponent} from './layout/categories/categories.component';
import {CategoriesAdminComponent} from './layout/categories/admin/categories-admin.component';
import {ProductsAdminComponent} from './layout/products/admin/products-admin.component';
import {MixingAdminComponent} from './layout/mixing/admin/mixing-admin.component';
import {MixturesComponent} from './layout/mixtures/mixtures/mixtures.component';
import {MixturesAdminComponent} from './layout/mixtures/admin/mixtures-admin.component';

const routes: Routes = [
  {path: 'customer', component: CustomerDetailComponent, canActivate: [AuthGuard]},  // Moved up
  {path: 'register', component: UserRegistrationComponent},
  {path: 'reset-password', component: ResetPasswordComponent},
  {path: 'products', component: ProductsComponent},
  {path: '/admin/products', component: ProductsAdminComponent},
  {path: 'categories', component: CategoriesComponent},
  {path: '/admin/categories', component: CategoriesAdminComponent},
  {path: 'mixing', component: MixingComponent},
  {path: '/admin/mixing', component: MixingAdminComponent},
  {path: '/mixtures', component: MixturesComponent},
  {path: '/admin/mixtures', component: MixturesAdminComponent},
  {path: '', component: WelcomeComponent},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
