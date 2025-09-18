# Integration Patterns Technical Specifications

## Overview
Comprehensive integration patterns for payment processing, WebSocket communication, and state management within the table-tap NestJS ecosystem.

## Payment Gateway Integration Patterns

### Gateway Abstraction Pattern
```typescript
// Abstract payment gateway interface
export abstract class PaymentGateway {
  abstract initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  abstract verifyPayment(paymentId: string): Promise<PaymentVerification>;
  abstract refundPayment(paymentId: string, amount?: number): Promise<RefundResponse>;
  abstract handleWebhook(payload: any, signature: string): Promise<WebhookResult>;
  abstract generateQRCode?(request: QRCodeRequest): Promise<QRCodeResponse>;
}

// Payconic implementation
@Injectable()
export class PayconicGateway extends PaymentGateway {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
  ) {
    super();
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const payconicRequest = this.transformToPayconicFormat(request);

    try {
      const response = await this.httpService.post(
        `${this.configService.get('PAYCONIC_API_URL')}/payments`,
        payconicRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('PAYCONIC_API_KEY')}`,
            'Content-Type': 'application/json',
            'X-Merchant-ID': this.configService.get('PAYCONIC_MERCHANT_ID'),
          },
          timeout: 30000,
        }
      ).toPromise();

      return this.transformFromPayconicFormat(response.data);
    } catch (error) {
      throw new PaymentGatewayException('Failed to initiate payment', error);
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult> {
    // Verify webhook signature
    const expectedSignature = this.cryptoService.hmacSha256(
      JSON.stringify(payload),
      this.configService.get('PAYCONIC_WEBHOOK_SECRET')
    );

    if (!this.cryptoService.verifySignature(signature, expectedSignature)) {
      throw new WebhookValidationException('Invalid webhook signature');
    }

    // Process webhook based on event type
    switch (payload.eventType) {
      case 'payment.succeeded':
        return this.handlePaymentSucceeded(payload);
      case 'payment.failed':
        return this.handlePaymentFailed(payload);
      case 'payment.cancelled':
        return this.handlePaymentCancelled(payload);
      default:
        throw new UnknownWebhookEventException(`Unknown event: ${payload.eventType}`);
    }
  }
}

// QR Code Bank Transfer implementation
@Injectable()
export class QRCodeBankTransferGateway extends PaymentGateway {
  constructor(
    private qrCodeService: QRCodeService,
    private bankingService: BankingService,
    private configService: ConfigService,
  ) {
    super();
  }

  async generateQRCode(request: QRCodeRequest): Promise<QRCodeResponse> {
    const paymentReference = this.generateUniqueReference();
    const bankDetails = await this.getBankDetails(request.cafeId);

    const qrData = {
      paymentMethod: 'bank_transfer',
      accountName: bankDetails.accountName,
      accountNumber: bankDetails.accountNumber,
      bsb: bankDetails.bsb,
      amount: request.amount,
      reference: paymentReference,
      description: `Order payment for ${request.orderId}`,
    };

    const qrCodeImage = await this.qrCodeService.generateQRCode(
      JSON.stringify(qrData),
      { size: 256, errorCorrectionLevel: 'M' }
    );

    return {
      qrCodeId: paymentReference,
      qrCodeData: qrCodeImage,
      paymentUrl: this.generatePaymentUrl(paymentReference),
      expiresAt: new Date(Date.now() + request.expiryMinutes * 60 * 1000),
      bankDetails: {
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        bsb: bankDetails.bsb,
        reference: paymentReference,
      },
    };
  }
}

// Gateway factory pattern
@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private payconicGateway: PayconicGateway,
    private qrCodeGateway: QRCodeBankTransferGateway,
    private creditGateway: CustomerCreditGateway,
  ) {}

  getGateway(paymentMethod: PaymentMethod): PaymentGateway {
    switch (paymentMethod) {
      case PaymentMethod.PAYCONIC_CARD:
      case PaymentMethod.PAYCONIC_BANK_TRANSFER:
      case PaymentMethod.PAYCONIC_DIGITAL_WALLET:
        return this.payconicGateway;
      case PaymentMethod.QR_CODE_BANK_TRANSFER:
        return this.qrCodeGateway;
      case PaymentMethod.CUSTOMER_CREDIT:
        return this.creditGateway;
      default:
        throw new UnsupportedPaymentMethodException(`Unsupported payment method: ${paymentMethod}`);
    }
  }
}
```

### Webhook Handler Architecture
```typescript
// Webhook event bus pattern
@Injectable()
export class WebhookEventBus {
  constructor(
    @InjectQueue('webhook-processing')
    private webhookQueue: Queue<WebhookJobData>,
    private eventEmitter: EventEmitter2,
  ) {}

