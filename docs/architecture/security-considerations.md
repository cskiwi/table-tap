# Security Considerations & Implementation

## Security Architecture Overview

The Table Tap system implements defense-in-depth security principles across all layers of the application, from client-side protection to database security.

## Authentication & Authorization

### JWT Token Strategy
```javascript
// Token Structure
{
  "iss": "table-tap-api",
  "sub": "user_uuid",
  "aud": "table-tap-clients",
  "exp": 1640995200,
  "iat": 1640991600,
  "cafe_id": "cafe_uuid",
  "roles": ["employee", "manager"],
  "permissions": ["view_orders", "create_orders", "update_inventory"],
  "session_id": "session_uuid",
  "device_id": "device_fingerprint"
}

// Refresh Token (stored separately, httpOnly cookie)
{
  "type": "refresh",
  "user_id": "user_uuid",
  "session_id": "session_uuid",
  "exp": 1643587200, // 30 days
  "revoked": false
}
```

### Implementation
```typescript
// JWT Service
@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days

  async login(email: string, password: string, cafeSlug: string) {
    // Validate credentials with rate limiting
    await this.rateLimitCheck(email);

    // Verify password with bcrypt
    const user = await this.validateCredentials(email, password, cafeSlug);

    // Generate device fingerprint
    const deviceFingerprint = this.generateDeviceFingerprint(request);

    // Create session
    const session = await this.createSession(user.id, deviceFingerprint);

    // Generate tokens
    const accessToken = this.generateAccessToken(user, session);
    const refreshToken = this.generateRefreshToken(user, session);

    // Store refresh token securely
    await this.storeRefreshToken(refreshToken, session.id);

    return { accessToken, refreshToken, user };
  }

  private generateDeviceFingerprint(request: Request): string {
    return crypto.createHash('sha256')
      .update(request.get('User-Agent') + request.ip)
      .digest('hex');
  }
}
```

### Role-Based Access Control (RBAC)
```sql
-- Permissions matrix
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

-- Role permissions
CREATE TABLE role_permissions (
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id),
    cafe_id UUID NOT NULL REFERENCES cafes(id),
    PRIMARY KEY (role, permission_id, cafe_id)
);

-- User role assignments
CREATE TABLE user_role_assignments (
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    cafe_id UUID NOT NULL REFERENCES cafes(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (user_id, role, cafe_id)
);
```

### Permission Middleware
```typescript
// Permission checking decorator
export function RequirePermissions(...permissions: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0];
      const user = request.user;

      for (const permission of permissions) {
        if (!user.permissions.includes(permission)) {
          throw new ForbiddenException(`Missing permission: ${permission}`);
        }
      }

      return method.apply(this, args);
    };
  };
}

// Usage
@RequirePermissions('view_orders', 'create_orders')
async createOrder(@Body() orderData: CreateOrderDto) {
  return this.orderService.createOrder(orderData);
}
```

## Data Protection

