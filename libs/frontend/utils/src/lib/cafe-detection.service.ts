import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Apollo } from 'apollo-angular';
import { Observable, map, of, catchError } from 'rxjs';
import { gql } from 'apollo-angular';
import { Cafe, CafeHostname } from '@app/models';

/**
 * Service for detecting the current cafe from hostname.
 *
 * Uses GraphQL API to lookup cafe by current hostname.
 * The backend resolver matches hostname to cafe via the CafeHostname table.
 *
 * @example
 * ```typescript
 * // Hostname: my-cafe.tabletap.com
 * service.detectCafeByHostname() // => Observable<CafeInfo>
 * ```
 */
const GET_CAFE_BY_HOSTNAME = gql`
  query GetCafe($args: CafeHostnameArgs) {
    cafeHostnames(args: $args) {
      id
      cafe {
        id
        name
        isActive
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CafeDetectionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apollo = inject(Apollo);

  /**
   * Detects which cafe the user is visiting by querying the GraphQL API.
   * Uses the current hostname to look up the cafe in the database.
   *
   * Priority:
   * 1. GraphQL lookup by current hostname
   * 2. Fallback to environment variable (for localhost testing)
   *
   * @returns Observable of cafe information, or null if not found
   */
  detectCafeByHostname(): Observable<Cafe | null> {
    const hostname = this.getCurrentHostname();

    if (!hostname) {
      console.warn('[CafeDetection] No hostname available');
      return of(null);
    }

    console.log('[CafeDetection] Detecting cafe for hostname:', hostname);

    // Query GraphQL API to find cafe by hostname
    return this.apollo
      .query<{ cafeHostnames: CafeHostname[] }>({
        query: GET_CAFE_BY_HOSTNAME,
        variables: {
          args: {
            take: 1,
            where: [
              {
                hostname: {
                  eq: hostname,
                },
              },
            ],
          },
        },
        fetchPolicy: 'network-only', // Always fetch fresh data
      })
      .pipe(
        map((result) => {
          const cafe = result.data.cafeHostnames[0]?.cafe;
          if (cafe) {
            console.log('[CafeDetection] Cafe detected:', { id: cafe.id, name: cafe.name, hostname });
          } else {
            console.warn('[CafeDetection] No cafe found for hostname:', hostname);
          }
          return cafe;
        }),
        catchError((error) => {
          console.error('[CafeDetection] Error detecting cafe:', error);
          return of(null);
        }),
      );
  }

  /**
   * Gets current hostname for debugging.
   */
  getCurrentHostname(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return window.location.hostname;
  }
}
