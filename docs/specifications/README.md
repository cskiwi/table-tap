# TableTap Payment Processing & WebSocket Architecture Specifications

## Overview
This directory contains comprehensive technical specifications for the TableTap cafe ordering system's payment processing and real-time WebSocket communication architecture, built on the NestJS framework with TypeORM, BullMQ, Redis, and Socket.IO.

## Architecture Components

### Payment System
- **QR Code Bank Transfer Payments**: Generate bank transfer QR codes with unique references
- **Payconic Integration**: Complete API integration with webhook handlers
- **Cash Handling**: Staff-validated cash payment workflows
- **Customer Credit System**: Digital wallet with transaction history
- **Tip Calculations**: Configurable per-cafe tip distribution
- **PCI Compliance**: Security measures and data protection

### WebSocket Real-time Communication
- **Multi-tenant Architecture**: Cafe-specific channels and rooms
- **Order Management**: Real-time order status updates
- **Kitchen Display**: Live order queue and preparation tracking
- **Customer Notifications**: Order progress and ready notifications
- **Staff Coordination**: Role-based communication channels
- **Admin Dashboard**: Live analytics and monitoring

## File Structure

```
docs/specifications/
├── README.md                           # This overview document
├── payment/
│   └── payment-system-specs.md         # Complete payment system specification
├── websocket/
│   └── websocket-architecture-specs.md # WebSocket architecture and protocols
├── architecture/
│   ├── integration-patterns.md         # Gateway patterns and state management
│   ├── typeorm-entities.md            # Database entities and models
│   └── nestjs-modules.md              # NestJS modules and services
└── api/
    └── api-endpoints.md                # REST API and GraphQL specifications
```

## Key Technologies

### Backend Stack
- **Framework**: NestJS with Express
- **Database**: PostgreSQL with TypeORM
- **Real-time**: Socket.IO (@nestjs/platform-socket.io)
- **Queue System**: BullMQ for background processing
- **Cache/Session**: Redis with ioredis
- **Authentication**: JWT with @nestjs/jwt
- **Validation**: class-validator and class-transformer

### Payment Integration
- **Payconic Gateway**: Credit card and digital wallet processing
- **QR Code Generation**: Bank transfer QR codes with canvas library
- **Webhook Processing**: Secure webhook validation and processing
- **PCI Compliance**: Security measures and audit logging

### Real-time Communication
- **WebSocket Namespaces**: Organized by functional areas
- **Room Management**: Dynamic subscription management
- **Event Broadcasting**: Multi-tenant message distribution
- **Connection Tracking**: Redis-based session management
- **Rate Limiting**: Per-user and per-namespace limits

## Implementation Guide

### 1. Payment System Setup

#### Install Dependencies
```bash
npm install @nestjs/bullmq @nestjs/jwt @nestjs/typeorm bullmq ioredis
npm install class-validator class-transformer canvas
```

#### Environment Variables
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=tabletap
DATABASE_PASSWORD=secure_password
DATABASE_NAME=tabletap_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Payconic
PAYCONIC_API_URL=https://api.payconic.com/v1
PAYCONIC_API_KEY=your_payconic_api_key
PAYCONIC_MERCHANT_ID=your_merchant_id
PAYCONIC_WEBHOOK_SECRET=your_webhook_secret

# QR Code Bank Transfer
QR_BANK_ACCOUNT_NAME=TableTap Pty Ltd
QR_BANK_BSB=123456
QR_BANK_ACCOUNT=987654321
```

#### Database Migration
```bash
# Generate migration
npm run migrate:create

# Run migrations
npm run migrate
```

### 2. WebSocket Setup

#### Socket.IO Configuration
```typescript
// In your main.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const redisAdapter = createAdapter(
  createClient({ url: 'redis://localhost:6379' }),
  createClient({ url: 'redis://localhost:6379' })
);

app.useWebSocketAdapter(new IoAdapter(app));
```

#### WebSocket Gateway Registration
```typescript
// Register in your app module
@Module({
  imports: [
    PaymentModule,
    WebSocketModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Security Configuration

#### CORS Setup
```typescript
// Enable CORS for WebSocket
const app = await NestFactory.create(AppModule, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  },
});
```

#### Rate Limiting
```typescript
// Install rate limiting
npm install @nestjs/throttler

// Configure in module
ThrottlerModule.forRoot([
  {
    ttl: 60000,
    limit: 100,
  },
]),
```

### 4. Monitoring and Logging

#### Bull Dashboard (Development)
```bash
npm install @bull-board/api @bull-board/express
```

#### Winston Logging
```typescript
// Already included: nest-winston
import { WinstonModule } from 'nest-winston';
```

## API Documentation

### REST Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/:id/status` - Get payment status
- `POST /api/payments/:id/verify` - Verify payment
- `POST /api/payments/:id/refund` - Process refund
- `GET /api/credits/balance` - Get credit balance
- `POST /api/credits/add` - Add customer credit

### WebSocket Events
- `order_created` - New order notification
- `order_status_updated` - Order status changes
- `payment_initiated` - Payment started
- `payment_completed` - Payment successful
- `kitchen_order_ready` - Order ready for pickup

### GraphQL Schema
Complete GraphQL schema available in `/api/api-endpoints.md` with:
- Payment queries and mutations
- Credit management
- Real-time subscriptions
- Statistical queries

## Security Considerations

### PCI Compliance
1. **Never store sensitive card data**
2. **Use tokenization for all card transactions**
3. **Encrypt data in transit and at rest**
4. **Implement proper access controls**
5. **Maintain comprehensive audit logs**

### WebSocket Security
1. **JWT authentication required**
2. **Rate limiting per connection**
3. **Input validation on all messages**
4. **CORS configuration**
5. **Connection monitoring and alerting**

## Performance Optimization

### Database
- Proper indexing on frequently queried columns
- Connection pooling configuration
- Read replicas for reporting queries

### Redis
- Separate Redis instances for different use cases
- Memory optimization settings
- Cluster setup for high availability

### WebSocket
- Socket.IO Redis adapter for scaling
- Message queue for heavy processing
- Connection limit per server instance

## Testing Strategy

### Unit Tests
```bash
# Run unit tests
npm run test

# With coverage
npm run test:cov
```

### Integration Tests
```bash
# Run integration tests
npm run test:e2e
```

### Load Testing
- WebSocket connection limits
- Payment processing throughput
- Database query performance
- Redis memory usage

## Deployment Considerations

### Docker Configuration
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
# ... build steps

FROM node:18-alpine AS production
# ... production setup
```

### Kubernetes Deployment
- Horizontal Pod Autoscaler for scaling
- Redis cluster for session management
- PostgreSQL with read replicas
- Load balancer configuration

### Monitoring
- Prometheus metrics
- Grafana dashboards
- Error tracking with Sentry
- Performance monitoring

## Development Workflow

### Getting Started
1. Clone repository
2. Install dependencies: `npm install`
3. Setup environment variables
4. Run database migrations: `npm run migrate`
5. Start development server: `npm run start:dev`

### Code Quality
- ESLint configuration
- Prettier formatting
- Husky pre-commit hooks
- TypeScript strict mode

## Support and Maintenance

### Documentation Updates
Keep specifications updated with:
- API changes and versioning
- New payment methods
- WebSocket event additions
- Security updates

### Monitoring Checklist
- [ ] Payment success rates
- [ ] WebSocket connection health
- [ ] Database performance
- [ ] Queue processing times
- [ ] Error rates and patterns

This comprehensive specification provides the foundation for implementing a robust, scalable payment processing and real-time communication system for the TableTap platform.