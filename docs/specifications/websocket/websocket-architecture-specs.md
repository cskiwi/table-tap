# WebSocket Architecture Technical Specifications

## Overview
Real-time communication architecture for table-tap cafe ordering system using @nestjs/platform-socket.io with multi-tenant support, secure authentication, and scalable event distribution.

## Architecture Stack
- **WebSocket Framework**: @nestjs/platform-socket.io with socket.io
- **Authentication**: JWT with @nestjs/jwt
- **Session Management**: Redis with ioredis
- **Message Queue**: BullMQ for background processing
- **Database**: TypeORM with PostgreSQL

## Socket.io Namespaces and Rooms Structure

### Namespace Architecture
```typescript
enum SocketNamespace {
  ORDERS = '/orders',        // Order management and updates
  KITCHEN = '/kitchen',      // Kitchen display system
  COUNTER = '/counter',      // Counter and staff operations
  CUSTOMERS = '/customers',  // Customer-facing updates
  ADMIN = '/admin',         // Admin dashboard and analytics
  PAYMENTS = '/payments'    // Payment status updates
}

interface NamespaceConfig {
  namespace: SocketNamespace;
  authentication: boolean;
  roles: UserRole[];
  rateLimiting: RateLimitConfig;
  persistence: boolean;
}
```

### Room Structure and Hierarchy
```typescript
interface RoomStructure {
  // Cafe-specific rooms
  cafeRooms: {
    pattern: `cafe:${cafeId}`;
    purpose: 'All updates for a specific cafe';
    subscribers: ['staff', 'admin', 'management'];
  };

  // Order-specific rooms
  orderRooms: {
    pattern: `order:${orderId}`;
    purpose: 'Updates for specific orders';
    subscribers: ['customer', 'staff', 'kitchen'];
  };

  // Role-based rooms
  roleRooms: {
    staff: `cafe:${cafeId}:staff`;
    kitchen: `cafe:${cafeId}:kitchen`;
    management: `cafe:${cafeId}:management`;
    customers: `cafe:${cafeId}:customers`;
  };

  // Table-specific rooms
  tableRooms: {
    pattern: `cafe:${cafeId}:table:${tableNumber}`;
    purpose: 'Table-specific communications';
    subscribers: ['customers_at_table', 'assigned_staff'];
  };

  // Device-specific rooms
  deviceRooms: {
    pattern: `device:${deviceId}`;
    purpose: 'Device-specific updates (kitchen displays, POS)';
    subscribers: ['device_handlers'];
  };
}
```

### WebSocket Gateway Implementation
```typescript
@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private orderService: OrderService,
    private logger: Logger,
  ) {}

  @SubscribeMessage('join_cafe')
  async handleJoinCafe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cafeId: string }
  ): Promise<void> {
    const user = client.data.user;
    if (!this.canAccessCafe(user, data.cafeId)) {
      throw new WsException('Unauthorized access to cafe');
    }

    await client.join(`cafe:${data.cafeId}`);
    await this.trackUserConnection(user.id, client.id, data.cafeId);
  }

  @SubscribeMessage('order_status_update')
  async handleOrderStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: OrderStatusUpdate
  ): Promise<void> {
    const user = client.data.user;
    await this.validateOrderAccess(user, data.orderId);

    const updatedOrder = await this.orderService.updateStatus(data);

    // Emit to relevant rooms
    this.server.to(`order:${data.orderId}`).emit('order_updated', updatedOrder);
    this.server.to(`cafe:${updatedOrder.cafeId}:staff`).emit('order_updated', updatedOrder);

    if (updatedOrder.status === OrderStatus.READY) {
      this.server.to(`cafe:${updatedOrder.cafeId}:customers`).emit('order_ready', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
      });
    }
  }
}
```

## Event Message Protocols

