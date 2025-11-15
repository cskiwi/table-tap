import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Apollo } from 'apollo-angular';
import { Observable, map, of, catchError } from 'rxjs';
import { gql } from 'apollo-angular';

/**
 * Service for detecting the current cafe context.
 *
 * Priority order:
 * 1. Environment variable (NEXT_PUBLIC_CAFE_ID) - for localhost testing
 * 2. Hostname-based detection (subdomain.tabletap.com)
 * 3. User's default/current cafe (fallback)
 *
 * @example
 * ```typescript
 * // Environment: NEXT_PUBLIC_CAFE_ID=cafe-123
 * service.detectCafeId(user) // => 'cafe-123'
 *
 * // Hostname: my-cafe.tabletap.com
 * service.detectCafeId(user) // => user.cafes.find(c => c.slug === 'my-cafe').id
 *
 * // No hostname/env: localhost
 * service.detectCafeId(user) // => user.currentCafeId || user.cafes[0].id
 * ```
 */
const GET_CAFE_BY_HOSTNAME = gql`
  query GetCafeByHostname($hostname: String!) {
    cafeByHostname(hostname: $hostname) {
      id
      name
      description
      slug
      logo
      website
      isActive
      status
    }
  }
`;

export interface CafeInfo {
  id: string;
  name: string;
  description?: string;
  slug: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  status?: string;
}

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
  detectCafeByHostname(): Observable<CafeInfo | null> {
    const hostname = this.getCurrentHostname();

    if (!hostname) {
      console.warn('[CafeDetection] No hostname available');
      return of(null);
    }

    console.log('[CafeDetection] Detecting cafe for hostname:', hostname);

    // Query GraphQL API to find cafe by hostname
    return this.apollo
      .query<{ cafeByHostname: CafeInfo | null }>({
        query: GET_CAFE_BY_HOSTNAME,
        variables: { hostname },
        fetchPolicy: 'network-only', // Always fetch fresh data
      })
      .pipe(
        map((result) => {
          const cafe = result.data.cafeByHostname;
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
        })
      );
  }

  /**
   * DEPRECATED: Use detectCafeByHostname() instead.
   * Returns cafe ID from environment variable only.
   */
  detectVisitingCafeId(): string | null {
    // Priority 1: Environment variable (for localhost testing)
    const envCafeId = this.getEnvironmentCafeId();
    if (envCafeId) {
      console.log('[CafeDetection] Using environment cafe ID:', envCafeId);
      return envCafeId;
    }

    console.warn('[CafeDetection] No cafe ID in environment. Use detectCafeByHostname() for hostname-based detection.');
    return null;
  }

  /**
   * DEPRECATED: Use detectVisitingCafeId() instead.
   * This method was conflating visiting cafe with permission cafe.
   */
  detectCafeId(user?: { cafeId?: string }): string | null {
    // For backward compatibility during migration
    const visitingCafe = this.detectVisitingCafeId();
    if (visitingCafe) return visitingCafe;

    // Fallback to user's permission cafe
    return user?.cafeId ?? null;
  }

  /**
   * Gets cafe ID from environment variable.
   * Supports both NEXT_PUBLIC_CAFE_ID and CAFE_ID.
   */
  private getEnvironmentCafeId(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    // Check window object for environment variables injected at build time
    const win = window as any;
    return win.__CAFE_ID__ ||
           win.env?.NEXT_PUBLIC_CAFE_ID ||
           win.env?.CAFE_ID ||
           null;
  }


  /**
   * Extracts subdomain from hostname.
   *
   * Examples:
   * - my-cafe.tabletap.com → "my-cafe"
   * - app.tabletap.com → "app"
   * - tabletap.com → null
   * - localhost → null
   */
  private extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');

    // Need at least 3 parts for subdomain (subdomain.domain.tld)
    if (parts.length < 3) {
      return null;
    }

    // First part is the subdomain
    const subdomain = parts[0];

    // Ignore common non-cafe subdomains
    const ignoredSubdomains = ['www', 'app', 'admin', 'api', 'staging', 'dev'];
    if (ignoredSubdomains.includes(subdomain)) {
      return null;
    }

    return subdomain;
  }

  /**
   * Checks if hostname-based detection is available.
   */
  canDetectFromHostname(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
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
