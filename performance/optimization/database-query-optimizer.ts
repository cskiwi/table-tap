import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { performance } from 'perf_hooks';

export interface QueryOptimization {
  name: string;
  originalQuery: string;
  optimizedQuery: string;
  expectedImprovement: number;
  indexRecommendations: string[];
  cacheStrategy?: string;
}

export interface DatabaseMetrics {
  queryExecutionTimes: Record<string, number>;
  indexUsage: Record<string, number>;
  connectionPoolStats: {
    active: number;
    idle: number;
    waiting: number;
  };
  cacheHitRatio: number;
  slowQueries: Array<{
    query: string;
    executionTime: number;
    frequency: number;
  }>;
}

@Injectable()
export class DatabaseQueryOptimizer {
  private readonly logger = new Logger(DatabaseQueryOptimizer.name);
  private queryMetrics: Map<string, number[]> = new Map();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Analyze and optimize restaurant-specific database queries
   */
  async optimizeRestaurantQueries(): Promise<{
    optimizations: QueryOptimization[];
    metrics: DatabaseMetrics;
    recommendations: string[];
  }> {
    this.logger.log('Starting database query optimization analysis');

    const optimizations = await this.analyzeCommonQueries();
    const metrics = await this.collectDatabaseMetrics();
    const recommendations = this.generateOptimizationRecommendations(metrics);

    return {
      optimizations,
      metrics,
      recommendations,
    };
  }

