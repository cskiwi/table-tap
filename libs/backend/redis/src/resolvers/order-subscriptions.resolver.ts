import { Injectable } from '@nestjs/common';
import { Args, Resolver, Subscription } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CounterAssignment, KitchenNotification, OrderEvent, PubSubMessage, RedisEventType } from '../interfaces';
import { RedisPubSubService } from '../services';

// GraphQL Types (these would be defined in your schema)
class OrderUpdate {
  orderId!: string;
  orderNumber!: string;
  status!: string;
  cafeId!: string;
  customerId!: string;
  timestamp!: Date;
}

class KitchenNotificationUpdate {
  orderId!: string;
  orderNumber!: string;
  cafeId!: string;
  counterId?: string;
  items!: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    customizations?: string[];
  }>;
  priority!: string;
  estimatedReadyTime?: Date;
}

class CounterAssignmentUpdate {
  orderId!: string;
  orderNumber!: string;
  counterId!: string;
  counterName!: string;
  cafeId!: string;
  assignedBy!: string;
  assignedAt!: Date;
}

@Resolver()
@Injectable()
export class OrderSubscriptionsResolver {
  constructor(private readonly pubsub: RedisPubSubService) {}

  /**
   * Subscribe to order updates for a specific cafe
   */
  @Subscription(() => OrderUpdate, {
    description: 'Subscribe to real-time order updates for a cafe',
  })
  async orderUpdates(@Args('cafeId') cafeId: string, @Args('status', { nullable: true }) status?: string): Promise<Observable<OrderUpdate>> {
    // Subscribe to cafe events
    await this.pubsub.subscribeToCafeEvents(cafeId);

    return this.pubsub.getCafeEvents<OrderEvent>(cafeId).pipe(
      filter((message: PubSubMessage<OrderEvent>) => {
        // Filter for order events
        const isOrderEvent = [RedisEventType.ORDER_CREATED, RedisEventType.ORDER_STATUS_UPDATED].includes(
          (message.pattern.split(':')[0] + ':' + message.pattern.split(':')[1]) as RedisEventType,
        );

        // Filter by status if provided
        if (status && message.data.status) {
          return isOrderEvent && message.data.status === status;
        }

        return isOrderEvent;
      }),
      map((message: PubSubMessage<OrderEvent>) => ({
        orderId: message.data.orderId,
        orderNumber: message.data.orderNumber,
        status: message.data.status || 'UNKNOWN',
        cafeId: message.data.cafeId,
        customerId: message.data.customerId,
        timestamp: message.timestamp,
      })),
    );
  }

  /**
   * Subscribe to kitchen notifications for a specific cafe
   */
  @Subscription(() => KitchenNotificationUpdate, {
    description: 'Subscribe to kitchen notifications for a cafe',
  })
  async kitchenNotifications(
    @Args('cafeId') cafeId: string,
    @Args('priority', { nullable: true }) priority?: string,
  ): Promise<Observable<KitchenNotificationUpdate>> {
    await this.pubsub.subscribeToCafeEvents(cafeId);

    return this.pubsub.getCafeEvents<KitchenNotification>(cafeId).pipe(
      filter((message: PubSubMessage<KitchenNotification>) => {
        const isKitchenEvent = message.pattern === RedisEventType.KITCHEN_NOTIFICATION;

        if (priority) {
          return isKitchenEvent && message.data.priority === priority;
        }

        return isKitchenEvent;
      }),
      map((message: PubSubMessage<KitchenNotification>) => ({
        orderId: message.data.orderId,
        orderNumber: message.data.orderNumber,
        cafeId: message.data.cafeId,
        counterId: message.data.counterId,
        items: message.data.items,
        priority: message.data.priority,
        estimatedReadyTime: message.data.estimatedReadyTime,
      })),
    );
  }

  /**
   * Subscribe to counter assignments for a specific counter
   */
  @Subscription(() => CounterAssignmentUpdate, {
    description: 'Subscribe to counter assignments for a specific counter',
  })
  async counterAssignments(@Args('counterId') counterId: string): Promise<Observable<CounterAssignmentUpdate>> {
    await this.pubsub.subscribeToCounterEvents(counterId);

    return this.pubsub.getCounterEvents<CounterAssignment>(counterId).pipe(
      filter((message: PubSubMessage<CounterAssignment>) => message.pattern === RedisEventType.COUNTER_ASSIGNMENT),
      map((message: PubSubMessage<CounterAssignment>) => ({
        orderId: message.data.orderId,
        orderNumber: message.data.orderNumber,
        counterId: message.data.counterId,
        counterName: message.data.counterName,
        cafeId: message.data.cafeId,
        assignedBy: message.data.assignedBy,
        assignedAt: message.data.assignedAt,
      })),
    );
  }

  /**
   * Subscribe to specific order updates
   */
  @Subscription(() => OrderUpdate, {
    description: 'Subscribe to updates for a specific order',
  })
  async orderUpdate(@Args('orderId') orderId: string): Promise<Observable<OrderUpdate>> {
    await this.pubsub.subscribeToOrderEvents(orderId);

    return this.pubsub.getOrderEvents<OrderEvent>(orderId).pipe(
      map((message: PubSubMessage<OrderEvent>) => ({
        orderId: message.data.orderId,
        orderNumber: message.data.orderNumber,
        status: message.data.status || 'UNKNOWN',
        cafeId: message.data.cafeId,
        customerId: message.data.customerId,
        timestamp: message.timestamp,
      })),
    );
  }

  /**
   * Subscribe to all cafe events (admin/manager view)
   */
  @Subscription(() => String, {
    description: 'Subscribe to all cafe events for management dashboard',
  })
  async cafeEvents(
    @Args('cafeId') cafeId: string,
    @Args('eventTypes', { type: () => [String], nullable: true }) eventTypes?: string[],
  ): Promise<Observable<string>> {
    await this.pubsub.subscribeToCafeEvents(cafeId);

    return this.pubsub.getCafeEvents(cafeId).pipe(
      filter((message: PubSubMessage) => {
        if (!eventTypes || eventTypes.length === 0) {
          return true;
        }
        return eventTypes.includes(message.data.type);
      }),
      map((message: PubSubMessage) =>
        JSON.stringify({
          type: message.data.type,
          data: message.data,
          timestamp: message.timestamp,
          channel: message.channel,
        }),
      ),
    );
  }

  /**
   * Subscribe to system-wide alerts
   */
  @Subscription(() => String, {
    description: 'Subscribe to system alerts and notifications',
  })
  async systemAlerts(): Promise<Observable<string>> {
    await this.pubsub.psubscribe('system:*');

    return this.pubsub.getPatternMessages('system:*').pipe(
      map((message: PubSubMessage) =>
        JSON.stringify({
          type: 'SYSTEM_ALERT',
          alert: message.data,
          timestamp: message.timestamp,
        }),
      ),
    );
  }

  /**
   * Subscribe to inventory updates for a cafe
   */
  @Subscription(() => String, {
    description: 'Subscribe to inventory level updates',
  })
  async inventoryUpdates(@Args('cafeId') cafeId: string): Promise<Observable<string>> {
    const inventoryChannel = `cafe:${cafeId}:inventory`;
    await this.pubsub.subscribe(inventoryChannel);

    return this.pubsub.getChannelMessages(inventoryChannel).pipe(
      filter((message: PubSubMessage) => message.data.type === RedisEventType.INVENTORY_UPDATED),
      map((message: PubSubMessage) =>
        JSON.stringify({
          type: 'INVENTORY_UPDATE',
          cafeId,
          items: message.data.items,
          timestamp: message.timestamp,
        }),
      ),
    );
  }
}
