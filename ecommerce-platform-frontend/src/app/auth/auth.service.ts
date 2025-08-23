// src/app/services/auth.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private tokenExpirationKey = 'token_expiration';
  private refreshTimeout: any;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private readonly keycloakTokenUrl = 'http://localhost:9090/realms/ecommerce-platform/protocol/openid-connect/token';
  private readonly clientId = 'ecommerce-platform-client';

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticatedSubject.next(this.isTokenValid());
      this.scheduleTokenRefresh();
    }
  }

  getRoles(): string[] {
    const token = this.token;
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);
      return decoded.realm_access?.roles || [];
    } catch (e) {
      console.error('Error decoding roles:', e);
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  get token(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.accessTokenKey);
    }
    return null;
  }

  storeToken(response: any): void {
    if (isPlatformBrowser(this.platformId)) {
      const expiresIn = response.expires_in * 1000;
      const expirationTime = Date.now() + expiresIn;

      localStorage.setItem(this.accessTokenKey, response.access_token);
      localStorage.setItem(this.refreshTokenKey, response.refresh_token);
      localStorage.setItem(this.tokenExpirationKey, expirationTime.toString());

      this.scheduleTokenRefresh();
    }
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.tokenExpirationKey);
      clearTimeout(this.refreshTimeout);
      this.snackBar.open('Logout successful!', 'Close', { duration: 5000 });
    }
    this.isAuthenticatedSubject.next(false);
  }

  isTokenValid(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const expiration = localStorage.getItem(this.tokenExpirationKey);
      return expiration ? new Date().getTime() < parseInt(expiration, 10) : false;
    }
    return false;
  }

  getUserId(): string | null {
    const token = this.token;
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub || decoded.userId;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  getUsername(): string {
    const token = this.token;
    if (!token) return '';
    const decoded: any = jwtDecode(token);
    return decoded.preferred_username;
  }

  getEmail(): string {
    const token = this.token;
    if (!token) return '';
    const decoded: any = jwtDecode(token);
    return decoded.email;
  }

  private scheduleTokenRefresh(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const expiration = localStorage.getItem(this.tokenExpirationKey);
    if (!expiration) return;

    const expiresIn = parseInt(expiration, 10) - Date.now();
    const refreshThreshold = 30000;

    if (expiresIn > refreshThreshold) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken().subscribe();
      }, expiresIn - refreshThreshold);
    }
  }

  private refreshToken() {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      this.logout();
      return of(null);
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.clientId);
    body.set('refresh_token', refreshToken);

    return this.http.post(this.keycloakTokenUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => this.storeToken(response)),
      catchError(error => {
        this.snackBar.open('Session expired. Please login again.', 'Close', { duration: 5000 });
        this.logout();
        return throwError(() => error);
      })
    );
  }
}
