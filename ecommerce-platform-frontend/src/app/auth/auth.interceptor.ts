import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthService} from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private apiVersion = 'v1';
  private configurationApiUrl = 'api/configuration/';
  private usersApiUrl = 'api/users/';

  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for public endpoints

    // CONFIGURATION endpoints that do not require auth
    if (req.url.includes(this.configurationApiUrl + this.apiVersion + '/last')
      || req.url.includes(this.configurationApiUrl + this.apiVersion + '/in-use-locales')
      || req.url.includes(this.configurationApiUrl + this.apiVersion + '/active-products-for-display-in-products')
      || req.url.includes(this.configurationApiUrl + this.apiVersion + '/active-categories-for-mixing')
    ) {
      return next.handle(req);
    }
    // USER endpoints that do not require auth
    if (req.url.includes(this.usersApiUrl + this.apiVersion + '/forgot-password')
      || (req.url.includes(this.usersApiUrl + this.apiVersion + '/create'))
      || req.url.includes(this.usersApiUrl + this.apiVersion + '/reset-password')) {
      return next.handle(req);
    }


    // Add auth header for other requests
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${this.authService.token}`)
    });

    return next.handle(authReq);
  }
}
