import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError, timer } from 'rxjs';
import { map, tap, catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { gql } from 'apollo-angular';

import { BaseService } from '../core/base.service';
import {
  User,
  UserRole,
  AuthTokens,
  LoginCredentials,
  BiometricConfig,
  UserPreferences
} from '../core/types';

// GraphQL Queries
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      firstName
      lastName
      role
      permissions
      cafeId
      isActive
      lastLoginAt
      preferences {
        language
        theme
        notifications {
          email
          push
          sms
        }
        defaultCurrency
      }
    }
  }
`;

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      id
      firstName
      lastName
      preferences {
        language
        theme
        notifications {
          email
          push
          sms
        }
      }
    }
  }
`;

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      expiresIn
      tokenType
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication service handling user login, logout, and session management
 * Integrates with Auth0 for authentication and provides role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {
  private readonly auth0 = inject(Auth0Service);
  private readonly router = inject(Router);

  // State management
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  // Observables
  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly user$ = this.authState$.pipe(map(state => state.user));
  public readonly isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  public readonly isLoading$ = this.authState$.pipe(map(state => state.isLoading));
  public readonly error$ = this.authState$.pipe(map(state => state.error));

  // Convenience observables
  public readonly userRole$ = this.user$.pipe(map(user => user?.role || null));
  public readonly userPermissions$ = this.user$.pipe(map(user => user?.permissions || []));
  public readonly cafeId$ = this.user$.pipe(map(user => user?.cafeId || null));

  // Token refresh
  private tokenRefreshTimer: any;

  constructor() {
    super();

    // Initialize authentication state from Auth0
    this.initializeAuth();

    // Setup automatic token refresh
    this.setupTokenRefresh();
  }

  /**
   * Initialize authentication state from Auth0
   */
  private initializeAuth(): void {
    this.setAuthLoading(true);

    // Check Auth0 authentication status
    this.auth0.isAuthenticated$.pipe(
      switchMap(isAuthenticated => {
        if (isAuthenticated) {
          // Get user profile from Auth0
          return this.auth0.user$.pipe(
            switchMap(auth0User => {
              if (auth0User) {
                // Get complete user profile from our API
                return this.getUserProfile();
              }
              return of(null);
            })
          );
        }
        return of(null);
      }),
      take(1)
    ).subscribe({
      next: (user) => {
        this.updateAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null
        });
      },
      error: (error) => {
        console.error('Auth initialization error:', error);
        this.updateAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Login with email and password (Auth0)
   */
  login(credentials: LoginCredentials): Observable<boolean> {
    this.setAuthLoading(true);
    this.clearAuthError();

    return new Observable(observer => {
      this.auth0.loginWithRedirect({
        appState: { target: '/dashboard' }
      }).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: (error) => {
          this.setAuthError(error.message || 'Login failed');
          this.setAuthLoading(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Login with popup (Auth0)
   */
  loginWithPopup(): Observable<boolean> {
    this.setAuthLoading(true);
    this.clearAuthError();

    return this.auth0.loginWithPopup().pipe(
      switchMap(() => this.getUserProfile()),
      map(user => {
        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return true;
      }),
      catchError(error => {
        this.setAuthError(error.message || 'Login failed');
        this.setAuthLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<boolean> {
    this.setAuthLoading(true);

    // Clear token refresh timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    return this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    }).pipe(
      tap(() => {
        // Clear local state
        this.updateAuthState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });

        // Clear any cached data
        this.clearCache();

        // Redirect to login page
        this.router.navigate(['/login']);
      }),
      map(() => true),
      catchError(error => {
        console.error('Logout error:', error);
        this.setAuthLoading(false);
        return of(false);
      })
    );
  }

  /**
   * Get user profile from API
   */
  getUserProfile(): Observable<User> {
    return this.query<{ me: User }>(GET_USER_PROFILE, {}, {
      useCache: false // Always fetch fresh user data
    }).pipe(
      map(response => response.me),
      tap(user => {
        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      })
    );
  }

  /**
   * Update user profile
   */
  updateUserProfile(input: UpdateUserProfileInput): Observable<User> {
    return this.mutate<{ updateUserProfile: User }>(UPDATE_USER_PROFILE, { input }).pipe(
      map(response => response.updateUserProfile),
      tap(updatedUser => {
        const currentState = this.authStateSubject.value;
        this.updateAuthState({
          user: { ...currentState.user!, ...updatedUser }
        });
      })
    );
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(permissions => permissions.includes(permission))
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): Observable<boolean> {
    return this.userRole$.pipe(
      map(userRole => userRole === role)
    );
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): Observable<boolean> {
    return this.userRole$.pipe(
      map(userRole => userRole ? roles.includes(userRole) : false)
    );
  }

  /**
   * Check if user can access cafe
   */
  canAccessCafe(cafeId: string): Observable<boolean> {
    return this.user$.pipe(
      map(user => {
        if (!user) return false;

        // Super admin can access any cafe
        if (user.role === UserRole.SUPER_ADMIN) return true;

        // Other users can only access their assigned cafe
        return user.cafeId === cafeId;
      })
    );
  }

  /**
   * Get Auth0 access token
   */
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthTokens> {
    return this.auth0.getAccessTokenSilently({ cacheMode: 'off' }).pipe(
      map(token => ({
        accessToken: token,
        refreshToken: '', // Auth0 handles refresh tokens internally
        expiresIn: 3600, // Default expiry
        tokenType: 'Bearer'
      })),
      tap(tokens => {
        this.updateAuthState({ tokens });
      })
    );
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    // Auth0 handles token refresh automatically
    // We just need to listen for token changes
    this.auth0.getAccessTokenSilently().subscribe({
      next: (token) => {
        if (token) {
          const tokens: AuthTokens = {
            accessToken: token,
            refreshToken: '',
            expiresIn: 3600,
            tokenType: 'Bearer'
          };
          this.updateAuthState({ tokens });
        }
      },
      error: (error) => {
        console.error('Token refresh error:', error);
      }
    });
  }

  /**
   * Handle authentication callback (for redirects)
   */
  handleAuthCallback(): Observable<boolean> {
    return this.auth0.handleRedirectCallback().pipe(
      switchMap(() => this.getUserProfile()),
      map(user => {
        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return true;
      }),
      catchError(error => {
        console.error('Auth callback error:', error);
        this.setAuthError(error.message || 'Authentication failed');
        this.setAuthLoading(false);
        return of(false);
      })
    );
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): Observable<boolean> {
    return this.auth0.isAuthenticated$.pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) return of(false);

        // Verify with backend
        return this.getUserProfile().pipe(
          map(() => true),
          catchError(() => of(false))
        );
      })
    );
  }

  /**
   * Get current user synchronously (use with caution)
   */
  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Get current user role synchronously
   */
  getCurrentUserRole(): UserRole | null {
    return this.authStateSubject.value.user?.role || null;
  }

  /**
   * Check if user is authenticated synchronously
   */
  isCurrentlyAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Set user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences
    };

    return this.updateUserProfile({ preferences: updatedPreferences });
  }

  /**
   * Handle authentication errors
   */
  private setAuthError(error: string): void {
    this.updateAuthState({ error, isLoading: false });
  }

  /**
   * Clear authentication error
   */
  private clearAuthError(): void {
    this.updateAuthState({ error: null });
  }

  /**
   * Set authentication loading state
   */
  private setAuthLoading(loading: boolean): void {
    this.updateAuthState({ isLoading: loading });
  }

  /**
   * Update authentication state
   */
  private updateAuthState(updates: Partial<AuthState>): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({
      ...currentState,
      ...updates
    });
  }

  /**
   * Force logout (for security purposes)
   */
  forceLogout(reason?: string): void {
    console.warn('Force logout triggered:', reason);

    this.updateAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: reason || 'Session expired'
    });

    this.clearCache();
    this.router.navigate(['/login']);
  }

  /**
   * Biometric authentication (placeholder for Capacitor integration)
   */
  authenticateWithBiometrics(): Observable<boolean> {
    // This would integrate with Capacitor's biometric plugins
    // For now, return a placeholder implementation
    return of(false);
  }

  /**
   * Setup biometric authentication
   */
  setupBiometricAuth(config: BiometricConfig): Observable<boolean> {
    // This would integrate with Capacitor's biometric plugins
    // For now, return a placeholder implementation
    return of(false);
  }

  /**
   * Check if biometric authentication is available
   */
  isBiometricAvailable(): Observable<boolean> {
    // This would check device capabilities
    // For now, return false
    return of(false);
  }
}