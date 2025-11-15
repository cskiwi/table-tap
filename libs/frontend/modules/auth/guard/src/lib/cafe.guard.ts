import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AUTH_KEY, AuthService } from '@app/frontend-modules-auth/service';
import { CafeDetectionService } from '@app/frontend-utils';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { map, of, switchMap, tap } from 'rxjs';

/**
 * CafeGuard detects the current cafe from hostname and makes it available to routes.
 *
 * New behavior (hostname-based):
 * 1. Detects cafe from hostname via GraphQL API
 * 2. Stores cafe info in route data for child components
 * 3. User permissions are checked separately via RoleGuard
 *
 * The detected cafe is independent of user authentication and is based purely
 * on which hostname/domain is being visited.
 *
 * @example
 * ```typescript
 * {
 *   path: 'menu',
 *   loadChildren: () => import('./menu'),
 *   canActivate: [CafeGuard]
 * }
 *
 * // In component:
 * const cafeId = this.route.snapshot.data['cafeId'];
 * const cafe = this.route.snapshot.data['cafe'];
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
  private readonly cafeDetection = inject(CafeDetectionService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const redirectTo = (route.data?.['redirectTo'] as string) || '/';

    console.log('[CafeGuard] Detecting cafe from hostname...');

    // Detect cafe from hostname (works both client and server side)
    return this.cafeDetection.detectCafeByHostname().pipe(
      tap((cafe) => {
        if (cafe) {
          console.log('[CafeGuard] Cafe detected:', { id: cafe.id, name: cafe.name });
          // Store cafe info in route data for child components to access
          route.data = {
            ...route.data,
            cafe,
            cafeId: cafe.id,
          };
        } else {
          console.warn('[CafeGuard] No cafe detected for current hostname');
        }
      }),
      map((cafe) => {
        if (!cafe) {
          console.warn('[CafeGuard] No cafe found, redirecting to home');
          this.router.navigate([redirectTo]);
          return false;
        }

        if (!cafe.isActive) {
          console.warn('[CafeGuard] Cafe is not active, redirecting to home');
          this.router.navigate([redirectTo]);
          return false;
        }

        console.log('[CafeGuard] Cafe guard passed, cafe is available in route.data');
        return true;
      })
    );
  }
}
