import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { CafeDetectionService } from '@app/frontend-utils';
import { map, tap } from 'rxjs';

/**
 * CafeGuard detects the current cafe from hostname and makes it available to routes.
 *
 * Responsibilities:
 * 1. Detects cafe from hostname via GraphQL API
 * 2. Stores cafe info in route data for child components
 * 3. Validates cafe is active
 *
 * Note: User permissions are checked separately via RoleGuard
 *
 * @example
 * ```typescript
 * {
 *   path: 'menu',
 *   loadChildren: () => import('./menu'),
 *   canActivate: [CafeGuard, RoleGuard]  // CafeGuard first, then RoleGuard
 * }
 *
 * // In component:
 * const cafeId = injectRouteData<string>('cafeId');
 * const cafe = injectRouteData<Cafe>('cafe');
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CafeGuard {
  private readonly router = inject(Router);
  private readonly cafeDetection = inject(CafeDetectionService);

  canActivate(route: ActivatedRouteSnapshot) {
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
