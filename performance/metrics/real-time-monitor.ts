import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { performance } from 'perf_hooks';
import * as os from 'os';
import * as process from 'process';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
  application: {
    activeOrders: number;
    ordersPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    employeesOnline: number;
  };
  database: {
    activeConnections: number;
    queryLatency: number;
    cacheHitRatio: number;
  };
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'CPU' | 'MEMORY' | 'LATENCY' | 'ERROR_RATE' | 'DATABASE' | 'BUSINESS';
  message: string;
  metrics: any;
  recommendations: string[];
}

export interface KitchenDashboardMetrics {
  orderUpdateLatency: number;
  websocketConnections: number;
  realTimeEvents: number;
  queueSize: number;
  processingRate: number;
}

@Injectable()
export class RealTimeMonitor {
  private readonly logger = new Logger(RealTimeMonitor.name);
  private metrics: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private kitchenMetrics: KitchenDashboardMetrics[] = [];
  private thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    latency: { warning: 500, critical: 1000 },
    errorRate: { warning: 5, critical: 10 },
    dbConnections: { warning: 80, critical: 95 },
  };

  // Performance counters
  private requestCount = 0;
  private errorCount = 0;
  private orderCount = 0;
  private responseTimeSum = 0;
  private lastOrderCount = 0;
  private networkBytesIn = 0;
  private networkBytesOut = 0;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeMonitoring();
  }

  /**
   * Initialize real-time monitoring
   */
  private initializeMonitoring(): void {
    this.logger.log('Initializing real-time performance monitoring');

    // Start monitoring intervals
    this.startSystemMetricsCollection();
    this.startKitchenDashboardMonitoring();
    this.startAlertEngine();

    // Clean up old data periodically
    setInterval(() => this.cleanupOldData(), 300000); // 5 minutes
  }

  /**
   * Collect system metrics every 10 seconds
   */
  @Interval(10000)
  private async collectSystemMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherSystemMetrics();
      this.metrics.push(metrics);

      // Keep only last 1000 measurements (about 2.7 hours)
      if (this.metrics.length > 1000) {
        this.metrics.shift();
      }

      // Emit metrics for real-time updates
      this.eventEmitter.emit('metrics.collected', metrics);

      // Check for alerts
      this.checkThresholds(metrics);

    } catch (error) {
      this.logger.error(`Failed to collect system metrics: ${error.message}`);
    }
  }

  /**
   * Gather comprehensive system metrics
   */
  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = await this.getCPUUsage();
    const memoryInfo = this.getMemoryInfo();
    const networkInfo = this.getNetworkInfo();
    const appMetrics = this.getApplicationMetrics();
    const dbMetrics = await this.getDatabaseMetrics();

    return {
      timestamp: Date.now(),
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: memoryInfo,
      network: networkInfo,
      application: appMetrics,
      database: dbMetrics,
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      const startTime = performance.now();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const endTime = performance.now();

        const userUsage = endMeasure.user / 1000; // Convert to milliseconds
        const systemUsage = endMeasure.system / 1000;
        const totalUsage = userUsage + systemUsage;
        const elapsed = endTime - startTime;

        const cpuPercent = (totalUsage / elapsed) * 100;
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): SystemMetrics['memory'] {
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };

    const processMemory = process.memoryUsage();

    return {
      ...systemMemory,
      heapUsed: processMemory.heapUsed,
      heapTotal: processMemory.heapTotal,
      rss: processMemory.rss,
    };
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): SystemMetrics['network'] {
    // In a real implementation, this would read from network interfaces
    // For now, we'll track application-level network metrics
    return {
      bytesIn: this.networkBytesIn,
      bytesOut: this.networkBytesOut,
      connectionsActive: this.getActiveConnectionCount(),
    };
  }

  /**
   * Get application-specific metrics
   */
  private getApplicationMetrics(): SystemMetrics['application'] {
    const currentTime = Date.now();
    const ordersPerMinute = this.orderCount - this.lastOrderCount;
    this.lastOrderCount = this.orderCount;

    const averageResponseTime = this.requestCount > 0 ?
      this.responseTimeSum / this.requestCount : 0;

    const errorRate = this.requestCount > 0 ?
      (this.errorCount / this.requestCount) * 100 : 0;

    // Reset counters for next interval
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;

    return {
      activeOrders: this.getActiveOrderCount(),
      ordersPerMinute,
      averageResponseTime,
      errorRate,
      employeesOnline: this.getOnlineEmployeeCount(),
    };
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    // In a real implementation, this would query the database
    return {
      activeConnections: Math.floor(Math.random() * 20) + 5,
      queryLatency: Math.random() * 50 + 10,
      cacheHitRatio: 0.85 + Math.random() * 0.1,
    };
  }

  /**
   * Monitor kitchen dashboard real-time performance
   */
  @Interval(5000) // Every 5 seconds
  private async monitorKitchenDashboard(): Promise<void> {
    try {
      const metrics = await this.collectKitchenMetrics();
      this.kitchenMetrics.push(metrics);

      // Keep only last 500 measurements
      if (this.kitchenMetrics.length > 500) {
        this.kitchenMetrics.shift();
      }

      // Emit kitchen-specific metrics
      this.eventEmitter.emit('kitchen.metrics', metrics);

      // Check kitchen-specific alerts
      this.checkKitchenPerformance(metrics);

    } catch (error) {
      this.logger.error(`Failed to collect kitchen metrics: ${error.message}`);
    }
  }

  /**
   * Collect kitchen dashboard specific metrics
   */
  private async collectKitchenMetrics(): Promise<KitchenDashboardMetrics> {
    const startTime = performance.now();

    // Simulate order update operation
    await this.simulateOrderUpdate();

    const endTime = performance.now();
    const updateLatency = endTime - startTime;

    return {
      orderUpdateLatency: updateLatency,
      websocketConnections: this.getWebSocketConnectionCount(),
      realTimeEvents: this.getRealTimeEventCount(),
      queueSize: this.getMessageQueueSize(),
      processingRate: this.getProcessingRate(),
    };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkThresholds(metrics: SystemMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // CPU threshold check
    if (metrics.cpu.usage > this.thresholds.cpu.critical) {
      alerts.push(this.createAlert('CRITICAL', 'CPU',
        `Critical CPU usage: ${metrics.cpu.usage.toFixed(1)}%`, metrics, [
        'Scale horizontally to distribute load',
        'Optimize CPU-intensive operations',
        'Consider upgrading server hardware'
      ]));
    } else if (metrics.cpu.usage > this.thresholds.cpu.warning) {
      alerts.push(this.createAlert('HIGH', 'CPU',
        `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`, metrics, [
        'Monitor for sustained high usage',
        'Review recent deployments for performance impacts'
      ]));
    }

    // Memory threshold check
    const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsagePercent > this.thresholds.memory.critical) {
      alerts.push(this.createAlert('CRITICAL', 'MEMORY',
        `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`, metrics, [
        'Increase server memory capacity',
        'Optimize memory-intensive operations',
        'Check for memory leaks'
      ]));
    } else if (memoryUsagePercent > this.thresholds.memory.warning) {
      alerts.push(this.createAlert('HIGH', 'MEMORY',
        `High memory usage: ${memoryUsagePercent.toFixed(1)}%`, metrics, [
        'Monitor memory growth trends',
        'Consider memory optimization'
      ]));
    }

    // Response time threshold check
    if (metrics.application.averageResponseTime > this.thresholds.latency.critical) {
      alerts.push(this.createAlert('CRITICAL', 'LATENCY',
        `Critical response time: ${metrics.application.averageResponseTime.toFixed(1)}ms`, metrics, [
        'Investigate slow database queries',
        'Scale application servers',
        'Optimize critical code paths'
      ]));
    } else if (metrics.application.averageResponseTime > this.thresholds.latency.warning) {
      alerts.push(this.createAlert('MEDIUM', 'LATENCY',
        `High response time: ${metrics.application.averageResponseTime.toFixed(1)}ms`, metrics, [
        'Review database query performance',
        'Check for blocking operations'
      ]));
    }

    // Error rate threshold check
    if (metrics.application.errorRate > this.thresholds.errorRate.critical) {
      alerts.push(this.createAlert('CRITICAL', 'ERROR_RATE',
        `Critical error rate: ${metrics.application.errorRate.toFixed(1)}%`, metrics, [
        'Investigate error logs immediately',
        'Check for system failures',
        'Implement circuit breakers'
      ]));
    } else if (metrics.application.errorRate > this.thresholds.errorRate.warning) {
      alerts.push(this.createAlert('MEDIUM', 'ERROR_RATE',
        `High error rate: ${metrics.application.errorRate.toFixed(1)}%`, metrics, [
        'Review recent error patterns',
        'Check external service dependencies'
      ]));
    }

    // Database connection threshold check
    const dbUsagePercent = (metrics.database.activeConnections / 100) * 100; // Assuming max 100 connections
    if (dbUsagePercent > this.thresholds.dbConnections.critical) {
      alerts.push(this.createAlert('CRITICAL', 'DATABASE',
        `Critical database connection usage: ${dbUsagePercent.toFixed(1)}%`, metrics, [
        'Increase database connection pool size',
        'Optimize connection usage patterns',
        'Check for connection leaks'
      ]));
    }

    // Store and emit alerts
    this.alerts.push(...alerts);
    for (const alert of alerts) {
      this.eventEmitter.emit('alert.created', alert);
      this.logger.warn(`Performance Alert [${alert.severity}]: ${alert.message}`);
    }
  }

  /**
   * Check kitchen dashboard specific performance
   */
  private checkKitchenPerformance(metrics: KitchenDashboardMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Kitchen update latency check
    if (metrics.orderUpdateLatency > 1000) {
      alerts.push(this.createAlert('HIGH', 'LATENCY',
        `Kitchen dashboard slow: ${metrics.orderUpdateLatency.toFixed(1)}ms update latency`,
        { kitchen: metrics }, [
        'Optimize real-time update queries',
        'Implement WebSocket connection pooling',
        'Consider caching frequently accessed orders'
      ]));
    }

    // Queue size check
    if (metrics.queueSize > 100) {
      alerts.push(this.createAlert('MEDIUM', 'BUSINESS',
        `Kitchen queue backlog: ${metrics.queueSize} pending orders`,
        { kitchen: metrics }, [
        'Increase kitchen staff during peak hours',
        'Optimize order preparation workflows',
        'Review menu complexity'
      ]));
    }

    // Processing rate check
    if (metrics.processingRate < 0.5) {
      alerts.push(this.createAlert('MEDIUM', 'BUSINESS',
        `Low kitchen processing rate: ${(metrics.processingRate * 100).toFixed(1)}%`,
        { kitchen: metrics }, [
        'Analyze kitchen workflow bottlenecks',
        'Provide additional staff training',
        'Review equipment efficiency'
      ]));
    }

    // Store and emit kitchen alerts
    this.alerts.push(...alerts);
    for (const alert of alerts) {
      this.eventEmitter.emit('kitchen.alert', alert);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    severity: PerformanceAlert['severity'],
    type: PerformanceAlert['type'],
    message: string,
    metrics: any,
    recommendations: string[]
  ): PerformanceAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity,
      type,
      message,
      metrics,
      recommendations,
    };
  }

  /**
   * Track HTTP request performance
   */
  trackRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    if (isError) {
      this.errorCount++;
    }
  }

  /**
   * Track order creation
   */
  trackOrderCreated(): void {
    this.orderCount++;
  }

  /**
   * Track network traffic
   */
  trackNetworkTraffic(bytesIn: number, bytesOut: number): void {
    this.networkBytesIn += bytesIn;
    this.networkBytesOut += bytesOut;
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(minutes: number = 60): SystemMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    return this.alerts.filter(a => a.timestamp >= cutoff);
  }

  /**
   * Get kitchen dashboard metrics
   */
  getKitchenMetrics(minutes: number = 30): KitchenDashboardMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.kitchenMetrics.filter(m => Date.now() - cutoff >= 0);
  }

  /**
   * Generate performance summary
   */
  getPerformanceSummary(): {
    current: SystemMetrics | null;
    trends: Record<string, 'improving' | 'stable' | 'degrading'>;
    alerts: { critical: number; high: number; medium: number; low: number };
    kitchenPerformance: { status: string; averageLatency: number };
  } {
    const current = this.getCurrentMetrics();
    const recentHistory = this.getMetricsHistory(30); // Last 30 minutes
    const recentAlerts = this.getActiveAlerts();
    const recentKitchen = this.getKitchenMetrics(15); // Last 15 minutes

    // Calculate trends
    const trends = this.calculateTrends(recentHistory);

    // Count alerts by severity
    const alertCounts = {
      critical: recentAlerts.filter(a => a.severity === 'CRITICAL').length,
      high: recentAlerts.filter(a => a.severity === 'HIGH').length,
      medium: recentAlerts.filter(a => a.severity === 'MEDIUM').length,
      low: recentAlerts.filter(a => a.severity === 'LOW').length,
    };

    // Kitchen performance summary
    const avgKitchenLatency = recentKitchen.length > 0 ?
      recentKitchen.reduce((sum, m) => sum + m.orderUpdateLatency, 0) / recentKitchen.length : 0;

    const kitchenStatus = avgKitchenLatency < 500 ? 'healthy' :
                         avgKitchenLatency < 1000 ? 'warning' : 'critical';

    return {
      current,
      trends,
      alerts: alertCounts,
      kitchenPerformance: {
        status: kitchenStatus,
        averageLatency: avgKitchenLatency,
      },
    };
  }

  // Helper methods for getting counts (would be implemented based on actual data sources)
  private getActiveOrderCount(): number {
    return Math.floor(Math.random() * 50) + 10;
  }

  private getOnlineEmployeeCount(): number {
    return Math.floor(Math.random() * 15) + 5;
  }

  private getActiveConnectionCount(): number {
    return Math.floor(Math.random() * 100) + 20;
  }

  private getWebSocketConnectionCount(): number {
    return Math.floor(Math.random() * 25) + 5;
  }

  private getRealTimeEventCount(): number {
    return Math.floor(Math.random() * 100) + 50;
  }

  private getMessageQueueSize(): number {
    return Math.floor(Math.random() * 20) + 2;
  }

  private getProcessingRate(): number {
    return 0.7 + Math.random() * 0.3; // 70-100% processing rate
  }

  private async simulateOrderUpdate(): Promise<void> {
    // Simulate some async operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  private calculateTrends(metrics: SystemMetrics[]): Record<string, 'improving' | 'stable' | 'degrading'> {
    if (metrics.length < 2) {
      return {
        cpu: 'stable',
        memory: 'stable',
        latency: 'stable',
        errorRate: 'stable',
      };
    }

    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    return {
      cpu: this.getTrend(first.cpu.usage, last.cpu.usage),
      memory: this.getTrend(first.memory.used / first.memory.total, last.memory.used / last.memory.total),
      latency: this.getTrend(first.application.averageResponseTime, last.application.averageResponseTime, true),
      errorRate: this.getTrend(first.application.errorRate, last.application.errorRate, true),
    };
  }

  private getTrend(start: number, end: number, lowerIsBetter: boolean = false): 'improving' | 'stable' | 'degrading' {
    const change = (end - start) / start;
    const threshold = 0.05; // 5% change threshold

    if (Math.abs(change) < threshold) {
      return 'stable';
    }

    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'degrading';
    } else {
      return change > 0 ? 'improving' : 'degrading';
    }
  }

  private startSystemMetricsCollection(): void {
    this.logger.log('Started system metrics collection');
  }

  private startKitchenDashboardMonitoring(): void {
    this.logger.log('Started kitchen dashboard monitoring');
  }

  private startAlertEngine(): void {
    this.logger.log('Started performance alert engine');
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    // Clean old metrics
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    // Clean old alerts
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff);

    // Clean old kitchen metrics
    this.kitchenMetrics = this.kitchenMetrics.filter(m => Date.now() - cutoff >= 0);
  }
}