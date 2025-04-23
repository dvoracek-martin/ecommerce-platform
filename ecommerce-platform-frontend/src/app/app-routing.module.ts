// src/app/app-routing.module.ts

import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard }                    from './auth/auth.guard';
import { WelcomeComponent }             from './layout/welcome/welcome.component';
import { UserRegistrationComponent }    from './auth/user-registration/user-registration.component';
import { ResetPasswordComponent }       from './auth/reset-password/reset-password.component';
import { CustomersComponent }           from './layout/customers/customers.component';
import { ProductsComponent }            from './layout/products/products.component';
import { MixingComponent }              from './layout/mixing/mixing.component';
import { CategoriesComponent }          from './layout/categories/categories.component';
import { MixturesComponent }            from './layout/mixtures/mixtures/mixtures.component';
import { OrdersComponent }              from './layout/orders/client/orders.component';
import { CartComponent }                from './layout/cart/client/cart.component';

// Admin pages
import { CustomersAdminComponent } from './layout/customers/admin/customers-admin.component';
import { ProductsAdminListComponent }  from './layout/products/admin/products-admin-list.component';
import { MixingAdminComponent }    from './layout/mixing/admin/mixing-admin.component';
import { CategoriesAdminCreateComponent }from './layout/categories/admin/categories-admin-create.component';
import { MixturesAdminComponent }  from './layout/mixtures/admin/mixtures-admin.component';
import { TagsAdminComponent }      from './layout/tags/admin/tags-admin.component';
import { OrdersAdminComponent }    from './layout/orders/admin/orders-admin.component';
import {UnauthorizedComponent} from './layout/unauthorized/client/unauthorized.component';
import {CategoriesAdminListComponent} from './layout/categories/admin/categories-admin-list.component';
import {CategoriesAdminUpdateComponent} from './layout/categories/admin/categories-admin-update.component';
import {
  ProductsAdminCreateComponent
} from './layout/products/admin/products-admin-create.component';
import {
  ProductsAdminUpdateComponent
} from './layout/products/admin/products-admin-update.component';

const routes: Routes = [
  // Public / authenticated client routes
  { path: '',          component: WelcomeComponent },
  { path: 'register',  component: UserRegistrationComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'categories',component: CategoriesComponent},
  { path: 'mixtures',  component: MixturesComponent},
  { path: 'products',  component: ProductsComponent},
  { path: 'mixing',    component: MixingComponent},

  // Client‑side pages (require login)
  { path: 'customer',  component: CustomersComponent, canActivate: [AuthGuard] },
  { path: 'orders',    component: OrdersComponent,    canActivate: [AuthGuard] },
  { path: 'cart',      component: CartComponent,      canActivate: [AuthGuard] },

  // Admin routes (only for user_admin role)
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { roles: ['user_admin'] },
    children: [
      { path: '',           redirectTo: 'customers', pathMatch: 'full' },
      { path: 'customers',  component: CustomersAdminComponent },
      { path: 'products',   component: ProductsAdminListComponent },
      { path: 'products/create', component: ProductsAdminCreateComponent },
      { path: 'products/update/:id', component: ProductsAdminUpdateComponent },
      { path: 'mixing',     component: MixingAdminComponent },
      { path: 'categories', component: CategoriesAdminListComponent },
      { path: 'categories/create', component: CategoriesAdminCreateComponent },
      { path: 'categories/update/:id', component: CategoriesAdminUpdateComponent },
      { path: 'mixtures',   component: MixturesAdminComponent },
      { path: 'tags',       component: TagsAdminComponent },
      { path: 'orders',     component: OrdersAdminComponent }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