### Message Schema Definitions
```typescript
// Base message interface
interface BaseSocketMessage {
  eventId: string;          // Unique event identifier
  timestamp: number;        // Unix timestamp
  version: string;          // Protocol version
  cafeId: string;          // Cafe context
  userId?: string;         // User context
  metadata?: Record<string, any>;
}

// Order-related messages
interface OrderCreatedMessage extends BaseSocketMessage {
  type: 'order_created';
  data: {
    orderId: string;
    orderNumber: number;
    customerId?: string;
    tableNumber?: number;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    estimatedReadyTime?: Date;
  };
}

interface OrderStatusUpdateMessage extends BaseSocketMessage {
  type: 'order_status_updated';
  data: {
    orderId: string;
    orderNumber: number;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
    updatedBy: string;
    statusChangeReason?: string;
    estimatedReadyTime?: Date;
  };
}

// Kitchen-specific messages
interface KitchenOrderMessage extends BaseSocketMessage {
  type: 'kitchen_order_received' | 'kitchen_order_started' | 'kitchen_order_completed';
  data: {
    orderId: string;
    orderNumber: number;
    items: KitchenOrderItem[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    specialInstructions?: string;
    estimatedPrepTime: number; // minutes
    kitchenStationId?: string;
  };
}

// Payment-related messages
interface PaymentStatusMessage extends BaseSocketMessage {
  type: 'payment_initiated' | 'payment_completed' | 'payment_failed';
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    failureReason?: string;
  };
}

// Staff notification messages
interface StaffNotificationMessage extends BaseSocketMessage {
  type: 'staff_notification';
  data: {
    notificationId: string;
    notificationType: NotificationType;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    title: string;
    message: string;
    actionRequired?: boolean;
    actionUrl?: string;
    targetRoles?: UserRole[];
  };
}

// Customer update messages
interface CustomerUpdateMessage extends BaseSocketMessage {
  type: 'order_progress' | 'order_ready' | 'queue_position_update';
  data: {
    orderId: string;
    orderNumber: number;
    currentStatus: OrderStatus;
    progressPercentage: number;
    estimatedReadyTime?: Date;
    queuePosition?: number;
    readyForPickup?: boolean;
  };
}

// Admin analytics messages
interface AdminAnalyticsMessage extends BaseSocketMessage {
  type: 'real_time_analytics';
  data: {
    activeOrders: number;
    completedOrdersToday: number;
    averageOrderTime: number; // minutes
    kitchenLoad: number; // percentage
    revenueToday: number;
    customerSatisfaction: number;
    staffOnDuty: number;
  };
}
```

### Message Validation Schema
```typescript
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseSocketMessageDto {
  @IsString()
  eventId: string;

  @IsNumber()
  timestamp: number;

  @IsString()
  version: string;

  @IsString()
  cafeId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class OrderStatusUpdateDto extends BaseSocketMessageDto {
  @IsEnum(['order_status_updated'])
  type: 'order_status_updated';

  @ValidateNested()
  @Type(() => OrderStatusUpdateDataDto)
  data: OrderStatusUpdateDataDto;
}

class OrderStatusUpdateDataDto {
  @IsString()
  orderId: string;

  @IsNumber()
  orderNumber: number;

  @IsEnum(OrderStatus)
  previousStatus: OrderStatus;

  @IsEnum(OrderStatus)
  newStatus: OrderStatus;

  @IsString()
  updatedBy: string;

  @IsOptional()
  @IsString()
  statusChangeReason?: string;
}
```

## Authentication for WebSocket Connections

### JWT Authentication Middleware
```typescript
@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new WsException('Authentication token required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new WsException('Token is invalid');
      }

      // Attach user data to client
      client.data.user = payload;
      client.data.token = token;

      // Update connection tracking
      await this.trackConnection(client.id, payload.sub, payload.cafeId);

      return true;
    } catch (error) {
      throw new WsException('Invalid authentication token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Check authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    const tokenQuery = client.handshake.query.token;
    if (typeof tokenQuery === 'string') {
      return tokenQuery;
    }

    // Check auth object (socket.io client can send auth object)
    return client.handshake.auth?.token || null;
  }
}
```

### Connection Tracking with Redis
```typescript
@Injectable()
export class ConnectionTrackingService {
  constructor(private redisService: RedisService) {}

  async trackConnection(
    socketId: string,
    userId: string,
    cafeId: string,
    roles: UserRole[]
  ): Promise<void> {
    const connectionData = {
      socketId,
      userId,
      cafeId,
      roles,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
    };

    // Store connection data
    await this.redisService.setex(
      `connection:${socketId}`,
      3600, // 1 hour TTL
      JSON.stringify(connectionData)
    );

    // Add to user's active connections
    await this.redisService.sadd(`user:${userId}:connections`, socketId);

    // Add to cafe's active connections
    await this.redisService.sadd(`cafe:${cafeId}:connections`, socketId);

    // Track by role
    for (const role of roles) {
      await this.redisService.sadd(`cafe:${cafeId}:role:${role}:connections`, socketId);
    }
  }

  async removeConnection(socketId: string): Promise<void> {
    const connectionData = await this.getConnection(socketId);
    if (!connectionData) return;

    // Remove from all tracking sets
    await Promise.all([
      this.redisService.srem(`user:${connectionData.userId}:connections`, socketId),
      this.redisService.srem(`cafe:${connectionData.cafeId}:connections`, socketId),
      ...connectionData.roles.map(role =>
        this.redisService.srem(`cafe:${connectionData.cafeId}:role:${role}:connections`, socketId)
      ),
      this.redisService.del(`connection:${socketId}`)
    ]);
  }

  async getActiveConnections(cafeId: string, role?: UserRole): Promise<string[]> {
    const key = role
      ? `cafe:${cafeId}:role:${role}:connections`
      : `cafe:${cafeId}:connections`;

    return this.redisService.smembers(key);
  }
}
```

