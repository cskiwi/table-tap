import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AUTH_KEY, AuthService } from '@app/frontend-modules-auth/service';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { map, of } from 'rxjs';

/**
 * CafeGuard ensures that a user has a valid cafeId before accessing protected routes.
 *
 * This guard prevents users from navigating beyond the landing page without a properly
 * loaded cafe context. It validates that:
 * 1. User is authenticated
 * 2. User has a valid cafeId assigned
 *
 * Routes protected by this guard will redirect to the home page if cafe validation fails.
 *
 * @example
 * ```typescript
 * {
 *   path: 'menu',
 *   loadChildren: () => import('./menu'),
 *   canActivate: [CafeGuard]
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CafeGuard {
  private readonly auth = inject(AuthService);
  private readonly cookie = inject(SsrCookieService);
  private readonly router = inject(Router);
  private readonly platform = inject(PLATFORM_ID);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const redirectTo = (route.data?.['redirectTo'] as string) || '/';

    // Server-side rendering: check auth cookie and fetch user
    if (isPlatformServer(this.platform)) {
      console.log('CafeGuard: checking cafe on server side');

      if (this.cookie.check(AUTH_KEY)) {
        console.log('CafeGuard: found auth cookie, fetching user');

        return this.auth.fetchUser().pipe(
          map((user) => {
            if (!user?.id) {
              console.warn('CafeGuard: user not found, redirecting to login');
              this.router.navigate(['/auth/login']);
              return false;
            }

            if (!user.cafeId) {
              console.warn('CafeGuard: user has no cafeId, redirecting to home');
              this.router.navigate([redirectTo]);
              return false;
            }

            console.log('CafeGuard: cafe validation passed', { userId: user.id, cafeId: user.cafeId });
            return true;
          }),
        );
      }

      console.warn('CafeGuard: no auth cookie found');
      return of(false);
    }

    // Client-side: check auth state
    if (!this.auth?.state.loggedIn()) {
      console.warn('CafeGuard: user not logged in, redirecting to login');
      this.auth.state.login({
        appState: { target: state.url },
      });
      return false;
    }

    const user = this.auth?.state.user();

    if (!user?.id) {
      console.warn('CafeGuard: user has no ID, redirecting to login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!user.cafeId) {
      console.warn('CafeGuard: user has no cafeId, redirecting to home', { userId: user.id });
      this.router.navigate([redirectTo]);
      return false;
    }

    console.log('CafeGuard: cafe validation passed', { userId: user.id, cafeId: user.cafeId });
    return true;
  }
}
