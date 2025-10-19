import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import DataLoader = require('dataloader');
import {
  User,
  Order,
  OrderItem,
  Payment,
  Cafe,
  Counter,
  Stock,
  Employee,
  TimeSheet,
  Configuration,
  TimeEntry,
  Glass,
  GlassMovement,
  Purchase,
  PurchaseItem,
  StockMovement,
  LoyaltyAccount,
  LoyaltyChallenge,
  LoyaltyPromotion,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyTier,
  LoyaltyTransaction,
  Credit,
  Product
} from '@app/models';

/**
 * DataLoader service for efficient batch loading of related entities
 * Implements batching and caching to solve N+1 query problems
 */
@Injectable()
export class DataLoaderService {
  private readonly logger = new Logger(DataLoaderService.name);

  // Order-related loaders
  public readonly orderItemsByOrderId: DataLoader<string, OrderItem[]>;
  public readonly paymentsByOrderId: DataLoader<string, Payment[]>;
  public readonly ordersByCustomerId: DataLoader<string, Order[]>;
  public readonly ordersByCafeId: DataLoader<string, Order[]>;

  // Entity loaders
  public readonly cafeById: DataLoader<string, Cafe>;
  public readonly userById: DataLoader<string, User>;
  public readonly counterById: DataLoader<string, Counter>;
  public readonly inventoryById: DataLoader<string, Stock>;
  public readonly employeeById: DataLoader<string, Employee>;
  public readonly configurationById: DataLoader<string, Configuration>;
  public readonly timeEntryById: DataLoader<string, TimeEntry>;
  public readonly glassById: DataLoader<string, Glass>;
  public readonly glassMovementById: DataLoader<string, GlassMovement>;
  public readonly purchaseById: DataLoader<string, Purchase>;
  public readonly purchaseItemById: DataLoader<string, PurchaseItem>;
  public readonly stockMovementById: DataLoader<string, StockMovement>;
  public readonly loyaltyAccountById: DataLoader<string, LoyaltyAccount>;
  public readonly loyaltyChallengeById: DataLoader<string, LoyaltyChallenge>;
  public readonly loyaltyPromotionById: DataLoader<string, LoyaltyPromotion>;
  public readonly loyaltyRewardById: DataLoader<string, LoyaltyReward>;
  public readonly loyaltyRewardRedemptionById: DataLoader<string, LoyaltyRewardRedemption>;
  public readonly loyaltyTierById: DataLoader<string, LoyaltyTier>;
  public readonly loyaltyTransactionById: DataLoader<string, LoyaltyTransaction>;
  public readonly creditById: DataLoader<string, Credit>;
  public readonly productById: DataLoader<string, Product>;

  // Stock-related loaders
  public readonly inventoryByCafeId: DataLoader<string, Stock[]>;
  public readonly lowStockItemsByCafeId: DataLoader<string, Stock[]>;

