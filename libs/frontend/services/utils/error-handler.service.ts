import { Injectable, ErrorHandler, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { ApiError, NotificationMessage } from '../core/types';
import { AppStateService } from '../state/app-state.service';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  error: ApiError;
  userAgent: string;
  url: string;
  userId?: string;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface ErrorHandlerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  enableUserNotifications: boolean;
  enableErrorReporting: boolean;
  maxErrorLogs: number;
  autoReportCriticalErrors: boolean;
}

/**
 * Global error handler service for the application
 * Handles HTTP errors, JavaScript errors, and provides error reporting
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);

  // Error state management
  private errorLogsSubject = new BehaviorSubject<ErrorLog[]>([]);
  private lastErrorSubject = new BehaviorSubject<ApiError | null>(null);

  // Observables
  public readonly errorLogs$ = this.errorLogsSubject.asObservable();
  public readonly lastError$ = this.lastErrorSubject.asObservable();

  // Configuration
  private config: ErrorHandlerConfig = {
    enableConsoleLogging: true,
    enableRemoteLogging: true,
    enableUserNotifications: true,
    enableErrorReporting: true,
    maxErrorLogs: 100,
    autoReportCriticalErrors: true
  };

  // Error patterns for classification
  private criticalErrorPatterns = [
    /ChunkLoadError/,
    /Loading chunk \d+ failed/,
    /Loading CSS chunk/,
    /Script error/,
    /Network Error/,
    /Failed to fetch/
  ];

  private authErrorPatterns = [
    /401/,
    /403/,
    /Unauthorized/,
    /Forbidden/,
    /Invalid token/,
    /Token expired/
  ];

  private networkErrorPatterns = [
    /Network/,
    /timeout/,
    /offline/,
    /connection/,
    /ERR_NETWORK/,
    /ERR_INTERNET_DISCONNECTED/
  ];

  constructor() {
    // Setup global error listeners
    this.setupGlobalErrorHandlers();

    // Setup periodic cleanup
    this.setupPeriodicCleanup();
  }

  /**
   * Angular ErrorHandler implementation
   */
  handleError(error: any): void {
    const apiError = this.convertToApiError(error);
    this.processError(apiError, 'global');
  }

  /**
   * Handle HTTP errors
   */
  handleHttpError(error: HttpErrorResponse): Observable<never> {
    const apiError = this.convertHttpErrorToApiError(error);
    this.processError(apiError, 'http');
    return throwError(() => apiError);
  }

  /**
   * Handle GraphQL errors
   */
  handleGraphQLError(error: any): Observable<never> {
    const apiError = this.convertGraphQLErrorToApiError(error);
    this.processError(apiError, 'graphql');
    return throwError(() => apiError);
  }

  /**
   * Handle business logic errors
   */
  handleBusinessError(message: string, code?: string, details?: any): void {
    const apiError: ApiError = {
      code: code || 'BUSINESS_ERROR',
      message,
      details,
      timestamp: new Date()
    };
    this.processError(apiError, 'business');
  }

  /**
   * Log error manually
   */
  logError(error: ApiError, context?: string): void {
    this.processError(error, context || 'manual');
  }

  /**
   * Report error to user with notification
   */
  reportErrorToUser(
    message: string,
    severity: 'info' | 'warning' | 'error' = 'error',
    action?: { label: string; callback: () => void }
  ): void {
    const notification: NotificationMessage = {
      type: 'NOTIFICATION',
      payload: {
        id: this.generateId(),
        title: this.getSeverityTitle(severity),
        message,
        severity: severity.toUpperCase() as any,
        action: action ? {
          label: action.label,
          url: '#'
        } : undefined
      },
      timestamp: new Date()
    };

    this.appState.addNotification(notification);

    // Execute action callback if provided
    if (action) {
      // Store callback for later execution
      (window as any)[`errorAction_${notification.payload.id}`] = action.callback;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorLog[];
  } {
    const logs = this.errorLogsSubject.value;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    logs.forEach(log => {
      // Count by type (extract from code)
      const type = log.error.code.split('_')[0] || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;

      // Count by severity
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    // Get recent errors (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = logs.filter(log => log.timestamp > oneDayAgo);

    return {
      total: logs.length,
      byType,
      bySeverity,
      recent
    };
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLogsSubject.next([]);
  }

  /**
   * Mark error as resolved
   */
  markErrorResolved(errorId: string): void {
    const currentLogs = this.errorLogsSubject.value;
    const updatedLogs = currentLogs.map(log =>
      log.id === errorId ? { ...log, resolved: true } : log
    );
    this.errorLogsSubject.next(updatedLogs);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: ApiError): boolean {
    // Network errors are usually recoverable
    if (this.isNetworkError(error)) return true;

    // Temporary server errors are recoverable
    if (error.statusCode && error.statusCode >= 500 && error.statusCode < 600) return true;

    // Rate limiting is recoverable
    if (error.statusCode === 429) return true;

    return false;
  }

  /**
   * Get recovery suggestions for error
   */
  getRecoverySuggestions(error: ApiError): string[] {
    const suggestions: string[] = [];

    if (this.isNetworkError(error)) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
    }

    if (this.isAuthenticationError(error)) {
      suggestions.push('Please log in again');
      suggestions.push('Check your credentials');
    }

    if (error.statusCode === 429) {
      suggestions.push('Please wait a moment before trying again');
    }

    if (error.statusCode && error.statusCode >= 500) {
      suggestions.push('The server is experiencing issues');
      suggestions.push('Please try again later');
    }

    if (suggestions.length === 0) {
      suggestions.push('Please contact support if the problem persists');
    }

    return suggestions;
  }

  /**
   * Process error through the error handling pipeline
   */
  private processError(error: ApiError, context?: string): void {
    // Store the last error
    this.lastErrorSubject.next(error);

    // Classify error severity
    const severity = this.classifyErrorSeverity(error);

    // Create error log
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      stackTrace: error.details?.stack,
      severity,
      resolved: false
    };

    // Add to error logs
    this.addErrorLog(errorLog);

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorLog, context);
    }

    // User notification
    if (this.config.enableUserNotifications && this.shouldNotifyUser(error, severity)) {
      this.notifyUser(error, severity);
    }

    // Remote logging
    if (this.config.enableRemoteLogging) {
      this.logToRemote(errorLog);
    }

    // Handle specific error types
    this.handleSpecificErrors(error);

    // Auto-report critical errors
    if (this.config.autoReportCriticalErrors && severity === 'critical') {
      this.reportCriticalError(errorLog);
    }
  }

  /**
   * Convert generic error to ApiError
   */
  private convertToApiError(error: any): ApiError {
    if (error instanceof Error) {
      return {
        code: error.name || 'JAVASCRIPT_ERROR',
        message: error.message || 'An unknown error occurred',
        details: {
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date()
      };
    }

    if (typeof error === 'string') {
      return {
        code: 'STRING_ERROR',
        message: error,
        timestamp: new Date()
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Convert HTTP error to ApiError
   */
  private convertHttpErrorToApiError(error: HttpErrorResponse): ApiError {
    return {
      code: `HTTP_${error.status}`,
      message: error.error?.message || error.message || `HTTP ${error.status} Error`,
      details: {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      },
      timestamp: new Date(),
      path: error.url || undefined,
      statusCode: error.status
    };
  }

  /**
   * Convert GraphQL error to ApiError
   */
  private convertGraphQLErrorToApiError(error: any): ApiError {
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const gqlError = error.graphQLErrors[0];
      return {
        code: gqlError.extensions?.code || 'GRAPHQL_ERROR',
        message: gqlError.message,
        details: {
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          path: gqlError.path
        },
        timestamp: new Date(),
        path: gqlError.path?.join('.') || undefined
      };
    }

    if (error.networkError) {
      return this.convertHttpErrorToApiError(error.networkError);
    }

    return this.convertToApiError(error);
  }

  /**
   * Classify error severity
   */
  private classifyErrorSeverity(error: ApiError): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (this.criticalErrorPatterns.some(pattern => pattern.test(error.message))) {
      return 'critical';
    }

    if (error.statusCode === 500) {
      return 'critical';
    }

    // High severity errors
    if (this.isAuthenticationError(error)) {
      return 'high';
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return 'high';
    }

    // Medium severity errors
    if (this.isNetworkError(error)) {
      return 'medium';
    }

    if (error.code.includes('VALIDATION')) {
      return 'medium';
    }

    // Low severity errors
    return 'low';
  }

  /**
   * Check if error is authentication related
   */
  private isAuthenticationError(error: ApiError): boolean {
    return this.authErrorPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.code)
    );
  }

  /**
   * Check if error is network related
   */
  private isNetworkError(error: ApiError): boolean {
    return this.networkErrorPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.code)
    );
  }

  /**
   * Log error to console
   */
  private logToConsole(errorLog: ErrorLog, context?: string): void {
    const { error } = errorLog;

    console.group(`🚨 Error [${errorLog.severity.toUpperCase()}] - ${context || 'Unknown'}`);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Timestamp:', error.timestamp);

    if (error.details) {
      console.error('Details:', error.details);
    }

    if (error.path) {
      console.error('Path:', error.path);
    }

    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }

    if (errorLog.stackTrace) {
      console.error('Stack Trace:', errorLog.stackTrace);
    }

    console.groupEnd();
  }

  /**
   * Determine if user should be notified
   */
  private shouldNotifyUser(error: ApiError, severity: string): boolean {
    // Don't notify for low severity errors
    if (severity === 'low') return false;

    // Don't notify for network errors when offline
    if (this.isNetworkError(error) && !navigator.onLine) return false;

    // Don't notify for validation errors (usually handled by forms)
    if (error.code.includes('VALIDATION')) return false;

    return true;
  }

  /**
   * Notify user about error
   */
  private notifyUser(error: ApiError, severity: string): void {
    let message = error.message;
    let title = 'Error';

    // Customize message based on error type
    if (this.isNetworkError(error)) {
      title = 'Connection Problem';
      message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (this.isAuthenticationError(error)) {
      title = 'Authentication Required';
      message = 'Please log in to continue.';
    } else if (severity === 'critical') {
      title = 'System Error';
      message = 'A critical error has occurred. The page will reload automatically.';
    }

    this.reportErrorToUser(message, severity as any);
  }

  /**
   * Log error to remote service
   */
  private logToRemote(errorLog: ErrorLog): void {
    // This would send error to remote logging service
    // For now, we'll just store it locally
    try {
      const storedLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      storedLogs.push(errorLog);

      // Keep only last 50 errors in localStorage
      if (storedLogs.length > 50) {
        storedLogs.splice(0, storedLogs.length - 50);
      }

      localStorage.setItem('error_logs', JSON.stringify(storedLogs));
    } catch (e) {
      console.error('Failed to store error log locally:', e);
    }
  }

  /**
   * Handle specific error types
   */
  private handleSpecificErrors(error: ApiError): void {
    // Handle authentication errors
    if (this.isAuthenticationError(error)) {
      this.handleAuthenticationError(error);
    }

    // Handle chunk loading errors (reload page)
    if (this.criticalErrorPatterns.some(pattern => pattern.test(error.message))) {
      this.handleChunkLoadError();
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(error: ApiError): void {
    // Clear user session
    this.appState.setAuthUser(null);

    // Redirect to login after a delay
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }, 2000);
  }

  /**
   * Handle chunk loading errors
   */
  private handleChunkLoadError(): void {
    // Reload the page to get fresh chunks
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: ApiError): void {
    // Set offline state if needed
    if (!navigator.onLine) {
      this.appState.setOnlineStatus(false);
    }
  }

  /**
   * Report critical error
   */
  private reportCriticalError(errorLog: ErrorLog): void {
    // This would report to error monitoring service
    console.error('Critical error reported:', errorLog);
  }

  /**
   * Add error log to collection
   */
  private addErrorLog(errorLog: ErrorLog): void {
    const currentLogs = this.errorLogsSubject.value;
    const updatedLogs = [errorLog, ...currentLogs];

    // Limit the number of stored logs
    if (updatedLogs.length > this.config.maxErrorLogs) {
      updatedLogs.splice(this.config.maxErrorLogs);
    }

    this.errorLogsSubject.next(updatedLogs);
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.convertToApiError(event.reason);
      this.processError(error, 'unhandled_rejection');
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = this.convertToApiError(event.error || event.message);
      this.processError(error, 'javascript_error');
    });
  }

  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up old error logs every hour
    setInterval(() => {
      const currentLogs = this.errorLogsSubject.value;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filteredLogs = currentLogs.filter(log => log.timestamp > oneWeekAgo);

      if (filteredLogs.length !== currentLogs.length) {
        this.errorLogsSubject.next(filteredLogs);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    return this.appState.getCurrentState().auth.user?.id;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get severity title for notifications
   */
  private getSeverityTitle(severity: string): string {
    switch (severity) {
      case 'info': return 'Information';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Notification';
    }
  }
}