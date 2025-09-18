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

import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpLoaderFactory} from './translate-http-loader.factory';
import {RouterModule} from '@angular/router';
import {ForgotPasswordComponent} from './auth/forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './auth/reset-password/reset-password.component';
import {MixingComponent} from './layout/mixing/mixing.component';
import {ProductsListComponent} from './layout/products/products-list.component';
import {CategoriesComponent} from './layout/categories/categories.component';
import {MixturesComponent} from './layout/mixtures/mixtures/mixtures.component';
import {MixturesAdminComponent} from './layout/mixtures/admin/mixtures-admin.component';
import {CategoriesAdminCreateComponent} from './layout/categories/admin/categories-admin-create.component';
import {MixingAdminComponent} from './layout/mixing/admin/mixing-admin.component';
import {OrderListComponent} from './layout/orders/client/order-list.component';
import {TagsAdminCreateComponent} from './layout/tags/admin/tags-admin-create.component';
import {CustomersAdminComponent} from './layout/customers/admin/customers-admin.component';
import {CartComponent} from './layout/cart/client/cart.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {UnauthorizedComponent} from './layout/unauthorized/client/unauthorized.component';
import {CategoriesAdminListComponent} from './layout/categories/admin/categories-admin-list.component';
import {ConfirmationDialogComponent} from './shared/confirmation-dialog/confirmation-dialog.component';
import {CategoriesAdminUpdateComponent} from './layout/categories/admin/categories-admin-update.component';
import {ProductsAdminCreateComponent} from './layout/products/admin/products-admin-create.component';
import {ProductsAdminUpdateComponent} from './layout/products/admin/products-admin-update.component';
import {AuthInterceptor} from './auth/auth.interceptor';
import {TagsAdminUpdateComponent} from './layout/tags/admin/tags-admin-update.component';
import {TagsAdminListComponent} from './layout/tags/admin/tags-admin-list.component';
import {CheckoutComponent} from './layout/checkout/checkout/checkout.component';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import {OrderDetailComponent} from './layout/orders/client/order-detail.component';
import {OrderListAdminComponent} from './layout/orders/admin/order-list-admin.component';
import {OrderDetailAdminComponent} from './layout/orders/admin/order-detail-admin.component';
import {ProductsAdminListComponent} from './layout/products/admin/products-admin-list.component';
import {ProductsDetailComponent} from './layout/products/products-detail.component';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {HeaderComponent} from './shared/header/header.component';

const myTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 500,
  hideDelay: 100,
  touchendHideDelay: 100
};

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
    ProductsListComponent,
    ProductsDetailComponent,
    CategoriesComponent,
    MixingAdminComponent,
    MixturesAdminComponent,
    ProductsAdminListComponent,
    ProductsAdminCreateComponent,
    ProductsAdminUpdateComponent,
    CategoriesAdminCreateComponent,
    OrderListComponent,
    OrderListAdminComponent,
    OrderDetailComponent,
    OrderDetailAdminComponent,
    TagsAdminCreateComponent,
    TagsAdminUpdateComponent,
    TagsAdminListComponent,
    CartComponent,
    UnauthorizedComponent,
    CategoriesAdminListComponent,
    CategoriesAdminUpdateComponent,
    ConfirmationDialogComponent,
    CheckoutComponent,
    HeaderComponent
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
    DragDropModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    MatChip,
    MatChipSet,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myTooltipDefaults}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
