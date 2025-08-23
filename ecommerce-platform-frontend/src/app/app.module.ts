// src/app/app.module.ts
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppComponent} from './app.component';
import {WelcomeComponent} from './layout/welcome/welcome.component';
import {UserLoginComponent} from './auth/user-login/user-login.component';
import {UserRegistrationComponent} from './auth/user-registration/user-registration.component';
import {CustomersComponent} from './layout/customers/customers.component';
import {AuthPopupComponent} from './auth/auth-popup/auth-popup.component';
import {AppRoutingModule} from './app-routing.module';
import {MaterialModule} from './material.module';

import {TranslateLoader, TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {HttpLoaderFactory} from './translate-http-loader.factory';
import {RouterModule} from '@angular/router';
import {ForgotPasswordComponent} from './auth/forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './auth/reset-password/reset-password.component';
import {MixingComponent} from './layout/mixing/mixing.component';
import {ProductsComponent} from './layout/products/products.component';
import {CategoriesComponent} from './layout/categories/categories.component';
import {MixturesComponent} from './layout/mixtures/mixtures/mixtures.component';
import {MixturesAdminComponent} from './layout/mixtures/admin/mixtures-admin.component';
import {ProductsAdminListComponent} from './layout/products/admin/products-admin-list.component';
import {CategoriesAdminCreateComponent} from './layout/categories/admin/categories-admin-create.component';
import {MixingAdminComponent} from './layout/mixing/admin/mixing-admin.component';
import {OrdersComponent} from './layout/orders/client/orders.component';
import {OrdersAdminComponent} from './layout/orders/admin/orders-admin.component';
import {TagsAdminCreateComponent} from './layout/tags/admin/tags-admin-create.component';
import {CustomersAdminComponent} from './layout/customers/admin/customers-admin.component';
import {CartComponent} from './layout/cart/client/cart.component';
import {CdkDropList, DragDropModule} from '@angular/cdk/drag-drop';
import {UnauthorizedComponent} from './layout/unauthorized/client/unauthorized.component';
import {
  CategoriesAdminListComponent
} from './layout/categories/admin/categories-admin-list.component';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {ConfirmationDialogComponent} from './shared/confirmation-dialog.component';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import {CategoriesAdminUpdateComponent} from './layout/categories/admin/categories-admin-update.component';
import {ProductsAdminCreateComponent} from './layout/products/admin/products-admin-create.component';
import {ProductsAdminUpdateComponent} from './layout/products/admin/products-admin-update.component';
import {AuthInterceptor} from './auth/auth.interceptor';
import {TagsAdminUpdateComponent} from './layout/tags/admin/tags-admin-update.component';
import {TagsAdminListComponent} from './layout/tags/admin/tags-admin-list.component';
import {MatTable} from '@angular/material/table';
import {MatBadgeModule} from '@angular/material/badge';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    UserRegistrationComponent,
    UserLoginComponent,
    AuthPopupComponent,
    CustomersComponent,
    CustomersAdminComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    MixingComponent,
    MixturesComponent,
    ProductsComponent,
    CategoriesComponent,
    MixingAdminComponent,
    MixturesAdminComponent,
    ProductsAdminListComponent,
    ProductsAdminCreateComponent,
    ProductsAdminUpdateComponent,
    CategoriesAdminCreateComponent,
    OrdersComponent,
    OrdersAdminComponent,
    TagsAdminCreateComponent,
    TagsAdminUpdateComponent,
    TagsAdminListComponent,
    CartComponent,
    UnauthorizedComponent,
    CategoriesAdminListComponent,
    CategoriesAdminUpdateComponent,
    ConfirmationDialogComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MaterialModule,
    MatBadgeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    CdkDropList,
    MatProgressSpinner,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogClose,
    TranslatePipe,
    DragDropModule,
    MatTable
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
