# NestJS Modules and Service Architecture

## Overview
Complete NestJS module structure for the payment processing and WebSocket real-time communication system, with service implementations and dependency injection patterns.

## Module Architecture

### Payment Module
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import {
  PaymentTransaction,
  CustomerCredit,
  CreditTransaction,
  CafeTipConfiguration,
  PaymentRefund,
  PaymentSplit,
  PaymentWebhook,
  TipDistribution,
  QRCodePayment,
} from './entities';

// Controllers
import {
  PaymentController,
  PayconicWebhookController,
  QRCodeController,
  CreditController,
  TipController,
} from './controllers';

// Services
import {
  PaymentService,
  PayconicService,
  QRCodeService,
  CreditService,
  TipService,
  PaymentSecurityService,
  PaymentGatewayFactory,
  PayconicGateway,
  QRCodeBankTransferGateway,
  CustomerCreditGateway,
} from './services';

// Processors
import {
  PaymentProcessor,
  WebhookProcessor,
  CreditProcessor,
} from './processors';

// Repositories
import {
  PaymentTransactionRepository,
  CustomerCreditRepository,
  CreditTransactionRepository,
} from './repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      CustomerCredit,
      CreditTransaction,
      CafeTipConfiguration,
      PaymentRefund,
      PaymentSplit,
      PaymentWebhook,
      TipDistribution,
      QRCodePayment,
    ]),
    BullModule.registerQueue({
      name: 'payment-queue',
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'webhook-processing',
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 30000,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'TableTap/1.0',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    PaymentController,
    PayconicWebhookController,
    QRCodeController,
    CreditController,
    TipController,
  ],
  providers: [
    // Core services
    PaymentService,
    PayconicService,
    QRCodeService,
    CreditService,
    TipService,
    PaymentSecurityService,

    // Gateway implementations
    PaymentGatewayFactory,
    PayconicGateway,
    QRCodeBankTransferGateway,
    CustomerCreditGateway,

    // Job processors
    PaymentProcessor,
    WebhookProcessor,
    CreditProcessor,

    // Repositories
    PaymentTransactionRepository,
    CustomerCreditRepository,
    CreditTransactionRepository,
  ],
  exports: [
    PaymentService,
    QRCodeService,
    CreditService,
    TipService,
    PaymentGatewayFactory,
  ],
})
export class PaymentModule {}
```

### WebSocket Module
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

// Gateways
import {
  OrdersGateway,
  KitchenGateway,
  CounterGateway,
  CustomersGateway,
  AdminGateway,
  PaymentsGateway,
} from './gateways';

// Services
import {
  WebSocketService,
  ConnectionTrackingService,
  MultiTenantWebSocketService,
  WebSocketSecurityService,
  WebSocketRateLimiter,
  RealTimeStateManager,
  StateSynchronizationService,
} from './services';

// Guards and Filters
import {
  WsAuthGuard,
  WebSocketExceptionFilter,
} from './guards';

// Interceptors
import {
  WebSocketLoggingInterceptor,
  WebSocketValidationInterceptor,
} from './interceptors';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'websocket-events',
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  providers: [
    // WebSocket Gateways
    OrdersGateway,
    KitchenGateway,
    CounterGateway,
    CustomersGateway,
    AdminGateway,
    PaymentsGateway,

    // Core services
    WebSocketService,
    ConnectionTrackingService,
    MultiTenantWebSocketService,
    WebSocketSecurityService,
    WebSocketRateLimiter,
    RealTimeStateManager,
    StateSynchronizationService,

    // Guards and filters
    WsAuthGuard,
    WebSocketExceptionFilter,

    // Interceptors
    WebSocketLoggingInterceptor,
    WebSocketValidationInterceptor,
  ],
  exports: [
    WebSocketService,
    MultiTenantWebSocketService,
    RealTimeStateManager,
    StateSynchronizationService,
  ],
})
export class WebSocketModule {}
```

