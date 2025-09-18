# Payment Processing System Technical Specifications

## Overview
Comprehensive payment system for table-tap cafe ordering platform supporting QR codes, Payconic integration, cash handling, and customer credits with complete audit trails and PCI compliance.

## Architecture Stack
- **Framework**: NestJS with TypeORM
- **Database**: PostgreSQL for transactions, Redis for sessions
- **Queue**: BullMQ for background processing
- **Authentication**: JWT with @nestjs/jwt
- **WebSocket**: @nestjs/platform-socket.io for real-time updates

## Payment Methods

### 1. QR Code Bank Transfer Payments

#### QR Code Generation
```typescript
interface QRCodePaymentRequest {
  orderId: string;
  amount: Decimal;
  cafeId: string;
  customerId?: string;
  expiryMinutes: number; // Default: 15 minutes
  metadata?: Record<string, any>;
}

interface QRCodeResponse {
  qrCodeId: string;
  qrCodeData: string; // Base64 encoded QR image
  paymentUrl: string;
  expiresAt: Date;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bsb: string;
    reference: string; // Unique payment reference
  };
}
```

#### Implementation Requirements
- Generate unique payment reference for each transaction
- QR codes expire after configurable time (default: 15 minutes)
- Support multiple Australian banks (CBA, ANZ, Westpac, NAB)
- Store QR code metadata for audit trail
- Integrate with canvas library for QR code image generation

### 2. Payconic Integration

#### API Configuration
```typescript
interface PayconicConfig {
  merchantId: string;
  secretKey: string;
  apiEndpoint: string; // https://api.payconic.com/v1
  webhookSecret: string;
  environment: 'sandbox' | 'production';
}

interface PayconicPaymentRequest {
  amount: number; // In cents
  currency: 'AUD';
  orderId: string;
  customerId?: string;
  paymentMethod: 'card' | 'bank_transfer' | 'digital_wallet';
  returnUrl: string;
  webhookUrl: string;
  metadata: {
    cafeId: string;
    tableNumber?: number;
    staffId?: string;
  };
}
```

#### Webhook Handler Specification
```typescript
@Controller('webhooks/payconic')
export class PayconicWebhookController {
  @Post()
  async handleWebhook(
    @Body() payload: PayconicWebhookPayload,
    @Headers('payconic-signature') signature: string
  ): Promise<void> {
    // 1. Verify webhook signature
    // 2. Process payment status update
    // 3. Update order status
    // 4. Notify via WebSocket
    // 5. Trigger background jobs
  }
}

interface PayconicWebhookPayload {
  eventType: 'payment.succeeded' | 'payment.failed' | 'payment.cancelled';
  paymentId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  timestamp: string;
  metadata: Record<string, any>;
}
```

### 3. Cash Payment Workflow

#### Cash Handling Process
```typescript
interface CashPaymentRequest {
  orderId: string;
  amountPaid: Decimal;
  amountDue: Decimal;
  staffId: string;
  tillId: string;
  paymentMethod: 'cash';
}

interface CashPaymentValidation {
  isExactAmount: boolean;
  changeRequired: Decimal;
  tillBalance: Decimal;
  canProcessPayment: boolean;
  validationErrors: string[];
}

enum CashValidationRules {
  EXACT_CHANGE_ONLY = 'exact_change_only',
  ROUND_TO_NEAREST_5_CENTS = 'round_to_5_cents',
  ALLOW_CHANGE = 'allow_change'
}
```

### 4. Customer Credit System

#### Credit Management
```typescript
interface CustomerCredit {
  customerId: string;
  balance: Decimal;
  currency: 'AUD';
  lastUpdated: Date;
  status: 'active' | 'suspended' | 'expired';
}

interface CreditTransaction {
  id: string;
  customerId: string;
  amount: Decimal;
  type: 'credit' | 'debit' | 'refund' | 'bonus';
  orderId?: string;
  staffId?: string;
  reason: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface CreditPaymentRequest {
  orderId: string;
  customerId: string;
  amountToCharge: Decimal;
  fallbackPaymentMethod?: PaymentMethod;
}
```

## Tip Calculations

