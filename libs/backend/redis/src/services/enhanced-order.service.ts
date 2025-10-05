import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
// Using temporary types as workaround for missing models
type OrderEntity = {
  id: string;
  orderNumber: string;
  status: string;
  cafeId: string;
  customerId: string;
  counterId?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

type CreateOrderInput = {
  cafeId: string;
  customerId: string;
  items: any[]
  [key: string]: any;
}

type UpdateOrderStatusInput = {
  orderId: string;
  status: string;
  [key: string]: any;
}

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Mock entity for TypeORM until proper models are available
class Order {
  id!: string;
  orderNumber!: string;
  status!: string;
  cafeId!: string;
  customerId!: string;
  counterId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
import { User } from '@app/models';
import { RedisPubSubService } from './pubsub.service';
import { RedisCacheService } from './cache.service';
import { Cacheable, CacheEvict, CacheCafeContext } from '../decorators/cache.decorator';

@Injectable()
export class EnhancedOrderService {
  private readonly logger = new Logger(EnhancedOrderService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly pubsub: RedisPubSubService,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Create order with Redis pub/sub notifications
   */
  async createOrder(input: CreateOrderInput, user: User): Promise<OrderEntity> {
    const order = await this.dataSource.transaction(async (manager) => {
      // Create order logic (existing implementation)
      const order = manager.create(Order, {
        ...input,
        customerId: user.id,
        status: OrderStatus.PENDING,
      });

      return manager.save(Order, order);
    });

    // Publish order created event
    await this.pubsub.publishOrderCreated({
      orderId: (order as OrderEntity).id,
      orderNumber: (order as OrderEntity).orderNumber,
      cafeId: (order as OrderEntity).cafeId,
      customerId: (order as OrderEntity).customerId,
    });

    // Send kitchen notification
    await this.pubsub.publishKitchenNotification({
      orderId: (order as OrderEntity).id,
      orderNumber: (order as OrderEntity).orderNumber,
      cafeId: (order as OrderEntity).cafeId,
      counterId: (order as OrderEntity).counterId,
      items: [], // Would be populated from order items
      priority: 'normal',
      estimatedReadyTime: (order as any).estimatedReadyTime,
    });

    // Invalidate relevant caches
    await this.cache.invalidateCafeCache((order as OrderEntity).cafeId);

    this.logger.log(`Order ${(order as OrderEntity).orderNumber} created and notifications sent`);
    return order as OrderEntity;
  }

  /**
   * Update order status with real-time notifications
   */
  async updateOrderStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    user: User
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Update status
    await this.orderRepository.update(orderId, { status: input.status });
    const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });

    // Publish status update
    await this.pubsub.publishOrderStatusUpdated({
      orderId: (order as OrderEntity).id,
      orderNumber: (order as OrderEntity).orderNumber,
      cafeId: (order as OrderEntity).cafeId,
      customerId: (order as OrderEntity).customerId,
      status: input.status,
    });

    // Cache the updated order
    await this.cache.set(`order:${orderId}`, updatedOrder, { ttl: 1800, namespace: 'orders' });

    this.logger.log(`Order ${(order as OrderEntity).orderNumber} status updated to ${input.status}`);
    return updatedOrder as OrderEntity;
  }

  /**
   * Get cached order by ID
   */
  @Cacheable(undefined, 1800, 'orders') // Cache for 30 minutes
  async getOrderById(orderId: string): Promise<OrderEntity | null> {
    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'customer', 'cafe'],
    });
  }

  /**
   * Get orders for cafe with caching
   */
  @CacheCafeContext((cafeId) => `cafe-orders-${cafeId}`, 900) // 15 minutes
  async getCafeOrders(cafeId: string, status?: OrderStatus): Promise<Order[]> {
    const where: any = { cafeId }
    if (status) {
      where.status = status;
    }

    return this.orderRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: 50, // Limit to recent orders
    });
  }

  /**
   * Get active orders for kitchen display
   */
  @CacheCafeContext((cafeId) => `kitchen-orders-${cafeId}`, 300) // 5 minutes
  async getKitchenOrders(cafeId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        cafeId,
        // status: [OrderStatus.PENDING, OrderStatus.PREPARING], // Simplified for now
      },
      order: { updatedAt: 'ASC' },
      relations: ['items'],
    });
  }

  /**
   * Assign order to counter
   */
  @CacheEvict(undefined, 'orders')
  async assignToCounter(orderId: string, counterId: string, user: User): Promise<Order> {
    await this.orderRepository.update(orderId, { counterId });
    const order = await this.getOrderById(orderId);

    if (order) {
      // Publish counter assignment
      await this.pubsub.publishCounterAssignment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        counterId,
        counterName: 'Counter Name', // Would fetch from counter repository
        cafeId: order.cafeId,
        assignedBy: user.id,
        assignedAt: new Date(),
      });

      // Invalidate cafe cache
      await this.cache.invalidateCafeCache(order.cafeId);
    }

    return order!;
  }

  /**
   * Get order statistics with caching
   */
  @CacheCafeContext((cafeId) => `order-stats-${cafeId}`, 600) // 10 minutes
  async getOrderStats(cafeId: string): Promise<{
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
  }> {
    const [total, pending, preparing, ready, completed] = await Promise.all([
      this.orderRepository.count({ where: { cafeId } }),
      this.orderRepository.count({ where: { cafeId, status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { cafeId, status: OrderStatus.PREPARING } }),
      this.orderRepository.count({ where: { cafeId, status: OrderStatus.READY } }),
      this.orderRepository.count({ where: { cafeId, status: OrderStatus.COMPLETED } }),
    ]);

    return { total, pending, preparing, ready, completed }
  }

  /**
   * Clear order caches for cafe
   */
  async clearCafeOrderCaches(cafeId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`cafe-orders-${cafeId}`, 'restaurant'),
      this.cache.del(`kitchen-orders-${cafeId}`, 'restaurant'),
      this.cache.del(`order-stats-${cafeId}`, 'restaurant'),
    ]);

    this.logger.log(`Cleared order caches for cafe ${cafeId}`);
  }

  /**
   * Get real-time order updates for GraphQL subscriptions
   */
  getOrderUpdatesStream(cafeId: string) {
    return this.pubsub.getCafeEvents(cafeId);
  }

  /**
   * Get kitchen notifications stream
   */
  getKitchenNotificationsStream(cafeId: string) {
    return this.pubsub.getCafeEvents(cafeId).pipe(
      // Would add filtering logic here
    );
  }
}