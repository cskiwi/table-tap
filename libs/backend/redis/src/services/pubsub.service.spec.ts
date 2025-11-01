import { Test, TestingModule } from '@nestjs/testing';
import { RedisPubSubService } from './pubsub.service';
import { REDIS_PUBSUB_TOKEN, REDIS_SUBSCRIBER_TOKEN } from '../config';
import { RedisEventType } from '../interfaces';

describe('RedisPubSubService', () => {
  let service: RedisPubSubService;
  let mockPublisher: any;
  let mockSubscriber: any;

  beforeEach(async () => {
    mockPublisher = {
      publish: jest.fn(),
      disconnect: jest.fn(),
    };

    mockSubscriber = {
      subscribe: jest.fn(),
      psubscribe: jest.fn(),
      unsubscribe: jest.fn(),
      punsubscribe: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisPubSubService,
        {
          provide: REDIS_PUBSUB_TOKEN,
          useValue: mockPublisher,
        },
        {
          provide: REDIS_SUBSCRIBER_TOKEN,
          useValue: mockSubscriber,
        },
      ],
    }).compile();

    service = module.get<RedisPubSubService>(RedisPubSubService);
  });

  describe('publish', () => {
    it('should publish message to channel', async () => {
      const channel = 'test-channel';
      const data = { test: 'data' };
      mockPublisher.publish.mockResolvedValue(1);

      const result = await service.publish(channel, data);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        channel,
        expect.stringContaining('"test":"data"')
      );
      expect(result).toBe(1);
    });

    it('should include timestamp and messageId in published message', async () => {
      const channel = 'test-channel';
      const data = { test: 'data' };
      const messageId = 'custom-id';
      mockPublisher.publish.mockResolvedValue(1);

      await service.publish(channel, data, messageId);

      const publishCall = mockPublisher.publish.mock.calls[0];
      const publishedMessage = JSON.parse(publishCall[1]);

      expect(publishedMessage).toMatchObject({
        channel,
        data,
        messageId,
        pattern: '',
      });
      expect(publishedMessage.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to channel', async () => {
      const channel = 'test-channel';

      await service.subscribe(channel);

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(channel);
    });

    it('should not subscribe to same channel twice', async () => {
      const channel = 'test-channel';

      await service.subscribe(channel);
      await service.subscribe(channel);

      expect(mockSubscriber.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('psubscribe', () => {
    it('should subscribe to pattern', async () => {
      const pattern = 'cafe:*:orders';

      await service.psubscribe(pattern);

      expect(mockSubscriber.psubscribe).toHaveBeenCalledWith(pattern);
    });
  });

  describe('restaurant-specific methods', () => {
    it('should publish order created event', async () => {
      const orderEvent = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        cafeId: 'cafe-123',
        customerId: 'user-123',
      };
      mockPublisher.publish.mockResolvedValue(1);

      const result = await service.publishOrderCreated(orderEvent);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'cafe:cafe-123:orders',
        expect.stringContaining(RedisEventType.ORDER_CREATED)
      );
      expect(result).toBe(1);
    });

    it('should publish order status updated event', async () => {
      const orderEvent = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        cafeId: 'cafe-123',
        customerId: 'user-123',
        status: 'PREPARING',
      };
      mockPublisher.publish.mockResolvedValue(2);

      const result = await service.publishOrderStatusUpdated(orderEvent);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(2); // Two channels
      expect(result).toBe(2);
    });

    it('should publish kitchen notification', async () => {
      const notification = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        cafeId: 'cafe-123',
        counterId: 'counter-1',
        items: [
          {
            menuItemId: 'item-1',
            name: 'Coffee',
            quantity: 2,
            customizations: ['extra-shot'],
          },
        ],
        priority: 'normal' as const,
      };
      mockPublisher.publish.mockResolvedValue(2);

      const result = await service.publishKitchenNotification(notification);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(2); // Kitchen and counter channels
      expect(result).toBe(2);
    });

    it('should publish counter assignment', async () => {
      const assignment = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        counterId: 'counter-1',
        counterName: 'Counter 1',
        cafeId: 'cafe-123',
        assignedBy: 'user-123',
        assignedAt: new Date(),
      };
      mockPublisher.publish.mockResolvedValue(3);

      const result = await service.publishCounterAssignment(assignment);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(3); // Three channels
      expect(result).toBe(3);
    });
  });

  describe('subscription helpers', () => {
    it('should subscribe to cafe events', async () => {
      const cafeId = 'cafe-123';

      await service.subscribeToCafeEvents(cafeId);

      expect(mockSubscriber.psubscribe).toHaveBeenCalledWith('cafe:cafe-123:*');
    });

    it('should subscribe to counter events', async () => {
      const counterId = 'counter-1';

      await service.subscribeToCounterEvents(counterId);

      expect(mockSubscriber.psubscribe).toHaveBeenCalledWith('counter:counter-1:*');
    });

    it('should subscribe to order events', async () => {
      const orderId = 'order-123';

      await service.subscribeToOrderEvents(orderId);

      expect(mockSubscriber.psubscribe).toHaveBeenCalledWith('order:order-123:*');
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from channel', async () => {
      const channel = 'test-channel';

      await service.unsubscribe(channel);

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith(channel);
    });

    it('should unsubscribe from pattern', async () => {
      const pattern = 'cafe:*:orders';

      await service.punsubscribe(pattern);

      expect(mockSubscriber.punsubscribe).toHaveBeenCalledWith(pattern);
    });
  });

  describe('cleanup', () => {
    it('should disconnect on module destroy', () => {
      service.onModuleDestroy();

      expect(mockPublisher.disconnect).toHaveBeenCalled();
      expect(mockSubscriber.disconnect).toHaveBeenCalled();
    });
  });
});