  async processWebhook(
    payload: any,
    signature: string,
    provider: string
  ): Promise<void> {
    // Immediate validation and queuing
    const webhookId = this.generateWebhookId();

    await this.webhookQueue.add('process_webhook', {
      webhookId,
      payload,
      signature,
      provider,
      receivedAt: new Date(),
    }, {
      priority: this.getWebhookPriority(payload.eventType),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    // Emit immediate event for real-time processing
    this.eventEmitter.emit(`webhook.received.${provider}`, {
      webhookId,
      eventType: payload.eventType,
      orderId: payload.orderId,
    });
  }
}

// Webhook processor
@Processor('webhook-processing')
export class WebhookProcessor {
  constructor(
    private paymentService: PaymentService,
    private orderService: OrderService,
    private websocketService: WebSocketService,
    private notificationService: NotificationService,
    private auditService: AuditService,
  ) {}

  @Process('process_webhook')
  async processWebhook(job: Job<WebhookJobData>): Promise<void> {
    const { webhookId, payload, signature, provider } = job.data;

    try {
      // Get appropriate gateway
      const gateway = this.getGatewayForProvider(provider);

      // Validate and process webhook
      const result = await gateway.handleWebhook(payload, signature);

      // Update payment and order status
      await this.updatePaymentStatus(result);

      // Emit real-time updates
      await this.emitRealTimeUpdates(result);

      // Send notifications if needed
      await this.sendNotifications(result);

      // Log successful processing
      await this.auditService.logWebhookProcessed({
        webhookId,
        provider,
        eventType: payload.eventType,
        orderId: result.orderId,
        processedAt: new Date(),
      });

    } catch (error) {
      // Log error and potentially retry
      await this.auditService.logWebhookError({
        webhookId,
        provider,
        error: error.message,
        payload: payload,
        attemptNumber: job.attemptsMade,
      });

      throw error; // Let BullMQ handle retry logic
    }
  }

  private async emitRealTimeUpdates(result: WebhookResult): Promise<void> {
    const { orderId, paymentId, newStatus, cafeId } = result;

    // Emit to order-specific room
    await this.websocketService.emitToRoom(`order:${orderId}`, 'payment_status_updated', {
      paymentId,
      orderId,
      status: newStatus,
      updatedAt: new Date(),
    });

    // Emit to cafe staff
    await this.websocketService.emitToRoom(`cafe:${cafeId}:staff`, 'payment_update', {
      paymentId,
      orderId,
      status: newStatus,
    });

    // If payment completed, update order status
    if (newStatus === PaymentStatus.COMPLETED) {
      const updatedOrder = await this.orderService.markAsPaid(orderId);

      await this.websocketService.emitToRoom(`cafe:${cafeId}:kitchen`, 'new_paid_order', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        items: updatedOrder.items,
        priority: this.calculateOrderPriority(updatedOrder),
      });
    }
  }
}
```

## State Management for Real-time Updates

### Redis-based State Manager
```typescript
@Injectable()
export class RealTimeStateManager {
  constructor(
    private redisService: RedisService,
    private websocketService: WebSocketService,
  ) {}

  // Order state management
  async updateOrderState(orderId: string, updates: Partial<OrderState>): Promise<void> {
    const key = `order_state:${orderId}`;
    const currentState = await this.getOrderState(orderId);
    const newState = { ...currentState, ...updates, updatedAt: Date.now() };

    await this.redisService.setex(key, 3600, JSON.stringify(newState));

    // Emit state change
    await this.websocketService.emitToRoom(`order:${orderId}`, 'order_state_changed', newState);
  }

  async getOrderState(orderId: string): Promise<OrderState> {
    const key = `order_state:${orderId}`;
    const state = await this.redisService.get(key);

    return state ? JSON.parse(state) : this.getDefaultOrderState();
  }

  // Kitchen display state
  async updateKitchenDisplayState(cafeId: string, updates: KitchenDisplayState): Promise<void> {
    const key = `kitchen_display:${cafeId}`;
    await this.redisService.setex(key, 300, JSON.stringify(updates));

    await this.websocketService.emitToRoom(
      `cafe:${cafeId}:kitchen`,
      'kitchen_display_updated',
      updates
    );
  }