## Error Handling and Reconnection Logic

### Error Types and Handling
```typescript
enum WebSocketErrorType {
  AUTHENTICATION_FAILED = 'authentication_failed',
  AUTHORIZATION_DENIED = 'authorization_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_MESSAGE_FORMAT = 'invalid_message_format',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  SERVER_ERROR = 'server_error',
  CONNECTION_LOST = 'connection_lost',
  TIMEOUT = 'timeout'
}

interface WebSocketError {
  type: WebSocketErrorType;
  code: string;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  retryAfter?: number; // seconds
}

@Catch()
export class WebSocketExceptionFilter implements BaseWsExceptionFilter {
  constructor(private logger: Logger) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    let error: WebSocketError;

    if (exception instanceof WsException) {
      error = this.handleWsException(exception);
    } else if (exception instanceof ValidationError) {
      error = this.handleValidationError(exception);
    } else {
      error = this.handleUnknownError(exception);
    }

    // Log error
    this.logger.error('WebSocket error occurred', {
      error,
      socketId: client.id,
      userId: client.data?.user?.id,
      cafeId: client.data?.user?.cafeId,
    });

    // Send error to client
    client.emit('error', error);

    // Disconnect client if error is not recoverable
    if (!error.recoverable) {
      client.disconnect();
    }
  }
}
```

### Client-Side Reconnection Strategy
```typescript
// Client-side reconnection configuration
interface ReconnectionConfig {
  maxReconnectionAttempts: number;
  reconnectionDelay: number; // Initial delay in ms
  reconnectionDelayMax: number; // Max delay in ms
  randomizationFactor: number; // 0-1, adds randomness to delay
  backoffMultiplier: number; // Multiplier for exponential backoff
  heartbeatInterval: number; // Ping interval in ms
  heartbeatTimeout: number; // Pong timeout in ms
}

const defaultReconnectionConfig: ReconnectionConfig = {
  maxReconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  backoffMultiplier: 1.5,
  heartbeatInterval: 25000,
  heartbeatTimeout: 20000,
};

// Client-side implementation example
class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectionAttempts = 0;
  private reconnectionTimer: NodeJS.Timeout | null = null;

  connect(token: string): void {
    this.socket = io('/orders', {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      ...defaultReconnectionConfig,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectionAttempts = 0;
      this.onConnected();
    });

    this.socket.on('disconnect', (reason) => {
      this.onDisconnected(reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      this.scheduleReconnection();
    });

    this.socket.on('error', (error: WebSocketError) => {
      this.onError(error);
      if (!error.recoverable) {
        this.socket?.disconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.onConnectionError(error);
      this.scheduleReconnection();
    });
  }

  private scheduleReconnection(): void {
    if (this.reconnectionAttempts >= defaultReconnectionConfig.maxReconnectionAttempts) {
      this.onMaxReconnectionAttemptsReached();
      return;
    }

    const delay = this.calculateReconnectionDelay();
    this.reconnectionTimer = setTimeout(() => {
      this.reconnectionAttempts++;
      this.connect(this.currentToken);
    }, delay);
  }

  private calculateReconnectionDelay(): number {
    const { reconnectionDelay, reconnectionDelayMax, backoffMultiplier, randomizationFactor } =
      defaultReconnectionConfig;

    const baseDelay = Math.min(
      reconnectionDelayMax,
      reconnectionDelay * Math.pow(backoffMultiplier, this.reconnectionAttempts)
    );

    // Add randomization to prevent thundering herd
    const randomization = baseDelay * randomizationFactor * Math.random();
    return baseDelay + randomization;
  }
}
```

## Rate Limiting and Security Measures

### Rate Limiting Configuration
```typescript
interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (client: Socket) => string;
  onLimitReached?: (client: Socket) => void;
}

const rateLimitConfigs: Record<SocketNamespace, RateLimitConfig> = {
  [SocketNamespace.ORDERS]: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  [SocketNamespace.KITCHEN]: {
    windowMs: 60000,
    maxRequests: 200, // Kitchen staff may need higher limits
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  [SocketNamespace.CUSTOMERS]: {
    windowMs: 60000,
    maxRequests: 50, // Lower limit for customers
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false,
  },
};

@Injectable()
export class WebSocketRateLimiter {
  constructor(private redisService: RedisService) {}

  async checkRateLimit(
    client: Socket,
    namespace: SocketNamespace
  ): Promise<boolean> {
    const config = rateLimitConfigs[namespace];
    const key = this.generateKey(client, namespace);

    const current = await this.redisService.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= config.maxRequests) {
      config.onLimitReached?.(client);
      return false;
    }

    // Increment counter
    const pipeline = this.redisService.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    await pipeline.exec();

    return true;
  }

  private generateKey(client: Socket, namespace: SocketNamespace): string {
    const userId = client.data.user?.id;
    const ip = client.handshake.address;
    return `rate_limit:${namespace}:${userId || ip}`;
  }
}
```

