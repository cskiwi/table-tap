/**
 * Background Jobs and Automation System
 * Handles automated inventory management tasks using BullMQ
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bullmq';
import { Queue, Job, Worker } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryProduct,
  InventoryStock,
  Alert,
  AlertRule,
  PurchaseOrder,
  ReorderSuggestion,
  DemandForecast
} from '../database/entity-definitions';
import { DemandForecastingService } from '../analytics/ml-algorithms';
import { BusinessIntelligenceService } from '../analytics/business-intelligence';

// ================================
// JOB TYPES AND INTERFACES
// ================================

interface StockCheckJobData {
  cafeId: string;
  productIds?: string[];
  urgentOnly?: boolean;
}

interface ForecastJobData {
  cafeId: string;
  productIds?: string[];
  horizonDays?: number;
}

interface ReorderJobData {
  cafeId: string;
  autoApprove?: boolean;
  maxOrderValue?: number;
}

interface AnalyticsJobData {
  cafeId: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
}

interface ExpirationCheckJobData {
  cafeId: string;
  daysAhead?: number;
}

interface OptimizationJobData {
  cafeId: string;
  includeReorderPoints?: boolean;
  includeSafetyStock?: boolean;
  includeSuppliers?: boolean;
}

interface NotificationJobData {
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipients: string[];
  subject: string;
  message: string;
  data?: any;
}

interface CleanupJobData {
  cafeId: string;
  retentionDays: number;
  dataTypes: string[];
}

// ================================
// JOB QUEUE NAMES
// ================================

export const INVENTORY_QUEUES = {
  STOCK_MONITORING: 'inventory:stock-monitoring',
  DEMAND_FORECASTING: 'inventory:demand-forecasting',
  REORDER_MANAGEMENT: 'inventory:reorder-management',
  ANALYTICS_PROCESSING: 'inventory:analytics-processing',
  ALERT_PROCESSING: 'inventory:alert-processing',
  OPTIMIZATION: 'inventory:optimization',
  NOTIFICATIONS: 'inventory:notifications',
  DATA_CLEANUP: 'inventory:data-cleanup',
  REPORT_GENERATION: 'inventory:report-generation'
} as const;

// ================================
// BACKGROUND JOB ORCHESTRATOR
// ================================

@Injectable()
export class InventoryJobOrchestrator {
  private readonly logger = new Logger(InventoryJobOrchestrator.name);

  constructor(
    @InjectQueue(INVENTORY_QUEUES.STOCK_MONITORING) private stockQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.DEMAND_FORECASTING) private forecastQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.REORDER_MANAGEMENT) private reorderQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.ANALYTICS_PROCESSING) private analyticsQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.ALERT_PROCESSING) private alertQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.OPTIMIZATION) private optimizationQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.NOTIFICATIONS) private notificationQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.DATA_CLEANUP) private cleanupQueue: Queue,
    @InjectQueue(INVENTORY_QUEUES.REPORT_GENERATION) private reportQueue: Queue
  ) {}

  /**
   * Schedule all automated inventory jobs for a cafe
   */
  async scheduleInventoryJobs(cafeId: string) {
    this.logger.log(`Scheduling inventory jobs for cafe ${cafeId}`);

    // Stock monitoring every 15 minutes
    await this.stockQueue.add(
      'check-stock-levels',
      { cafeId },
      {
        repeat: { pattern: '*/15 * * * *' },
        jobId: `stock-check-${cafeId}`,
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );

    // Expiration check daily at 6 AM
    await this.stockQueue.add(
      'check-expiring-products',
      { cafeId, daysAhead: 7 } as ExpirationCheckJobData,
      {
        repeat: { pattern: '0 6 * * *' },
        jobId: `expiration-check-${cafeId}`,
        removeOnComplete: 7,
        removeOnFail: 3
      }
    );

    // Demand forecasting daily at 2 AM
    await this.forecastQueue.add(
      'generate-demand-forecasts',
      { cafeId, horizonDays: 30 } as ForecastJobData,
      {
        repeat: { pattern: '0 2 * * *' },
        jobId: `demand-forecast-${cafeId}`,
        removeOnComplete: 7,
        removeOnFail: 3
      }
    );

    // Reorder suggestions every 4 hours
    await this.reorderQueue.add(
      'generate-reorder-suggestions',
      { cafeId, maxOrderValue: 5000 } as ReorderJobData,
      {
        repeat: { pattern: '0 */4 * * *' },
        jobId: `reorder-suggestions-${cafeId}`,
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );

    // Analytics processing daily at 3 AM
    await this.analyticsQueue.add(
      'process-daily-analytics',
      {
        cafeId,
        periodType: 'daily',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date()
      } as AnalyticsJobData,
      {
        repeat: { pattern: '0 3 * * *' },
        jobId: `daily-analytics-${cafeId}`,
        removeOnComplete: 30,
        removeOnFail: 7
      }
    );

    // Optimization weekly on Sundays at 1 AM
    await this.optimizationQueue.add(
      'optimize-inventory-levels',
      {
        cafeId,
        includeReorderPoints: true,
        includeSafetyStock: true,
        includeSuppliers: true
      } as OptimizationJobData,
      {
        repeat: { pattern: '0 1 * * 0' },
        jobId: `optimization-${cafeId}`,
        removeOnComplete: 4,
        removeOnFail: 2
      }
    );

    // Data cleanup monthly on 1st at midnight
    await this.cleanupQueue.add(
      'cleanup-old-data',
      {
        cafeId,
        retentionDays: 365,
        dataTypes: ['movements', 'analytics', 'forecasts']
      } as CleanupJobData,
      {
        repeat: { pattern: '0 0 1 * *' },
        jobId: `data-cleanup-${cafeId}`,
        removeOnComplete: 12,
        removeOnFail: 3
      }
    );

    this.logger.log(`Successfully scheduled all inventory jobs for cafe ${cafeId}`);
  }

  /**
   * Trigger immediate stock check
   */
  async triggerStockCheck(cafeId: string, productIds?: string[], urgentOnly = false) {
    return this.stockQueue.add(
      'check-stock-levels',
      { cafeId, productIds, urgentOnly } as StockCheckJobData,
      { priority: urgentOnly ? 10 : 5 }
    );
  }

  /**
   * Trigger immediate forecast generation
   */
  async triggerForecastGeneration(cafeId: string, productIds?: string[], horizonDays = 30) {
    return this.forecastQueue.add(
      'generate-demand-forecasts',
      { cafeId, productIds, horizonDays } as ForecastJobData,
      { priority: 7 }
    );
  }

  /**
   * Trigger immediate reorder suggestions
   */
  async triggerReorderSuggestions(cafeId: string, autoApprove = false, maxOrderValue?: number) {
    return this.reorderQueue.add(
      'generate-reorder-suggestions',
      { cafeId, autoApprove, maxOrderValue } as ReorderJobData,
      { priority: 8 }
    );
  }

  /**
   * Send notification
   */
  async sendNotification(data: NotificationJobData) {
    return this.notificationQueue.add('send-notification', data, { priority: 9 });
  }
}

// ================================
// STOCK MONITORING PROCESSOR
// ================================

@Processor(INVENTORY_QUEUES.STOCK_MONITORING)
export class StockMonitoringProcessor {
  private readonly logger = new Logger(StockMonitoringProcessor.name);

  constructor(
    @InjectRepository(InventoryProduct)
    private productRepository: Repository<InventoryProduct>,
    @InjectRepository(InventoryStock)
    private stockRepository: Repository<InventoryStock>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
    @InjectQueue(INVENTORY_QUEUES.NOTIFICATIONS)
    private notificationQueue: Queue
  ) {}

  @Process('check-stock-levels')
  async checkStockLevels(job: Job<StockCheckJobData>) {
    const { cafeId, productIds, urgentOnly } = job.data;
    this.logger.log(`Checking stock levels for cafe ${cafeId}`);

    try {
      let query = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.stockLevels', 'stock')
        .leftJoinAndSelect('stock.location', 'location')
        .where('product.cafeId = :cafeId', { cafeId })
        .andWhere('product.isActive = true');

      if (productIds?.length) {
        query = query.andWhere('product.id IN (:...productIds)', { productIds });
      }

      const products = await query.getMany();
      const alerts: Alert[] = [];

      for (const product of products) {
        const totalStock = product.stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
        const reservedStock = product.stockLevels.reduce((sum, stock) => sum + stock.reservedQuantity, 0);
        const availableStock = totalStock - reservedStock;

        // Check for low stock
        if (availableStock <= product.reorderPoint) {
          const severity = availableStock <= product.reorderPoint * 0.5 ? 'critical' : 'high';

          if (!urgentOnly || severity === 'critical') {
            const alert = await this.createLowStockAlert(product, availableStock, severity);
            if (alert) alerts.push(alert);
          }
        }

        // Check for overstocking
        if (product.maxStockLevel && totalStock > product.maxStockLevel * 1.2) {
          const alert = await this.createOverstockAlert(product, totalStock);
          if (alert) alerts.push(alert);
        }

        // Update job progress
        await job.updateProgress((products.indexOf(product) / products.length) * 100);
      }

      this.logger.log(`Created ${alerts.length} stock alerts for cafe ${cafeId}`);
      return { alertsCreated: alerts.length, productsChecked: products.length };

    } catch (error) {
      this.logger.error(`Error checking stock levels for cafe ${cafeId}:`, error);
      throw error;
    }
  }

  @Process('check-expiring-products')
  async checkExpiringProducts(job: Job<ExpirationCheckJobData>) {
    const { cafeId, daysAhead = 7 } = job.data;
    this.logger.log(`Checking for products expiring in ${daysAhead} days for cafe ${cafeId}`);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const expiringStock = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.product', 'product')
        .leftJoinAndSelect('stock.location', 'location')
        .where('product.cafeId = :cafeId', { cafeId })
        .andWhere('stock.expirationDate IS NOT NULL')
        .andWhere('stock.expirationDate <= :cutoffDate', { cutoffDate })
        .andWhere('stock.quantity > 0')
        .orderBy('stock.expirationDate', 'ASC')
        .getMany();

      const alerts: Alert[] = [];

      for (const stock of expiringStock) {
        const daysUntilExpiration = Math.floor(
          (stock.expirationDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const severity = daysUntilExpiration <= 1 ? 'critical' :
                        daysUntilExpiration <= 3 ? 'high' : 'medium';

        const alert = await this.createExpirationAlert(stock, daysUntilExpiration, severity);
        if (alert) alerts.push(alert);
      }

      this.logger.log(`Created ${alerts.length} expiration alerts for cafe ${cafeId}`);
      return { alertsCreated: alerts.length, expiringItems: expiringStock.length };

    } catch (error) {
      this.logger.error(`Error checking expiring products for cafe ${cafeId}:`, error);
      throw error;
    }
  }

  private async createLowStockAlert(
    product: InventoryProduct,
    currentStock: number,
    severity: 'high' | 'critical'
  ): Promise<Alert | null> {
    // Check if similar alert already exists
    const existingAlert = await this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.cafeId = :cafeId', { cafeId: product.cafeId })
      .andWhere('alert.status = :status', { status: 'active' })
      .andWhere("alert.data->>'productId' = :productId", { productId: product.id })
      .andWhere("alert.data->>'type' = 'low_stock'")
      .getOne();

    if (existingAlert) return null;

    const alert = this.alertRepository.create({
      severity,
      title: `Low Stock: ${product.name}`,
      message: `Product ${product.name} is below reorder point. Current stock: ${currentStock}, Reorder point: ${product.reorderPoint}`,
      data: {
        type: 'low_stock',
        productId: product.id,
        productName: product.name,
        currentStock,
        reorderPoint: product.reorderPoint,
        urgency: severity
      },
      cafeId: product.cafeId,
      status: 'active'
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Send notification
    await this.notificationQueue.add('send-notification', {
      type: 'email',
      recipients: ['inventory@cafe.com'], // Would come from alert rules
      subject: `${severity.toUpperCase()}: Low Stock Alert`,
      message: alert.message,
      data: alert.data
    } as NotificationJobData);

    return savedAlert;
  }

  private async createOverstockAlert(
    product: InventoryProduct,
    currentStock: number
  ): Promise<Alert | null> {
    const alert = this.alertRepository.create({
      severity: 'medium',
      title: `Overstock: ${product.name}`,
      message: `Product ${product.name} is overstocked. Current: ${currentStock}, Max: ${product.maxStockLevel}`,
      data: {
        type: 'overstock',
        productId: product.id,
        productName: product.name,
        currentStock,
        maxStockLevel: product.maxStockLevel
      },
      cafeId: product.cafeId,
      status: 'active'
    });

    return this.alertRepository.save(alert);
  }

  private async createExpirationAlert(
    stock: InventoryStock,
    daysUntilExpiration: number,
    severity: 'medium' | 'high' | 'critical'
  ): Promise<Alert | null> {
    const alert = this.alertRepository.create({
      severity,
      title: `Expiring Soon: ${stock.product.name}`,
      message: `${stock.quantity} units of ${stock.product.name} expire in ${daysUntilExpiration} days (Batch: ${stock.batchNumber})`,
      data: {
        type: 'expiration',
        productId: stock.productId,
        productName: stock.product.name,
        stockId: stock.id,
        quantity: stock.quantity,
        batchNumber: stock.batchNumber,
        expirationDate: stock.expirationDate,
        daysUntilExpiration,
        locationName: stock.location.name
      },
      cafeId: stock.product.cafeId,
      status: 'active'
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Send urgent notification for critical expiration
    if (severity === 'critical') {
      await this.notificationQueue.add('send-notification', {
        type: 'email',
        recipients: ['manager@cafe.com'],
        subject: 'URGENT: Products Expiring Today',
        message: alert.message,
        data: alert.data
      } as NotificationJobData);
    }

    return savedAlert;
  }
}

// ================================
// DEMAND FORECASTING PROCESSOR
// ================================

@Processor(INVENTORY_QUEUES.DEMAND_FORECASTING)
export class DemandForecastingProcessor {
  private readonly logger = new Logger(DemandForecastingProcessor.name);

  constructor(
    @InjectRepository(InventoryProduct)
    private productRepository: Repository<InventoryProduct>,
    @InjectRepository(DemandForecast)
    private forecastRepository: Repository<DemandForecast>,
    private forecastingService: DemandForecastingService
  ) {}

  @Process('generate-demand-forecasts')
  async generateDemandForecasts(job: Job<ForecastJobData>) {
    const { cafeId, productIds, horizonDays = 30 } = job.data;
    this.logger.log(`Generating demand forecasts for cafe ${cafeId}, horizon: ${horizonDays} days`);

    try {
      let query = this.productRepository
        .createQueryBuilder('product')
        .where('product.cafeId = :cafeId', { cafeId })
        .andWhere('product.isActive = true');

      if (productIds?.length) {
        query = query.andWhere('product.id IN (:...productIds)', { productIds });
      }

      const products = await query.getMany();
      let forecastsGenerated = 0;

      for (const product of products) {
        try {
          // Get historical data (simplified - would need actual sales data)
          const historicalData = await this.getHistoricalDemandData(product.id);

          if (historicalData.length < 14) {
            this.logger.warn(`Insufficient data for product ${product.id}, skipping forecast`);
            continue;
          }

          // Generate forecasts
          const forecasts = await this.forecastingService.generateDemandForecast(
            product.id,
            historicalData,
            horizonDays,
            true
          );

          // Save forecasts to database
          for (const forecast of forecasts) {
            await this.forecastRepository.save({
              productId: forecast.productId,
              cafeId,
              forecastDate: forecast.forecastDate,
              forecastHorizonDays: 1, // Daily forecasts
              predictedDemand: forecast.predictedDemand,
              confidenceIntervalLower: forecast.confidenceInterval.lower,
              confidenceIntervalUpper: forecast.confidenceInterval.upper,
              modelVersion: forecast.modelVersion,
              featuresUsed: forecast.features
            });
          }

          forecastsGenerated += forecasts.length;
          await job.updateProgress((products.indexOf(product) / products.length) * 100);

        } catch (error) {
          this.logger.error(`Error generating forecast for product ${product.id}:`, error);
        }
      }

      this.logger.log(`Generated ${forecastsGenerated} forecasts for ${products.length} products`);
      return { forecastsGenerated, productsProcessed: products.length };

    } catch (error) {
      this.logger.error(`Error in demand forecasting job for cafe ${cafeId}:`, error);
      throw error;
    }
  }

  @Process('train-forecast-models')
  async trainForecastModels(job: Job<{ cafeId: string; productIds?: string[] }>) {
    const { cafeId, productIds } = job.data;
    this.logger.log(`Training forecast models for cafe ${cafeId}`);

    // Implementation would trigger model training
    // This is a placeholder for the actual ML model training process

    return { modelsTrained: productIds?.length || 0 };
  }

  private async getHistoricalDemandData(productId: string) {
    // Simplified - would get actual sales/movement data
    // This is a placeholder that would query the inventory_movements table
    const mockData = [];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      mockData.push({
        date,
        value: Math.floor(Math.random() * 10) + 5, // Random demand between 5-15
        features: {
          temperature: 20 + Math.random() * 10,
          isWeekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
          isHoliday: 0
        }
      });
    }

    return mockData;
  }
}

// ================================
// REORDER MANAGEMENT PROCESSOR
// ================================

@Processor(INVENTORY_QUEUES.REORDER_MANAGEMENT)
export class ReorderManagementProcessor {
  private readonly logger = new Logger(ReorderManagementProcessor.name);

  constructor(
    @InjectRepository(InventoryProduct)
    private productRepository: Repository<InventoryProduct>,
    @InjectRepository(ReorderSuggestion)
    private reorderSuggestionRepository: Repository<ReorderSuggestion>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectQueue(INVENTORY_QUEUES.NOTIFICATIONS)
    private notificationQueue: Queue
  ) {}

  @Process('generate-reorder-suggestions')
  async generateReorderSuggestions(job: Job<ReorderJobData>) {
    const { cafeId, autoApprove = false, maxOrderValue } = job.data;
    this.logger.log(`Generating reorder suggestions for cafe ${cafeId}`);

    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.stockLevels', 'stock')
        .leftJoinAndSelect('product.supplierProducts', 'supplierProduct')
        .leftJoinAndSelect('supplierProduct.supplier', 'supplier')
        .where('product.cafeId = :cafeId', { cafeId })
        .andWhere('product.isActive = true')
        .getMany();

      const suggestions: ReorderSuggestion[] = [];

      for (const product of products) {
        const totalStock = product.stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
        const reservedStock = product.stockLevels.reduce((sum, stock) => sum + stock.reservedQuantity, 0);
        const availableStock = totalStock - reservedStock;

        // Check if reorder is needed
        if (availableStock <= product.reorderPoint) {
          const suggestion = await this.createReorderSuggestion(product, availableStock);
          if (suggestion) {
            suggestions.push(suggestion);

            // Auto-approve if enabled and within limits
            if (autoApprove && (!maxOrderValue || suggestion.estimatedCost <= maxOrderValue)) {
              await this.autoApproveSuggestion(suggestion);
            }
          }
        }

        await job.updateProgress((products.indexOf(product) / products.length) * 100);
      }

      // Send summary notification
      if (suggestions.length > 0) {
        await this.notificationQueue.add('send-notification', {
          type: 'email',
          recipients: ['purchasing@cafe.com'],
          subject: `${suggestions.length} New Reorder Suggestions`,
          message: `Generated ${suggestions.length} reorder suggestions. Total estimated cost: $${suggestions.reduce((sum, s) => sum + s.estimatedCost, 0).toFixed(2)}`,
          data: { suggestions: suggestions.map(s => s.id) }
        } as NotificationJobData);
      }

      this.logger.log(`Generated ${suggestions.length} reorder suggestions for cafe ${cafeId}`);
      return { suggestionsGenerated: suggestions.length, autoApproved: autoApprove ? suggestions.length : 0 };

    } catch (error) {
      this.logger.error(`Error generating reorder suggestions for cafe ${cafeId}:`, error);
      throw error;
    }
  }

  @Process('auto-approve-reorders')
  async autoApproveReorders(job: Job<{ cafeId: string; maxValue: number }>) {
    const { cafeId, maxValue } = job.data;

    const pendingSuggestions = await this.reorderSuggestionRepository
      .createQueryBuilder('suggestion')
      .where('suggestion.cafeId = :cafeId', { cafeId })
      .andWhere('suggestion.status = :status', { status: 'pending' })
      .andWhere('suggestion.estimatedCost <= :maxValue', { maxValue })
      .getMany();

    let approvedCount = 0;

    for (const suggestion of pendingSuggestions) {
      try {
        await this.autoApproveSuggestion(suggestion);
        approvedCount++;
      } catch (error) {
        this.logger.error(`Error auto-approving suggestion ${suggestion.id}:`, error);
      }
    }

    return { approvedCount };
  }

  private async createReorderSuggestion(
    product: InventoryProduct,
    currentStock: number
  ): Promise<ReorderSuggestion | null> {
    // Find best supplier
    const bestSupplier = product.supplierProducts
      ?.filter(sp => sp.supplier.isActive)
      ?.sort((a, b) => a.unitCost - b.unitCost)[0];

    if (!bestSupplier) {
      this.logger.warn(`No active suppliers found for product ${product.id}`);
      return null;
    }

    // Calculate suggested quantity
    const shortage = product.reorderPoint - currentStock;
    const suggestedQuantity = Math.max(product.reorderQuantity, shortage);

    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(product, currentStock);

    const suggestion = this.reorderSuggestionRepository.create({
      productId: product.id,
      supplierId: bestSupplier.supplierId,
      suggestedQuantity,
      estimatedCost: suggestedQuantity * bestSupplier.unitCost,
      priorityScore,
      reason: this.generateReorderReason(product, currentStock, shortage),
      algorithmVersion: '2.0.0',
      inputData: {
        currentStock,
        reorderPoint: product.reorderPoint,
        reorderQuantity: product.reorderQuantity,
        shortage,
        supplierUnitCost: bestSupplier.unitCost
      },
      cafeId: product.cafeId,
      status: 'pending'
    });

    return this.reorderSuggestionRepository.save(suggestion);
  }

  private async autoApproveSuggestion(suggestion: ReorderSuggestion): Promise<void> {
    // Create purchase order
    const poNumber = `AUTO-${Date.now()}-${suggestion.id.slice(-8)}`;

    const purchaseOrder = this.purchaseOrderRepository.create({
      poNumber,
      supplierId: suggestion.supplierId,
      status: 'draft',
      orderDate: new Date(),
      subtotal: suggestion.estimatedCost,
      totalAmount: suggestion.estimatedCost,
      cafeId: suggestion.cafeId,
      createdByUserId: 'system', // System user ID
      items: [{
        productId: suggestion.productId,
        quantityOrdered: suggestion.suggestedQuantity,
        unitCost: suggestion.estimatedCost / suggestion.suggestedQuantity,
        totalCost: suggestion.estimatedCost
      }]
    });

    const savedPO = await this.purchaseOrderRepository.save(purchaseOrder);

    // Update suggestion status
    suggestion.status = 'approved';
    suggestion.createdPurchaseOrderId = savedPO.id;
    await this.reorderSuggestionRepository.save(suggestion);

    this.logger.log(`Auto-approved reorder suggestion ${suggestion.id}, created PO ${savedPO.poNumber}`);
  }

  private calculatePriorityScore(product: InventoryProduct, currentStock: number): number {
    const stockoutRisk = Math.max(0, (product.reorderPoint - currentStock) / product.reorderPoint);
    const revenueImpact = product.unitCost * 10; // Simplified revenue calculation

    return Math.min(10, stockoutRisk * 5 + (revenueImpact / 1000) * 2);
  }

  private generateReorderReason(product: InventoryProduct, currentStock: number, shortage: number): string {
    if (currentStock <= 0) {
      return `OUT OF STOCK: Immediate reorder required for ${product.name}`;
    } else if (currentStock <= product.reorderPoint * 0.5) {
      return `CRITICAL LOW: Stock is ${shortage} units below reorder point`;
    } else {
      return `Low stock: Below reorder point by ${shortage} units`;
    }
  }
}

// ================================
// CRON-BASED SCHEDULER
// ================================

@Injectable()
export class InventoryScheduler {
  private readonly logger = new Logger(InventoryScheduler.name);

  constructor(
    private jobOrchestrator: InventoryJobOrchestrator,
    @InjectRepository(InventoryProduct)
    private productRepository: Repository<InventoryProduct>
  ) {}

  /**
   * Schedule critical stock checks every 5 minutes
   */
  @Cron('*/5 * * * *')
  async handleCriticalStockCheck() {
    this.logger.log('Running critical stock check');

    // Get all active cafes
    const cafes = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.cafeId', 'cafeId')
      .where('product.isActive = true')
      .getRawMany();

    for (const cafe of cafes) {
      await this.jobOrchestrator.triggerStockCheck(cafe.cafeId, undefined, true);
    }
  }

  /**
   * Weekly analytics and optimization
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyOptimization() {
    this.logger.log('Running weekly inventory optimization');

    const cafes = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.cafeId', 'cafeId')
      .where('product.isActive = true')
      .getRawMany();

    for (const cafe of cafes) {
      // Trigger optimization and analytics jobs
      // Implementation would use the queue system
    }
  }

  /**
   * Monthly model retraining
   */
  @Cron('0 0 1 * *') // First day of every month
  async handleMonthlyModelRetraining() {
    this.logger.log('Running monthly ML model retraining');

    // Implementation would trigger model retraining jobs
    // This ensures forecasting models stay accurate with new data
  }
}

export {
  StockCheckJobData,
  ForecastJobData,
  ReorderJobData,
  AnalyticsJobData,
  ExpirationCheckJobData,
  OptimizationJobData,
  NotificationJobData,
  CleanupJobData,
  INVENTORY_QUEUES
};