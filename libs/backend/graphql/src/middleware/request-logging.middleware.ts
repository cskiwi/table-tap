import { Injectable, Logger } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
} from '@apollo/server';
import { performance } from 'perf_hooks';

export interface RequestMetrics {
  operationName?: string;
  query: string;
  variables?: Record<string, any>;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  complexity?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

export interface LoggingConfig {
  enableMetrics: boolean;
  enableQueryLogging: boolean;
  enableErrorLogging: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number; // milliseconds
  logVariables: boolean;
  logResults: boolean;
  excludeIntrospection: boolean;
  maxQueryLength: number;
}

@Injectable()
@Plugin()
export class RequestLoggingPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(RequestLoggingPlugin.name);
  private readonly metricsLogger = new Logger('GraphQLMetrics');

  private readonly config: LoggingConfig = {
    enableMetrics: true,
    enableQueryLogging: true,
    enableErrorLogging: true,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
    logVariables: false, // Security: don't log variables by default
    logResults: false, // Performance: don't log results by default
    excludeIntrospection: true,
    maxQueryLength: 1000,
  }

  constructor(config?: Partial<LoggingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      didResolveOperation: async (requestContext: GraphQLRequestContext<any>) => {
        const { request, operationName } = requestContext;

        // Skip introspection queries if configured
        if (this.config.excludeIntrospection && this.isIntrospectionQuery(request.query)) {
          return;
        }

        const startTime = performance.now()

        // Store metrics in context for later use
        requestContext.contextValue.requestMetrics = {
          operationName,
          query: this.truncateQuery(request.query || ''),
          variables: this.config.logVariables ? request.variables : undefined,
          startTime,
          success: true,
        } as RequestMetrics;

        if (this.config.enableQueryLogging) {
          this.logger.log(
            `GraphQL Operation Started: ${operationName || 'Anonymous'} - ${this.truncateQuery(request.query || '')}`
          );
        }
      },

      didEncounterErrors: async (requestContext: GraphQLRequestContext<any>) => {
        const metrics = requestContext.contextValue.requestMetrics as RequestMetrics;
        if (metrics) {
          metrics.success = false;
          metrics.errorMessage = requestContext.errors
            ?.map(error => error.message)
            .join(', ');
        }

        if (this.config.enableErrorLogging) {
          this.logger.error(
            `GraphQL Errors in ${metrics?.operationName || 'Anonymous'}: ${metrics?.errorMessage}`,
            requestContext.errors
          );
        }
      },

      willSendResponse: async (requestContext: GraphQLRequestContext<any>) => {
        const metrics = requestContext.contextValue.requestMetrics as RequestMetrics;

        if (!metrics) return;

        const endTime = performance.now()
        metrics.endTime = endTime;
        metrics.duration = endTime - metrics.startTime;

        // Extract user information if available
        const user = requestContext.contextValue.req?.user;
        if (user) {
          metrics.userId = user.id;
        }

        // Extract request information
        const req = requestContext.contextValue.req;
        if (req) {
          metrics.userAgent = req.headers['user-agent']
          metrics.ip = req.ip || req.connection?.remoteAddress;
        }

        // Log completion
        if (this.config.enableQueryLogging) {
          this.logger.log(
            `GraphQL Operation Completed: ${metrics.operationName || 'Anonymous'} - ${metrics.duration?.toFixed(2)}ms - ${metrics.success ? 'SUCCESS' : 'ERROR'}`
          );
        }

        // Log slow queries
        if (this.config.enableSlowQueryLogging &&
            metrics.duration &&
            metrics.duration > this.config.slowQueryThreshold) {
          this.logger.warn(
            `Slow GraphQL Query detected: ${metrics.operationName || 'Anonymous'} took ${metrics.duration.toFixed(2)}ms\n` +
            `Query: ${metrics.query}\n` +
            `Variables: ${this.config.logVariables ? JSON.stringify(metrics.variables, null, 2) : '[HIDDEN]'}`
          );
        }

        // Log metrics
        if (this.config.enableMetrics) {
          this.logMetrics(metrics);
        }

        // Add performance headers
        if (requestContext.response.http) {
          requestContext.response.http.headers.set(
            'X-GraphQL-Duration',
            metrics.duration?.toFixed(2) || '0'
          );
          requestContext.response.http.headers.set(
            'X-GraphQL-Operation',
            metrics.operationName || 'anonymous'
          );
        }
      },
    }
  }

  private isIntrospectionQuery(query?: string): boolean {
    if (!query) return false;
    return query.includes('__schema') ||
           query.includes('__type') ||
           query.includes('IntrospectionQuery');
  }

  private truncateQuery(query: string): string {
    if (query.length <= this.config.maxQueryLength) {
      return query;
    }
    return query.substring(0, this.config.maxQueryLength) + '...';
  }

  private logMetrics(metrics: RequestMetrics): void {
    // Structured logging for metrics collection
    this.metricsLogger.log({
      type: 'graphql_request',
      operation: metrics.operationName,
      duration: metrics.duration,
      success: metrics.success,
      userId: metrics.userId,
      userAgent: metrics.userAgent,
      ip: metrics.ip,
      complexity: metrics.complexity,
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Request logging middleware for Express
 */
export class GraphQLRequestLogger {
  private static readonly logger = new Logger('GraphQLRequest');

  static middleware(config?: Partial<LoggingConfig>) {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now()

      // Log incoming request
      GraphQLRequestLogger.logger.log(
        `GraphQL Request: ${req.method} ${req.url} - User: ${req.user?.id || 'anonymous'} - IP: ${req.ip}`
      );

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk: any, encoding: any) {
        const duration = Date.now() - startTime;

        GraphQLRequestLogger.logger.log(
          `GraphQL Response: ${res.statusCode} - ${duration}ms`
        );

        // Call original end
        originalEnd.call(this, chunk, encoding);
      }

      next()
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static readonly logger = new Logger('Performance');
  private static metrics = new Map<string, number[]>()

  /**
   * Record operation duration
   */
  static recordDuration(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const durations = this.metrics.get(operation)!;
    durations.push(duration);

    // Keep only last 1000 measurements
    if (durations.length > 1000) {
      durations.shift()
    }
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } | null {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    }
  }

  /**
   * Log performance report
   */
  static logReport(): void {
    this.logger.log('=== GraphQL Performance Report ===');

    for (const [operation, durations] of this.metrics.entries()) {
      const stats = this.getStats(operation);
      if (stats) {
        this.logger.log(
          `${operation}: ${stats.count} requests, ` +
          `avg: ${stats.average.toFixed(2)}ms, ` +
          `min: ${stats.min.toFixed(2)}ms, ` +
          `max: ${stats.max.toFixed(2)}ms, ` +
          `p95: ${stats.p95.toFixed(2)}ms, ` +
          `p99: ${stats.p99.toFixed(2)}ms`
        );
      }
    }
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear()
  }
}