### Security Middleware
```typescript
@Injectable()
export class WebSocketSecurityService {
  constructor(
    private rateLimiter: WebSocketRateLimiter,
    private connectionTracking: ConnectionTrackingService,
    private auditService: AuditService,
  ) {}

  async validateConnection(client: Socket): Promise<boolean> {
    // 1. Rate limiting check
    if (!await this.rateLimiter.checkRateLimit(client, SocketNamespace.ORDERS)) {
      this.auditService.logSecurityEvent({
        type: 'rate_limit_exceeded',
        clientId: client.id,
        userId: client.data.user?.id,
        ip: client.handshake.address,
      });
      return false;
    }

    // 2. Check for suspicious patterns
    if (await this.detectSuspiciousActivity(client)) {
      this.auditService.logSecurityEvent({
        type: 'suspicious_activity',
        clientId: client.id,
        userId: client.data.user?.id,
        ip: client.handshake.address,
      });
      return false;
    }

    // 3. Check concurrent connection limits
    const userConnections = await this.connectionTracking.getUserConnections(
      client.data.user.id
    );
    if (userConnections.length > 5) { // Max 5 concurrent connections per user
      this.auditService.logSecurityEvent({
        type: 'max_connections_exceeded',
        clientId: client.id,
        userId: client.data.user?.id,
        connectionCount: userConnections.length,
      });
      return false;
    }

    return true;
  }

  private async detectSuspiciousActivity(client: Socket): Promise<boolean> {
    const userId = client.data.user?.id;
    const ip = client.handshake.address;

    // Check for rapid reconnections from same IP
    const recentConnections = await this.redisService.get(
      `recent_connections:${ip}`
    );
    if (recentConnections && parseInt(recentConnections) > 10) {
      return true;
    }

    // Track connection
    await this.redisService.setex(`recent_connections:${ip}`, 300, '1');

    return false;
  }
}
```

## Multi-tenant Support

### Cafe-Specific Channel Management
```typescript
@Injectable()
export class MultiTenantWebSocketService {
  constructor(
    private server: Server,
    private connectionTracking: ConnectionTrackingService,
    private cafeService: CafeService,
  ) {}

  async broadcastToCafe(
    cafeId: string,
    event: string,
    data: any,
    options?: {
      excludeRoles?: UserRole[];
      includeRoles?: UserRole[];
      excludeUsers?: string[];
    }
  ): Promise<void> {
    let targetRoom = `cafe:${cafeId}`;

    if (options?.includeRoles && options.includeRoles.length > 0) {
      // Broadcast to specific roles only
      for (const role of options.includeRoles) {
        this.server.to(`cafe:${cafeId}:role:${role}`).emit(event, data);
      }
      return;
    }

    if (options?.excludeRoles && options.excludeRoles.length > 0) {
      // Get all connections and filter out excluded roles
      const allConnections = await this.connectionTracking.getActiveConnections(cafeId);
      const filteredConnections = await this.filterConnectionsByRole(
        allConnections,
        options.excludeRoles,
        'exclude'
      );

      for (const socketId of filteredConnections) {
        this.server.to(socketId).emit(event, data);
      }
      return;
    }

    // Broadcast to entire cafe
    this.server.to(targetRoom).emit(event, data);
  }

  async validateCafeAccess(userId: string, cafeId: string): Promise<boolean> {
    const userCafes = await this.cafeService.getUserCafes(userId);
    return userCafes.some(cafe => cafe.id === cafeId);
  }

  private async filterConnectionsByRole(
    connections: string[],
    roles: UserRole[],
    filterType: 'include' | 'exclude'
  ): Promise<string[]> {
    const filtered: string[] = [];

    for (const socketId of connections) {
      const connectionData = await this.connectionTracking.getConnection(socketId);
      if (!connectionData) continue;

      const hasRole = connectionData.roles.some(role => roles.includes(role));

      if (filterType === 'include' && hasRole) {
        filtered.push(socketId);
      } else if (filterType === 'exclude' && !hasRole) {
        filtered.push(socketId);
      }
    }

    return filtered;
  }
}
```

This WebSocket architecture specification provides a comprehensive foundation for real-time communication in the table-tap system, with robust security, multi-tenancy, and scalability considerations built in.