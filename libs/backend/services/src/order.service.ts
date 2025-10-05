import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { RedisPubSubService, RedisCacheService } from './lib/redis-placeholder.service'; // Using placeholder services
import { User, Product } from '@app/models';
import { Stock } from '@app/models';
import {
  Order,
  OrderItem,
  Counter,
  Cafe,
  Menu,
  Payment,
  CreateOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
  ProcessPaymentInput,
  RefundPaymentInput,
  OrderFilters,
  PaginationInput,
  SortInput,
  PaginatedOrderResponse,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
  MenuItemStatus
} from '@app/models';
import { InventoryService } from './inventory.service';

export interface OrderServiceOptions {
  filters?: OrderFilters;
  pagination?: PaginationInput;
  sort?: SortInput;
  user?: User;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  popularItems: Array<{ menuItemId: string; name: string; quantity: number; revenue: number }>;
  busyHours: Array<{ hour: number; orderCount: number }>;
  customerRetention: {
    returningCustomers: number;
    newCustomers: number;
  }
  averagePreparationTime: number;
  completionRate: number;
  cancellationRate: number;
}

export interface OrderMetrics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  analytics: OrderAnalytics;
}

export interface InventoryImpact {
  menuItemId: string;
  inventoryItems: Array<{
    itemId: string;
    quantityNeeded: number;
    availableStock: number;
    sufficient: boolean;
  }>;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[]
  warnings: string[]
  inventoryImpacts: InventoryImpact[]
  estimatedTotal: number;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(Stock)
    private readonly inventoryRepository: Repository<Stock>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly pubsub: RedisPubSubService,
    private readonly cache: RedisCacheService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Create a new order with transaction management
   * Handles inventory deduction and counter assignment
   */
  async create(input: CreateOrderInput, user: User): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      try {
        this.logger.log(`Creating order for user ${user.id} at cafe ${input.cafeId}`);

        // Validate cafe exists and is active
        const cafe = await manager.findOne(Cafe, {
          where: { id: input.cafeId } as any,
          select: ['id', 'name', 'status'],
        });

        if (!cafe) {
          throw new NotFoundException(`Cafe with ID ${input.cafeId} not found`);
        }

        // Generate unique order number
        const orderNumber = await this.generateOrderNumber(input.cafeId, manager);

        // Comprehensive order validation including menu items and inventory
        const validationResult = await this.validateCompleteOrder(input, manager);
        if (!validationResult.isValid) {
          throw new BadRequestException(`Order validation failed: ${validationResult.errors.join(', ')}`);
        }

        const subtotal = validationResult.estimatedTotal;

        const tax = subtotal * 0.08; // 8% tax rate
        const total = subtotal + tax + (input.tip || 0);

        // Create order
        const order = manager.create(Order, {
          orderNumber,
          customerId: user.id,
          cafeId: input.cafeId,
          type: input.type || OrderType.DINE_IN,
          status: OrderStatus.PENDING,
          subtotal,
          tax,
          tip: input.tip || 0,
          total,
          notes: input.notes,
          tableNumber: input.tableNumber,
          estimatedReadyTime: this.calculateEstimatedReadyTime(input.items.length),
        });

        const savedOrder = await manager.save(Order, order);

        // Create order items and deduct inventory
        for (const itemInput of input.items) {
          // Get menu item to fetch price
          const menuItem = await manager.findOne(Product, {
            where: { id: itemInput.menuItemId },
          }) as Product;

          if (!menuItem) {
            throw new Error(`Menu item ${itemInput.menuItemId} not found`);
          }

          const orderItem = manager.create(OrderItem, {
            orderId: savedOrder.id,
            menuItemId: itemInput.menuItemId,
            quantity: itemInput.quantity,
            unitPrice: menuItem.basePrice,
            subtotal: itemInput.quantity * menuItem.basePrice,
            notes: itemInput.specialInstructions,
            customizations: itemInput.customizations,
          });

          await manager.save(OrderItem, orderItem);

          // Deduct from inventory if tracking enabled
          const inventoryImpact = validationResult.inventoryImpacts.find(impact => impact.menuItemId === itemInput.menuItemId);
          if (inventoryImpact) {
            await this.deductInventoryForOrder(inventoryImpact.inventoryItems, itemInput.quantity, manager);
          }
        }

        // Auto-assign to counter based on order type and availability
        if (input.counterId) {
          await this.assignToCounterInternal(savedOrder.id, input.counterId, manager);
        } else {
          const autoAssignedCounter = await this.findBestAvailableCounter(input.cafeId, input.type, manager);
          if (autoAssignedCounter) {
            await this.assignToCounterInternal(savedOrder.id, autoAssignedCounter.id, manager);
          }
        }

        // Publish order created event
        await this.pubsub.publish('orderCreated', {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          cafeId: savedOrder.cafeId,
          customerId: savedOrder.customerId,
        });

        // Send kitchen notification
        await this.pubsub.publish('kitchenNotification', {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          cafeId: savedOrder.cafeId,
          counterId: savedOrder.counterId,
          items: input.items.map(item => ({
            menuItemId: item.menuItemId,
            name: 'Menu Item Name', // Would fetch from menu item
            quantity: item.quantity,
            customizations: item.customizations,
          })),
          priority: 'normal',
          estimatedReadyTime: savedOrder.estimatedReadyTime,
        });

        // Invalidate cafe cache
        await this.cache.del(`cafe:${savedOrder.cafeId}:*`);

        this.logger.log(`Order ${savedOrder.orderNumber} created successfully`);
        return savedOrder;

      } catch (error) {
        this.logger.error(`Failed to create order: ${error.message}`, error.stack);
        throw error;
      }
    });
  }

  /**
   * Update order status with workflow validation
   */
  async updateStatus(id: string, input: UpdateOrderStatusInput, user: User): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: ['cafe', 'counter'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Validate status transition
      this.validateStatusTransition(order.status, input.status);

      // Update timestamps based on status
      const updates: Partial<Order> = { status: input.status }

      switch (input.status) {
        case OrderStatus.PREPARING:
          updates.readyAt = null;
          updates.deliveredAt = null;
          break;
        case OrderStatus.READY:
          updates.readyAt = new Date()
          updates.deliveredAt = null;
          break;
        case OrderStatus.DELIVERED:
          if (!order.readyAt) updates.readyAt = new Date()
          updates.deliveredAt = new Date()
          break;
        case OrderStatus.CANCELLED:
          // Restore inventory if order was preparing or ready
          if ([OrderStatus.PREPARING, OrderStatus.READY].includes(order.status)) {
            await this.restoreInventoryFromOrder(order.id, manager);
          }
          break;
      }

      await manager.update(Order, id, updates);

      const updatedOrder = await manager.findOne(Order, { where: { id } });

      // Publish status update event
      await this.pubsub.publish('orderStatusUpdated', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cafeId: order.cafeId,
        customerId: order.customerId,
        status: input.status,
      });

      // Invalidate cafe cache
      await this.cache.del(`cafe:${order.cafeId}:*`);

      this.logger.log(`Order ${order.orderNumber} status updated to ${input.status}`);
      return updatedOrder!;
    });
  }

  /**
   * Assign order to counter with validation
   */
  async assignToCounter(orderId: string, counterId: string, user: User): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      return this.assignToCounterInternal(orderId, counterId, manager);
    });
  }

  /**
   * Get next order for counter processing
   */
  async getNextOrder(cafeId: string, counterId?: string, user?: User): Promise<Order | null> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.PREPARING],
      })
      .orderBy('order.createdAt', 'ASC');

    if (counterId) {
      queryBuilder.andWhere('order.counterId = :counterId', { counterId });
    }

    return queryBuilder.getOne()
  }

  /**
   * Cancel order with reason
   */
  async cancel(id: string, reason?: string, user?: User): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, { where: { id } });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (order.status === OrderStatus.DELIVERED) {
        throw new BadRequestException('Cannot cancel completed order');
      }

      // Restore inventory if needed
      if ([OrderStatus.PREPARING, OrderStatus.READY].includes(order.status)) {
        await this.restoreInventoryFromOrder(order.id, manager);
      }

      await manager.update(Order, id, {
        status: OrderStatus.CANCELLED,
        notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}`.trim() : order.notes
      });

      const cancelledOrder = await manager.findOne(Order, { where: { id } });

      this.logger.log(`Order ${order.orderNumber} cancelled. Reason: ${reason || 'No reason provided'}`);
      return cancelledOrder!;
    });
  }

  /**
   * Find orders with filtering and pagination
   */
  async findAll(options: OrderServiceOptions): Promise<PaginatedOrderResponse> {
    const { filters, pagination, sort, user } = options;

    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    // Apply filters
    if (filters?.cafeId) {
      queryBuilder.andWhere('order.cafeId = :cafeId', { cafeId: filters.cafeId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.dateRange?.from) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: filters.dateRange.from });
    }

    if (filters?.dateRange?.to) {
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: filters.dateRange.to });
    }

    // Apply sorting
    if (sort?.field && sort?.direction) {
      queryBuilder.orderBy(`order.${sort.field}`, sort.direction);
    } else {
      queryBuilder.orderBy('order.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = pagination?.skip || 0;
    const take = pagination?.take || 20;

    queryBuilder.skip(skip).take(take);

    const [orders, total] = await queryBuilder.getManyAndCount()

    return {
      data: orders,
      total,
      skip,
      take,
      totalPages: Math.ceil(total / take),
    }
  }

  async findById(id: string, user?: User): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { id } });
  }

  async findByOrderNumber(orderNumber: string, cafeId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { orderNumber, cafeId }
    });
  }

  async findByCafe(cafeId: string, options: Omit<OrderServiceOptions, 'filters'>): Promise<Order[]> {
    return this.findAll({ ...options, filters: { cafeId, customerId: undefined, counterId: undefined, status: undefined, type: undefined, dateRange: undefined, search: undefined } }).then(result => result.data);
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' }
    });
  }

  async update(id: string, input: UpdateOrderInput, user: User): Promise<Order> {
    await this.orderRepository.update(id, input);
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Process payment for an order
   */
  async processPayment(input: ProcessPaymentInput, user: User): Promise<Payment> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      try {
        this.logger.log(`Processing payment for order ${input.orderId}, amount: ${input.amount}`);

        // Validate order exists and is in correct status
        const order = await manager.findOne(Order, {
          where: { id: input.orderId },
          relations: ['payments'],
        });

        if (!order) {
          throw new NotFoundException(`Order with ID ${input.orderId} not found`);
        }

        if (order.status === OrderStatus.CANCELLED) {
          throw new BadRequestException('Cannot process payment for cancelled order');
        }

        // Calculate remaining balance
        const totalPaid = order.payments?.reduce((sum, payment) =>
          payment.status === PaymentStatus.COMPLETED ? sum + payment.amount : sum, 0) || 0;
        const remainingBalance = order.total - totalPaid;

        if (input.amount > remainingBalance) {
          throw new BadRequestException(`Payment amount exceeds remaining balance. Remaining: ${remainingBalance}`);
        }

        // Generate transaction ID
        const transactionId = await this.generateTransactionId(input.orderId, manager);

        // Create payment record
        const payment = manager.create(Payment, {
          transactionId,
          orderId: input.orderId,
          method: input.method,
          amount: input.amount,
          currency: input.currency || 'USD',
          status: PaymentStatus.PROCESSING,
          processorTransactionId: input.processorTransactionId,
          metadata: input.metadata,
        });

        const savedPayment = await manager.save(Payment, payment);

        // Process payment based on method
        const processingResult = await this.processPaymentByMethod(savedPayment, input.method);

        // Update payment status
        await manager.update(Payment, savedPayment.id, {
          status: processingResult.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          processedAt: new Date(),
          processorResponse: JSON.stringify(processingResult),
        });

        const finalPayment = await manager.findOne(Payment, { where: { id: savedPayment.id } });

        // Update order status if fully paid
        if (processingResult.success && (totalPaid + input.amount) >= order.total) {
          await this.updateOrderPaymentStatus(order.id, manager);
        }

        // Publish payment event
        await this.pubsub.publish('paymentProcessed', {
          orderId: order.id,
          paymentId: finalPayment!.id,
          amount: input.amount,
          method: input.method,
          status: finalPayment!.status,
        });

        this.logger.log(`Payment processed for order ${input.orderId}: ${finalPayment!.status}`);
        return finalPayment!;

      } catch (error) {
        this.logger.error(`Failed to process payment: ${error.message}`, error.stack);
        throw error;
      }
    });
  }

  /**
   * Refund a payment
   */
  async refundPayment(input: RefundPaymentInput, user: User): Promise<Payment> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: input.paymentId },
        relations: ['order'],
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${input.paymentId} not found`);
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Can only refund completed payments');
      }

      if (input.amount > payment.amount) {
        throw new BadRequestException('Refund amount cannot exceed original payment amount');
      }

      // Process refund through payment processor
      const refundResult = await this.processRefundByMethod(payment, input.amount, input.reason);

      if (!refundResult.success) {
        throw new InternalServerErrorException(`Refund failed: ${refundResult.error}`);
      }

      // Update payment status
      const newStatus = input.amount === payment.amount ?
        PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

      const updatedMetadata = {
        ...(payment.metadata as object || {}),
        refund: {
          amount: input.amount,
          reason: input.reason,
          processedAt: new Date(),
          processorResponse: refundResult,
        }
      };

      await manager.update(Payment, payment.id, {
        status: newStatus,
        metadata: updatedMetadata as any
      });

      const updatedPayment = await manager.findOne(Payment, { where: { id: payment.id } });

      this.logger.log(`Refund processed for payment ${payment.id}: ${input.amount}`);
      return updatedPayment!;
    });
  }

  /**
   * Get comprehensive order analytics
   */
  async getOrderAnalytics(cafeId: string, period: OrderMetrics['period'], user: User): Promise<OrderMetrics> {
    try {
      const { startDate, endDate } = this.getDateRangeForPeriod(period);

      // Get order analytics in parallel
      const [
        totalOrders,
        ordersByStatus,
        totalRevenue,
        popularItems,
        busyHours,
        customerMetrics,
        timingMetrics
      ] = await Promise.all([
        this.getTotalOrdersCount(cafeId, startDate, endDate),
        this.getOrdersByStatus(cafeId, startDate, endDate),
        this.getTotalRevenue(cafeId, startDate, endDate),
        this.getPopularItems(cafeId, startDate, endDate),
        this.getBusyHours(cafeId, startDate, endDate),
        this.getCustomerMetrics(cafeId, startDate, endDate),
        this.getTimingMetrics(cafeId, startDate, endDate),
      ]);

      const analytics: OrderAnalytics = {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        ordersByStatus,
        popularItems,
        busyHours,
        customerRetention: customerMetrics,
        averagePreparationTime: timingMetrics.averagePreparationTime,
        completionRate: timingMetrics.completionRate,
        cancellationRate: timingMetrics.cancellationRate,
      }

      // Cache analytics for 1 hour
      await this.cache.set(`order_analytics:${cafeId}:${period}`, analytics, 3600);

      return {
        period,
        startDate,
        endDate,
        analytics,
      }

    } catch (error) {
      this.logger.error(`Failed to get order analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get order history with advanced filtering
   */
  async getOrderHistory(
    cafeId: string,
    filters: {
      customerId?: string;
      status?: OrderStatus[]
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
      searchTerm?: string;
    },
    pagination: PaginationInput,
    user: User
  ): Promise<PaginatedOrderResponse> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.payments', 'payments')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.cafeId = :cafeId', { cafeId });

    // Apply filters
    if (filters.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('order.status IN (:...statuses)', { statuses: filters.status });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.minAmount) {
      queryBuilder.andWhere('order.total >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      queryBuilder.andWhere('order.total <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere('(order.orderNumber ILIKE :search OR order.notes ILIKE :search)',
        { search: `%${filters.searchTerm}%` });
    }

    // Apply pagination
    const skip = pagination?.skip || 0;
    const take = pagination?.take || 20;

    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    const [orders, total] = await queryBuilder.getManyAndCount()

    return {
      data: orders,
      total,
      skip,
      take,
      totalPages: Math.ceil(total / take),
    }
  }

  /**
   * Get real-time order queue for kitchen/counter display
   */
  async getOrderQueue(cafeId: string, counterId?: string, user?: User): Promise<Order[]> {
    const cacheKey = `order_queue:${cafeId}${counterId ? `:${counterId}` : ''}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.PREPARING],
      });

    if (counterId) {
      queryBuilder.andWhere('order.counterId = :counterId', { counterId });
    }

    const orders = await queryBuilder
      .orderBy('order.createdAt', 'ASC')
      .getMany()

    // Cache for 30 seconds
    await this.cache.set(cacheKey, orders, 30);

    return orders;
  }

  /**
   * Get performance metrics for orders
   */
  async getOrderPerformanceMetrics(cafeId: string, date: Date, user: User): Promise<{
    averagePreparationTime: number;
    averageWaitTime: number;
    orderThroughput: number;
    peakHours: Array<{ hour: number; orderCount: number; avgWaitTime: number }>;
    counterPerformance: Array<{ counterId: string; orderCount: number; avgTime: number }>;
    customerSatisfactionScore: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getMany()

    // Calculate metrics
    const preparationTimes = orders
      .filter(o => o.readyAt && o.createdAt)
      .map(o => (o.readyAt!.getTime() - o.createdAt.getTime()) / (1000 * 60)); // minutes

    const waitTimes = orders
      .filter(o => o.deliveredAt && o.readyAt)
      .map(o => (o.deliveredAt!.getTime() - o.readyAt!.getTime()) / (1000 * 60)); // minutes

    const averagePreparationTime = preparationTimes.length > 0
      ? preparationTimes.reduce((a, b) => a + b) / preparationTimes.length : 0;

    const averageWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b) / waitTimes.length : 0;

    // Calculate peak hours
    const hourlyData = new Map<number, { count: number; totalWaitTime: number }>()
    orders.forEach(order => {
      const hour = order.createdAt.getHours()
      const waitTime = order.deliveredAt && order.readyAt
        ? (order.deliveredAt.getTime() - order.readyAt.getTime()) / (1000 * 60) : 0;

      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { count: 0, totalWaitTime: 0 });
      }

      const data = hourlyData.get(hour)!;
      data.count++;
      data.totalWaitTime += waitTime;
    });

    const peakHours = Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      orderCount: data.count,
      avgWaitTime: data.count > 0 ? data.totalWaitTime / data.count : 0,
    }));

    // Calculate counter performance
    const counterData = new Map<string, { count: number; totalTime: number }>()
    orders.forEach(order => {
      if (order.counterId && order.readyAt) {
        const prepTime = (order.readyAt.getTime() - order.createdAt.getTime()) / (1000 * 60);

        if (!counterData.has(order.counterId)) {
          counterData.set(order.counterId, { count: 0, totalTime: 0 });
        }

        const data = counterData.get(order.counterId)!;
        data.count++;
        data.totalTime += prepTime;
      }
    });

    const counterPerformance = Array.from(counterData.entries()).map(([counterId, data]) => ({
      counterId,
      orderCount: data.count,
      avgTime: data.count > 0 ? data.totalTime / data.count : 0,
    }));

    return {
      averagePreparationTime,
      averageWaitTime,
      orderThroughput: orders.length,
      peakHours,
      counterPerformance,
      customerSatisfactionScore: this.calculateSatisfactionScore(averagePreparationTime, averageWaitTime),
    }
  }

  // Private helper methods

  private async generateOrderNumber(cafeId: string, manager: EntityManager): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await manager.count(Order, {
      where: {
        cafeId,
        orderNumber: Like(`${today}%`)
      }
    });

    return `${today}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Comprehensive order validation including menu items, pricing, and inventory
   */
  private async validateCompleteOrder(
    input: CreateOrderInput,
    manager: EntityManager
  ): Promise<OrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const inventoryImpacts: InventoryImpact[] = []
    let estimatedTotal = 0;

    try {
      // Validate cafe exists and is accepting orders
      const cafe = await manager.findOne(Cafe, {
        where: { id: input.cafeId } as any,
        select: ['id', 'name', 'status'],
      });

      if (!cafe) {
        errors.push(`Cafe with ID ${input.cafeId} not found`);
        return { isValid: false, errors, warnings, inventoryImpacts, estimatedTotal }
      }

      // Validate each menu item
      for (const itemInput of input.items) {
        const menuItem = await manager.findOne(Menu, {
          where: { id: itemInput.menuItemId, cafeId: input.cafeId } as any
        });

        if (!menuItem) {
          errors.push(`Menu item ${itemInput.menuItemId} not found in cafe ${input.cafeId}`);
          continue;
        }

        if (menuItem.status !== MenuItemStatus.AVAILABLE) {
          errors.push(`Menu item ${menuItem.name} is not available`);
          continue;
        }

        // Price is validated by using menu item price directly (no client-provided price)

        // Check inventory availability for this menu item
        const inventoryItems = await this.getInventoryForMenuItem(menuItem.id, manager);
        const inventoryImpact: InventoryImpact = {
          menuItemId: menuItem.id,
          inventoryItems: inventoryItems.map(item => ({
            itemId: item.id,
            quantityNeeded: item.quantityNeeded * itemInput.quantity,
            availableStock: item.currentStock,
            sufficient: item.currentStock >= (item.quantityNeeded * itemInput.quantity),
          }))
        }

        inventoryImpacts.push(inventoryImpact);

        // Check if any inventory items are insufficient
        const insufficientItems = inventoryImpact.inventoryItems.filter(item => !item.sufficient);
        if (insufficientItems.length > 0) {
          warnings.push(`Insufficient inventory for ${menuItem.name}: ${insufficientItems.map(item => `${item.itemId} (need ${item.quantityNeeded}, have ${item.availableStock})`).join(', ')}`);
        }

        estimatedTotal += itemInput.quantity * menuItem.price;
      }

      // Additional business rule validations
      if (input.items.length === 0) {
        errors.push('Order must contain at least one item');
      }

      if (input.items.length > 50) {
        warnings.push('Large order detected - may impact preparation time');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        inventoryImpacts,
        estimatedTotal,
      }

    } catch (error) {
      this.logger.error(`Order validation failed: ${error.message}`, error.stack);
      errors.push('Order validation failed due to system error');
      return { isValid: false, errors, warnings, inventoryImpacts, estimatedTotal }
    }
  }

  /**
   * Get inventory items needed for a menu item (recipe-based)
   */
  private async getInventoryForMenuItem(menuItemId: string, manager: EntityManager): Promise<Array<{
    id: string;
    currentStock: number;
    quantityNeeded: number;
  }>> {
    // This would typically involve a recipe/ingredient table
    // For now, we'll return a simplified version
    // In a real implementation, you'd have a menu_item_ingredients table

    const inventoryItems = await manager
      .createQueryBuilder(Stock, 'inventory')
      .where('inventory.menuItemId = :menuItemId', { menuItemId }) // Assuming direct relationship for simplicity
      .select(['inventory.id', 'inventory.currentStock'])
      .getRawMany()

    return inventoryItems.map(item => ({
      id: item.inventory_id,
      currentStock: item.inventory_currentStock,
      quantityNeeded: 1, // This would come from recipe data
    }));
  }

  private calculateEstimatedReadyTime(itemCount: number): Date {
    const baseTime = 10; // 10 minutes base
    const additionalTime = Math.ceil(itemCount / 3) * 5; // 5 minutes per 3 items
    const estimatedMinutes = baseTime + additionalTime;

    const readyTime = new Date()
    readyTime.setMinutes(readyTime.getMinutes() + estimatedMinutes);

    return readyTime;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [],
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async assignToCounterInternal(
    orderId: string,
    counterId: string,
    manager: EntityManager
  ): Promise<Order> {
    // Validate counter exists and is available
    const counter = await manager.findOne(Counter, {
      where: { id: counterId },
      select: ['id', 'name', 'status', 'cafeId'],
    });

    if (!counter) {
      throw new NotFoundException(`Counter with ID ${counterId} not found`);
    }

    await manager.update(Order, orderId, { counterId });

    const order = await manager.findOne(Order, { where: { id: orderId } });
    return order!;
  }

  private async findBestAvailableCounter(
    cafeId: string,
    orderType: OrderType,
    manager: EntityManager
  ): Promise<Counter | null> {
    // Simple implementation - find least busy counter
    const counters = await manager
      .createQueryBuilder(Counter, 'counter')
      .leftJoin('counter.orders', 'order', 'order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.PREPARING],
      })
      .where('counter.cafeId = :cafeId', { cafeId })
      .andWhere('counter.status = :status', { status: 'ACTIVE' })
      .groupBy('counter.id')
      .orderBy('COUNT(order.id)', 'ASC')
      .getOne()

    return counters;
  }

  /**
   * Deduct inventory stock for order items
   */
  private async deductInventoryForOrder(
    inventoryItems: Array<{ itemId: string; quantityNeeded: number }>,
    orderQuantity: number,
    manager: EntityManager
  ): Promise<void> {
    for (const item of inventoryItems) {
      const inventory = await manager.findOne(Stock, { where: { id: item.itemId } });

      if (inventory && inventory.currentStock >= item.quantityNeeded) {
        await manager.update(Stock, item.itemId, {
          currentStock: inventory.currentStock - item.quantityNeeded
        });

        this.logger.debug(`Deducted ${item.quantityNeeded} units from inventory ${item.itemId}`);
      } else {
        this.logger.warn(`Insufficient inventory for item ${item.itemId}. Required: ${item.quantityNeeded}, Available: ${(inventory as any)?.currentStock || 0}`);
      }
    }
  }

  /**
   * Restore inventory when order is cancelled
   */
  private async restoreInventoryFromOrder(
    orderId: string,
    manager: EntityManager
  ): Promise<void> {
    const orderItems = await manager.find(OrderItem, {
      where: { orderId },
      relations: ['menuItem'],
    });

    for (const orderItem of orderItems) {
      // Get productId from the orderItem
      const productId = orderItem.productId || orderItem.product?.id;
      if (!productId) continue;

      const inventoryItems = await this.getInventoryForMenuItem(productId, manager);

      for (const item of inventoryItems) {
        const quantityToRestore = item.quantityNeeded * ((orderItem as any).quantity || 0);

        await manager.increment(Stock, { id: item.id }, 'currentStock', quantityToRestore);

        this.logger.debug(`Restored ${quantityToRestore} units to inventory ${item.id}`);
      }
    }
  }

  /**
   * Generate unique transaction ID for payments
   */
  private async generateTransactionId(orderId: string, manager: EntityManager): Promise<string> {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN_${orderId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase()
  }

  /**
   * Process payment by method
   */
  private async processPaymentByMethod(payment: Payment, method: PaymentMethod): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      switch (method) {
        case PaymentMethod.CASH:
          // Cash payments are considered immediately successful
          return {
            success: true,
            transactionId: payment.transactionId,
          }

        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          // Here you would integrate with payment processors like Stripe, Square, etc.
          return await this.processCardPayment(payment);

        case PaymentMethod.MOBILE_PAYMENT:
          // Process mobile payments (Apple Pay, Google Pay, etc.)
          return await this.processMobilePayment(payment);

        case PaymentMethod.GIFT_CARD:
          return await this.processGiftCardPayment(payment);

        case PaymentMethod.STORE_CREDIT:
          return await this.processStoreCreditPayment(payment);

        case PaymentMethod.SPLIT_PAYMENT:
          // Split payments would require additional logic
          return await this.processSplitPayment(payment);

        default:
          return {
            success: false,
            error: `Unsupported payment method: ${method}`,
          }
      }
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Process card payments (placeholder for actual payment processor integration)
   */
  private async processCardPayment(payment: Payment): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Placeholder for actual payment processor integration (Stripe, Square, etc.)
    // In real implementation, you would call the payment processor's API here

    this.logger.log(`Processing card payment: ${payment.transactionId} for amount ${payment.amount}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 95% success rate for demonstration
    const success = Math.random() > 0.05;

    return {
      success,
      transactionId: success ? `CARD_${Date.now()}` : undefined,
      error: success ? undefined : 'Card payment failed - insufficient funds or card declined',
    }
  }

  /**
   * Process mobile payments
   */
  private async processMobilePayment(payment: Payment): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    this.logger.log(`Processing mobile payment: ${payment.transactionId}`);

    // Simulate mobile payment processing
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      success: true,
      transactionId: `MOBILE_${Date.now()}`,
    }
  }

  /**
   * Process gift card payments
   */
  private async processGiftCardPayment(payment: Payment): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // In real implementation, you would validate gift card balance and deduct amount
    this.logger.log(`Processing gift card payment: ${payment.transactionId}`);

    return {
      success: true,
      transactionId: `GIFT_${Date.now()}`,
    }
  }

  /**
   * Process store credit payments
   */
  private async processStoreCreditPayment(payment: Payment): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // In real implementation, you would check customer store credit balance
    this.logger.log(`Processing store credit payment: ${payment.transactionId}`);

    return {
      success: true,
      transactionId: `CREDIT_${Date.now()}`,
    }
  }

  /**
   * Process split payments
   */
  private async processSplitPayment(payment: Payment): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Split payments would involve multiple payment methods
    this.logger.log(`Processing split payment: ${payment.transactionId}`);

    return {
      success: true,
      transactionId: `SPLIT_${Date.now()}`,
    }
  }

  /**
   * Process refund by payment method
   */
  private async processRefundByMethod(
    payment: Payment,
    refundAmount: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      switch (payment.method) {
        case PaymentMethod.CASH:
          // Cash refunds are handled manually
          return {
            success: true,
            refundId: `CASH_REFUND_${Date.now()}`,
          }

        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          // Process card refund through payment processor
          return await this.processCardRefund(payment, refundAmount);

        case PaymentMethod.MOBILE_PAYMENT:
          return await this.processMobileRefund(payment, refundAmount);

        case PaymentMethod.GIFT_CARD:
          return await this.processGiftCardRefund(payment, refundAmount);

        case PaymentMethod.STORE_CREDIT:
          return await this.processStoreCreditRefund(payment, refundAmount);

        default:
          return {
            success: false,
            error: `Refunds not supported for payment method: ${payment.method}`,
          }
      }
    } catch (error) {
      this.logger.error(`Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Process card refunds
   */
  private async processCardRefund(payment: Payment, amount: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
    // Placeholder for actual refund processing
    this.logger.log(`Processing card refund: ${amount} for payment ${payment.id}`);

    return {
      success: true,
      refundId: `CARD_REFUND_${Date.now()}`,
    }
  }

  /**
   * Process mobile payment refunds
   */
  private async processMobileRefund(payment: Payment, amount: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
    this.logger.log(`Processing mobile refund: ${amount} for payment ${payment.id}`);

    return {
      success: true,
      refundId: `MOBILE_REFUND_${Date.now()}`,
    }
  }

  /**
   * Process gift card refunds
   */
  private async processGiftCardRefund(payment: Payment, amount: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
    this.logger.log(`Processing gift card refund: ${amount} for payment ${payment.id}`);

    return {
      success: true,
      refundId: `GIFT_REFUND_${Date.now()}`,
    }
  }

  /**
   * Process store credit refunds
   */
  private async processStoreCreditRefund(payment: Payment, amount: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
    this.logger.log(`Processing store credit refund: ${amount} for payment ${payment.id}`);

    return {
      success: true,
      refundId: `CREDIT_REFUND_${Date.now()}`,
    }
  }

  /**
   * Update order payment status when fully paid
   */
  private async updateOrderPaymentStatus(orderId: string, manager: EntityManager): Promise<void> {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) return;

    const totalPaid = order.payments
      .filter((p: any) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    if (totalPaid >= order.totalAmount && order.status === OrderStatus.PENDING) {
      await manager.update(Order, orderId, {
        status: OrderStatus.PREPARING
      });

      this.logger.log(`Order ${order.orderNumber} status updated to PREPARING - payment completed`);
    }
  }

  /**
   * Analytics helper methods
   */
  private getDateRangeForPeriod(period: OrderMetrics['period']): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date(now);
    const startDate = new Date(now);

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate }
  }

  private async getTotalOrdersCount(cafeId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.orderRepository.count({
      where: {
        cafeId,
        createdAt: Between(startDate, endDate),
      },
    });
  }

  private async getOrdersByStatus(cafeId: string, startDate: Date, endDate: Date): Promise<Record<OrderStatus, number>> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('order.status')
      .getRawMany()

    const ordersByStatus: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PREPARING]: 0,
      [OrderStatus.READY]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.REFUNDED]: 0,
      [OrderStatus.FAILED]: 0,
    }

    result.forEach(row => {
      ordersByStatus[row.status] = parseInt(row.count);
    });

    return ordersByStatus;
  }

  private async getTotalRevenue(cafeId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED] })
      .getRawOne()

    return parseFloat(result.total) || 0;
  }

  private async getPopularItems(cafeId: string, startDate: Date, endDate: Date): Promise<Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>> {
    const result = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.menuItem', 'menuItem')
      .select('orderItem.menuItemId', 'menuItemId')
      .addSelect('menuItem.name', 'name')
      .addSelect('SUM(orderItem.quantity)', 'quantity')
      .addSelect('SUM(orderItem.subtotal)', 'revenue')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('orderItem.menuItemId, menuItem.name')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(10)
      .getRawMany()

    return result.map(row => ({
      menuItemId: row.menuItemId,
      name: row.name || 'Unknown Item',
      quantity: parseInt(row.quantity),
      revenue: parseFloat(row.revenue),
    }));
  }

  private async getBusyHours(cafeId: string, startDate: Date, endDate: Date): Promise<Array<{
    hour: number;
    orderCount: number;
  }>> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('EXTRACT(HOUR FROM order.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'orderCount')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('EXTRACT(HOUR FROM order.createdAt)')
      .orderBy('EXTRACT(HOUR FROM order.createdAt)', 'ASC')
      .getRawMany()

    return result.map(row => ({
      hour: parseInt(row.hour),
      orderCount: parseInt(row.orderCount),
    }));
  }

  private async getCustomerMetrics(cafeId: string, startDate: Date, endDate: Date): Promise<{
    returningCustomers: number;
    newCustomers: number;
  }> {
    // Get customers who ordered in this period
    const customersInPeriod = await this.orderRepository
      .createQueryBuilder('order')
      .select('DISTINCT order.customerId', 'customerId')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.customerId IS NOT NULL')
      .getRawMany()

    const customerIds = customersInPeriod.map(row => row.customerId);

    if (customerIds.length === 0) {
      return { returningCustomers: 0, newCustomers: 0 }
    }

    // Find customers who had orders before this period
    const returningCustomers = await this.orderRepository
      .createQueryBuilder('order')
      .select('DISTINCT order.customerId', 'customerId')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt < :startDate', { startDate })
      .andWhere('order.customerId IN (:...customerIds)', { customerIds })
      .getRawMany()

    return {
      returningCustomers: returningCustomers.length,
      newCustomers: customerIds.length - returningCustomers.length,
    }
  }

  private async getTimingMetrics(cafeId: string, startDate: Date, endDate: Date): Promise<{
    averagePreparationTime: number;
    completionRate: number;
    cancellationRate: number;
  }> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany()

    if (orders.length === 0) {
      return { averagePreparationTime: 0, completionRate: 0, cancellationRate: 0 }
    }

    // Calculate average preparation time for completed orders
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED && o.readyAt);
    const preparationTimes = completedOrders.map(o =>
      (o.readyAt!.getTime() - o.createdAt.getTime()) / (1000 * 60) // minutes
    );

    const averagePreparationTime = preparationTimes.length > 0
      ? preparationTimes.reduce((a, b) => a + b) / preparationTimes.length
      : 0;

    const completionRate = orders.length > 0
      ? (completedOrders.length / orders.length) * 100
      : 0;

    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
    const cancellationRate = orders.length > 0
      ? (cancelledOrders / orders.length) * 100
      : 0;

    return {
      averagePreparationTime,
      completionRate,
      cancellationRate,
    }
  }

  private calculateSatisfactionScore(avgPrepTime: number, avgWaitTime: number): number {
    // Simple satisfaction score calculation based on timing
    // This could be enhanced with actual customer feedback data
    const idealPrepTime = 15; // 15 minutes ideal
    const idealWaitTime = 5; // 5 minutes ideal

    const prepTimeScore = Math.max(0, 100 - Math.abs(avgPrepTime - idealPrepTime) * 2);
    const waitTimeScore = Math.max(0, 100 - Math.abs(avgWaitTime - idealWaitTime) * 4);

    return (prepTimeScore + waitTimeScore) / 2;
  }
}