### Configurable Tip System
```typescript
interface CafeTipConfiguration {
  cafeId: string;
  tipEnabled: boolean;
  tipType: 'percentage' | 'fixed' | 'both';
  defaultPercentage?: number; // 10, 15, 20
  fixedAmounts?: Decimal[]; // [2, 5, 10]
  customTipEnabled: boolean;
  maxTipPercentage: number; // 50%
  minTipAmount: Decimal;
  maxTipAmount: Decimal;
  tipDistribution: {
    kitchenStaff: number; // Percentage
    serviceStaff: number; // Percentage
    management: number; // Percentage
  };
}

interface TipCalculation {
  orderAmount: Decimal;
  tipAmount: Decimal;
  tipPercentage: number;
  totalAmount: Decimal;
  distribution: {
    kitchenStaff: Decimal;
    serviceStaff: Decimal;
    management: Decimal;
  };
}
```

## Transaction Logging & Audit Trail

### Complete Transaction Entity
```typescript
@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid', { nullable: true })
  customerId?: string;

  @Column('uuid')
  cafeId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer()
  })
  amount: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    nullable: true
  })
  tipAmount?: Decimal;

  @Column('varchar')
  currency: string; // AUD

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus
  })
  status: PaymentStatus;

  @Column('varchar', { nullable: true })
  externalTransactionId?: string;

  @Column('varchar', { nullable: true })
  qrCodeReference?: string;

  @Column('uuid', { nullable: true })
  staffId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('timestamp')
  initiatedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('timestamp', { nullable: true })
  failedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Audit fields
  @Column('varchar', { nullable: true })
  ipAddress?: string;

  @Column('varchar', { nullable: true })
  userAgent?: string;

  @Column('jsonb', { nullable: true })
  auditTrail?: AuditLogEntry[];
}

enum PaymentMethod {
  QR_CODE_BANK_TRANSFER = 'qr_bank_transfer',
  PAYCONIC_CARD = 'payconic_card',
  PAYCONIC_BANK_TRANSFER = 'payconic_bank_transfer',
  PAYCONIC_DIGITAL_WALLET = 'payconic_digital_wallet',
  CASH = 'cash',
  CUSTOMER_CREDIT = 'customer_credit',
  SPLIT_PAYMENT = 'split_payment'
}

enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund'
}
```

## PCI Compliance Requirements

### Data Security Specifications

#### Secure Data Handling
```typescript
interface PCIComplianceConfig {
  // Never store full credit card details
  cardDataHandling: {
    storeFullCardNumber: false; // NEVER
    storeCVV: false; // NEVER
    storeExpiryDate: false; // NEVER
    tokenizationRequired: true;
  };

  // Encryption requirements
  encryption: {
    dataInTransit: 'TLS 1.2+';
    dataAtRest: 'AES-256';
    keyManagement: 'AWS KMS' | 'Azure Key Vault';
  };

  // Access controls
  accessControl: {
    roleBasedAccess: true;
    principleOfLeastPrivilege: true;
    regularAccessReviews: true;
    strongAuthentication: true;
  };

  // Monitoring and logging
  monitoring: {
    realTimeMonitoring: true;
    suspiciousActivityDetection: true;
    comprehensiveLogging: true;
    logRetentionPeriod: '12_months';
  };
}
```

#### Secure Payment Processing Flow
1. **Client Side**: Never collect sensitive card data directly
2. **Tokenization**: Use Payconic's tokenization for card data
3. **Server Side**: Process only tokens and non-sensitive data
4. **Storage**: Store only necessary transaction metadata
5. **Transmission**: All communication over HTTPS/WSS
6. **Audit**: Log all payment-related activities

### Security Implementation
```typescript
@Injectable()
export class PaymentSecurityService {
  // Validate payment request
  async validatePaymentRequest(request: PaymentRequest): Promise<ValidationResult> {
    // 1. Input validation and sanitization
    // 2. Amount validation (positive, reasonable limits)
    // 3. Rate limiting check
    // 4. Fraud detection rules
    // 5. Merchant validation
  }

  // Encrypt sensitive data
  async encryptSensitiveData(data: string): Promise<string> {
    // Use AWS KMS or similar for encryption
  }

  // Generate secure payment reference
  generateSecureReference(): string {
    // Cryptographically secure random reference
  }

  // Log security events
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Comprehensive security logging
  }
}
```

## Background Job Processing with BullMQ

