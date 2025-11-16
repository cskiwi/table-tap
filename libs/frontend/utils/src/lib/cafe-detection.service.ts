import { Injectable, PLATFORM_ID, inject, signal, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Apollo } from 'apollo-angular';
import { Observable, map, of, catchError, tap } from 'rxjs';
import { gql } from 'apollo-angular';
import { Cafe, CafeHostname } from '@app/models';
import { REQUEST } from '../injection-tokens/request.token';

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
  private readonly injector = inject(Injector);
  
  // Cache the detected cafe in memory to prevent unnecessary re-fetches
  private readonly _detectedCafe = signal<Cafe | null>(null);
  
  /**
   * Returns the currently detected cafe as a signal.
   * This can be used by components to reactively access the cafe data.
   */
  readonly detectedCafe = this._detectedCafe.asReadonly();

  /**
   * Detects which cafe the user is visiting by querying the GraphQL API.
   * Uses the current hostname to look up the cafe in the database.
   *
   * Priority:
   * 1. Check in-memory cache (signal)
   * 2. GraphQL lookup by current hostname (uses cache-first for better performance)
   * 3. Fallback to environment variable (for localhost testing)
   *
   * @returns Observable of cafe information, or null if not found
   */
  detectCafeByHostname(): Observable<Cafe | null> {
    // Return cached cafe if available
    const cached = this._detectedCafe();
    if (cached) {
      console.log('[CafeDetection] Using cached cafe:', { id: cached.id, name: cached.name });
      return of(cached);
    }

    const hostname = this.getCurrentHostname();

    if (!hostname) {
      console.warn('[CafeDetection] No hostname available');
      return of(null);
    } 

    console.log('[CafeDetection] Detecting cafe for hostname:', hostname);

    // Query GraphQL API to find cafe by hostname
    // Use cache-first to prevent re-fetching on page reloads
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
        fetchPolicy: 'cache-first', // Use cached data to prevent redirect on reload
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
        tap((cafe) => {
          // Cache the result in memory
          if (cafe) {
            this._detectedCafe.set(cafe);
          }
        }),
        catchError((error) => {
          console.error('[CafeDetection] Error detecting cafe:', error);
          return of(null);
        }),
      );
  }

  /**
   * Gets current hostname for debugging.
   * Works on both client and server side.
   */
  getCurrentHostname(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.hostname;
    }
    
    // On server side, get REQUEST from the injector
    // This allows us to access it at runtime when the provider is available
    const request = this.injector.get(REQUEST, null);
    
    console.log('[CafeDetection] Getting hostname on server', {
      hasRequest: !!request,
      requestType: typeof request,
      hasHeaders: !!request?.headers,
      headersKeys: request?.headers ? Object.keys(request.headers).slice(0, 10) : [],
    });
    
    // On server side, get hostname from Express request headers
    if (request?.headers) {
      // Express request has headers as an object with string keys
      const host = request.headers['host'] || request.headers.host;
      
      if (host) {
        // Remove port if present
        const hostname = host.split(':')[0];
        console.log('[CafeDetection] Server-side hostname detected:', hostname);
        return hostname;
      }
    }
    
    console.warn('[CafeDetection] No hostname available on server');
    return null;
  }

  /**
   * Clears the cached cafe data.
   * Useful when you need to force a refresh of the cafe information.
   */
  clearCache(): void {
    this._detectedCafe.set(null);
    console.log('[CafeDetection] Cache cleared');
  }
}
