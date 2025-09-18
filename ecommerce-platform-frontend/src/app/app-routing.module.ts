// src/app/app-routing.module.ts
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from './auth/auth.guard';
import {WelcomeComponent} from './layout/welcome/welcome.component';
import {UserRegistrationComponent} from './auth/user-registration/user-registration.component';
import {ResetPasswordComponent} from './auth/reset-password/reset-password.component';
import {CustomersComponent} from './layout/customers/customers.component';
import {ProductsListComponent} from './layout/products/products-list.component';
import {MixingComponent} from './layout/mixing/mixing.component';
import {CategoriesComponent} from './layout/categories/categories.component';
import {MixturesComponent} from './layout/mixtures/mixtures/mixtures.component';
import {OrderListComponent} from './layout/orders/client/order-list.component';
import {CartComponent} from './layout/cart/client/cart.component';

// Admin pages
import {CustomersAdminComponent} from './layout/customers/admin/customers-admin.component';
import {ProductsAdminListComponent} from './layout/products/admin/products-admin-list.component';
import {MixingAdminComponent} from './layout/mixing/admin/mixing-admin.component';
import {CategoriesAdminCreateComponent} from './layout/categories/admin/categories-admin-create.component';
import {MixturesAdminComponent} from './layout/mixtures/admin/mixtures-admin.component';
import {TagsAdminCreateComponent} from './layout/tags/admin/tags-admin-create.component';
import {UnauthorizedComponent} from './layout/unauthorized/client/unauthorized.component';
import {CategoriesAdminListComponent} from './layout/categories/admin/categories-admin-list.component';
import {CategoriesAdminUpdateComponent} from './layout/categories/admin/categories-admin-update.component';
import {ProductsAdminCreateComponent} from './layout/products/admin/products-admin-create.component';
import {ProductsAdminUpdateComponent} from './layout/products/admin/products-admin-update.component';
import {TagsAdminListComponent} from './layout/tags/admin/tags-admin-list.component';
import {TagsAdminUpdateComponent} from './layout/tags/admin/tags-admin-update.component';
import {ProductsDetailComponent} from './layout/products/products-detail.component';
import {CheckoutComponent} from './layout/checkout/checkout/checkout.component';
import {OrderDetailComponent} from './layout/orders/client/order-detail.component';
import {OrderListAdminComponent} from './layout/orders/admin/order-list-admin.component';
import {OrderDetailAdminComponent} from './layout/orders/admin/order-detail-admin.component';

const routes: Routes = [
  {path: '', component: WelcomeComponent},
  {path: 'register', component: UserRegistrationComponent},
  {path: 'reset-password', component: ResetPasswordComponent},
  {path: 'unauthorized', component: UnauthorizedComponent},
  {path: 'categories', component: CategoriesComponent},
  {path: 'mixtures', component: MixturesComponent},
  {path: 'products', component: ProductsListComponent},
  {path: 'products/:id', component: ProductsDetailComponent},
  {path: 'mixing', component: MixingComponent},
  {path: 'cart', component: CartComponent},
  {path: 'checkout', component: CheckoutComponent},

  // Client‑side pages (require login)
  {path: 'customer', component: CustomersComponent, canActivate: [AuthGuard]},
  {path: 'orders', component: OrderListComponent, canActivate: [AuthGuard]},
  {path: 'orders/detail', component: OrderDetailComponent, canActivate: [AuthGuard]},

  // Admin routes
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: {roles: ['user_admin']},
    children: [
      {path: '', redirectTo: 'customers', pathMatch: 'full'},
      {path: 'customers', component: CustomersAdminComponent},
      {path: 'products', component: ProductsAdminListComponent},
      {path: 'products/create', component: ProductsAdminCreateComponent},
      {path: 'products/update/:id', component: ProductsAdminUpdateComponent},
      {path: 'mixing', component: MixingAdminComponent},
      {path: 'categories', component: CategoriesAdminListComponent},
      {path: 'categories/create', component: CategoriesAdminCreateComponent},
      {path: 'categories/update/:id', component: CategoriesAdminUpdateComponent},
      {path: 'mixtures', component: MixturesAdminComponent},
      {path: 'tags', component: TagsAdminListComponent},
      {path: 'tags/update/:id', component: TagsAdminUpdateComponent},
      {path: 'tags/create', component: TagsAdminCreateComponent},
      {path: 'orders', component: OrderListAdminComponent},
      {path: 'orders/detail', component: OrderDetailAdminComponent},
    ]
  },

  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