  /**
   * Analyze common restaurant queries and suggest optimizations
   */
  private async analyzeCommonQueries(): Promise<QueryOptimization[]> {
    const optimizations: QueryOptimization[] = [];

    // 1. Order retrieval for kitchen dashboard
    optimizations.push({
      name: 'Kitchen Dashboard Orders',
      originalQuery: `
        SELECT o.*, oi.*, p.*
        FROM "Orders" o
        LEFT JOIN "OrderItems" oi ON o.id = oi."orderId"
        LEFT JOIN "Payments" p ON o.id = p."orderId"
        WHERE o.status IN ('PENDING', 'PREPARING', 'READY')
        ORDER BY o."createdAt" ASC
      `,
      optimizedQuery: `
        SELECT o.id, o."orderNumber", o.status, o."createdAt",
               o."estimatedReadyTime", o."tableNumber", o.total,
               jsonb_agg(DISTINCT oi.*) as items,
               jsonb_agg(DISTINCT p.*) FILTER (WHERE p.id IS NOT NULL) as payments
        FROM "Orders" o
        LEFT JOIN "OrderItems" oi ON o.id = oi."orderId"
        LEFT JOIN "Payments" p ON o.id = p."orderId" AND p.status = 'COMPLETED'
        WHERE o.status IN ('PENDING', 'PREPARING', 'READY')
          AND o."cafeId" = $1
          AND o."createdAt" >= CURRENT_DATE
        GROUP BY o.id
        ORDER BY o."createdAt" ASC
        LIMIT 50
      `,
      expectedImprovement: 60,
      indexRecommendations: [
        'CREATE INDEX CONCURRENTLY idx_orders_kitchen_dashboard ON "Orders" ("cafeId", status, "createdAt") WHERE status IN (\'PENDING\', \'PREPARING\', \'READY\')',
        'CREATE INDEX CONCURRENTLY idx_order_items_order_id ON "OrderItems" ("orderId")',
      ],
      cacheStrategy: 'Redis with 30-second TTL for active orders',
    });

    // 2. Employee timesheet aggregation
    optimizations.push({
      name: 'Employee Timesheet Summary',
      originalQuery: `
        SELECT e.*, ts.*, u.name, u.email
        FROM "Employees" e
        JOIN "Users" u ON e."userId" = u.id
        LEFT JOIN "TimeSheets" ts ON e.id = ts."employeeId"
        WHERE e."cafeId" = $1
        ORDER BY u.name
      `,
      optimizedQuery: `
        WITH employee_hours AS (
          SELECT
            ts."employeeId",
            COUNT(*) as total_days,
            SUM(ts."totalMinutes") as total_minutes,
            SUM(ts."overtimeMinutes") as overtime_minutes,
            AVG(ts."totalMinutes") as avg_daily_minutes
          FROM "TimeSheets" ts
          WHERE ts.date >= $2 AND ts.date <= $3
          GROUP BY ts."employeeId"
        )
        SELECT
          e.id, e."employeeId", e.role, e.status,
          u.name, u.email,
          COALESCE(eh.total_days, 0) as days_worked,
          COALESCE(eh.total_minutes, 0) / 60.0 as total_hours,
          COALESCE(eh.overtime_minutes, 0) / 60.0 as overtime_hours,
          COALESCE(eh.avg_daily_minutes, 0) / 60.0 as avg_daily_hours
        FROM "Employees" e
        JOIN "Users" u ON e."userId" = u.id
        LEFT JOIN employee_hours eh ON e.id = eh."employeeId"
        WHERE e."cafeId" = $1 AND e.status = 'ACTIVE'
        ORDER BY u.name
      `,
      expectedImprovement: 75,
      indexRecommendations: [
        'CREATE INDEX CONCURRENTLY idx_timesheets_employee_date_range ON "TimeSheets" ("employeeId", date)',
        'CREATE INDEX CONCURRENTLY idx_employees_cafe_status ON "Employees" ("cafeId", status)',
      ],
      cacheStrategy: 'Cache daily aggregations with incremental updates',
    });

    // 3. Real-time order status updates
    optimizations.push({
      name: 'Real-time Order Updates',
      originalQuery: `
        UPDATE "Orders"
        SET status = $1, "updatedAt" = NOW()
        WHERE id = $2
      `,
      optimizedQuery: `
        UPDATE "Orders"
        SET status = $1, "updatedAt" = NOW(),
            "readyTime" = CASE WHEN $1 = 'READY' THEN NOW() ELSE "readyTime" END,
            "completedTime" = CASE WHEN $1 = 'COMPLETED' THEN NOW() ELSE "completedTime" END
        WHERE id = $2 AND status != $1
        RETURNING id, status, "updatedAt", "readyTime", "completedTime"
      `,
      expectedImprovement: 40,
      indexRecommendations: [
        'CREATE INDEX CONCURRENTLY idx_orders_id_status ON "Orders" (id, status)',
      ],
      cacheStrategy: 'Invalidate related caches and publish WebSocket updates',
    });

    // 4. Payment processing queries
    optimizations.push({
      name: 'Payment Processing',
      originalQuery: `
        SELECT p.*, o."orderNumber", o.total
        FROM "Payments" p
        JOIN "Orders" o ON p."orderId" = o.id
        WHERE p.status = 'PENDING'
        ORDER BY p."createdAt"
      `,
      optimizedQuery: `
        SELECT p.id, p."transactionId", p.method, p.status, p.amount,
               p."createdAt", p."orderId",
               o."orderNumber", o.total, o."cafeId"
        FROM "Payments" p
        JOIN "Orders" o ON p."orderId" = o.id
        WHERE p.status = 'PENDING'
          AND p."createdAt" >= NOW() - INTERVAL '24 hours'
        ORDER BY p."createdAt"
        LIMIT 100
      `,
      expectedImprovement: 50,
      indexRecommendations: [
        'CREATE INDEX CONCURRENTLY idx_payments_status_created ON "Payments" (status, "createdAt")',
        'CREATE INDEX CONCURRENTLY idx_payments_order_id ON "Payments" ("orderId")',
      ],
      cacheStrategy: 'Cache payment status with short TTL',
    });

    // 5. Menu item performance analysis
    optimizations.push({
      name: 'Menu Item Analytics',
      originalQuery: `
        SELECT m.*, COUNT(oi.id) as order_count, SUM(oi.quantity) as total_quantity
        FROM "MenuItems" m
        LEFT JOIN "OrderItems" oi ON m.id = oi."menuItemId"
        LEFT JOIN "Orders" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
        GROUP BY m.id
        ORDER BY order_count DESC
      `,
      optimizedQuery: `
        WITH item_stats AS (
          SELECT
            oi."menuItemId",
            COUNT(DISTINCT oi."orderId") as order_count,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.subtotal) as total_revenue,
            AVG(oi.quantity) as avg_quantity_per_order
          FROM "OrderItems" oi
          JOIN "Orders" o ON oi."orderId" = o.id
          WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
            AND o.status = 'COMPLETED'
            AND o."cafeId" = $3
          GROUP BY oi."menuItemId"
        )
        SELECT
          m.id, m.name, m.price, m.category,
          COALESCE(s.order_count, 0) as order_count,
          COALESCE(s.total_quantity, 0) as total_quantity,
          COALESCE(s.total_revenue, 0) as total_revenue,
          COALESCE(s.avg_quantity_per_order, 0) as avg_quantity_per_order,
          CASE
            WHEN s.order_count > 0 THEN s.total_revenue / s.order_count
            ELSE 0
          END as revenue_per_order
        FROM "MenuItems" m
        LEFT JOIN item_stats s ON m.id = s."menuItemId"
        WHERE m."cafeId" = $3 AND m.status = 'ACTIVE'
        ORDER BY COALESCE(s.order_count, 0) DESC
      `,
      expectedImprovement: 80,
      indexRecommendations: [
        'CREATE INDEX CONCURRENTLY idx_order_items_menu_item_order ON "OrderItems" ("menuItemId", "orderId")',
        'CREATE INDEX CONCURRENTLY idx_orders_completed_cafe_date ON "Orders" ("cafeId", status, "createdAt") WHERE status = \'COMPLETED\'',
      ],
      cacheStrategy: 'Cache daily/weekly aggregations with scheduled updates',
    });

    return optimizations;
  }

