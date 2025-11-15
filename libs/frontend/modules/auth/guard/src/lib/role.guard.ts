import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AUTH_KEY, AuthService } from '@app/frontend-modules-auth/service';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { map, of } from 'rxjs';

export type UserRole = 'admin' | 'employee' | 'customer' | 'kitchen_staff';

export interface RoleGuardData {
  roles: UserRole[];
  redirectTo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleGuard {
  private readonly auth = inject(AuthService);
  private readonly cookie = inject(SsrCookieService);
  private readonly router = inject(Router);
  private readonly platform = inject(PLATFORM_ID);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const requiredRoles = (route.data?.['roles'] as UserRole[]) || [];
    const redirectTo = (route.data?.['redirectTo'] as string) || '/';

    // on the server we need to check if we have a token and fetch the user
    if (isPlatformServer(this.platform)) {
      console.log('RoleGuard: checking roles on server side', this.cookie.getAll());

      if (this.cookie.check(AUTH_KEY)) {
        console.log('RoleGuard: found auth cookie');

        return this.auth.fetchUser().pipe(
          map((user) => {
            if (!user?.id) {
              this.router.navigate(['/auth/login']);
              return false;
            }

            // If no specific roles required, just check if authenticated
            if (requiredRoles.length === 0) {
              return true;
            }

            // Check if user has one of the required roles
            const userRole = user.role as UserRole;
            const hasRequiredRole = requiredRoles.includes(userRole);

            if (!hasRequiredRole) {
              this.router.navigate([redirectTo]);
              return false;
            }

            return true;
          }),
        );
      }
      return of(false);
    }

    // on the client we can just check the state
    if (!this.auth?.state.loggedIn()) {
      this.auth.state.login({
        appState: { target: state.url },
      });

      return false;
    }

    const user = this.auth?.state.user();

    if (!user?.id) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // If no specific roles required, just check if authenticated
    if (requiredRoles.length === 0) {
      return true;
    }

    // Check if user has one of the required roles
    const userRole = user.role as UserRole;
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      this.router.navigate([redirectTo]);
      return false;
    }

    return true;
  }
}
