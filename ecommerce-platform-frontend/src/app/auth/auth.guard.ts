import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // 1) Must be logged in
    if (!this.authService.isTokenValid()) {
      // preserve the attempted URL for redirecting after login
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // 2) If the route defines required roles, check them
    const requiredRoles = route.data['roles'] as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAnyRole = requiredRoles.some(role => this.authService.hasRole(role));
      if (!hasAnyRole) {
        // Redirect to Unauthorized Page
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    // 3) All checks passed
    return true;
  }
}