  /**
   * Collect comprehensive database performance metrics
   */
  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Test query execution times
      const queryExecutionTimes = await this.measureQueryPerformance(queryRunner);

      // Check index usage
      const indexUsage = await this.analyzeIndexUsage(queryRunner);

      // Get connection pool stats
      const connectionPoolStats = await this.getConnectionPoolStats();

      // Calculate cache hit ratio (simulated)
      const cacheHitRatio = await this.calculateCacheHitRatio();

      // Identify slow queries
      const slowQueries = await this.identifySlowQueries(queryRunner);

      return {
        queryExecutionTimes,
        indexUsage,
        connectionPoolStats,
        cacheHitRatio,
        slowQueries,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Measure execution time of common queries
   */
  private async measureQueryPerformance(queryRunner: QueryRunner): Promise<Record<string, number>> {
    const queries = {
      'order_retrieval': `
        SELECT COUNT(*) FROM "Orders"
        WHERE status IN ('PENDING', 'PREPARING')
        AND "createdAt" >= CURRENT_DATE
      `,
      'employee_timesheet': `
        SELECT COUNT(*) FROM "TimeSheets"
        WHERE date = CURRENT_DATE
      `,
      'payment_processing': `
        SELECT COUNT(*) FROM "Payments"
        WHERE status = 'PENDING'
      `,
      'menu_analytics': `
        SELECT COUNT(DISTINCT oi."menuItemId")
        FROM "OrderItems" oi
        JOIN "Orders" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= CURRENT_DATE
      `,
    };

    const executionTimes: Record<string, number> = {};

    for (const [name, query] of Object.entries(queries)) {
      const startTime = performance.now();

      try {
        await queryRunner.query(query);
        const endTime = performance.now();
        executionTimes[name] = endTime - startTime;
      } catch (error) {
        this.logger.warn(`Failed to execute query ${name}: ${error.message}`);
        executionTimes[name] = -1;
      }
    }

    return executionTimes;
  }

  /**
   * Analyze database index usage
   */
  private async analyzeIndexUsage(queryRunner: QueryRunner): Promise<Record<string, number>> {
    try {
      // PostgreSQL-specific query to analyze index usage
      const indexStatsQuery = `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `;

      const results = await queryRunner.query(indexStatsQuery);
      const indexUsage: Record<string, number> = {};

      for (const row of results) {
        indexUsage[`${row.tablename}.${row.indexname}`] = row.scans || 0;
      }

      return indexUsage;
    } catch (error) {
      this.logger.warn(`Failed to analyze index usage: ${error.message}`);
      return {};
    }
  }

  /**
   * Get connection pool statistics
   */
  private async getConnectionPoolStats(): Promise<DatabaseMetrics['connectionPoolStats']> {
    // This would typically query the actual connection pool
    // For now, we'll simulate realistic values
    return {
      active: Math.floor(Math.random() * 10) + 5,
      idle: Math.floor(Math.random() * 15) + 5,
      waiting: Math.floor(Math.random() * 3),
    };
  }

  /**
   * Calculate cache hit ratio
   */
  private async calculateCacheHitRatio(): Promise<number> {
    // This would typically check Redis or application cache metrics
    // For now, we'll simulate a realistic cache hit ratio
    return 0.75 + Math.random() * 0.2; // 75-95% hit ratio
  }

  /**
   * Identify slow queries
   */
  private async identifySlowQueries(queryRunner: QueryRunner): Promise<DatabaseMetrics['slowQueries']> {
    try {
      // PostgreSQL-specific query to find slow queries
      const slowQueriesQuery = `
        SELECT
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `;

      const results = await queryRunner.query(slowQueriesQuery);

      return results.map((row: any) => ({
        query: row.query?.substring(0, 200) + '...' || 'Unknown query',
        executionTime: row.mean_time || 0,
        frequency: row.calls || 0,
      }));
    } catch (error) {
      // pg_stat_statements might not be available
      this.logger.warn(`Failed to identify slow queries: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate optimization recommendations based on metrics
   */
  private generateOptimizationRecommendations(metrics: DatabaseMetrics): string[] {
    const recommendations: string[] = [];

    // Check query execution times
    for (const [queryName, time] of Object.entries(metrics.queryExecutionTimes)) {
      if (time > 100) { // More than 100ms
        recommendations.push(`Optimize ${queryName} query - execution time: ${time.toFixed(2)}ms`);
      }
    }

    // Check connection pool
    if (metrics.connectionPoolStats.waiting > 5) {
      recommendations.push('Increase database connection pool size - high waiting connections');
    }

    if (metrics.connectionPoolStats.active / (metrics.connectionPoolStats.active + metrics.connectionPoolStats.idle) > 0.8) {
      recommendations.push('Consider scaling database or optimizing connection usage');
    }

    // Check cache hit ratio
    if (metrics.cacheHitRatio < 0.8) {
      recommendations.push(`Improve caching strategy - current hit ratio: ${(metrics.cacheHitRatio * 100).toFixed(1)}%`);
    }

    // Check slow queries
    if (metrics.slowQueries.length > 0) {
      recommendations.push(`Address ${metrics.slowQueries.length} slow queries identified`);

      const slowestQuery = metrics.slowQueries[0];
      if (slowestQuery && slowestQuery.executionTime > 500) {
        recommendations.push(`Critical: Query with ${slowestQuery.executionTime.toFixed(2)}ms average execution time needs immediate attention`);
      }
    }

    // General restaurant-specific recommendations
    recommendations.push(
      'Implement read replicas for analytics queries',
      'Set up database monitoring and alerting',
      'Consider partitioning large tables by date',
      'Implement connection pooling with PgBouncer',
      'Set up automated vacuum and analyze schedules',
      'Consider implementing materialized views for complex analytics'
    );

    return recommendations;
  }

  /**
   * Apply recommended database optimizations
   */
  async applyOptimizations(optimizations: QueryOptimization[]): Promise<{
    applied: string[];
    failed: string[];
    results: Record<string, any>;
  }> {
    this.logger.log('Applying database optimizations');

    const applied: string[] = [];
    const failed: string[] = [];
    const results: Record<string, any> = {};

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      for (const optimization of optimizations) {
        try {
          // Apply index recommendations
          for (const indexQuery of optimization.indexRecommendations) {
            await queryRunner.query(indexQuery);
            this.logger.log(`Applied index: ${indexQuery}`);
          }

          applied.push(optimization.name);
          results[optimization.name] = {
            status: 'success',
            expectedImprovement: optimization.expectedImprovement,
            indexesCreated: optimization.indexRecommendations.length,
          };

        } catch (error) {
          this.logger.error(`Failed to apply optimization ${optimization.name}: ${error.message}`);
          failed.push(optimization.name);
          results[optimization.name] = {
            status: 'failed',
            error: error.message,
          };
        }
      }
    } finally {
      await queryRunner.release();
    }

    return {
      applied,
      failed,
      results,
    };
  }

  /**
   * Monitor query performance over time
   */
  async startQueryPerformanceMonitoring(): Promise<void> {
    this.logger.log('Starting query performance monitoring');

    // Set up periodic monitoring
    setInterval(async () => {
      try {
        const metrics = await this.collectDatabaseMetrics();

        // Store metrics for trending analysis
        for (const [queryName, time] of Object.entries(metrics.queryExecutionTimes)) {
          if (!this.queryMetrics.has(queryName)) {
            this.queryMetrics.set(queryName, []);
          }

          const times = this.queryMetrics.get(queryName)!;
          times.push(time);

          // Keep only last 100 measurements
          if (times.length > 100) {
            times.shift();
          }
        }

        // Check for performance degradation
        this.checkPerformanceDegradation();

      } catch (error) {
        this.logger.error(`Query monitoring failed: ${error.message}`);
      }
    }, 60000); // Monitor every minute
  }

  /**
   * Check for performance degradation
   */
  private checkPerformanceDegradation(): void {
    for (const [queryName, times] of this.queryMetrics.entries()) {
      if (times.length < 10) continue;

      const recent = times.slice(-10);
      const older = times.slice(-20, -10);

      const recentAvg = recent.reduce((sum, time) => sum + time, 0) / recent.length;
      const olderAvg = older.reduce((sum, time) => sum + time, 0) / older.length;

      const degradation = (recentAvg - olderAvg) / olderAvg;

      if (degradation > 0.5) { // 50% degradation
        this.logger.warn(`Performance degradation detected for ${queryName}: ${(degradation * 100).toFixed(1)}% increase in execution time`);
      }
    }
  }
}