import { Injectable, inject, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map, tap, of, catchError } from 'rxjs';
import { GET_CAFE_BY_HOSTNAME, GET_CAFE_DETAILS } from '../graphql/cafe.queries';

export interface CafeInfo {
  id: string;
  name: string;
  description?: string;
  slug: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  status?: string;
  address?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
}

/**
 * Service to manage the current cafe context.
 * Provides cafe information based on hostname detection.
 * This replaces user.cafeId throughout the application.
 */
@Injectable({
  providedIn: 'root',
})
export class CafeService {
  private readonly apollo = inject(Apollo);

  // Signals for reactive cafe state
  private readonly cafeSignal = signal<CafeInfo | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly cafe = this.cafeSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /**
   * Get the current cafe ID.
   * Returns null if no cafe is loaded.
   */
  get cafeId(): string | null {
    return this.cafeSignal()?.id ?? null;
  }

  /**
   * Fetch cafe information by hostname.
   * This is called by the CafeGuard to detect which cafe is being visited.
   *
   * @param hostname - The hostname to lookup (e.g., "my-cafe.tabletap.com")
   * @returns Observable of cafe information or null if not found
   */
  fetchCafeByHostname(hostname: string): Observable<CafeInfo | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.apollo
      .query<{ cafeByHostname: CafeInfo | null }>({
        query: GET_CAFE_BY_HOSTNAME,
        variables: { hostname },
        fetchPolicy: 'network-only', // Always fetch fresh data for hostname lookup
      })
      .pipe(
        map((result) => result.data.cafeByHostname),
        tap((cafe) => {
          this.cafeSignal.set(cafe);
          this.loadingSignal.set(false);
          if (!cafe) {
            this.errorSignal.set(`No cafe found for hostname: ${hostname}`);
          }
        }),
        catchError((error) => {
          console.error('[CafeService] Error fetching cafe by hostname:', error);
          this.errorSignal.set(error.message || 'Failed to fetch cafe');
          this.loadingSignal.set(false);
          this.cafeSignal.set(null);
          return of(null);
        })
      );
  }

  /**
   * Fetch cafe details by ID.
   * Used when we already have a cafe ID (e.g., from route params).
   *
   * @param cafeId - The cafe ID to fetch
   * @returns Observable of cafe information
   */
  fetchCafeById(cafeId: string): Observable<CafeInfo | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.apollo
      .query<{ cafe: CafeInfo | null }>({
        query: GET_CAFE_DETAILS,
        variables: { id: cafeId },
        fetchPolicy: 'cache-first', // Use cache for ID-based lookups
      })
      .pipe(
        map((result) => result.data.cafe),
        tap((cafe) => {
          this.cafeSignal.set(cafe);
          this.loadingSignal.set(false);
          if (!cafe) {
            this.errorSignal.set(`No cafe found with ID: ${cafeId}`);
          }
        }),
        catchError((error) => {
          console.error('[CafeService] Error fetching cafe by ID:', error);
          this.errorSignal.set(error.message || 'Failed to fetch cafe');
          this.loadingSignal.set(false);
          this.cafeSignal.set(null);
          return of(null);
        })
      );
  }

  /**
   * Set cafe information directly.
   * Used when cafe info is provided from route data or guard.
   *
   * @param cafe - The cafe information to set
   */
  setCafe(cafe: CafeInfo | null): void {
    this.cafeSignal.set(cafe);
    this.errorSignal.set(null);
  }

  /**
   * Clear the current cafe context.
   */
  clearCafe(): void {
    this.cafeSignal.set(null);
    this.errorSignal.set(null);
  }
}
