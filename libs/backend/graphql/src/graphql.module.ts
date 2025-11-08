import { ApolloDriver } from '@nestjs/apollo';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions, GraphQLModule as NestJsGql } from '@nestjs/graphql';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginSchemaReporting } from '@apollo/server/plugin/schemaReporting';
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting';
import { AuthorizationModule } from '@app/backend-authorization';
import { UserResolver } from './resolvers';
import { OrderResolver } from './resolvers/restaurant/order.resolver';
import { InventoryResolver } from './resolvers/restaurant/inventory.resolver';
import { EmployeeResolver } from './resolvers/restaurant/employee.resolver';
import { KitchenDashboardResolver } from './resolvers/restaurant/kitchen-dashboard.resolver';
import { AdminDashboardResolver } from './resolvers/restaurant/admin-dashboard.resolver';
import { SalesAnalyticsResolver } from './resolvers/restaurant/sales-analytics.resolver';
import { InventoryAlertsResolver } from './resolvers/restaurant/inventory-alerts.resolver';
import { AdminNotificationsResolver } from './resolvers/restaurant/admin-notifications.resolver';
import { AdminSettingsResolver } from './resolvers/restaurant/admin-settings.resolver';
import { ExportResolver } from './resolvers/restaurant/export.resolver';
import { MenuResolver } from './resolvers/restaurant/menu.resolver';
import { PaymentResolver } from './resolvers/restaurant/payment.resolver';
import { CafeResolver } from './resolvers/restaurant/cafe.resolver';
import { LoyaltyAccountResolver } from './resolvers/restaurant/loyalty-account.resolver';
import { LoyaltyRewardResolver } from './resolvers/restaurant/loyalty-reward.resolver';
import { LoyaltyTransactionResolver } from './resolvers/restaurant/loyalty-transaction.resolver';
import { LoyaltyTierResolver } from './resolvers/restaurant/loyalty-tier.resolver';
import { LoyaltyPromotionResolver } from './resolvers/restaurant/loyalty-promotion.resolver';
import { LoyaltyChallengeResolver } from './resolvers/restaurant/loyalty-challenge.resolver';
import { QueryComplexityPlugin } from './middleware/query-complexity.middleware';
import { RequestLoggingPlugin } from './middleware/request-logging.middleware';
import { RoleBasedAccessGuard, EmployeeContextEnhancer } from './middleware/role-access-control.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Order,
  OrderItem,
  Payment,
  Cafe,
  Counter,
  Stock as Stock,
  Employee,
  TimeSheet,
  Product as Menu,
  User,
  LoyaltyAccount,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyTier,
  LoyaltyPromotion,
  LoyaltyChallenge,
  LoyaltyRewardRedemption,
  InventoryAlert,
  AdminNotification,
  AdminSettings,
  SalesAnalytics,
} from '@app/models';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AuthorizationModule,
    ConfigModule,
    CacheModule.register({
      ttl: 60000, // 1 minute default TTL
      max: 1000, // Maximum number of items in cache
    }),
    TypeOrmModule.forFeature([
      // User entities
      User,
      // Restaurant entities
      Order,
      OrderItem,
      Payment,
      Cafe,
      Counter,
      Stock,
      Employee,
      TimeSheet,
      Menu,
      // Loyalty entities
      LoyaltyAccount,
      LoyaltyReward,
      LoyaltyTransaction,
      LoyaltyTier,
      LoyaltyPromotion,
      LoyaltyChallenge,
      LoyaltyRewardRedemption,
      // Admin entities
      InventoryAlert,
      AdminNotification,
      AdminSettings,
      SalesAnalytics,
    ]),
    NestJsGql.forRootAsync({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const plugins = [];
        const env = config.get<string>('NODE_ENV');
        const logger = new Logger(GraphQLModule.name);

        logger.log(`GraphQL Module initialized in ${env} mode.`);

        if (env !== 'production') {
          plugins.push(ApolloServerPluginLandingPageLocalDefault({ footer: false }));
        } else if (env === 'production') {
          plugins.push(
            ApolloServerPluginLandingPageProductionDefault({
              graphRef: config.get<string>('APOLLO_GRAPH_REF'),
              footer: true,
            }),
          );
          plugins.push(ApolloServerPluginSchemaReporting());

          plugins.push(
            ApolloServerPluginUsageReporting({
              sendVariableValues: { all: true },
            }),
          );
        }

        // Add custom plugins
        plugins.push(
          new QueryComplexityPlugin({
            maximumComplexity: config.get<number>('GRAPHQL_MAX_COMPLEXITY') || 1000,
            enableLogging: config.get<boolean>('GRAPHQL_LOG_COMPLEXITY') || true,
          }),
          new RequestLoggingPlugin({
            enableMetrics: true,
            enableQueryLogging: env !== 'production',
            slowQueryThreshold: config.get<number>('GRAPHQL_SLOW_QUERY_THRESHOLD') || 1000,
            logVariables: env === 'development',
          }),
        );

        return {
          playground: false,
          debug: env !== 'production',
          autoSchemaFile: true,
          sortSchema: true,
          context: ({ req }: { req: unknown }) => ({ req }),
          plugins,
          introspection: true,
          formatError: (error: GraphQLError): GraphQLFormattedError => {
            // Log errors for monitoring
            console.error('GraphQL Error:', error);
            return {
              message: error.message,
              extensions: {
                code: error.extensions?.['code'],
                timestamp: new Date().toISOString(),
              },
            };
          },
        } as Omit<GqlModuleOptions, 'driver'>;
      },
    }),
  ],
  providers: [
    // Resolvers
    UserResolver,
    OrderResolver,
    InventoryResolver,
    EmployeeResolver,
    MenuResolver,
    PaymentResolver,
    CafeResolver,
    KitchenDashboardResolver,
    AdminDashboardResolver,
    SalesAnalyticsResolver,
    InventoryAlertsResolver,
    AdminNotificationsResolver,
    AdminSettingsResolver,
    ExportResolver,
    LoyaltyAccountResolver,
    LoyaltyRewardResolver,
    LoyaltyTransactionResolver,
    LoyaltyTierResolver,
    LoyaltyPromotionResolver,
    LoyaltyChallengeResolver,
    // Guards and Middleware
    RoleBasedAccessGuard,
    EmployeeContextEnhancer,
  ],
  exports: [RoleBasedAccessGuard, EmployeeContextEnhancer],
})
export class GraphQLModule {}
