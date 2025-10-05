import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import DataLoader = require('dataloader');
import { User } from '@app/models';
import {
  Order,
  OrderItem,
  Payment,
  Cafe,
  Counter,
  Stock,
  Employee,
  TimeSheet
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