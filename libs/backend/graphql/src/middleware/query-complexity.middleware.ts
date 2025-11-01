import { Injectable, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
} from '@apollo/server';
import {
  getComplexity,
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity';
import { ValidationContext, ValidationRule } from 'graphql';

export interface ComplexityConfig {
  maximumComplexity: number;
  scalarCost: number;
  objectCost: number;
  listFactor: number;
  introspectionCost: number;
  enableLogging: boolean;
}

@Injectable()
@Plugin()
export class QueryComplexityPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(QueryComplexityPlugin.name);

  private readonly config: ComplexityConfig = {
    maximumComplexity: 1000,
    scalarCost: 1,
    objectCost: 2,
    listFactor: 10,
    introspectionCost: 100,
    enableLogging: true,
  }

  constructor(config?: Partial<ComplexityConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      didResolveOperation: async (requestContext: GraphQLRequestContext<any>) => {
        const { request, document, operationName } = requestContext;

        if (!document) return;

        try {
          const complexity = getComplexity({
            estimators: [
              fieldExtensionsEstimator(),
              simpleEstimator({ defaultComplexity: this.config.scalarCost }),
            ],
            schema: requestContext.schema,
            query: document,
            variables: request.variables,
          });

          if (this.config.enableLogging) {
            this.logger.log(
              `Query complexity: ${complexity} for operation: ${operationName || 'Anonymous'}`
            );
          }

          // Log high complexity queries for monitoring
          if (complexity > this.config.maximumComplexity * 0.8) {
            this.logger.warn(
              `High complexity query detected: ${complexity}/${this.config.maximumComplexity} for operation: ${operationName || 'Anonymous'}`
            );
          }

          if (complexity > this.config.maximumComplexity) {
            this.logger.error(
              `Query complexity exceeded: ${complexity}/${this.config.maximumComplexity} for operation: ${operationName || 'Anonymous'}`
            );
            throw new Error(
              `Query is too complex: ${complexity}. Maximum allowed complexity: ${this.config.maximumComplexity}`
            );
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Error calculating query complexity: ${errorMessage}`);
          // Don't block the query if complexity calculation fails
        }
      },

      willSendResponse: async (requestContext: GraphQLRequestContext<any>) => {
        // Add complexity info to response headers for debugging
        if (this.config.enableLogging && requestContext.response.http) {
          requestContext.response.http.headers.set(
            'X-GraphQL-Complexity-Limit',
            this.config.maximumComplexity.toString()
          );
        }
      },
    }
  }

  /**
   * Create validation rule for query complexity
   * This can be used in addition to the plugin for validation phase checking
   *
   * TODO: Uncomment when createComplexityLimitRule is available in graphql-query-complexity
   */
  // static createValidationRule(config?: Partial<ComplexityConfig>): ValidationRule {
  //   const finalConfig = {
  //     maximumComplexity: 1000,
  //     scalarCost: 1,
  //     objectCost: 2,
  //     listFactor: 10,
  //     introspectionCost: 100,
  //     enableLogging: true,
  //     ...config,
  //   }

  //   return createComplexityLimitRule(finalConfig.maximumComplexity, {
  //     estimators: [
  //       fieldExtensionsEstimator(),
  //       simpleEstimator({ defaultComplexity: finalConfig.scalarCost }),
  //     ],
  //     onComplete: (complexity: number, context: ValidationContext) => {
  //       if (finalConfig.enableLogging) {
  //         console.log(`Query complexity: ${complexity}`);
  //       }
  //     },
  //   });
  // }
}

/**
 * Complexity estimator for common field patterns
 */
export class CustomComplexityEstimator {
  /**
   * Estimate complexity for pagination fields
   */
  static paginationEstimator(args: any): number {
    const limit = args.limit || args.first || args.take || 10;
    return Math.min(limit, 100); // Cap at 100 to prevent abuse
  }

  /**
   * Estimate complexity for search fields
   */
  static searchEstimator(args: any): number {
    const query = args.query || args.search || '';
    const baseComplexity = 10;

    // More complex searches cost more
    if (query.length > 50) return baseComplexity * 2;
    if (query.includes('*') || query.includes('?')) return baseComplexity * 1.5;

    return baseComplexity;
  }

  /**
   * Estimate complexity for aggregation fields
   */
  static aggregationEstimator(args: any): number {
    const groupBy = args.groupBy || []
    const metrics = args.metrics || []

    return 50 + (groupBy.length * 10) + (metrics.length * 5);
  }

  /**
   * Estimate complexity for date range queries
   */
  static dateRangeEstimator(args: any): number {
    const startDate = args.startDate || args.from;
    const endDate = args.endDate || args.to;

    if (!startDate || !endDate) return 20; // Default for open-ended ranges

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // More days = higher complexity
    return Math.min(daysDiff, 365); // Cap at 1 year
  }
}

/**
 * Field complexity configurations for schema fields
 * These can be added to field definitions in your GraphQL schema
 */
export const FIELD_COMPLEXITY_MAP = {
  // Simple fields
  'User.id': 1,
  'User.email': 1,
  'User.firstName': 1,
  'User.lastName': 1,

  // Relationship fields
  'Order.items': 5,
  'Order.payments': 3,
  'Order.customer': 2,
  'Order.cafe': 2,

  // Complex aggregation fields
  'Cafe.dailyRevenue': 50,
  'Cafe.monthlyStats': 100,
  'Employee.performanceMetrics': 75,

  // Search and filter operations
  'Query.searchOrders': 25,
  'Query.searchInventory': 20,
  'Query.searchEmployees': 15,

  // Reports and analytics
  'Query.inventoryReport': 150,
  'Query.salesReport': 200,
  'Query.employeeReport': 100,

  // Real-time subscriptions
  'Subscription.orderUpdates': 10,
  'Subscription.inventoryAlerts': 15,
  'Subscription.stockAlerts': 20,
}

/**
 * Middleware for Express to add complexity checking
 */
export function complexityMiddleware(config?: Partial<ComplexityConfig>) {
  return (req: any, res: any, next: any) => {
    // Add complexity config to request context
    req.complexityConfig = config;
    next()
  }
}