# Redis Infrastructure for TableTap

A comprehensive Redis infrastructure library for TableTap restaurant operations, providing caching, pub/sub messaging, session management, and health monitoring with horizontal scaling support.

## Features

- **Redis Clustering**: Automatic clustering support for high availability
- **PubSub Messaging**: Real-time order updates and kitchen notifications
- **Caching**: Menu items, cafe info, and inventory caching with TTL
- **Session Management**: Employee authentication and session storage
- **Health Monitoring**: Comprehensive health checks for monitoring
- **Decorators**: Easy-to-use caching decorators for methods
- **TypeScript**: Full TypeScript support with type safety

## Installation

```bash
npm install ioredis @nestjs/common @nestjs/config @nestjs/terminus
```

## Configuration

### Environment Variables

```env
# Basic Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_URL=redis://localhost:6379  # Alternative to individual settings

# Clustering
REDIS_CLUSTER_ENABLED=true
REDIS_CLUSTER_NODES=host1:6379,host2:6379,host3:6379

# Cache Settings
REDIS_CACHE_TTL=3600  # Default cache TTL in seconds
REDIS_CACHE_PREFIX=tabletap:cache:

# Session Settings
REDIS_SESSION_TTL=86400  # Session TTL in seconds
REDIS_SESSION_PREFIX=tabletap:session:
```

### Module Registration

```typescript
import { RedisModule } from '@app/backend-redis';

@Module({
  imports: [
    // Basic registration
    RedisModule.forRoot(),

    // Or with async configuration
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
        cluster: {
          enabled: configService.get('REDIS_CLUSTER_ENABLED', false),
          nodes: [
            { host: 'redis-1', port: 6379 },
            { host: 'redis-2', port: 6379 },
            { host: 'redis-3', port: 6379 },
          ],
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Usage

### Caching Service

```typescript
import { RedisCacheService } from '@app/backend-redis';

@Injectable()
export class MenuService {
  constructor(private readonly cache: RedisCacheService) {}

  async getMenuItems(cafeId: string) {
    // Try cache first
    const cached = await this.cache.getCachedMenuItems(cafeId);
    if (cached) return cached;

    // Fetch from database
    const menuItems = await this.menuRepository.find({ cafeId });

    // Cache for 1 hour
    await this.cache.cacheMenuItems(cafeId, menuItems, 3600);

    return menuItems;
  }

  async updateMenuItem(cafeId: string, item: MenuItem) {
    const updated = await this.menuRepository.save(item);

    // Invalidate cache
    await this.cache.invalidateCafeCache(cafeId);

    return updated;
  }
}
```

### Cache Decorators

```typescript
import { Cacheable, CacheEvict, CacheCafeContext } from '@app/backend-redis';

@Injectable()
export class CafeService {
  constructor(private readonly cacheService: RedisCacheService) {}

  @Cacheable('cafe-info', 7200, 'restaurant') // Cache for 2 hours
  async getCafeInfo(cafeId: string) {
    return this.cafeRepository.findOne({ where: { id: cafeId } });
  }

  @CacheCafeContext((cafeId) => `inventory-${cafeId}`, 1800) // 30 minutes
  async getInventoryLevels(cafeId: string) {
    return this.inventoryRepository.find({ where: { cafeId } });
  }

  @CacheEvict('cafe-info', 'restaurant')
  async updateCafeInfo(cafeId: string, updates: Partial<Cafe>) {
    return this.cafeRepository.update(cafeId, updates);
  }
}
```

### PubSub Messaging

```typescript
import { RedisPubSubService } from '@app/backend-redis';

@Injectable()
export class OrderService {
  constructor(private readonly pubsub: RedisPubSubService) {}

  async createOrder(orderData: CreateOrderInput): Promise<Order> {
    const order = await this.orderRepository.save(orderData);

    // Publish order created event
    await this.pubsub.publishOrderCreated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      cafeId: order.cafeId,
      customerId: order.customerId,
    });

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.update(orderId, { status });

    // Publish status update
    await this.pubsub.publishOrderStatusUpdated({
      orderId,
      orderNumber: order.orderNumber,
      cafeId: order.cafeId,
      customerId: order.customerId,
      status,
    });

    return order;
  }
}
```

### Real-time Subscriptions

```typescript
import { RedisPubSubService } from '@app/backend-redis';