## Core Service Implementations

### Payment Service
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paymentSecurityService: PaymentSecurityService,
    private readonly realTimeStateManager: RealTimeStateManager,
    @InjectQueue('payment-queue')
    private readonly paymentQueue: Queue<PaymentJobData>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async initiatePayment(request: InitiatePaymentRequest): Promise<PaymentResponse> {
    // 1. Validate payment request
    const validation = await this.paymentSecurityService.validatePaymentRequest(request);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }

    // 2. Get appropriate payment gateway
    const gateway = this.paymentGatewayFactory.getGateway(request.paymentMethod);

    // 3. Create transaction record
    const transaction = await this.paymentTransactionRepository.create({
      orderId: request.orderId,
      customerId: request.customerId,
      cafeId: request.cafeId,
      amount: request.amount,
      tipAmount: request.tipAmount,
      totalAmount: request.amount + (request.tipAmount || 0),
      currency: request.currency || 'AUD',
      paymentMethod: request.paymentMethod,
      status: 'pending',
      initiatedAt: new Date(),
      expiresAt: this.calculateExpiryTime(request.paymentMethod),
      metadata: request.metadata,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    try {
      // 4. Initiate payment with gateway
      const gatewayResponse = await gateway.initiatePayment({
        ...request,
        transactionId: transaction.id,
      });

      // 5. Update transaction with gateway response
      await this.paymentTransactionRepository.update(transaction.id, {
        externalTransactionId: gatewayResponse.externalId,
        gatewayPaymentId: gatewayResponse.paymentId,
        gatewayResponse: gatewayResponse,
        status: gatewayResponse.status || 'pending',
      });

      // 6. Update real-time state
      await this.realTimeStateManager.syncPaymentState(transaction.id, {
        paymentId: transaction.id,
        orderId: request.orderId,
        status: gatewayResponse.status || 'pending',
        amount: transaction.totalAmount,
        paymentMethod: request.paymentMethod,
        lastUpdated: Date.now(),
        retryCount: 0,
      });

      // 7. Queue background processing
      await this.paymentQueue.add('verify_payment', {
        paymentId: transaction.id,
        jobType: 'verify_payment',
        priority: this.calculateJobPriority(request),
        retryAttempts: 3,
        metadata: request.metadata,
      }, {
        delay: 30000, // Verify payment after 30 seconds
      });

      // 8. Emit event for real-time notifications
      this.eventEmitter.emit('payment.initiated', {
        paymentId: transaction.id,
        orderId: request.orderId,
        cafeId: request.cafeId,
        amount: transaction.totalAmount,
        paymentMethod: request.paymentMethod,
      });

      return {
        paymentId: transaction.id,
        status: gatewayResponse.status || 'pending',
        redirectUrl: gatewayResponse.redirectUrl,
        qrCodeData: gatewayResponse.qrCodeData,
        expiresAt: transaction.expiresAt,
      };

    } catch (error) {
      // Update transaction with error
      await this.paymentTransactionRepository.update(transaction.id, {
        status: 'failed',
        failedAt: new Date(),
        metadata: {
          ...transaction.metadata,
          error: error.message,
        },
      });

      throw error;
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    const transaction = await this.paymentTransactionRepository.findById(paymentId);
    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    const gateway = this.paymentGatewayFactory.getGateway(transaction.paymentMethod);

    try {
      const verification = await gateway.verifyPayment(
        transaction.externalTransactionId || paymentId
      );

      // Update transaction if status changed
      if (verification.status !== transaction.status) {
        await this.updatePaymentStatus(paymentId, verification.status, {
          verificationResult: verification,
          verifiedAt: new Date(),
        });
      }

      return {
        paymentId,
        status: verification.status,
        amount: verification.amount,
        verifiedAt: new Date(),
      };
    } catch (error) {
      await this.paymentTransactionRepository.update(paymentId, {
        metadata: {
          ...transaction.metadata,
          verificationError: error.message,
          lastVerificationAttempt: new Date(),
        },
      });

      throw error;
    }
  }

  async updatePaymentStatus(
    paymentId: string,
    newStatus: PaymentStatus,
    metadata?: Record<string, any>
  ): Promise<void> {
    const transaction = await this.paymentTransactionRepository.findById(paymentId);
    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    const updateData: Partial<PaymentTransaction> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'completed') {
      updateData.completedAt = new Date();
    } else if (newStatus === 'failed') {
      updateData.failedAt = new Date();
    }

    if (metadata) {
      updateData.metadata = {
        ...transaction.metadata,
        ...metadata,
      };
    }

    // Update audit trail
    const auditEntry = {
      action: 'status_update',
      timestamp: new Date(),
      previousStatus: transaction.status,
      newStatus,
      metadata,
    };

    updateData.auditTrail = [
      ...(transaction.auditTrail || []),
      auditEntry,
    ];

    await this.paymentTransactionRepository.update(paymentId, updateData);

    // Update real-time state
    await this.realTimeStateManager.syncPaymentState(paymentId, {
      paymentId,
      orderId: transaction.orderId,
      status: newStatus,
      amount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      lastUpdated: Date.now(),
      retryCount: 0,
    });

    // Emit status change event
    this.eventEmitter.emit('payment.status_changed', {
      paymentId,
      orderId: transaction.orderId,
      cafeId: transaction.cafeId,
      previousStatus: transaction.status,
      newStatus,
      timestamp: new Date(),
    });
  }

  async refundPayment(
    paymentId: string,
    refundAmount?: number,
    reason?: string
  ): Promise<RefundResult> {
    const transaction = await this.paymentTransactionRepository.findById(paymentId);
    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refundAmountToUse = refundAmount || transaction.totalAmount;
    if (refundAmountToUse > transaction.totalAmount) {
      throw new BadRequestException('Refund amount cannot exceed original payment amount');
    }

    const gateway = this.paymentGatewayFactory.getGateway(transaction.paymentMethod);

    try {
      const refundResult = await gateway.refundPayment(
        transaction.externalTransactionId,
        refundAmountToUse
      );

      // Create refund record
      const refund = await this.paymentTransactionRepository.createRefund({
        originalTransactionId: paymentId,
        refundAmount: refundAmountToUse,
        originalAmount: transaction.totalAmount,
        reason: reason || 'Customer requested refund',
        status: refundResult.status || 'pending',
        externalRefundId: refundResult.refundId,
        metadata: refundResult.metadata,
      });

      // Emit refund event
      this.eventEmitter.emit('payment.refunded', {
        originalPaymentId: paymentId,
        refundId: refund.id,
        refundAmount: refundAmountToUse,
        cafeId: transaction.cafeId,
        timestamp: new Date(),
      });

      return {
        refundId: refund.id,
        status: refund.status,
        refundAmount: refundAmountToUse,
        processedAt: refund.processedAt,
      };
    } catch (error) {
      // Log refund failure
      await this.paymentTransactionRepository.update(paymentId, {
        metadata: {
          ...transaction.metadata,
          refundError: {
            message: error.message,
            attemptedAt: new Date(),
            refundAmount: refundAmountToUse,
          },
        },
      });

      throw error;
    }
  }

  private calculateExpiryTime(paymentMethod: PaymentMethod): Date {
    const expiryMinutes = {
      [PaymentMethod.QR_CODE_BANK_TRANSFER]: 15,
      [PaymentMethod.PAYCONIC_CARD]: 30,
      [PaymentMethod.PAYCONIC_BANK_TRANSFER]: 60,
      [PaymentMethod.PAYCONIC_DIGITAL_WALLET]: 30,
      [PaymentMethod.CUSTOMER_CREDIT]: 5,
    };

    const minutes = expiryMinutes[paymentMethod] || 30;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private calculateJobPriority(request: InitiatePaymentRequest): number {
    // Higher priority for larger amounts and premium customers
    let priority = 0;

    if (request.amount > 100) priority += 2;
    if (request.amount > 500) priority += 3;
    if (request.customerId && request.metadata?.customerTier === 'premium') priority += 5;

    return Math.min(priority, 10); // Max priority is 10
  }
}
```

### WebSocket Service
```typescript
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WebSocketService {
  private server: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  async emitToRoom(room: string, event: string, data: any): Promise<void> {
    if (!this.server) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.server.to(room).emit(event, {
      ...data,
      timestamp: Date.now(),
      eventId: this.generateEventId(),
    });
  }

  async emitToUser(userId: string, event: string, data: any): Promise<void> {
    const connections = await this.connectionTracking.getUserConnections(userId);

    for (const socketId of connections) {
      this.server.to(socketId).emit(event, {
        ...data,
        timestamp: Date.now(),
        eventId: this.generateEventId(),
      });
    }
  }

  async emitToCafe(
    cafeId: string,
    event: string,
    data: any,
    options?: {
      excludeRoles?: UserRole[];
      includeRoles?: UserRole[];
      excludeUsers?: string[];
    }
  ): Promise<void> {
    if (options?.includeRoles?.length) {
      for (const role of options.includeRoles) {
        await this.emitToRoom(`cafe:${cafeId}:role:${role}`, event, data);
      }
      return;
    }

    if (options?.excludeRoles?.length || options?.excludeUsers?.length) {
      const allConnections = await this.connectionTracking.getActiveConnections(cafeId);
      const filteredConnections = await this.filterConnections(
        allConnections,
        options
      );

      for (const socketId of filteredConnections) {
        this.server.to(socketId).emit(event, {
          ...data,
          timestamp: Date.now(),
          eventId: this.generateEventId(),
        });
      }
      return;
    }

    await this.emitToRoom(`cafe:${cafeId}`, event, data);
  }

  async broadcastToCafe(cafeId: string, event: string, data: any): Promise<void> {
    await this.emitToRoom(`cafe:${cafeId}`, event, {
      ...data,
      timestamp: Date.now(),
      eventId: this.generateEventId(),
      broadcast: true,
    });
  }

  async notifyPaymentInitiated(transaction: PaymentTransaction): Promise<void> {
    const eventData = {
      paymentId: transaction.id,
      orderId: transaction.orderId,
      amount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
    };

    // Notify order-specific subscribers
    await this.emitToRoom(`order:${transaction.orderId}`, 'payment_initiated', eventData);

    // Notify cafe staff
    await this.emitToRoom(`cafe:${transaction.cafeId}:staff`, 'payment_initiated', eventData);

    // Notify customer if present
    if (transaction.customerId) {
      await this.emitToUser(transaction.customerId, 'payment_initiated', eventData);
    }
  }

  async notifyOrderStatusChanged(orderId: string, newStatus: OrderStatus, cafeId: string): Promise<void> {
    const eventData = {
      orderId,
      status: newStatus,
      timestamp: Date.now(),
    };

    // Notify order subscribers
    await this.emitToRoom(`order:${orderId}`, 'order_status_changed', eventData);

    // Notify appropriate cafe rooms based on status
    switch (newStatus) {
      case OrderStatus.PAID:
        await this.emitToRoom(`cafe:${cafeId}:kitchen`, 'new_paid_order', eventData);
        break;
      case OrderStatus.PREPARING:
        await this.emitToRoom(`cafe:${cafeId}:staff`, 'order_in_preparation', eventData);
        break;
      case OrderStatus.READY:
        await this.emitToRoom(`cafe:${cafeId}:customers`, 'order_ready', eventData);
        await this.emitToRoom(`cafe:${cafeId}:staff`, 'order_ready', eventData);
        break;
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async filterConnections(
    connections: string[],
    options: {
      excludeRoles?: UserRole[];
      excludeUsers?: string[];
    }
  ): Promise<string[]> {
    const filtered: string[] = [];

    for (const socketId of connections) {
      const connectionData = await this.connectionTracking.getConnection(socketId);
      if (!connectionData) continue;

      // Exclude by user
      if (options.excludeUsers?.includes(connectionData.userId)) {
        continue;
      }

      // Exclude by role
      if (options.excludeRoles?.some(role => connectionData.roles.includes(role))) {
        continue;
      }

      filtered.push(socketId);
    }

    return filtered;
  }
}
```

### Credit Service
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class CreditService {
  constructor(
    private readonly customerCreditRepository: CustomerCreditRepository,
    private readonly creditTransactionRepository: CreditTransactionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getCreditBalance(customerId: string, cafeId?: string): Promise<CustomerCredit> {
    let credit = await this.customerCreditRepository.findByCustomerAndCafe(customerId, cafeId);

    if (!credit) {
      // Create new credit account
      credit = await this.customerCreditRepository.create({
        customerId,
        cafeId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        currency: 'AUD',
        status: 'active',
      });
    }

    return credit;
  }

  async addCredit(
    customerId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>,
    cafeId?: string,
    staffId?: string
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    const credit = await this.getCreditBalance(customerId, cafeId);
    const newBalance = credit.balance + amount;

    // Create credit transaction
    const transaction = await this.creditTransactionRepository.create({
      customerId,
      customerCreditId: credit.id,
      amount,
      type: 'credit',
      reason,
      balanceBefore: credit.balance,
      balanceAfter: newBalance,
      cafeId,
      staffId,
      metadata,
    });

    // Update credit balance
    await this.customerCreditRepository.update(credit.id, {
      balance: newBalance,
      totalEarned: credit.totalEarned + amount,
    });

    // Emit event
    this.eventEmitter.emit('credit.added', {
      customerId,
      amount,
      newBalance,
      transactionId: transaction.id,
      cafeId,
    });

    return transaction;
  }

  async deductCredit(
    customerId: string,
    amount: number,
    reason: string,
    orderId?: string,
    metadata?: Record<string, any>,
    cafeId?: string
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Deduction amount must be positive');
    }

    const credit = await this.getCreditBalance(customerId, cafeId);

    if (credit.balance < amount) {
      throw new BadRequestException('Insufficient credit balance');
    }

    const newBalance = credit.balance - amount;

    // Create debit transaction
    const transaction = await this.creditTransactionRepository.create({
      customerId,
      customerCreditId: credit.id,
      amount: -amount, // Negative for debit
      type: 'debit',
      reason,
      orderId,
      balanceBefore: credit.balance,
      balanceAfter: newBalance,
      cafeId,
      metadata,
    });

    // Update credit balance
    await this.customerCreditRepository.update(credit.id, {
      balance: newBalance,
      totalSpent: credit.totalSpent + amount,
    });

    // Emit event
    this.eventEmitter.emit('credit.deducted', {
      customerId,
      amount,
      newBalance,
      transactionId: transaction.id,
      orderId,
      cafeId,
    });

    return transaction;
  }

  async getCreditHistory(
    customerId: string,
    cafeId?: string,
    limit = 50,
    offset = 0
  ): Promise<CreditTransaction[]> {
    return this.creditTransactionRepository.findByCustomer(
      customerId,
      cafeId,
      limit,
      offset
    );
  }

  async processRefundToCredit(
    customerId: string,
    refundAmount: number,
    originalOrderId: string,
    cafeId?: string
  ): Promise<CreditTransaction> {
    return this.addCredit(
      customerId,
      refundAmount,
      `Refund for order ${originalOrderId}`,
      {
        refundType: 'order_refund',
        originalOrderId,
        processedAt: new Date(),
      },
      cafeId
    );
  }
}
```

This comprehensive NestJS module architecture provides a scalable, maintainable foundation for the payment processing and WebSocket real-time communication system, with proper separation of concerns, dependency injection, and event-driven patterns.