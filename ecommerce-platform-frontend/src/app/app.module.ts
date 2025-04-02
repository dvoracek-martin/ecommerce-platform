// src/app/app.module.ts
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppComponent} from './app.component';
import {WelcomeComponent} from './layout/welcome/welcome.component';
import {UserLoginComponent} from './auth/user-login/user-login.component';
import {UserRegistrationComponent} from './auth/user-registration/user-registration.component';
import {CustomerDetailComponent} from './layout/customer-detail/customer-detail.component';
import {AuthPopupComponent} from './auth/auth-popup/auth-popup.component';
import {AppRoutingModule} from './app-routing.module';
import {MaterialModule} from './material.module';

import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpLoaderFactory} from './translate-http-loader.factory';
import {RouterModule} from '@angular/router';
import {ForgotPasswordComponent} from './auth/forgot-password/forgot-password.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    UserRegistrationComponent,
    UserLoginComponent,
    AuthPopupComponent,
    CustomerDetailComponent,
    ForgotPasswordComponent,
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
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