@Resolver()
export class OrderResolver {
  constructor(private readonly pubsub: RedisPubSubService) {}

  @Subscription(() => OrderUpdate)
  async orderUpdates(@Args('cafeId') cafeId: string) {
    // Subscribe to cafe events
    await this.pubsub.subscribeToCafeEvents(cafeId);

    // Return observable for GraphQL subscriptions
    return this.pubsub.getCafeEvents(cafeId).pipe(
      map(message => message.data)
    );
  }

  @Subscription(() => KitchenNotification)
  async kitchenNotifications(@Args('counterId') counterId: string) {
    await this.pubsub.subscribeToCounterEvents(counterId);

    return this.pubsub.getCounterEvents(counterId).pipe(
      filter(message => message.data.type === 'KITCHEN_NOTIFICATION'),
      map(message => message.data)
    );
  }
}
```

### Session Management

```typescript
import { RedisSessionService } from '@app/backend-redis';

@Injectable()
export class AuthService {
  constructor(private readonly session: RedisSessionService) {}

  async login(credentials: LoginInput): Promise<{ token: string; user: User }> {
    const user = await this.validateCredentials(credentials);
    const sessionId = this.generateSessionId();

    // Create session
    await this.session.createSession(sessionId, {
      userId: user.id,
      cafeId: user.defaultCafeId,
      role: user.role,
      permissions: user.permissions,
      lastActivity: new Date(),
    }, {
      ttl: 86400, // 24 hours
      slidingExpiration: true,
    });

    const token = this.jwtService.sign({ sessionId, userId: user.id });
    return { token, user };
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    return this.session.getSession(sessionId);
  }

  async logout(sessionId: string): Promise<void> {
    await this.session.deleteSession(sessionId);
  }
}
```

### Health Monitoring

```typescript
import { RedisHealthIndicator } from '@app/backend-redis';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.redis.checkRedisHealth('redis'),
      () => this.redis.checkMemoryUsage('redis-memory', 1000), // 1GB limit
      () => this.redis.checkPerformance('redis-performance'),
    ]);
  }
}
```

## Event Types

The library provides predefined event types for restaurant operations:

```typescript
enum RedisEventType {
  ORDER_CREATED = 'order:created',
  ORDER_STATUS_UPDATED = 'order:status_updated',
  ORDER_ASSIGNED = 'order:assigned',
  KITCHEN_NOTIFICATION = 'kitchen:notification',
  COUNTER_ASSIGNMENT = 'counter:assignment',
  INVENTORY_UPDATED = 'inventory:updated',
  CAFE_STATUS_CHANGED = 'cafe:status_changed',
  EMPLOYEE_LOGIN = 'employee:login',
  EMPLOYEE_LOGOUT = 'employee:logout',
  SYSTEM_ALERT = 'system:alert'
}
```

## Channel Patterns

- **Cafe Events**: `cafe:{cafeId}:*`
- **Order Events**: `order:{orderId}:*`
- **Counter Events**: `counter:{counterId}:*`
- **Kitchen Events**: `cafe:{cafeId}:kitchen`
- **System Events**: `system:*`

## Best Practices

1. **Connection Pooling**: The module automatically handles connection pooling
2. **Error Handling**: All operations include proper error handling and logging
3. **TTL Management**: Set appropriate TTL values based on data volatility
4. **Cache Invalidation**: Implement proper cache invalidation strategies
5. **Memory Monitoring**: Monitor Redis memory usage in production
6. **Clustering**: Use clustering for high availability in production

## Performance Considerations

- **Clustering**: Enables horizontal scaling across multiple Redis nodes
- **Connection Pooling**: Reduces connection overhead
- **Serialization**: Uses JSON for complex objects, consider MessagePack for binary data
- **TTL Strategy**: Shorter TTL for frequently changing data, longer for static data
- **Batch Operations**: Use `mget` and `mdel` for multiple operations

## Monitoring

The library includes comprehensive health checks:

- Connection health
- Memory usage monitoring
- Performance metrics
- Cluster status (if applicable)
- PubSub connectivity

Monitor these metrics in your production environment for optimal performance.