### Payment Job Definitions
```typescript
// Payment processing jobs
interface PaymentJobData {
  paymentId: string;
  jobType: 'process_payment' | 'verify_payment' | 'handle_webhook' | 'send_receipt';
  priority: number;
  retryAttempts: number;
  metadata: Record<string, any>;
}

@Processor('payment-queue')
export class PaymentProcessor {
  @Process('process_payment')
  async processPayment(job: Job<PaymentJobData>): Promise<void> {
    // 1. Validate payment data
    // 2. Process with payment gateway
    // 3. Update transaction status
    // 4. Notify via WebSocket
    // 5. Update order status
  }

  @Process('verify_payment')
  async verifyPayment(job: Job<PaymentJobData>): Promise<void> {
    // 1. Check payment status with gateway
    // 2. Update local transaction record
    // 3. Handle status changes
  }

  @Process('handle_webhook')
  async handleWebhook(job: Job<PaymentJobData>): Promise<void> {
    // 1. Process webhook payload
    // 2. Update transaction status
    // 3. Trigger downstream processes
  }

  @Process('send_receipt')
  async sendReceipt(job: Job<PaymentJobData>): Promise<void> {
    // 1. Generate receipt
    // 2. Send via email/SMS
    // 3. Update customer records
  }
}
```

### Job Scheduling and Retry Logic
```typescript
interface PaymentJobConfig {
  defaultJobOptions: {
    removeOnComplete: 50;
    removeOnFail: 50;
    attempts: 3;
    backoff: {
      type: 'exponential';
      delay: 2000;
    };
  };

  queueOptions: {
    defaultJobOptions: JobsOptions;
    connection: Redis;
    settings: {
      stalledInterval: 30000;
      retryProcessDelay: 5000;
    };
  };
}
```

## Integration with Existing NestJS Stack

### Module Structure
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      CustomerCredit,
      CreditTransaction,
      CafeTipConfiguration
    ]),
    BullModule.registerQueue({
      name: 'payment-queue',
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    PaymentController,
    PayconicWebhookController,
    QRCodeController,
    CreditController,
  ],
  providers: [
    PaymentService,
    QRCodeService,
    PayconicService,
    CreditService,
    PaymentSecurityService,
    PaymentProcessor,
    PaymentGateway,
  ],
  exports: [
    PaymentService,
    QRCodeService,
    CreditService,
  ],
})
export class PaymentModule {}
```

### Service Integration Examples
```typescript
@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentRepo: Repository<PaymentTransaction>,
    @InjectQueue('payment-queue')
    private paymentQueue: Queue<PaymentJobData>,
    private websocketService: WebSocketService,
    private securityService: PaymentSecurityService,
  ) {}

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    // 1. Validate request
    const validation = await this.securityService.validatePaymentRequest(request);
    if (!validation.isValid) throw new BadRequestException(validation.errors);

    // 2. Create transaction record
    const transaction = await this.paymentRepo.save({...});

    // 3. Queue payment processing job
    await this.paymentQueue.add('process_payment', {
      paymentId: transaction.id,
      jobType: 'process_payment',
      priority: request.priority || 0,
      retryAttempts: 3,
      metadata: request.metadata,
    });

    // 4. Notify real-time subscribers
    await this.websocketService.notifyPaymentInitiated(transaction);

    return {
      paymentId: transaction.id,
      status: transaction.status,
      redirectUrl: transaction.redirectUrl,
      qrCodeData: transaction.qrCodeData,
    };
  }
}
```

## Error Handling & Monitoring

### Error Classification
```typescript
enum PaymentErrorType {
  VALIDATION_ERROR = 'validation_error',
  GATEWAY_ERROR = 'gateway_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  SECURITY_ERROR = 'security_error',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  CARD_DECLINED = 'card_declined',
  SYSTEM_ERROR = 'system_error'
}

interface PaymentError {
  type: PaymentErrorType;
  code: string;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  suggestedAction?: string;
}
```

### Monitoring Requirements
- Real-time payment status tracking
- Failed payment alerts
- Transaction volume monitoring
- Gateway response time tracking
- Security incident detection
- Compliance audit logging

This payment system specification integrates seamlessly with the existing NestJS stack and provides a comprehensive foundation for secure, scalable payment processing with real-time capabilities.