  // Queue position management
  async updateQueuePosition(cafeId: string, orderId: string, position: number): Promise<void> {
    const queueKey = `queue:${cafeId}`;
    const orderKey = `order_queue:${orderId}`;

    await Promise.all([
      this.redisService.zadd(queueKey, position, orderId),
      this.redisService.setex(orderKey, 7200, JSON.stringify({ position, cafeId })),
    ]);

    // Notify customer
    await this.websocketService.emitToRoom(`order:${orderId}`, 'queue_position_updated', {
      orderId,
      position,
      estimatedWaitTime: this.calculateEstimatedWaitTime(position),
    });
  }

  // Payment state synchronization
  async syncPaymentState(paymentId: string, state: PaymentState): Promise<void> {
    const key = `payment_state:${paymentId}`;
    await this.redisService.setex(key, 1800, JSON.stringify(state)); // 30 min TTL

    // Emit to relevant subscribers
    await this.websocketService.emitToRoom(`payment:${paymentId}`, 'payment_state_sync', state);

    if (state.orderId) {
      await this.websocketService.emitToRoom(`order:${state.orderId}`, 'payment_state_sync', state);
    }
  }
}

interface OrderState {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  queuePosition?: number;
  estimatedReadyTime?: number;
  kitchenStatus?: KitchenOrderStatus;
  lastUpdated: number;
  assignedStaff?: string[];
  specialRequests?: string[];
}

interface PaymentState {
  paymentId: string;
  orderId?: string;
  status: PaymentStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  gatewayTransactionId?: string;
  lastUpdated: number;
  errorMessage?: string;
  retryCount: number;
}

interface KitchenDisplayState {
  cafeId: string;
  activeOrders: KitchenOrderDisplay[];
  completedOrders: string[];
  averagePreparationTime: number;
  currentLoad: number; // 0-100 percentage
  lastUpdated: number;
}
```

### Event-Driven State Synchronization
```typescript
@Injectable()
export class StateSynchronizationService {
  constructor(
    private stateManager: RealTimeStateManager,
    private eventEmitter: EventEmitter2,
    private websocketService: WebSocketService,
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Order events
    this.eventEmitter.on('order.created', this.handleOrderCreated.bind(this));
    this.eventEmitter.on('order.status_changed', this.handleOrderStatusChanged.bind(this));
    this.eventEmitter.on('order.payment_completed', this.handleOrderPaymentCompleted.bind(this));

    // Payment events
    this.eventEmitter.on('payment.initiated', this.handlePaymentInitiated.bind(this));
    this.eventEmitter.on('payment.completed', this.handlePaymentCompleted.bind(this));
    this.eventEmitter.on('payment.failed', this.handlePaymentFailed.bind(this));

    // Kitchen events
    this.eventEmitter.on('kitchen.order_started', this.handleKitchenOrderStarted.bind(this));
    this.eventEmitter.on('kitchen.order_completed', this.handleKitchenOrderCompleted.bind(this));
  }

  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const { order } = event;

    // Initialize order state
    await this.stateManager.updateOrderState(order.id, {
      orderId: order.id,
      status: order.status,
      paymentStatus: PaymentStatus.PENDING,
      lastUpdated: Date.now(),
    });

    // Add to cafe queue
    const queuePosition = await this.calculateQueuePosition(order.cafeId);
    await this.stateManager.updateQueuePosition(order.cafeId, order.id, queuePosition);

    // Notify real-time subscribers
    await this.websocketService.broadcastToCafe(order.cafeId, 'new_order', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      queuePosition,
      estimatedReadyTime: this.calculateEstimatedReadyTime(queuePosition),
    });
  }

  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    const { payment } = event;

    // Update payment state
    await this.stateManager.syncPaymentState(payment.id, {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: PaymentStatus.COMPLETED,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      lastUpdated: Date.now(),
      retryCount: 0,
    });

    // Update order state
    await this.stateManager.updateOrderState(payment.orderId, {
      paymentStatus: PaymentStatus.COMPLETED,
      lastUpdated: Date.now(),
    });

    // Notify kitchen
    await this.websocketService.emitToRoom(
      `cafe:${payment.cafeId}:kitchen`,
      'paid_order_ready_for_preparation',
      {
        orderId: payment.orderId,
        paymentConfirmed: true,
      }
    );
  }
}
```

## BullMQ Job Processing Integration

### Job Queue Architecture
```typescript
// Job queue configuration
export const queueConfigs = {
  'payment-processing': {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      db: 0,
    },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    settings: {
      stalledInterval: 30000,
      retryProcessDelay: 5000,
    },
  },
  'order-processing': {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      db: 1,
    },
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 5,
      backoff: {
        type: 'fixed',
        delay: 1000,
      },
    },
  },
  'notification-queue': {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      db: 2,
    },
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 100,
      attempts: 2,
      delay: 0,
    },
  },
};