  // Employee-related loaders
  public readonly employeesByCafeId: DataLoader<string, Employee[]>;
  public readonly timeSheetsByEmployeeId: DataLoader<string, TimeSheet[]>;
  public readonly activeShiftByEmployeeId: DataLoader<string, TimeSheet | null>;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    @InjectRepository(Stock)
    private readonly inventoryRepository: Repository<Stock>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(TimeSheet)
    private readonly timeSheetRepository: Repository<TimeSheet>,
    @InjectRepository(Configuration)
    private readonly configurationRepository: Repository<Configuration>,
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Glass)
    private readonly glassRepository: Repository<Glass>,
    @InjectRepository(GlassMovement)
    private readonly glassMovementRepository: Repository<GlassMovement>,
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepository: Repository<PurchaseItem>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepository: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyChallenge)
    private readonly loyaltyChallengeRepository: Repository<LoyaltyChallenge>,
    @InjectRepository(LoyaltyPromotion)
    private readonly loyaltyPromotionRepository: Repository<LoyaltyPromotion>,
    @InjectRepository(LoyaltyReward)
    private readonly loyaltyRewardRepository: Repository<LoyaltyReward>,
    @InjectRepository(LoyaltyRewardRedemption)
    private readonly loyaltyRewardRedemptionRepository: Repository<LoyaltyRewardRedemption>,
    @InjectRepository(LoyaltyTier)
    private readonly loyaltyTierRepository: Repository<LoyaltyTier>,
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
    @InjectRepository(Credit)
    private readonly creditRepository: Repository<Credit>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    // Order-related loaders
    this.orderItemsByOrderId = new DataLoader(this.batchOrderItems.bind(this), {
      cacheKeyFn: (key: string) => `orderItems:${key}`,
    });

    this.paymentsByOrderId = new DataLoader(this.batchPayments.bind(this), {
      cacheKeyFn: (key: string) => `payments:${key}`,
    });

    this.ordersByCustomerId = new DataLoader(this.batchOrdersByCustomer.bind(this), {
      cacheKeyFn: (key: string) => `customerOrders:${key}`,
    });

    this.ordersByCafeId = new DataLoader(this.batchOrdersByCafe.bind(this), {
      cacheKeyFn: (key: string) => `cafeOrders:${key}`,
    });

    // Entity loaders
    this.cafeById = new DataLoader(this.batchCafes.bind(this), {
      cacheKeyFn: (key: string) => `cafe:${key}`,
    });

    this.userById = new DataLoader(this.batchUsers.bind(this), {
      cacheKeyFn: (key: string) => `user:${key}`,
    });

    this.counterById = new DataLoader(this.batchCounters.bind(this), {
      cacheKeyFn: (key: string) => `counter:${key}`,
    });

    this.inventoryById = new DataLoader(this.batchInventoryItems.bind(this), {
      cacheKeyFn: (key: string) => `inventory:${key}`,
    });

    this.employeeById = new DataLoader(this.batchEmployees.bind(this), {
      cacheKeyFn: (key: string) => `employee:${key}`,
    });

    this.configurationById = new DataLoader(this.batchConfigurations.bind(this), {
      cacheKeyFn: (key: string) => `configuration:${key}`,
    });

    this.timeEntryById = new DataLoader(this.batchTimeEntries.bind(this), {
      cacheKeyFn: (key: string) => `timeEntry:${key}`,
    });

    this.glassById = new DataLoader(this.batchGlasses.bind(this), {
      cacheKeyFn: (key: string) => `glass:${key}`,
    });

    this.glassMovementById = new DataLoader(this.batchGlassMovements.bind(this), {
      cacheKeyFn: (key: string) => `glassMovement:${key}`,
    });

    this.purchaseById = new DataLoader(this.batchPurchases.bind(this), {
      cacheKeyFn: (key: string) => `purchase:${key}`,
    });

    this.purchaseItemById = new DataLoader(this.batchPurchaseItems.bind(this), {
      cacheKeyFn: (key: string) => `purchaseItem:${key}`,
    });

    this.stockMovementById = new DataLoader(this.batchStockMovements.bind(this), {
      cacheKeyFn: (key: string) => `stockMovement:${key}`,
    });

    this.loyaltyAccountById = new DataLoader(this.batchLoyaltyAccounts.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyAccount:${key}`,
    });

    this.loyaltyChallengeById = new DataLoader(this.batchLoyaltyChallenges.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyChallenge:${key}`,
    });

    this.loyaltyPromotionById = new DataLoader(this.batchLoyaltyPromotions.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyPromotion:${key}`,
    });

    this.loyaltyRewardById = new DataLoader(this.batchLoyaltyRewards.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyReward:${key}`,
    });

    this.loyaltyRewardRedemptionById = new DataLoader(this.batchLoyaltyRewardRedemptions.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyRewardRedemption:${key}`,
    });

    this.loyaltyTierById = new DataLoader(this.batchLoyaltyTiers.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyTier:${key}`,
    });

    this.loyaltyTransactionById = new DataLoader(this.batchLoyaltyTransactions.bind(this), {
      cacheKeyFn: (key: string) => `loyaltyTransaction:${key}`,
    });

    this.creditById = new DataLoader(this.batchCredits.bind(this), {
      cacheKeyFn: (key: string) => `credit:${key}`,
    });

    this.productById = new DataLoader(this.batchProducts.bind(this), {
      cacheKeyFn: (key: string) => `product:${key}`,
    });

    // Stock-related loaders
    this.inventoryByCafeId = new DataLoader(this.batchInventoryByCafe.bind(this), {
      cacheKeyFn: (key: string) => `cafeInventory:${key}`,
    });

    this.lowStockItemsByCafeId = new DataLoader(this.batchLowStockItems.bind(this), {
      cacheKeyFn: (key: string) => `lowStock:${key}`,
    });

    // Employee-related loaders
    this.employeesByCafeId = new DataLoader(this.batchEmployeesByCafe.bind(this), {
      cacheKeyFn: (key: string) => `cafeEmployees:${key}`,
    });

    this.timeSheetsByEmployeeId = new DataLoader(this.batchTimeSheets.bind(this), {
      cacheKeyFn: (key: string) => `timeSheets:${key}`,
    });

    this.activeShiftByEmployeeId = new DataLoader(this.batchActiveShifts.bind(this), {
      cacheKeyFn: (key: string) => `activeShift:${key}`,
    });
  }

  // Batch loaders implementation

  private async batchOrderItems(orderIds: readonly string[]): Promise<OrderItem[][]> {
    const orderItems = await this.orderItemRepository.find({
      where: { orderId: In([...orderIds]) },
      relations: ['menuItem']
    });

    const grouped = this.groupBy(orderItems, 'orderId');
    return orderIds.map(id => grouped[id] || []);
  }

  private async batchPayments(orderIds: readonly string[]): Promise<Payment[][]> {
    const payments = await this.paymentRepository.find({
      where: { orderId: In([...orderIds]) },
      order: { createdAt: 'DESC' }
    });

    const grouped = this.groupBy(payments, 'orderId');
    return orderIds.map(id => grouped[id] || []);
  }

  private async batchOrdersByCustomer(customerIds: readonly string[]): Promise<Order[][]> {
    const orders = await this.orderRepository.find({
      where: { customerId: In([...customerIds]) },
      order: { createdAt: 'DESC' }
    });

    const grouped = this.groupBy(orders, 'customerId');
    return customerIds.map(id => grouped[id] || []);
  }

  private async batchOrdersByCafe(cafeIds: readonly string[]): Promise<Order[][]> {
    const orders = await this.orderRepository.find({
      where: { cafeId: In([...cafeIds]) },
      order: { createdAt: 'DESC' }
    });

    const grouped = this.groupBy(orders, 'cafeId');
    return cafeIds.map(id => grouped[id] || []);
  }

  private async batchCafes(ids: readonly string[]): Promise<(Cafe | Error)[]> {
    const cafes = await this.cafeRepository.find({
      where: { id: In([...ids]) }
    });

    const cafeMap = new Map(cafes.map(cafe => [cafe.id, cafe]));
    return ids.map(id => cafeMap.get(id) || new Error(`Cafe not found: ${id}`));
  }

  private async batchUsers(ids: readonly string[]): Promise<(User | Error)[]> {
    const users = await this.userRepository.find({
      where: { id: In([...ids]) }
    });

    const userMap = new Map(users.map(user => [user.id, user]));
    return ids.map(id => userMap.get(id) || new Error(`User not found: ${id}`));
  }

  private async batchCounters(ids: readonly string[]): Promise<(Counter | Error)[]> {
    const counters = await this.counterRepository.find({
      where: { id: In([...ids]) }
    });

    const counterMap = new Map(counters.map(counter => [counter.id, counter]));
    return ids.map(id => counterMap.get(id) || new Error(`Counter not found: ${id}`));
  }

  private async batchInventoryItems(ids: readonly string[]): Promise<(Stock | Error)[]> {
    const items = await this.inventoryRepository.find({
      where: { id: In([...ids]) }
    });

    const itemMap = new Map(items.map(item => [item.id, item]));
    return ids.map(id => itemMap.get(id) || new Error(`Stock item not found: ${id}`));
  }

  private async batchEmployees(ids: readonly string[]): Promise<(Employee | Error)[]> {
    const employees = await this.employeeRepository.find({
      where: { id: In([...ids]) },
      relations: ['user', 'cafe', 'assignedCounter']
    });

    const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
    return ids.map(id => employeeMap.get(id) || new Error(`Employee not found: ${id}`));
  }

  private async batchInventoryByCafe(cafeIds: readonly string[]): Promise<Stock[][]> {
    const inventory = await this.inventoryRepository.find({
      where: { cafeId: In([...cafeIds]) },
      relations: ['product'],
      order: { id: 'ASC' }
    });

    const grouped = this.groupBy(inventory, 'cafeId');
    return cafeIds.map(id => grouped[id] || []);
  }

  private async batchLowStockItems(cafeIds: readonly string[]): Promise<Stock[][]> {
    const lowStockItems = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.cafeId IN (:...cafeIds)', { cafeIds: [...cafeIds] })
      .andWhere('inventory.currentStock <= inventory.minimumStock')
      .andWhere('inventory.currentStock > 0')
      .orderBy('inventory.currentStock', 'ASC')
      .getMany()

    const grouped = this.groupBy(lowStockItems, 'cafeId');
    return cafeIds.map(id => grouped[id] || []);
  }

  private async batchEmployeesByCafe(cafeIds: readonly string[]): Promise<Employee[][]> {
    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.assignedCounter', 'assignedCounter')
      .where('employee.cafeId IN (:...cafeIds)', { cafeIds: [...cafeIds] })
      .orderBy('user.firstName', 'ASC')
      .getMany();

    const grouped = this.groupBy(employees, 'cafeId');
    return cafeIds.map(id => grouped[id] || []);
  }

  private async batchTimeSheets(employeeIds: readonly string[]): Promise<TimeSheet[][]> {
    const timeSheets = await this.timeSheetRepository
      .createQueryBuilder('timeSheet')
      .where('timeSheet.employeeId IN (:...employeeIds)', { employeeIds: [...employeeIds] })
      .orderBy('timeSheet.startTime', 'DESC')
      .getMany();

    const grouped = this.groupBy(timeSheets, 'employeeId');
    return employeeIds.map(id => grouped[id] || []);
  }

  private async batchActiveShifts(employeeIds: readonly string[]): Promise<(TimeSheet | null)[]> {
    const activeShifts = await this.timeSheetRepository
      .createQueryBuilder('timeSheet')
      .where('timeSheet.employeeId IN (:...employeeIds)', { employeeIds: [...employeeIds] })
      .andWhere('timeSheet.endTime IS NULL')
      .getMany();

    const shiftMap = new Map(activeShifts.map(shift => [shift.employeeId, shift]));
    return employeeIds.map(id => shiftMap.get(id) || null);
  }

  private async batchConfigurations(ids: readonly string[]): Promise<(Configuration | Error)[]> {
    const configurations = await this.configurationRepository.find({
      where: { id: In([...ids]) }
    });

    const configMap = new Map(configurations.map(config => [config.id, config]));
    return ids.map(id => configMap.get(id) || new Error(`Configuration not found: ${id}`));
  }

  private async batchTimeEntries(ids: readonly string[]): Promise<(TimeEntry | Error)[]> {
    const timeEntries = await this.timeEntryRepository.find({
      where: { id: In([...ids]) }
    });

    const entryMap = new Map(timeEntries.map(entry => [entry.id, entry]));
    return ids.map(id => entryMap.get(id) || new Error(`TimeEntry not found: ${id}`));
  }

  private async batchGlasses(ids: readonly string[]): Promise<(Glass | Error)[]> {
    const glasses = await this.glassRepository.find({
      where: { id: In([...ids]) }
    });

    const glassMap = new Map(glasses.map(glass => [glass.id, glass]));
    return ids.map(id => glassMap.get(id) || new Error(`Glass not found: ${id}`));
  }

  private async batchGlassMovements(ids: readonly string[]): Promise<(GlassMovement | Error)[]> {
    const movements = await this.glassMovementRepository.find({
      where: { id: In([...ids]) }
    });

    const movementMap = new Map(movements.map(movement => [movement.id, movement]));
    return ids.map(id => movementMap.get(id) || new Error(`GlassMovement not found: ${id}`));
  }

  private async batchPurchases(ids: readonly string[]): Promise<(Purchase | Error)[]> {
    const purchases = await this.purchaseRepository.find({
      where: { id: In([...ids]) }
    });

    const purchaseMap = new Map(purchases.map(purchase => [purchase.id, purchase]));
    return ids.map(id => purchaseMap.get(id) || new Error(`Purchase not found: ${id}`));
  }

  private async batchPurchaseItems(ids: readonly string[]): Promise<(PurchaseItem | Error)[]> {
    const items = await this.purchaseItemRepository.find({
      where: { id: In([...ids]) }
    });

    const itemMap = new Map(items.map(item => [item.id, item]));
    return ids.map(id => itemMap.get(id) || new Error(`PurchaseItem not found: ${id}`));
  }

  private async batchStockMovements(ids: readonly string[]): Promise<(StockMovement | Error)[]> {
    const movements = await this.stockMovementRepository.find({
      where: { id: In([...ids]) }
    });

    const movementMap = new Map(movements.map(movement => [movement.id, movement]));
    return ids.map(id => movementMap.get(id) || new Error(`StockMovement not found: ${id}`));
  }

  private async batchLoyaltyAccounts(ids: readonly string[]): Promise<(LoyaltyAccount | Error)[]> {
    const accounts = await this.loyaltyAccountRepository.find({
      where: { id: In([...ids]) }
    });

    const accountMap = new Map(accounts.map(account => [account.id, account]));
    return ids.map(id => accountMap.get(id) || new Error(`LoyaltyAccount not found: ${id}`));
  }

  private async batchLoyaltyChallenges(ids: readonly string[]): Promise<(LoyaltyChallenge | Error)[]> {
    const challenges = await this.loyaltyChallengeRepository.find({
      where: { id: In([...ids]) }
    });

    const challengeMap = new Map(challenges.map(challenge => [challenge.id, challenge]));
    return ids.map(id => challengeMap.get(id) || new Error(`LoyaltyChallenge not found: ${id}`));
  }

  private async batchLoyaltyPromotions(ids: readonly string[]): Promise<(LoyaltyPromotion | Error)[]> {
    const promotions = await this.loyaltyPromotionRepository.find({
      where: { id: In([...ids]) }
    });

    const promotionMap = new Map(promotions.map(promotion => [promotion.id, promotion]));
    return ids.map(id => promotionMap.get(id) || new Error(`LoyaltyPromotion not found: ${id}`));
  }

  private async batchLoyaltyRewards(ids: readonly string[]): Promise<(LoyaltyReward | Error)[]> {
    const rewards = await this.loyaltyRewardRepository.find({
      where: { id: In([...ids]) }
    });

    const rewardMap = new Map(rewards.map(reward => [reward.id, reward]));
    return ids.map(id => rewardMap.get(id) || new Error(`LoyaltyReward not found: ${id}`));
  }

  private async batchLoyaltyRewardRedemptions(ids: readonly string[]): Promise<(LoyaltyRewardRedemption | Error)[]> {
    const redemptions = await this.loyaltyRewardRedemptionRepository.find({
      where: { id: In([...ids]) }
    });

    const redemptionMap = new Map(redemptions.map(redemption => [redemption.id, redemption]));
    return ids.map(id => redemptionMap.get(id) || new Error(`LoyaltyRewardRedemption not found: ${id}`));
  }

  private async batchLoyaltyTiers(ids: readonly string[]): Promise<(LoyaltyTier | Error)[]> {
    const tiers = await this.loyaltyTierRepository.find({
      where: { id: In([...ids]) }
    });

    const tierMap = new Map(tiers.map(tier => [tier.id, tier]));
    return ids.map(id => tierMap.get(id) || new Error(`LoyaltyTier not found: ${id}`));
  }

  private async batchLoyaltyTransactions(ids: readonly string[]): Promise<(LoyaltyTransaction | Error)[]> {
    const transactions = await this.loyaltyTransactionRepository.find({
      where: { id: In([...ids]) }
    });

    const transactionMap = new Map(transactions.map(transaction => [transaction.id, transaction]));
    return ids.map(id => transactionMap.get(id) || new Error(`LoyaltyTransaction not found: ${id}`));
  }

  private async batchCredits(ids: readonly string[]): Promise<(Credit | Error)[]> {
    const credits = await this.creditRepository.find({
      where: { id: In([...ids]) }
    });

    const creditMap = new Map(credits.map(credit => [credit.id, credit]));
    return ids.map(id => creditMap.get(id) || new Error(`Credit not found: ${id}`));
  }

  private async batchProducts(ids: readonly string[]): Promise<(Product | Error)[]> {
    const products = await this.productRepository.find({
      where: { id: In([...ids]) }
    });

    const productMap = new Map(products.map(product => [product.id, product]));
    return ids.map(id => productMap.get(id) || new Error(`Product not found: ${id}`));
  }

  // Utility methods

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Clear all caches - useful for testing or when data changes outside GraphQL
   */
  clearAllCaches(): void {
    this.orderItemsByOrderId.clearAll()
    this.paymentsByOrderId.clearAll()
    this.ordersByCustomerId.clearAll()
    this.ordersByCafeId.clearAll()
    this.cafeById.clearAll()
    this.userById.clearAll()
    this.counterById.clearAll()
    this.inventoryById.clearAll()
    this.employeeById.clearAll()
    this.inventoryByCafeId.clearAll()
    this.lowStockItemsByCafeId.clearAll()
    this.employeesByCafeId.clearAll()
    this.timeSheetsByEmployeeId.clearAll()
    this.activeShiftByEmployeeId.clearAll()
    this.configurationById.clearAll()
    this.timeEntryById.clearAll()
    this.glassById.clearAll()
    this.glassMovementById.clearAll()
    this.purchaseById.clearAll()
    this.purchaseItemById.clearAll()
    this.stockMovementById.clearAll()
    this.loyaltyAccountById.clearAll()
    this.loyaltyChallengeById.clearAll()
    this.loyaltyPromotionById.clearAll()
    this.loyaltyRewardById.clearAll()
    this.loyaltyRewardRedemptionById.clearAll()
    this.loyaltyTierById.clearAll()
    this.loyaltyTransactionById.clearAll()
    this.creditById.clearAll()
    this.productById.clearAll()

    this.logger.log('All DataLoader caches cleared');
  }

  /**
   * Clear specific cache by key pattern
   */
  clearCacheByPattern(pattern: string): void {
    // Implementation would depend on DataLoader version and caching strategy
    this.logger.log(`Clearing cache for pattern: ${pattern}`);
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): Record<string, any> {
    return {
      orderItemsCache: this.orderItemsByOrderId.constructor.name,
      paymentsCache: this.paymentsByOrderId.constructor.name,
      // Add more stats as needed
    }
  }
}