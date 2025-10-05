import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer, BehaviorSubject, of } from 'rxjs';
import { catchError, retry, retryWhen, delayWhen, map, tap, shareReplay } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { ApolloQueryResult } from '@apollo/client/core';

import {
  ApiResponse,
  PaginationOptions,
  ServiceConfig,
  ApiError,
  CacheConfig
} from './types';

/**
 * Base service class providing common functionality for all data services
 * Includes HTTP client, GraphQL integration, error handling, caching, and retry logic
 */
@Injectable({
  providedIn: 'root'
})
export abstract class BaseService {
  protected readonly http = inject(HttpClient);
  protected readonly apollo = inject(Apollo);

  // Service configuration
  protected config: ServiceConfig = {
    apiBaseUrl: '/api/v1',
    graphqlEndpoint: '/graphql',
    websocketUrl: '/socket.io',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    enableOfflineMode: true
  }

  // Cache configuration
  protected cacheConfig: CacheConfig = {
    keyPrefix: 'app_cache_',
    defaultTTL: 300000,
    maxSize: 100,
    storage: 'memory'
  }

  // In-memory cache
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  // Loading states
  protected loadingSubjects = new Map<string, BehaviorSubject<boolean>>()

  // Error handling
  protected lastError$ = new BehaviorSubject<ApiError | null>(null);

  /**
   * Make HTTP GET request with error handling and caching
   */
  protected get<T>(
    endpoint: string,
    params?: HttpParams | Record<string, any>,
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      retryAttempts?: number;
    } = {}
  ): Observable<ApiResponse<T>> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    const cacheKey = this.generateCacheKey('GET', url, params);

    // Check cache first
    if (options.useCache !== false && this.config.enableCaching) {
      const cached = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    const httpParams = params instanceof HttpParams ? params : this.buildHttpParams(params);

    return this.http.get<ApiResponse<T>>(url, { params: httpParams }).pipe(
      retry(options.retryAttempts ?? this.config.retryAttempts),
      tap(response => {
        if (options.useCache !== false && this.config.enableCaching) {
          this.setCachedData(cacheKey, response, options.cacheTTL);
        }
      }),
      catchError(this.handleError.bind(this)),
      shareReplay(1)
    );
  }

  /**
   * Make HTTP POST request with error handling
   */
  protected post<T>(
    endpoint: string,
    body: any,
    options: { retryAttempts?: number } = {}
  ): Observable<ApiResponse<T>> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;

    return this.http.post<ApiResponse<T>>(url, body).pipe(
      retry(options.retryAttempts ?? this.config.retryAttempts),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Make HTTP PUT request with error handling
   */
  protected put<T>(
    endpoint: string,
    body: any,
    options: { retryAttempts?: number } = {}
  ): Observable<ApiResponse<T>> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;

    return this.http.put<ApiResponse<T>>(url, body).pipe(
      retry(options.retryAttempts ?? this.config.retryAttempts),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Make HTTP DELETE request with error handling
   */
  protected delete<T>(
    endpoint: string,
    options: { retryAttempts?: number } = {}
  ): Observable<ApiResponse<T>> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;

    return this.http.delete<ApiResponse<T>>(url).pipe(
      retry(options.retryAttempts ?? this.config.retryAttempts),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Execute GraphQL query with error handling and caching
   */
  protected query<T>(
    query: DocumentNode,
    variables?: any,
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      errorPolicy?: 'none' | 'ignore' | 'all';
      fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache';
    } = {}
  ): Observable<T> {
    return this.apollo.query<T>({
      query,
      variables,
      errorPolicy: options.errorPolicy || 'all',
      fetchPolicy: options.fetchPolicy || 'cache-first'
    }).pipe(
      map((result: ApolloQueryResult<T>) => {
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        return result.data;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Execute GraphQL mutation with error handling
   */
  protected mutate<T>(
    mutation: DocumentNode,
    variables?: any,
    options: {
      errorPolicy?: 'none' | 'ignore' | 'all';
      optimisticResponse?: any;
      update?: any;
    } = {}
  ): Observable<T> {
    return this.apollo.mutate<T>({
      mutation,
      variables,
      errorPolicy: options.errorPolicy || 'all',
      optimisticResponse: options.optimisticResponse,
      update: options.update
    }).pipe(
      map((result: any) => {
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        return result.data;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Set loading state for a specific operation
   */
  protected setLoading(key: string, loading: boolean): void {
    if (!this.loadingSubjects.has(key)) {
      this.loadingSubjects.set(key, new BehaviorSubject<boolean>(false));
    }
    this.loadingSubjects.get(key)!.next(loading);
  }

  /**
   * Get loading state observable for a specific operation
   */
  protected getLoading(key: string): Observable<boolean> {
    if (!this.loadingSubjects.has(key)) {
      this.loadingSubjects.set(key, new BehaviorSubject<boolean>(false));
    }
    return this.loadingSubjects.get(key)!.asObservable()
  }

  /**
   * Handle HTTP and GraphQL errors
   */
  protected handleError(error: any): Observable<never> {
    let apiError: ApiError;

    if (error instanceof HttpErrorResponse) {
      // HTTP error
      apiError = {
        code: error.status.toString(),
        message: error.error?.message || error.message || 'An HTTP error occurred',
        details: error.error,
        timestamp: new Date(),
        path: error.url || undefined,
        statusCode: error.status
      }
    } else if (error.networkError) {
      // GraphQL network error
      apiError = {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        details: error,
        timestamp: new Date(),
        statusCode: error.networkError.status
      }
    } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      // GraphQL error
      const gqlError = error.graphQLErrors[0]
      apiError = {
        code: gqlError.extensions?.code || 'GRAPHQL_ERROR',
        message: gqlError.message,
        details: gqlError,
        timestamp: new Date(),
        path: gqlError.path?.join('.') || undefined
      }
    } else {
      // Generic error
      apiError = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: error,
        timestamp: new Date()
      }
    }

    // Store last error
    this.lastError$.next(apiError);

    // Log error for debugging
    console.error('Service Error:', apiError);

    return throwError(() => apiError);
  }

  /**
   * Build HTTP params from object
   */
  private buildHttpParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams()

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key]
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return httpParams;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(method: string, url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${this.cacheConfig.keyPrefix}${method}_${url}_${paramString}`;
  }

  /**
   * Get cached data if valid
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCachedData(key: string, data: any, ttl?: number): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheConfig.defaultTTL
    });
  }

  /**
   * Clear all cached data
   */
  protected clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear specific cached data by pattern
   */
  protected clearCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Build pagination params
   */
  protected buildPaginationParams(options?: PaginationOptions): Record<string, any> {
    const params: Record<string, any> = {};

    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.sortBy) params.sortBy = options.sortBy;
    if (options?.sortOrder) params.sortOrder = options.sortOrder;
    if (options?.filters) {
      Object.assign(params, options.filters);
    }

    return params;
  }

  /**
   * Get the last error observable
   */
  public getLastError(): Observable<ApiError | null> {
    return this.lastError$.asObservable()
  }

  /**
   * Clear the last error
   */
  public clearLastError(): void {
    this.lastError$.next(null);
  }

  /**
   * Update service configuration
   */
  public updateConfig(config: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current service configuration
   */
  public getConfig(): ServiceConfig {
    return { ...this.config }
  }
}