// Job orchestration service
@Injectable()
export class JobOrchestrationService {
  constructor(
    @InjectQueue('payment-processing')
    private paymentQueue: Queue<PaymentJobData>,
    @InjectQueue('order-processing')
    private orderQueue: Queue<OrderJobData>,
    @InjectQueue('notification-queue')
    private notificationQueue: Queue<NotificationJobData>,
    private websocketService: WebSocketService,
  ) {}

  async orchestrateOrderPayment(order: Order): Promise<void> {
    const flowId = this.generateFlowId();

    // Step 1: Initiate payment processing
    const paymentJob = await this.paymentQueue.add('initiate_payment', {
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      flowId,
    }, {
      priority: this.calculatePaymentPriority(order),
    });

    // Step 2: Schedule order status update (dependent on payment)
    await this.orderQueue.add('update_order_status', {
      orderId: order.id,
      newStatus: OrderStatus.PAYMENT_PENDING,
      flowId,
    }, {
      delay: 1000, // 1 second delay
      parent: {
        id: paymentJob.id,
        queue: 'payment-processing',
      },
    });

    // Step 3: Schedule real-time notifications
    await this.notificationQueue.add('notify_payment_initiated', {
      orderId: order.id,
      cafeId: order.cafeId,
      customerId: order.customerId,
      flowId,
    });

    // Emit orchestration started event
    await this.websocketService.emitToRoom(`order:${order.id}`, 'orchestration_started', {
      flowId,
      steps: ['payment_initiation', 'order_status_update', 'notifications'],
    });
  }

  async handleJobCompletion(job: Job, result: any): Promise<void> {
    const flowId = job.data.flowId;

    // Update flow progress in real-time
    await this.websocketService.emitToRoom(`flow:${flowId}`, 'step_completed', {
      jobId: job.id,
      jobType: job.name,
      result: result,
      completedAt: new Date(),
    });

    // Check if flow is complete
    if (await this.isFlowComplete(flowId)) {
      await this.websocketService.emitToRoom(`flow:${flowId}`, 'flow_completed', {
        flowId,
        completedAt: new Date(),
      });
    }
  }
}

// Advanced job processors
@Processor('payment-processing')
export class PaymentJobProcessor {
  constructor(
    private paymentService: PaymentService,
    private stateManager: RealTimeStateManager,
    private websocketService: WebSocketService,
  ) {}

  @Process('initiate_payment')
  async initiatePayment(job: Job<PaymentJobData>): Promise<PaymentResult> {
    const { orderId, amount, paymentMethod, flowId } = job.data;

    try {
      // Update job progress
      await job.progress(10);

      // Initiate payment
      const paymentResult = await this.paymentService.initiatePayment({
        orderId,
        amount,
        paymentMethod,
      });

      await job.progress(50);

      // Update state
      await this.stateManager.syncPaymentState(paymentResult.paymentId, {
        paymentId: paymentResult.paymentId,
        orderId,
        status: paymentResult.status,
        amount,
        paymentMethod,
        lastUpdated: Date.now(),
        retryCount: 0,
      });

      await job.progress(80);

      // Emit real-time update
      await this.websocketService.emitToRoom(`order:${orderId}`, 'payment_initiated', {
        paymentId: paymentResult.paymentId,
        status: paymentResult.status,
        redirectUrl: paymentResult.redirectUrl,
      });

      await job.progress(100);

      return paymentResult;
    } catch (error) {
      // Update error state
      await this.stateManager.syncPaymentState(`temp_${orderId}`, {
        paymentId: `temp_${orderId}`,
        orderId,
        status: PaymentStatus.FAILED,
        amount,
        paymentMethod,
        lastUpdated: Date.now(),
        errorMessage: error.message,
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  @OnQueueActive()
  async onActive(job: Job): Promise<void> {
    await this.websocketService.emitToRoom(`order:${job.data.orderId}`, 'job_started', {
      jobId: job.id,
      jobType: job.name,
      startedAt: new Date(),
    });
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: any): Promise<void> {
    await this.websocketService.emitToRoom(`order:${job.data.orderId}`, 'job_completed', {
      jobId: job.id,
      jobType: job.name,
      result,
      completedAt: new Date(),
    });
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error): Promise<void> {
    await this.websocketService.emitToRoom(`order:${job.data.orderId}`, 'job_failed', {
      jobId: job.id,
      jobType: job.name,
      error: error.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date(),
    });
  }
}
```

This integration patterns specification provides comprehensive guidance for implementing payment processing, WebSocket communication, and state management within the table-tap system, ensuring scalability, reliability, and real-time performance.