### Encryption at Rest
```yaml
# PostgreSQL encryption configuration
# postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
ssl_ca_file = '/path/to/ca.crt'

# Transparent Data Encryption (TDE) for sensitive columns
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_encrypted BYTEA, -- Encrypted with AES-256
    ssn_encrypted BYTEA,   -- If storing sensitive employee data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Field-Level Encryption
```typescript
// Encryption service for sensitive data
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;

  async encrypt(data: string, userKey?: string): Promise<string> {
    const key = userKey || process.env.ENCRYPTION_KEY;
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const derivedKey = crypto.pbkdf2Sync(key, salt, this.keyDerivationIterations, 32, 'sha256');

    const cipher = crypto.createCipher(this.algorithm, derivedKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return Buffer.from(
      JSON.stringify({
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      })
    ).toString('base64');
  }

  async decrypt(encryptedData: string, userKey?: string): Promise<string> {
    const key = userKey || process.env.ENCRYPTION_KEY;
    const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));

    const derivedKey = crypto.pbkdf2Sync(
      key,
      Buffer.from(data.salt, 'hex'),
      this.keyDerivationIterations,
      32,
      'sha256'
    );

    const decipher = crypto.createDecipher(
      this.algorithm,
      derivedKey,
      Buffer.from(data.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### PCI DSS Compliance for Payment Data

#### Payment Data Isolation
```typescript
// Separate service for payment processing
@Injectable()
export class PaymentService {
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    // Never store card data - tokenize immediately
    const tokenizedCard = await this.tokenizeCard(paymentRequest.cardData);

    // Use payment processor's vault
    const paymentResult = await this.paymentGateway.charge({
      token: tokenizedCard.token,
      amount: paymentRequest.amount,
      metadata: {
        order_id: paymentRequest.orderId,
        cafe_id: paymentRequest.cafeId
      }
    });

    // Only store transaction reference
    await this.storeTransactionReference(paymentResult);

    return paymentResult;
  }

  private async tokenizeCard(cardData: CardData): Promise<TokenizedCard> {
    // Immediate tokenization - card data never persisted
    return this.paymentGateway.tokenize(cardData);
  }
}
```

#### PCI DSS Environment Segmentation
```yaml
# Docker Compose - Isolated payment service
version: '3.8'
services:
  payment-service:
    image: table-tap/payment-service
    networks:
      - pci_network
    environment:
      - NODE_ENV=production
      - PCI_COMPLIANT_MODE=true
    volumes:
      - /secure/certs:/app/certs:ro

networks:
  pci_network:
    driver: bridge
    internal: true
```

## Input Validation & Sanitization

### Request Validation
```typescript
// DTO with validation
export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  cafe_id: string;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer_info: CustomerInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Matches(/^[a-zA-Z0-9\s\-.,!?]*$/) // Allow only safe characters
  notes?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  @Max(1000)
  tip_amount?: number;
}

export class CustomerInfoDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z\s'-]+$/)
  name: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Length(0, 255)
  email?: string;
}
```

### SQL Injection Prevention
```typescript
// Using parameterized queries with TypeORM
@Injectable()
export class OrderRepository {
  async findOrdersByStatus(cafeId: string, status: string): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.cafe_id = :cafeId AND order.status = :status', {
        cafeId,
        status
      })
      .getMany();
  }

  async searchOrders(cafeId: string, searchTerm: string): Promise<Order[]> {
    // Sanitize search term
    const sanitizedTerm = searchTerm.replace(/[^a-zA-Z0-9\s]/g, '');

    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.cafe_id = :cafeId', { cafeId })
      .andWhere(
        '(order.order_number ILIKE :searchTerm OR order.customer_name ILIKE :searchTerm)',
        { searchTerm: `%${sanitizedTerm}%` }
      )
      .getMany();
  }
}
```

## API Security

### Rate Limiting
```typescript
// Rate limiting with Redis
@Injectable()
export class RateLimitService {
  private readonly redisClient: Redis;

  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await this.redisClient.incr(key);

    if (current === 1) {
      await this.redisClient.expire(key, window);
    }

    return current <= limit;
  }
}

// Rate limiting decorator
export function RateLimit(limit: number, window: number, keyGenerator?: Function) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0];
      const key = keyGenerator
        ? keyGenerator(request)
        : `rate_limit:${request.ip}:${propertyName}`;

      const rateLimitService = this.rateLimitService;
      const allowed = await rateLimitService.checkRateLimit(key, limit, window);

      if (!allowed) {
        throw new TooManyRequestsException('Rate limit exceeded');
      }

      return method.apply(this, args);
    };
  };
}

// Usage
@RateLimit(100, 3600) // 100 requests per hour
async getOrders(@Req() request: Request) {
  return this.orderService.getOrders();
}

@RateLimit(5, 900, (req) => `login:${req.body.email}`) // 5 login attempts per 15 minutes per email
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### CORS Configuration
```typescript
// CORS setup with specific origins
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.tabletap.com',
      'https://admin.tabletap.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:4200' : null
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Content Security Policy
```typescript
// CSP middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.tabletap.com wss://api.tabletap.com; " +
    "frame-src https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  next();
});
```

## WebSocket Security

### Authentication & Authorization
```typescript
// WebSocket authentication middleware
export class WsAuthMiddleware implements WsMiddleware {
  async use(client: Socket, next: Function) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check if user has access to the requested cafe
      const cafeId = client.handshake.query?.cafe_id;
      if (!this.hasAccessToCafe(user, cafeId)) {
        throw new ForbiddenException('No access to cafe');
      }

      client.data.user = user;
      client.data.cafe_id = cafeId;
      next();
    } catch (error) {
      next(error);
    }
  }
}

// WebSocket event authorization
@WebSocketGateway(3001, {
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/orders'
})
export class OrderGateway {
  @SubscribeMessage('update_order_status')
  @RequireWsPermissions('update_orders')
  async handleUpdateOrderStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdateOrderStatusDto
  ) {
    // Verify user can update this specific order
    const order = await this.orderService.findById(data.order_id);

    if (order.cafe_id !== client.data.cafe_id) {
      throw new ForbiddenException('Cannot update orders from different cafe');
    }

    return this.orderService.updateStatus(data.order_id, data.status);
  }
}
```

## Audit Logging

### Audit Trail Implementation
```sql
-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- What
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,

    -- When
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Where
    cafe_id UUID REFERENCES cafes(id),
    ip_address INET,
    user_agent TEXT,

    -- Details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',

    -- System
    request_id UUID,
    session_id UUID
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX idx_audit_logs_cafe_timestamp ON audit_logs(cafe_id, timestamp);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp);
```

### Audit Service
```typescript
@Injectable()
export class AuditService {
  async logAction(
    action: string,
    resourceType: string,
    resourceId: string,
    user: User,
    request: Request,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    const auditLog = {
      user_id: user.id,
      user_email: user.email,
      user_role: user.roles[0], // Primary role
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      cafe_id: user.cafe_id,
      ip_address: this.getClientIp(request),
      user_agent: request.get('User-Agent'),
      old_values: oldValues,
      new_values: newValues,
      metadata: metadata || {},
      request_id: request.id,
      session_id: user.session_id
    };

    await this.auditRepository.save(auditLog);
  }

  private getClientIp(request: Request): string {
    return request.get('X-Forwarded-For') ||
           request.get('X-Real-IP') ||
           request.connection.remoteAddress;
  }
}

// Audit decorator
export function Audit(resourceType: string, action?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0];
      const auditAction = action || propertyName;

      // Execute original method
      const result = await method.apply(this, args);

      // Log the action
      await this.auditService.logAction(
        auditAction,
        resourceType,
        result?.id || 'unknown',
        request.user,
        request,
        null,
        result
      );

      return result;
    };
  };
}
```

## Security Monitoring

### Intrusion Detection
```typescript
// Security monitoring service
@Injectable()
export class SecurityMonitoringService {
  private readonly suspiciousActivityThresholds = {
    failedLogins: 5,
    rapidRequests: 100,
    unusualIpChanges: 3
  };

  async detectAnomalies(user: User, request: Request): Promise<void> {
    const checks = [
      this.checkFailedLogins(user),
      this.checkRapidRequests(user, request),
      this.checkUnusualLocation(user, request),
      this.checkDeviceFingerprint(user, request)
    ];

    const results = await Promise.all(checks);
    const suspiciousActivities = results.filter(result => result.suspicious);

    if (suspiciousActivities.length > 0) {
      await this.handleSuspiciousActivity(user, request, suspiciousActivities);
    }
  }

  private async checkFailedLogins(user: User): Promise<SecurityCheck> {
    const failedAttempts = await this.getFailedLoginAttempts(user.email, 3600); // Last hour

    return {
      type: 'failed_logins',
      suspicious: failedAttempts >= this.suspiciousActivityThresholds.failedLogins,
      details: { attempts: failedAttempts }
    };
  }

  private async handleSuspiciousActivity(
    user: User,
    request: Request,
    activities: SecurityCheck[]
  ): Promise<void> {
    // Log security event
    await this.securityLogService.logSecurityEvent({
      user_id: user.id,
      event_type: 'suspicious_activity',
      details: activities,
      ip_address: request.ip,
      timestamp: new Date()
    });

    // Send alert to administrators
    await this.alertService.sendSecurityAlert({
      user: user,
      activities: activities,
      severity: this.calculateSeverity(activities)
    });

    // Take automated action if necessary
    if (this.shouldLockAccount(activities)) {
      await this.userService.lockAccount(user.id, 'Suspicious activity detected');
    }
  }
}
```

## Data Privacy & GDPR Compliance

### Data Anonymization
```typescript
@Injectable()
export class DataPrivacyService {
  async anonymizeUser(userId: string): Promise<void> {
    // Replace personal data with anonymized values
    await this.userRepository.update(userId, {
      first_name: 'Anonymous',
      last_name: 'User',
      email: `anon_${uuid()}@anonymized.local`,
      phone: null,
      avatar_url: null,
      deleted_at: new Date()
    });

    // Anonymize order data but preserve business analytics
    await this.orderRepository
      .createQueryBuilder()
      .update()
      .set({
        customer_name: 'Anonymous Customer',
        customer_phone: null,
        customer_email: null
      })
      .where('customer_id = :userId', { userId })
      .execute();

    // Log data anonymization
    await this.auditService.logAction(
      'anonymize_data',
      'user',
      userId,
      { system: true },
      null,
      null,
      null,
      { reason: 'GDPR data deletion request' }
    );
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.userService.findById(userId);
    const orders = await this.orderService.findByCustomerId(userId);
    const payments = await this.paymentService.findByUserId(userId);
    const timesheets = await this.timesheetService.findByUserId(userId);

    return {
      personal_data: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        created_at: user.created_at
      },
      orders: orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        created_at: order.created_at
      })),
      payment_history: payments.map(payment => ({
        transaction_id: payment.transaction_id,
        amount: payment.amount,
        method: payment.payment_method,
        date: payment.created_at
      })),
      employment_data: timesheets.map(timesheet => ({
        date: timesheet.shift_date,
        hours: timesheet.total_hours,
        pay: timesheet.total_pay
      }))
    };
  }
}
```

## Infrastructure Security

### Docker Security
```dockerfile
# Multi-stage build for smaller attack surface
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy application
COPY --from=builder --chown=nextjs:nodejs /app /app
WORKDIR /app

# Security headers
USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

### Environment Security
```bash
# Environment variables validation
#!/bin/bash
required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "ENCRYPTION_KEY"
  "REDIS_URL"
  "STRIPE_SECRET_KEY"
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Validate JWT secret strength
if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "Error: JWT_SECRET must be at least 32 characters"
  exit 1
fi
```

This comprehensive security implementation covers all major aspects of application security, from authentication and authorization to data protection and monitoring, ensuring the Table Tap system meets enterprise security standards.