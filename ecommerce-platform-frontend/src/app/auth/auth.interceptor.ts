import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private apiVersion = 'v1';
  private configurationApiUrl = '/api/configuration/';
  private usersApiUrl = '/api/users/';
  private catalogApiUrl = '/api/catalog/';

  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Zajistí, že URL vždy začíná jen od /api/...
    const url = req.url.replace(/^https?:\/\/[^\/]+/, '');

    // ==============================
    // Public CONFIGURATION endpoints
    // ==============================
    if (url.includes(this.configurationApiUrl + this.apiVersion + '/last')
      || url.includes(this.configurationApiUrl + this.apiVersion + '/in-use-locales')
      || url.includes(this.configurationApiUrl + this.apiVersion + '/active-categories-for-mixing')) {
      return next.handle(req);
    }

    // ==============================
    // Public USER endpoints
    // ==============================
    if (url.includes(this.usersApiUrl + this.apiVersion + '/forgot-password')
      || url.includes(this.usersApiUrl + this.apiVersion + '/create')
      || url.includes(this.usersApiUrl + this.apiVersion + '/reset-password')) {
      return next.handle(req);
    }

    // ==============================
    // Public CATALOG endpoints
    // ==============================
    if (url.includes(this.catalogApiUrl + this.apiVersion + '/active-categories')
      || url.includes(this.catalogApiUrl + this.apiVersion + '/active-products-for-display-in-products')
      || url.includes(this.catalogApiUrl + this.apiVersion + '/all-tags')
      || url.startsWith(this.catalogApiUrl + this.apiVersion + '/tags/')
      || url.includes(this.catalogApiUrl + this.apiVersion + '/products')) {
      return next.handle(req);
    }

    // ==============================
    // Add Authorization header
    // ==============================
    const authToken = this.authService.token;
    if (authToken) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`)
      });
      return next.handle(authReq);
    }

    // Pokud není token, pustíme request bez úprav
    return next.handle(req);
  }
}
