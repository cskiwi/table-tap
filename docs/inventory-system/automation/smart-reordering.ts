/**
 * Smart Reordering System
 * Advanced automated ordering with ML optimization and supplier management
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryProduct,
  InventoryStock,
  Supplier,
  SupplierProduct,
  PurchaseOrder,
  PurchaseOrderItem,
  ReorderSuggestion,
  DemandForecast
} from '../database/entity-definitions';

// ================================
// INTERFACES AND TYPES
// ================================

interface SmartReorderConfiguration {
  cafeId: string;
  autoApprovalEnabled: boolean;
  maxAutoOrderValue: number;
  emergencyThreshold: number; // Stock level that triggers emergency orders
  seasonalAdjustment: boolean;
  supplierRotation: boolean;
  bulkDiscountOptimization: boolean;
  leadTimeBuffer: number; // Extra days added to supplier lead time
  safetyStockMultiplier: number;
  qualityWeighting: number; // 0-1, how much to weight quality vs price
}

interface SupplierPerformanceMetrics {
  supplierId: string;
  supplierName: string;
  onTimeDeliveryRate: number;
  qualityScore: number;
  priceCompetitiveness: number;
  leadTimeAccuracy: number;
  orderFulfillmentRate: number;
  communicationRating: number;
  overallScore: number;
  recommendationWeight: number;
}

interface OptimalOrderPlan {
  productId: string;
  recommendedSupplier: string;
  orderQuantity: number;
  estimatedCost: number;
  expectedDeliveryDate: Date;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  reasoning: string[];
  riskFactors: string[];
  alternatives: AlternativeOrderOption[];
}

interface AlternativeOrderOption {
  supplierId: string;
  supplierName: string;
  quantity: number;
  cost: number;
  deliveryDate: Date;
  score: number;
  tradeoffs: string[];
}

interface OrderBatch {
  supplierId: string;
  totalValue: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  consolidationSavings: number;
  shippingSavings: number;
}

interface EmergencyOrderTrigger {
  productId: string;
  currentStock: number;
  criticalLevel: number;
  estimatedStockoutDate: Date;
  impact: 'low' | 'medium' | 'high' | 'severe';
  recommendedAction: 'immediate_order' | 'find_substitute' | 'adjust_menu';
}

// ================================
// SMART REORDERING ENGINE
// ================================

@Injectable()
export class SmartReorderingEngine {
  private readonly logger = new Logger(SmartReorderingEngine.name);

  constructor(
    @InjectRepository(InventoryProduct)
    private productRepository: Repository<InventoryProduct>,
    @InjectRepository(InventoryStock)
    private stockRepository: Repository<InventoryStock>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(SupplierProduct)
    private supplierProductRepository: Repository<SupplierProduct>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(ReorderSuggestion)
    private reorderSuggestionRepository: Repository<ReorderSuggestion>,
    @InjectRepository(DemandForecast)
    private demandForecastRepository: Repository<DemandForecast>
  ) {}

  /**
   * Generate comprehensive smart reorder plan
   */
  async generateSmartReorderPlan(
    cafeId: string,
    config: SmartReorderConfiguration
  ): Promise<{
    orderPlans: OptimalOrderPlan[];
    batchRecommendations: OrderBatch[];
    emergencyTriggers: EmergencyOrderTrigger[];
    totalEstimatedCost: number;
    potentialSavings: number;
  }> {
    this.logger.log(`Generating smart reorder plan for cafe ${cafeId}`);

    try {
      // Get products needing reorder
      const productsNeedingReorder = await this.identifyProductsNeedingReorder(cafeId, config);

      // Analyze supplier performance
      const supplierMetrics = await this.analyzeSupplierPerformance(cafeId);

      // Generate optimal order plans
      const orderPlans: OptimalOrderPlan[] = [];
      const emergencyTriggers: EmergencyOrderTrigger[] = [];

      for (const product of productsNeedingReorder) {
        const plan = await this.generateOptimalOrderPlan(
          product,
          supplierMetrics,
          config
        );

        if (plan) {
          orderPlans.push(plan);

          // Check for emergency situations
          const emergencyTrigger = await this.checkEmergencyTrigger(product, config);
          if (emergencyTrigger) {
            emergencyTriggers.push(emergencyTrigger);
          }
        }
      }

      // Optimize batching across suppliers
      const batchRecommendations = await this.optimizeBatching(orderPlans, config);

      // Calculate costs and savings
      const totalEstimatedCost = orderPlans.reduce((sum, plan) => sum + plan.estimatedCost, 0);
      const potentialSavings = await this.calculatePotentialSavings(orderPlans, batchRecommendations);

      this.logger.log(`Generated reorder plan with ${orderPlans.length} orders, estimated cost: $${totalEstimatedCost.toFixed(2)}`);

      return {
        orderPlans,
        batchRecommendations,
        emergencyTriggers,
        totalEstimatedCost,
        potentialSavings
      };

    } catch (error) {
      this.logger.error(`Error generating smart reorder plan for cafe ${cafeId}:`, error);
      throw error;
    }
  }

  /**
   * Execute automated orders based on configuration
   */
  async executeAutomatedOrders(
    cafeId: string,
    orderPlans: OptimalOrderPlan[],
    config: SmartReorderConfiguration
  ): Promise<{
    ordersCreated: number;
    totalValue: number;
    ordersRequiringApproval: number;
  }> {
    let ordersCreated = 0;
    let totalValue = 0;
    let ordersRequiringApproval = 0;

    for (const plan of orderPlans) {
      try {
        // Check if order meets auto-approval criteria
        const canAutoApprove = this.canAutoApprove(plan, config);

        if (canAutoApprove) {
          const purchaseOrder = await this.createPurchaseOrder(plan, cafeId, true);
          ordersCreated++;
          totalValue += plan.estimatedCost;
          this.logger.log(`Auto-created purchase order ${purchaseOrder.poNumber} for ${plan.estimatedCost}`);
        } else {
          // Create as draft requiring approval
          await this.createPurchaseOrder(plan, cafeId, false);
          ordersRequiringApproval++;
          this.logger.log(`Created draft purchase order for ${plan.estimatedCost} requiring approval`);
        }

      } catch (error) {
        this.logger.error(`Error creating purchase order for product ${plan.productId}:`, error);
      }
    }

    return {
      ordersCreated,
      totalValue,
      ordersRequiringApproval
    };
  }

  /**
   * Identify products that need reordering
   */
  private async identifyProductsNeedingReorder(
    cafeId: string,
    config: SmartReorderConfiguration
  ): Promise<InventoryProduct[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.stockLevels', 'stock')
      .leftJoinAndSelect('product.supplierProducts', 'supplierProduct')
      .leftJoinAndSelect('supplierProduct.supplier', 'supplier')
      .where('product.cafeId = :cafeId', { cafeId })
      .andWhere('product.isActive = true')
      .getMany();

    const needReorder: InventoryProduct[] = [];

    for (const product of products) {
      const totalStock = product.stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
      const reservedStock = product.stockLevels.reduce((sum, stock) => sum + stock.reservedQuantity, 0);
      const availableStock = totalStock - reservedStock;

      // Get demand forecast for next 30 days
      const forecast = await this.getDemandForecast(product.id, 30);
      const projectedDemand = forecast.reduce((sum, f) => sum + f.predictedDemand, 0);

      // Calculate dynamic reorder point
      const dynamicReorderPoint = await this.calculateDynamicReorderPoint(
        product,
        projectedDemand,
        config
      );

      // Check if reorder is needed
      if (availableStock <= dynamicReorderPoint) {
        needReorder.push(product);
      }

      // Emergency check
      if (availableStock <= product.reorderPoint * config.emergencyThreshold) {
        needReorder.push(product);
      }
    }

    return [...new Set(needReorder)]; // Remove duplicates
  }

  /**
   * Analyze supplier performance metrics
   */
  private async analyzeSupplierPerformance(cafeId: string): Promise<Map<string, SupplierPerformanceMetrics>> {
    const suppliers = await this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.cafeId = :cafeId', { cafeId })
      .andWhere('supplier.isActive = true')
      .getMany();

    const metricsMap = new Map<string, SupplierPerformanceMetrics>();

    for (const supplier of suppliers) {
      const metrics = await this.calculateSupplierMetrics(supplier);
      metricsMap.set(supplier.id, metrics);
    }

    return metricsMap;
  }

  /**
   * Calculate supplier performance metrics
   */
  private async calculateSupplierMetrics(supplier: Supplier): Promise<SupplierPerformanceMetrics> {
    // Get recent purchase orders from this supplier
    const recentOrders = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .where('po.supplierId = :supplierId', { supplierId: supplier.id })
      .andWhere('po.orderDate >= :date', { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) })
      .getMany();

    // Calculate on-time delivery rate
    const onTimeDeliveries = recentOrders.filter(order =>
      order.actualDeliveryDate &&
      order.expectedDeliveryDate &&
      order.actualDeliveryDate <= order.expectedDeliveryDate
    ).length;
    const onTimeDeliveryRate = recentOrders.length > 0 ? onTimeDeliveries / recentOrders.length : 0.8;

    // Calculate other metrics (simplified)
    const qualityScore = supplier.rating / 5; // Assuming 5-star rating system
    const priceCompetitiveness = 0.8; // Would compare against market prices
    const leadTimeAccuracy = 0.85; // Would calculate from actual vs estimated lead times
    const orderFulfillmentRate = 0.95; // Would calculate from complete vs partial fulfillments
    const communicationRating = 0.8; // Would be based on response times and communication quality

    // Calculate overall score with weights
    const overallScore = (
      onTimeDeliveryRate * 0.25 +
      qualityScore * 0.20 +
      priceCompetitiveness * 0.20 +
      leadTimeAccuracy * 0.15 +
      orderFulfillmentRate * 0.15 +
      communicationRating * 0.05
    );

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      onTimeDeliveryRate,
      qualityScore,
      priceCompetitiveness,
      leadTimeAccuracy,
      orderFulfillmentRate,
      communicationRating,
      overallScore,
      recommendationWeight: overallScore
    };
  }

  /**
   * Generate optimal order plan for a product
   */
  private async generateOptimalOrderPlan(
    product: InventoryProduct,
    supplierMetrics: Map<string, SupplierPerformanceMetrics>,
    config: SmartReorderConfiguration
  ): Promise<OptimalOrderPlan | null> {
    const availableSuppliers = product.supplierProducts?.filter(sp =>
      sp.supplier.isActive && supplierMetrics.has(sp.supplierId)
    );

    if (!availableSuppliers?.length) {
      this.logger.warn(`No available suppliers for product ${product.id}`);
      return null;
    }

    // Score suppliers based on multiple criteria
    const supplierScores = availableSuppliers.map(sp => {
      const metrics = supplierMetrics.get(sp.supplierId)!;
      const priceScore = 1 - (sp.unitCost / Math.max(...availableSuppliers.map(s => s.unitCost)));
      const qualityScore = metrics.overallScore;

      // Weight price vs quality based on configuration
      const compositeScore = (
        priceScore * (1 - config.qualityWeighting) +
        qualityScore * config.qualityWeighting
      );

      return {
        supplierProduct: sp,
        metrics,
        compositeScore
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);

    const bestOption = supplierScores[0];

    // Calculate optimal order quantity
    const currentStock = product.stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
    const forecast = await this.getDemandForecast(product.id, 30);
    const projectedDemand = forecast.reduce((sum, f) => sum + f.predictedDemand, 0);

    const optimalQuantity = await this.calculateOptimalOrderQuantity(
      product,
      currentStock,
      projectedDemand,
      bestOption.supplierProduct,
      config
    );

    // Calculate delivery date
    const leadTimeDays = bestOption.supplierProduct.leadTimeDays + config.leadTimeBuffer;
    const expectedDeliveryDate = new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000);

    // Determine priority
    const priority = this.determinePriority(product, currentStock, projectedDemand, config);

    // Generate reasoning
    const reasoning = this.generateOrderReasoning(
      product,
      bestOption,
      optimalQuantity,
      currentStock,
      projectedDemand
    );

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(product, bestOption, config);

    // Generate alternatives
    const alternatives = supplierScores.slice(1, 3).map(option =>
      this.createAlternativeOption(option, optimalQuantity, config)
    );

    return {
      productId: product.id,
      recommendedSupplier: bestOption.supplierProduct.supplierId,
      orderQuantity: optimalQuantity,
      estimatedCost: optimalQuantity * bestOption.supplierProduct.unitCost,
      expectedDeliveryDate,
      priority,
      reasoning,
      riskFactors,
      alternatives
    };
  }

  /**
   * Calculate dynamic reorder point based on forecasts and seasonality
   */
  private async calculateDynamicReorderPoint(
    product: InventoryProduct,
    projectedDemand: number,
    config: SmartReorderConfiguration
  ): Promise<number> {
    const baseReorderPoint = product.reorderPoint;

    // Seasonal adjustment
    let seasonalMultiplier = 1;
    if (config.seasonalAdjustment) {
      seasonalMultiplier = await this.calculateSeasonalMultiplier(product.id);
    }

    // Demand variability adjustment
    const demandVariability = await this.calculateDemandVariability(product.id);
    const variabilityMultiplier = 1 + (demandVariability * 0.5);

    // Safety stock multiplier from config
    const safetyMultiplier = config.safetyStockMultiplier;

    return Math.max(
      baseReorderPoint,
      baseReorderPoint * seasonalMultiplier * variabilityMultiplier * safetyMultiplier
    );
  }

  /**
   * Calculate optimal order quantity using EOQ with modifications
   */
  private async calculateOptimalOrderQuantity(
    product: InventoryProduct,
    currentStock: number,
    projectedDemand: number,
    supplierProduct: SupplierProduct,
    config: SmartReorderConfiguration
  ): Promise<number> {
    // Basic EOQ calculation
    const annualDemand = projectedDemand * (365 / 30); // Scale 30-day forecast to annual
    const orderingCost = 50; // Estimated ordering cost
    const holdingCostRate = 0.2; // 20% annual holding cost
    const unitCost = supplierProduct.unitCost;

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / (unitCost * holdingCostRate));

    // Adjust for current situation
    const shortage = Math.max(0, product.reorderPoint - currentStock);
    const baseQuantity = Math.max(eoq, product.reorderQuantity, shortage);

    // Bulk discount optimization
    let finalQuantity = baseQuantity;
    if (config.bulkDiscountOptimization) {
      finalQuantity = await this.optimizeForBulkDiscounts(
        baseQuantity,
        supplierProduct,
        projectedDemand
      );
    }

    // Ensure minimum order quantity is met
    return Math.max(finalQuantity, supplierProduct.minimumOrderQuantity);
  }

  /**
   * Optimize batching to reduce shipping costs and consolidate orders
   */
  private async optimizeBatching(
    orderPlans: OptimalOrderPlan[],
    config: SmartReorderConfiguration
  ): Promise<OrderBatch[]> {
    const batches = new Map<string, OrderBatch>();

    for (const plan of orderPlans) {
      const supplierId = plan.recommendedSupplier;

      if (!batches.has(supplierId)) {
        batches.set(supplierId, {
          supplierId,
          totalValue: 0,
          items: [],
          consolidationSavings: 0,
          shippingSavings: 0
        });
      }

      const batch = batches.get(supplierId)!;
      batch.totalValue += plan.estimatedCost;
      batch.items.push({
        productId: plan.productId,
        quantity: plan.orderQuantity,
        unitCost: plan.estimatedCost / plan.orderQuantity,
        totalCost: plan.estimatedCost
      });
    }

    // Calculate savings for each batch
    for (const batch of batches.values()) {
      // Estimate shipping savings from consolidation
      const individualShippingCost = batch.items.length * 25; // $25 per individual shipment
      const consolidatedShippingCost = 50; // $50 for consolidated shipment
      batch.shippingSavings = Math.max(0, individualShippingCost - consolidatedShippingCost);

      // Estimate consolidation savings (volume discounts, etc.)
      if (batch.totalValue > 1000) {
        batch.consolidationSavings = batch.totalValue * 0.02; // 2% volume discount
      }
    }

    return Array.from(batches.values());
  }

  /**
   * Check for emergency reorder triggers
   */
  private async checkEmergencyTrigger(
    product: InventoryProduct,
    config: SmartReorderConfiguration
  ): Promise<EmergencyOrderTrigger | null> {
    const currentStock = product.stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
    const criticalLevel = product.reorderPoint * config.emergencyThreshold;

    if (currentStock <= criticalLevel) {
      // Estimate stockout date
      const dailyUsage = await this.calculateAverageDailyUsage(product.id);
      const daysUntilStockout = dailyUsage > 0 ? currentStock / dailyUsage : 999;
      const estimatedStockoutDate = new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000);

      // Determine impact
      let impact: 'low' | 'medium' | 'high' | 'severe' = 'medium';
      if (currentStock <= 0) impact = 'severe';
      else if (daysUntilStockout <= 1) impact = 'high';
      else if (daysUntilStockout <= 3) impact = 'medium';
      else impact = 'low';

      // Determine recommended action
      let recommendedAction: 'immediate_order' | 'find_substitute' | 'adjust_menu' = 'immediate_order';
      if (impact === 'severe') {
        recommendedAction = 'find_substitute';
      } else if (impact === 'high' && !product.supplierProducts?.length) {
        recommendedAction = 'adjust_menu';
      }

      return {
        productId: product.id,
        currentStock,
        criticalLevel,
        estimatedStockoutDate,
        impact,
        recommendedAction
      };
    }

    return null;
  }

  // ================================
  // HELPER METHODS
  // ================================

  private async getDemandForecast(productId: string, days: number): Promise<DemandForecast[]> {
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.demandForecastRepository
      .createQueryBuilder('forecast')
      .where('forecast.productId = :productId', { productId })
      .andWhere('forecast.forecastDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('forecast.forecastDate', 'ASC')
      .getMany();
  }

  private async calculateSeasonalMultiplier(productId: string): Promise<number> {
    // Simplified seasonal calculation
    const month = new Date().getMonth();
    const seasonalFactors = [0.9, 0.85, 0.95, 1.1, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 0.9, 1.2]; // Winter holidays boost
    return seasonalFactors[month];
  }

  private async calculateDemandVariability(productId: string): Promise<number> {
    // Get historical demand variance
    const forecast = await this.getDemandForecast(productId, -30); // Last 30 days
    if (forecast.length < 7) return 0.2; // Default moderate variability

    const demands = forecast.map(f => f.predictedDemand);
    const mean = demands.reduce((sum, val) => sum + val, 0) / demands.length;
    const variance = demands.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / demands.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0.2;

    return Math.min(1, coefficientOfVariation);
  }

  private async optimizeForBulkDiscounts(
    baseQuantity: number,
    supplierProduct: SupplierProduct,
    projectedDemand: number
  ): Promise<number> {
    // Simplified bulk discount optimization
    // In reality, this would check supplier discount tiers
    const monthlyDemand = projectedDemand;
    const maxOptimalQuantity = monthlyDemand * 3; // Don't order more than 3 months supply

    // Check if doubling the order would be beneficial
    if (baseQuantity * 2 <= maxOptimalQuantity) {
      // Assume 3% discount for orders over certain threshold
      const discountThreshold = supplierProduct.minimumOrderQuantity * 5;
      if (baseQuantity * 2 >= discountThreshold) {
        return baseQuantity * 2;
      }
    }

    return baseQuantity;
  }

  private determinePriority(
    product: InventoryProduct,
    currentStock: number,
    projectedDemand: number,
    config: SmartReorderConfiguration
  ): 'low' | 'medium' | 'high' | 'emergency' {
    if (currentStock <= product.reorderPoint * config.emergencyThreshold) {
      return 'emergency';
    } else if (currentStock <= product.reorderPoint * 0.7) {
      return 'high';
    } else if (currentStock <= product.reorderPoint) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateOrderReasoning(
    product: InventoryProduct,
    bestOption: any,
    optimalQuantity: number,
    currentStock: number,
    projectedDemand: number
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Current stock (${currentStock}) is below reorder point (${product.reorderPoint})`);
    reasoning.push(`Selected supplier ${bestOption.metrics.supplierName} based on best overall score (${(bestOption.compositeScore * 100).toFixed(1)}%)`);
    reasoning.push(`Order quantity (${optimalQuantity}) optimized for 30-day projected demand (${projectedDemand.toFixed(1)})`);

    if (bestOption.metrics.onTimeDeliveryRate > 0.9) {
      reasoning.push(`Supplier has excellent delivery record (${(bestOption.metrics.onTimeDeliveryRate * 100).toFixed(1)}% on-time)`);
    }

    return reasoning;
  }

  private identifyRiskFactors(
    product: InventoryProduct,
    bestOption: any,
    config: SmartReorderConfiguration
  ): string[] {
    const risks: string[] = [];

    if (bestOption.metrics.onTimeDeliveryRate < 0.8) {
      risks.push(`Supplier has poor delivery record (${(bestOption.metrics.onTimeDeliveryRate * 100).toFixed(1)}% on-time)`);
    }

    if (product.supplierProducts?.length === 1) {
      risks.push('Single supplier dependency - no alternatives available');
    }

    if (bestOption.supplierProduct.leadTimeDays > 7) {
      risks.push(`Long lead time (${bestOption.supplierProduct.leadTimeDays} days) increases stockout risk`);
    }

    return risks;
  }

  private createAlternativeOption(
    option: any,
    quantity: number,
    config: SmartReorderConfiguration
  ): AlternativeOrderOption {
    const cost = quantity * option.supplierProduct.unitCost;
    const deliveryDate = new Date(Date.now() + (option.supplierProduct.leadTimeDays + config.leadTimeBuffer) * 24 * 60 * 60 * 1000);

    const tradeoffs: string[] = [];
    if (option.supplierProduct.unitCost > option.supplierProduct.unitCost) {
      tradeoffs.push('Higher unit cost');
    }
    if (option.supplierProduct.leadTimeDays > option.supplierProduct.leadTimeDays) {
      tradeoffs.push('Longer lead time');
    }
    if (option.metrics.onTimeDeliveryRate < 0.9) {
      tradeoffs.push('Lower delivery reliability');
    }

    return {
      supplierId: option.supplierProduct.supplierId,
      supplierName: option.metrics.supplierName,
      quantity,
      cost,
      deliveryDate,
      score: option.compositeScore,
      tradeoffs
    };
  }

  private canAutoApprove(plan: OptimalOrderPlan, config: SmartReorderConfiguration): boolean {
    if (!config.autoApprovalEnabled) return false;
    if (plan.estimatedCost > config.maxAutoOrderValue) return false;
    if (plan.priority === 'emergency') return true; // Auto-approve emergency orders
    if (plan.riskFactors.length > 2) return false; // Too many risks

    return true;
  }

  private async createPurchaseOrder(
    plan: OptimalOrderPlan,
    cafeId: string,
    autoApproved: boolean
  ): Promise<PurchaseOrder> {
    const poNumber = `${autoApproved ? 'AUTO' : 'DRAFT'}-${Date.now()}-${plan.productId.slice(-8)}`;

    const purchaseOrder = this.purchaseOrderRepository.create({
      poNumber,
      supplierId: plan.recommendedSupplier,
      status: autoApproved ? 'sent' : 'draft',
      orderDate: new Date(),
      expectedDeliveryDate: plan.expectedDeliveryDate,
      subtotal: plan.estimatedCost,
      totalAmount: plan.estimatedCost,
      notes: `Smart reorder - ${plan.reasoning.join('; ')}`,
      cafeId,
      createdByUserId: 'system',
      items: [{
        productId: plan.productId,
        quantityOrdered: plan.orderQuantity,
        unitCost: plan.estimatedCost / plan.orderQuantity,
        totalCost: plan.estimatedCost
      }]
    });

    return this.purchaseOrderRepository.save(purchaseOrder);
  }

  private async calculateAverageDailyUsage(productId: string): Promise<number> {
    // This would calculate from actual sales/movement data
    // Simplified implementation
    return 5; // Default 5 units per day
  }

  private async calculatePotentialSavings(
    orderPlans: OptimalOrderPlan[],
    batchRecommendations: OrderBatch[]
  ): Promise<number> {
    let totalSavings = 0;

    // Calculate savings from batching
    for (const batch of batchRecommendations) {
      totalSavings += batch.shippingSavings + batch.consolidationSavings;
    }

    // Calculate savings from optimal supplier selection
    // This would compare against default/previous supplier choices
    const optimizationSavings = orderPlans.length * 25; // Estimated $25 per order from optimization

    return totalSavings + optimizationSavings;
  }
}

export {
  SmartReorderConfiguration,
  SupplierPerformanceMetrics,
  OptimalOrderPlan,
  AlternativeOrderOption,
  OrderBatch,
  EmergencyOrderTrigger
};