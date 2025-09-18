/**
 * Business Intelligence and Analytics Service
 * Advanced analytics, reporting, and optimization algorithms
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryProduct,
  InventoryMovement,
  ProductAnalytics,
  PurchaseOrder,
  InventoryStock
} from '../database/entity-definitions';

// ================================
// INTERFACES AND TYPES
// ================================

interface PerformanceMetrics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  inventoryTurnover: number;
  daysOnHand: number;
  stockoutEvents: number;
  wastePercentage: number;
  fillRate: number;
  averageFulfillmentTime: number;
}

interface ProductPerformanceRank {
  productId: string;
  productName: string;
  rank: number;
  score: number;
  metrics: {
    revenue: number;
    profitMargin: number;
    turnover: number;
    growth: number;
    wasteRate: number;
  };
  recommendation: 'maintain' | 'increase' | 'decrease' | 'discontinue';
  reasoning: string[];
}

interface InventoryOptimizationSuggestion {
  type: 'reorder_point' | 'reorder_quantity' | 'safety_stock' | 'max_stock' | 'supplier_change';
  productId: string;
  currentValue: number;
  suggestedValue: number;
  potentialSaving: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  expectedImpact: string;
}

interface SeasonalPattern {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  pattern: number[];
  strength: number; // 0-1, how strong the seasonal pattern is
  description: string;
}

interface ABCAnalysisResult {
  categoryA: string[]; // High value, tight control
  categoryB: string[]; // Moderate value, moderate control
  categoryC: string[]; // Low value, simple control
  analysis: {
    productId: string;
    category: 'A' | 'B' | 'C';
    annualValue: number;
    cumulativePercentage: number;
    controlStrategy: string;
  }[];
}

interface VENAnalysisResult {
  vital: string[];      // Cannot operate without
  essential: string[];  // Important but alternatives exist
  nonEssential: string[]; // Nice to have
  analysis: {
    productId: string;
    category: 'V' | 'E' | 'N';
    businessImpact: number;
    availabilityRisk: number;
    recommendation: string;
  }[];
}

// ================================
// BUSINESS INTELLIGENCE SERVICE
// ================================

@Injectable()
export class BusinessIntelligenceService {
  private readonly logger = new Logger(BusinessIntelligenceService.name);

  constructor(
    @InjectRepository(InventoryProduct)
    private productRepository: Repository<InventoryProduct>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(ProductAnalytics)
    private analyticsRepository: Repository<ProductAnalytics>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(InventoryStock)
    private stockRepository: Repository<InventoryStock>
  ) {}

  /**
   * Generate comprehensive business intelligence dashboard
   */
  async generateBusinessIntelligenceDashboard(
    cafeId: string,
    startDate: Date,
    endDate: Date
  ) {
    this.logger.log(`Generating BI dashboard for cafe ${cafeId}`);

    const [
      performanceMetrics,
      productRankings,
      optimizationSuggestions,
      abcAnalysis,
      venAnalysis,
      seasonalPatterns,
      costAnalysis,
      profitabilityAnalysis
    ] = await Promise.all([
      this.calculatePerformanceMetrics(cafeId, startDate, endDate),
      this.generateProductPerformanceRankings(cafeId, startDate, endDate),
      this.generateOptimizationSuggestions(cafeId),
      this.performABCAnalysis(cafeId, startDate, endDate),
      this.performVENAnalysis(cafeId),
      this.detectSeasonalPatterns(cafeId, startDate, endDate),
      this.analyzeCostStructure(cafeId, startDate, endDate),
      this.analyzeProfitability(cafeId, startDate, endDate)
    ]);

    return {
      performanceMetrics,
      productRankings,
      optimizationSuggestions,
      abcAnalysis,
      venAnalysis,
      seasonalPatterns,
      costAnalysis,
      profitabilityAnalysis,
      generatedAt: new Date(),
      period: { startDate, endDate }
    };
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async calculatePerformanceMetrics(
    cafeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    // Get movements for the period
    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .where('movement.cafeId = :cafeId', { cafeId })
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    // Get sales movements (negative quantities)
    const salesMovements = movements.filter(m =>
      m.movementType === 'sale' && m.quantityChange < 0
    );

    // Calculate revenue
    const totalRevenue = salesMovements.reduce((sum, movement) =>
      sum + Math.abs(movement.quantityChange * movement.unitCost * 1.3), 0 // Assuming 30% markup
    );

    // Calculate cost
    const totalCost = salesMovements.reduce((sum, movement) =>
      sum + Math.abs(movement.quantityChange * movement.unitCost), 0
    );

    // Calculate waste
    const wasteMovements = movements.filter(m => m.movementType === 'waste');
    const totalWaste = wasteMovements.reduce((sum, movement) =>
      sum + Math.abs(movement.totalCost), 0
    );

    // Get current stock values
    const currentStock = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('product.cafeId = :cafeId', { cafeId })
      .getMany();

    const totalStockValue = currentStock.reduce((sum, stock) =>
      sum + (stock.quantity * stock.costPerUnit), 0
    );

    // Calculate inventory turnover
    const inventoryTurnover = totalStockValue > 0 ? totalCost / totalStockValue : 0;
    const daysOnHand = inventoryTurnover > 0 ? 365 / inventoryTurnover : 365;

    // Calculate stockout events
    const stockoutEvents = await this.countStockoutEvents(cafeId, startDate, endDate);

    // Calculate fill rate
    const totalDemand = salesMovements.length;
    const fulfilledDemand = totalDemand - stockoutEvents;
    const fillRate = totalDemand > 0 ? (fulfilledDemand / totalDemand) * 100 : 100;

    return {
      totalRevenue,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      inventoryTurnover,
      daysOnHand,
      stockoutEvents,
      wastePercentage: totalCost > 0 ? (totalWaste / totalCost) * 100 : 0,
      fillRate,
      averageFulfillmentTime: await this.calculateAverageFulfillmentTime(cafeId, startDate, endDate)
    };
  }

  /**
   * Generate product performance rankings using multi-criteria analysis
   */
  async generateProductPerformanceRankings(
    cafeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProductPerformanceRank[]> {
    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .leftJoinAndSelect('analytics.product', 'product')
      .where('analytics.cafeId = :cafeId', { cafeId })
      .andWhere('analytics.periodStart >= :startDate', { startDate })
      .andWhere('analytics.periodEnd <= :endDate', { endDate })
      .getMany();

    const rankings: ProductPerformanceRank[] = [];

    for (const analytic of analytics) {
      // Calculate composite score
      const revenueScore = this.normalizeScore(analytic.totalRevenue, analytics.map(a => a.totalRevenue));
      const profitScore = this.normalizeScore(analytic.profitMargin, analytics.map(a => a.profitMargin));
      const turnoverScore = this.normalizeScore(1 / (analytic.avgStockLevel || 1), analytics.map(a => 1 / (a.avgStockLevel || 1)));
      const growthScore = await this.calculateGrowthScore(analytic.productId, startDate, endDate);
      const wasteScore = 1 - this.normalizeScore(analytic.wasteQuantity, analytics.map(a => a.wasteQuantity));

      // Weighted composite score
      const score = (
        revenueScore * 0.3 +
        profitScore * 0.25 +
        turnoverScore * 0.2 +
        growthScore * 0.15 +
        wasteScore * 0.1
      );

      // Generate recommendation
      const recommendation = this.generateProductRecommendation(analytic, score);

      rankings.push({
        productId: analytic.productId,
        productName: analytic.product.name,
        rank: 0, // Will be set after sorting
        score,
        metrics: {
          revenue: analytic.totalRevenue,
          profitMargin: analytic.profitMargin,
          turnover: analytic.avgStockLevel > 0 ? analytic.totalSold / analytic.avgStockLevel : 0,
          growth: growthScore,
          wasteRate: analytic.totalSold > 0 ? (analytic.wasteQuantity / analytic.totalSold) * 100 : 0
        },
        recommendation: recommendation.action,
        reasoning: recommendation.reasons
      });
    }

    // Sort by score and assign ranks
    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Generate optimization suggestions using advanced algorithms
   */
  async generateOptimizationSuggestions(cafeId: string): Promise<InventoryOptimizationSuggestion[]> {
    const suggestions: InventoryOptimizationSuggestion[] = [];

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.stockLevels', 'stock')
      .leftJoinAndSelect('product.supplierProducts', 'supplierProduct')
      .leftJoinAndSelect('supplierProduct.supplier', 'supplier')
      .where('product.cafeId = :cafeId', { cafeId })
      .andWhere('product.isActive = true')
      .getMany();

    for (const product of products) {
      // Analyze reorder point optimization
      const reorderSuggestion = await this.analyzeReorderPointOptimization(product);
      if (reorderSuggestion) suggestions.push(reorderSuggestion);

      // Analyze safety stock optimization
      const safetyStockSuggestion = await this.analyzeSafetyStockOptimization(product);
      if (safetyStockSuggestion) suggestions.push(safetyStockSuggestion);

      // Analyze supplier optimization
      const supplierSuggestion = await this.analyzeSupplierOptimization(product);
      if (supplierSuggestion) suggestions.push(supplierSuggestion);

      // Analyze max stock optimization
      const maxStockSuggestion = await this.analyzeMaxStockOptimization(product);
      if (maxStockSuggestion) suggestions.push(maxStockSuggestion);
    }

    // Sort by potential savings
    suggestions.sort((a, b) => b.potentialSaving - a.potentialSaving);

    return suggestions;
  }

  /**
   * Perform ABC Analysis (80/20 rule for inventory management)
   */
  async performABCAnalysis(
    cafeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ABCAnalysisResult> {
    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .leftJoinAndSelect('analytics.product', 'product')
      .where('analytics.cafeId = :cafeId', { cafeId })
      .andWhere('analytics.periodStart >= :startDate', { startDate })
      .andWhere('analytics.periodEnd <= :endDate', { endDate })
      .getMany();

    // Calculate annual values and sort
    const productValues = analytics
      .map(analytic => ({
        productId: analytic.productId,
        annualValue: analytic.totalRevenue * (365 / this.daysBetween(startDate, endDate))
      }))
      .sort((a, b) => b.annualValue - a.annualValue);

    const totalValue = productValues.reduce((sum, item) => sum + item.annualValue, 0);

    // Assign categories and calculate cumulative percentages
    const analysis = [];
    let cumulativeValue = 0;
    const categoryA: string[] = [];
    const categoryB: string[] = [];
    const categoryC: string[] = [];

    for (const item of productValues) {
      cumulativeValue += item.annualValue;
      const cumulativePercentage = (cumulativeValue / totalValue) * 100;

      let category: 'A' | 'B' | 'C';
      let controlStrategy: string;

      if (cumulativePercentage <= 80) {
        category = 'A';
        categoryA.push(item.productId);
        controlStrategy = 'Tight control, frequent review, accurate records';
      } else if (cumulativePercentage <= 95) {
        category = 'B';
        categoryB.push(item.productId);
        controlStrategy = 'Moderate control, periodic review';
      } else {
        category = 'C';
        categoryC.push(item.productId);
        controlStrategy = 'Simple control, bulk orders, less frequent review';
      }

      analysis.push({
        productId: item.productId,
        category,
        annualValue: item.annualValue,
        cumulativePercentage,
        controlStrategy
      });
    }

    return {
      categoryA,
      categoryB,
      categoryC,
      analysis
    };
  }

  /**
   * Perform VEN Analysis (Vital, Essential, Non-essential)
   */
  async performVENAnalysis(cafeId: string): Promise<VENAnalysisResult> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.cafeId = :cafeId', { cafeId })
      .andWhere('product.isActive = true')
      .getMany();

    const vital: string[] = [];
    const essential: string[] = [];
    const nonEssential: string[] = [];
    const analysis = [];

    for (const product of products) {
      // Calculate business impact score (0-100)
      const businessImpact = await this.calculateBusinessImpact(product);

      // Calculate availability risk (0-100)
      const availabilityRisk = await this.calculateAvailabilityRisk(product);

      let category: 'V' | 'E' | 'N';
      let recommendation: string;

      if (businessImpact >= 80 || availabilityRisk >= 80) {
        category = 'V';
        vital.push(product.id);
        recommendation = 'Critical item - ensure multiple suppliers, high safety stock';
      } else if (businessImpact >= 50 || availabilityRisk >= 50) {
        category = 'E';
        essential.push(product.id);
        recommendation = 'Important item - monitor closely, moderate safety stock';
      } else {
        category = 'N';
        nonEssential.push(product.id);
        recommendation = 'Standard item - normal ordering procedures';
      }

      analysis.push({
        productId: product.id,
        category,
        businessImpact,
        availabilityRisk,
        recommendation
      });
    }

    return {
      vital,
      essential,
      nonEssential,
      analysis
    };
  }

  /**
   * Detect seasonal patterns in demand
   */
  async detectSeasonalPatterns(
    cafeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SeasonalPattern[]> {
    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .where('movement.cafeId = :cafeId', { cafeId })
      .andWhere('movement.movementType = :type', { type: 'sale' })
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('movement.createdAt', 'ASC')
      .getMany();

    const patterns: SeasonalPattern[] = [];

    // Daily pattern (by hour)
    const hourlyPattern = this.calculateHourlyPattern(movements);
    if (hourlyPattern.strength > 0.3) {
      patterns.push(hourlyPattern);
    }

    // Weekly pattern (by day of week)
    const weeklyPattern = this.calculateWeeklyPattern(movements);
    if (weeklyPattern.strength > 0.3) {
      patterns.push(weeklyPattern);
    }

    // Monthly pattern (by day of month)
    const monthlyPattern = this.calculateMonthlyPattern(movements);
    if (monthlyPattern.strength > 0.3) {
      patterns.push(monthlyPattern);
    }

    return patterns;
  }

  /**
   * Analyze cost structure and identify optimization opportunities
   */
  async analyzeCostStructure(cafeId: string, startDate: Date, endDate: Date) {
    const purchaseOrders = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.cafeId = :cafeId', { cafeId })
      .andWhere('po.orderDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const totalPurchaseCost = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const averageOrderValue = purchaseOrders.length > 0 ? totalPurchaseCost / purchaseOrders.length : 0;

    // Cost by category
    const costByCategory = new Map<string, number>();
    const costBySupplier = new Map<string, { name: string; cost: number; orders: number }>();

    for (const po of purchaseOrders) {
      // Track supplier costs
      const supplierKey = po.supplierId;
      if (!costBySupplier.has(supplierKey)) {
        costBySupplier.set(supplierKey, {
          name: po.supplier.name,
          cost: 0,
          orders: 0
        });
      }
      const supplierData = costBySupplier.get(supplierKey)!;
      supplierData.cost += po.totalAmount;
      supplierData.orders += 1;

      // Track category costs
      for (const item of po.items) {
        const categoryId = item.product.categoryId || 'uncategorized';
        const currentCost = costByCategory.get(categoryId) || 0;
        costByCategory.set(categoryId, currentCost + item.totalCost);
      }
    }

    return {
      totalPurchaseCost,
      averageOrderValue,
      orderCount: purchaseOrders.length,
      costByCategory: Array.from(costByCategory.entries()).map(([categoryId, cost]) => ({
        categoryId,
        cost,
        percentage: (cost / totalPurchaseCost) * 100
      })),
      costBySupplier: Array.from(costBySupplier.entries()).map(([supplierId, data]) => ({
        supplierId,
        name: data.name,
        cost: data.cost,
        orders: data.orders,
        averageOrderValue: data.cost / data.orders,
        percentage: (data.cost / totalPurchaseCost) * 100
      }))
    };
  }

  /**
   * Analyze profitability by product, category, and time period
   */
  async analyzeProfitability(cafeId: string, startDate: Date, endDate: Date) {
    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .leftJoinAndSelect('analytics.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('analytics.cafeId = :cafeId', { cafeId })
      .andWhere('analytics.periodStart >= :startDate', { startDate })
      .andWhere('analytics.periodEnd <= :endDate', { endDate })
      .getMany();

    const totalRevenue = analytics.reduce((sum, a) => sum + a.totalRevenue, 0);
    const totalCost = analytics.reduce((sum, a) => sum + a.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;

    // Profitability by product
    const productProfitability = analytics
      .map(analytic => ({
        productId: analytic.productId,
        productName: analytic.product.name,
        revenue: analytic.totalRevenue,
        cost: analytic.totalCost,
        profit: analytic.grossProfit,
        margin: analytic.profitMargin,
        contribution: totalRevenue > 0 ? (analytic.totalRevenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);

    // Profitability by category
    const categoryProfitability = new Map<string, {
      categoryName: string;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    for (const analytic of analytics) {
      const categoryId = analytic.product.categoryId || 'uncategorized';
      const categoryName = analytic.product.category?.name || 'Uncategorized';

      if (!categoryProfitability.has(categoryId)) {
        categoryProfitability.set(categoryId, {
          categoryName,
          revenue: 0,
          cost: 0,
          profit: 0
        });
      }

      const categoryData = categoryProfitability.get(categoryId)!;
      categoryData.revenue += analytic.totalRevenue;
      categoryData.cost += analytic.totalCost;
      categoryData.profit += analytic.grossProfit;
    }

    return {
      overall: {
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      productProfitability,
      categoryProfitability: Array.from(categoryProfitability.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.categoryName,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit,
        margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        contribution: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
    };
  }

  // ================================
  // HELPER METHODS
  // ================================

  private normalizeScore(value: number, allValues: number[]): number {
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    return max > min ? (value - min) / (max - min) : 0;
  }

  private async calculateGrowthScore(productId: string, startDate: Date, endDate: Date): Promise<number> {
    // Calculate growth by comparing periods
    const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);

    const firstPeriod = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.productId = :productId', { productId })
      .andWhere('analytics.periodStart >= :startDate', { startDate })
      .andWhere('analytics.periodEnd <= :midPoint', { endDate: midPoint })
      .getOne();

    const secondPeriod = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.productId = :productId', { productId })
      .andWhere('analytics.periodStart >= :midPoint', { startDate: midPoint })
      .andWhere('analytics.periodEnd <= :endDate', { endDate })
      .getOne();

    if (!firstPeriod || !secondPeriod || firstPeriod.totalRevenue === 0) {
      return 0;
    }

    const growth = (secondPeriod.totalRevenue - firstPeriod.totalRevenue) / firstPeriod.totalRevenue;
    return Math.max(0, Math.min(1, (growth + 1) / 2)); // Normalize to 0-1
  }

  private generateProductRecommendation(
    analytic: ProductAnalytics,
    score: number
  ): { action: 'maintain' | 'increase' | 'decrease' | 'discontinue'; reasons: string[] } {
    const reasons: string[] = [];
    let action: 'maintain' | 'increase' | 'decrease' | 'discontinue';

    if (score >= 0.8) {
      action = 'increase';
      reasons.push('High performance across all metrics');
      if (analytic.profitMargin > 0.3) reasons.push('Excellent profit margin');
      if (analytic.totalSold > 0) reasons.push('Strong sales volume');
    } else if (score >= 0.6) {
      action = 'maintain';
      reasons.push('Good overall performance');
      if (analytic.profitMargin > 0.2) reasons.push('Healthy profit margin');
    } else if (score >= 0.3) {
      action = 'decrease';
      reasons.push('Below average performance');
      if (analytic.profitMargin < 0.1) reasons.push('Low profit margin');
      if (analytic.wasteQuantity > analytic.totalSold * 0.1) reasons.push('High waste rate');
    } else {
      action = 'discontinue';
      reasons.push('Poor performance across metrics');
      if (analytic.profitMargin < 0) reasons.push('Negative profit margin');
      if (analytic.totalSold === 0) reasons.push('No sales activity');
    }

    return { action, reasons };
  }

  private async analyzeReorderPointOptimization(product: InventoryProduct): Promise<InventoryOptimizationSuggestion | null> {
    // Simplified reorder point analysis
    const currentStock = product.stockLevels?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    const avgDailyUsage = await this.calculateAverageDailyUsage(product.id);

    if (avgDailyUsage > 0) {
      const optimalReorderPoint = avgDailyUsage * 7; // 1 week safety stock

      if (Math.abs(product.reorderPoint - optimalReorderPoint) > product.reorderPoint * 0.2) {
        const potentialSaving = Math.abs(product.reorderPoint - optimalReorderPoint) * product.unitCost * 0.1;

        return {
          type: 'reorder_point',
          productId: product.id,
          currentValue: product.reorderPoint,
          suggestedValue: optimalReorderPoint,
          potentialSaving,
          priority: potentialSaving > 100 ? 'high' : 'medium',
          reason: `Current reorder point is ${product.reorderPoint > optimalReorderPoint ? 'too high' : 'too low'} based on usage patterns`,
          expectedImpact: `Reduce holding costs by $${potentialSaving.toFixed(2)} annually`
        };
      }
    }

    return null;
  }

  private async analyzeSafetyStockOptimization(product: InventoryProduct): Promise<InventoryOptimizationSuggestion | null> {
    // Placeholder for safety stock analysis
    return null;
  }

  private async analyzeSupplierOptimization(product: InventoryProduct): Promise<InventoryOptimizationSuggestion | null> {
    // Placeholder for supplier optimization analysis
    return null;
  }

  private async analyzeMaxStockOptimization(product: InventoryProduct): Promise<InventoryOptimizationSuggestion | null> {
    // Placeholder for max stock analysis
    return null;
  }

  private async calculateBusinessImpact(product: InventoryProduct): Promise<number> {
    // Simplified business impact calculation
    // In reality, this would consider customer satisfaction, revenue impact, etc.
    const category = product.category?.name.toLowerCase() || '';

    if (category.includes('essential') || category.includes('main')) return 90;
    if (category.includes('popular') || category.includes('featured')) return 70;
    if (category.includes('seasonal') || category.includes('special')) return 40;

    return 50; // Default moderate impact
  }

  private async calculateAvailabilityRisk(product: InventoryProduct): Promise<number> {
    // Simplified availability risk calculation
    const supplierCount = product.supplierProducts?.length || 0;

    if (supplierCount === 0) return 100;
    if (supplierCount === 1) return 80;
    if (supplierCount === 2) return 60;

    return 30; // Multiple suppliers = lower risk
  }

  private calculateHourlyPattern(movements: InventoryMovement[]): SeasonalPattern {
    const hourlyData = new Array(24).fill(0);

    for (const movement of movements) {
      const hour = movement.createdAt.getHours();
      hourlyData[hour] += Math.abs(movement.quantityChange);
    }

    const strength = this.calculatePatternStrength(hourlyData);

    return {
      period: 'daily',
      pattern: hourlyData,
      strength,
      description: `Hourly demand pattern with ${strength > 0.5 ? 'strong' : 'moderate'} seasonality`
    };
  }

  private calculateWeeklyPattern(movements: InventoryMovement[]): SeasonalPattern {
    const weeklyData = new Array(7).fill(0);

    for (const movement of movements) {
      const dayOfWeek = movement.createdAt.getDay();
      weeklyData[dayOfWeek] += Math.abs(movement.quantityChange);
    }

    const strength = this.calculatePatternStrength(weeklyData);

    return {
      period: 'weekly',
      pattern: weeklyData,
      strength,
      description: `Weekly demand pattern with ${strength > 0.5 ? 'strong' : 'moderate'} seasonality`
    };
  }

  private calculateMonthlyPattern(movements: InventoryMovement[]): SeasonalPattern {
    const monthlyData = new Array(12).fill(0);

    for (const movement of movements) {
      const month = movement.createdAt.getMonth();
      monthlyData[month] += Math.abs(movement.quantityChange);
    }

    const strength = this.calculatePatternStrength(monthlyData);

    return {
      period: 'monthly',
      pattern: monthlyData,
      strength,
      description: `Monthly demand pattern with ${strength > 0.5 ? 'strong' : 'moderate'} seasonality`
    };
  }

  private calculatePatternStrength(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

    return Math.min(1, coefficientOfVariation); // Normalize to 0-1
  }

  private async countStockoutEvents(cafeId: string, startDate: Date, endDate: Date): Promise<number> {
    // Count inventory movements that resulted in zero stock
    const stockoutCount = await this.movementRepository
      .createQueryBuilder('movement')
      .where('movement.cafeId = :cafeId', { cafeId })
      .andWhere('movement.quantityAfter = 0')
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();

    return stockoutCount;
  }

  private async calculateAverageFulfillmentTime(cafeId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simplified calculation - would need order fulfillment data
    return 15; // 15 minutes average
  }

  private async calculateAverageDailyUsage(productId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .where('movement.productId = :productId', { productId })
      .andWhere('movement.movementType = :type', { type: 'sale' })
      .andWhere('movement.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getMany();

    const totalUsage = movements.reduce((sum, movement) => sum + Math.abs(movement.quantityChange), 0);
    return totalUsage / 30;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

export {
  PerformanceMetrics,
  ProductPerformanceRank,
  InventoryOptimizationSuggestion,
  SeasonalPattern,
  ABCAnalysisResult,
  VENAnalysisResult
};