import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cluster, Redis } from 'ioredis';
import { Observable, Subject } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';
import { REDIS_PUBSUB_TOKEN, REDIS_SUBSCRIBER_TOKEN } from '../config';
import { CounterAssignment, KitchenNotification, OrderEvent, PubSubMessage, RedisEventType } from '../interfaces';

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly destroy$ = new Subject<void>();
  private readonly messageSubject = new Subject<PubSubMessage>();
  private subscribedChannels = new Set<string>();
  private subscribedPatterns = new Set<string>();

  constructor(
    @Inject(REDIS_PUBSUB_TOKEN) private readonly publisher: Redis | Cluster,
    @Inject(REDIS_SUBSCRIBER_TOKEN) private readonly subscriber: Redis | Cluster,
  ) {
    this.setupSubscriberListeners();
  }

  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }

  /**
   * Publish message to a channel
   */
  async publish<T = any>(channel: string, data: T, messageId?: string): Promise<number> {
    try {
      const message: PubSubMessage<T> = {
        pattern: '',
        channel,
        data,
        timestamp: new Date(),
        messageId: messageId || this.generateMessageId(),
      };

      const serializedMessage = JSON.stringify(message);
      const result = await this.publisher.publish(channel, serializedMessage);

      this.logger.debug(`Published message to channel ${channel}: ${serializedMessage}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish message to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a specific channel
   */
  async subscribe(channel: string): Promise<void> {
    try {
      if (!this.subscribedChannels.has(channel)) {
        await this.subscriber.subscribe(channel);
        this.subscribedChannels.add(channel);
        this.logger.log(`Subscribed to channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to pattern-based channels
   */
  async psubscribe(pattern: string): Promise<void> {
    try {
      if (!this.subscribedPatterns.has(pattern)) {
        await this.subscriber.psubscribe(pattern);
        this.subscribedPatterns.add(pattern);
        this.logger.log(`Subscribed to pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to subscribe to pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      this.subscribedChannels.delete(channel);
      this.logger.log(`Unsubscribed from channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a pattern
   */
  async punsubscribe(pattern: string): Promise<void> {
    try {
      await this.subscriber.punsubscribe(pattern);
      this.subscribedPatterns.delete(pattern);
      this.logger.log(`Unsubscribed from pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Get observable for all messages
   */
  getMessages(): Observable<PubSubMessage> {
    return this.messageSubject.asObservable().pipe(takeUntil(this.destroy$), share());
  }

  /**
   * Get observable for specific channel messages
   */
  getChannelMessages<T = any>(channel: string): Observable<PubSubMessage<T>> {
    return this.getMessages().pipe(
      filter((message) => message.channel === channel),
      map((message) => message as PubSubMessage<T>),
    );
  }

  /**
   * Get observable for pattern-based messages
   */
  getPatternMessages<T = any>(pattern: string): Observable<PubSubMessage<T>> {
    return this.getMessages().pipe(
      filter((message) => message.pattern === pattern),
      map((message) => message as PubSubMessage<T>),
    );
  }

  // Restaurant-specific methods

  /**
   * Publish order creation event
   */
  async publishOrderCreated(orderEvent: OrderEvent): Promise<number> {
    const channel = `cafe:${orderEvent.cafeId}:orders`;
    return this.publish(channel, {
      type: RedisEventType.ORDER_CREATED,
      ...orderEvent,
    });
  }

  /**
   * Publish order status update
   */
  async publishOrderStatusUpdated(orderEvent: OrderEvent): Promise<number> {
    const channels = [`cafe:${orderEvent.cafeId}:orders`, `order:${orderEvent.orderId}:status`];
    const results = await Promise.all(
      channels.map((channel) =>
        this.publish(channel, {
          type: RedisEventType.ORDER_STATUS_UPDATED,
          ...orderEvent,
        }),
      ),
    );

    return results.reduce((sum, result) => sum + result, 0);
  }

  /**
   * Publish kitchen notification
   */
  async publishKitchenNotification(notification: KitchenNotification): Promise<number> {
    const channels = [
      `cafe:${notification.cafeId}:kitchen`,
      notification.counterId ? `counter:${notification.counterId}:notifications` : null,
    ].filter(Boolean) as string[];

    const results = await Promise.all(
      channels.map((channel) =>
        this.publish(channel, {
          type: RedisEventType.KITCHEN_NOTIFICATION,
          ...notification,
        }),
      ),
    );

    return results.reduce((sum, result) => sum + result, 0);
  }

  /**
   * Publish counter assignment
   */
  async publishCounterAssignment(assignment: CounterAssignment): Promise<number> {
    const channels = [
      `cafe:${assignment.cafeId}:assignments`,
      `counter:${assignment.counterId}:assignments`,
      `order:${assignment.orderId}:assignment`,
    ];
    const results = await Promise.all(
      channels.map((channel) =>
        this.publish(channel, {
          type: RedisEventType.COUNTER_ASSIGNMENT,
          ...assignment,
        }),
      ),
    );

    return results.reduce((sum, result) => sum + result, 0);
  }

  /**
   * Subscribe to cafe-specific events
   */
  async subscribeToCafeEvents(cafeId: string): Promise<void> {
    const patterns = [`cafe:${cafeId}:*`];
    await Promise.all(patterns.map((pattern) => this.psubscribe(pattern)));
  }

  /**
   * Subscribe to counter-specific events
   */
  async subscribeToCounterEvents(counterId: string): Promise<void> {
    const patterns = [`counter:${counterId}:*`];
    await Promise.all(patterns.map((pattern) => this.psubscribe(pattern)));
  }

  /**
   * Subscribe to order-specific events
   */
  async subscribeToOrderEvents(orderId: string): Promise<void> {
    const patterns = [`order:${orderId}:*`];
    await Promise.all(patterns.map((pattern) => this.psubscribe(pattern)));
  }

  /**
   * Get cafe events observable
   */
  getCafeEvents<T = any>(cafeId: string): Observable<PubSubMessage<T>> {
    return this.getMessages().pipe(
      filter((message) => message.channel.startsWith(`cafe:${cafeId}:`) || message.pattern.startsWith(`cafe:${cafeId}:`)),
      map((message) => message as PubSubMessage<T>),
    );
  }

  /**
   * Get counter events observable
   */
  getCounterEvents<T = any>(counterId: string): Observable<PubSubMessage<T>> {
    return this.getMessages().pipe(
      filter((message) => message.channel.startsWith(`counter:${counterId}:`) || message.pattern.startsWith(`counter:${counterId}:`)),
      map((message) => message as PubSubMessage<T>),
    );
  }

  /**
   * Get order events observable
   */
  getOrderEvents<T = any>(orderId: string): Observable<PubSubMessage<T>> {
    return this.getMessages().pipe(
      filter((message) => message.channel.startsWith(`order:${orderId}:`) || message.pattern.startsWith(`order:${orderId}:`)),
      map((message) => message as PubSubMessage<T>),
    );
  }

  private setupSubscriberListeners(): void {
    // Regular message listener
    this.subscriber.on('message', (channel: string, message: string) => {
      try {
        const parsedMessage: PubSubMessage = JSON.parse(message);
        parsedMessage.pattern = '';
        this.messageSubject.next(parsedMessage);
      } catch (error) {
        this.logger.error(`Failed to parse message from channel ${channel}:`, error);
      }
    });

    // Pattern message listener
    this.subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
      try {
        const parsedMessage: PubSubMessage = JSON.parse(message);
        parsedMessage.pattern = pattern;
        this.messageSubject.next(parsedMessage);
      } catch (error) {
        this.logger.error(`Failed to parse pattern message from ${pattern}/${channel}:`, error);
      }
    });

    // Connection event listeners
    this.subscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      this.logger.error('Redis subscriber error:', error);
    });

    this.subscriber.on('close', () => {
      this.logger.warn('Redis subscriber connection closed');
    });

    this.publisher.on('connect', () => {
      this.logger.log('Redis publisher connected');
    });

    this.publisher.on('error', (error) => {
      this.logger.error('Redis publisher error:', error);
    });
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
