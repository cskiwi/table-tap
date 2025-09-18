# TypeORM Entities for Payment and Transaction System

## Overview
Comprehensive data model definitions for payment processing, customer credits, and transaction logging using TypeORM with PostgreSQL.

## Core Payment Entities

### Payment Transaction Entity
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { DecimalTransformer } from '../transformers/decimal.transformer';

@Entity('payment_transactions')
@Index(['orderId'])
@Index(['customerId'])
@Index(['cafeId'])
@Index(['status'])
@Index(['paymentMethod'])
@Index(['createdAt'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  orderId: string;

  @Column('uuid', { nullable: true })
  @Index()
  customerId?: string;

  @Column('uuid')
  @Index()
  cafeId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    nullable: true,
  })
  tipAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  totalAmount: number;

  @Column('varchar', { length: 3, default: 'AUD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: [
      'qr_bank_transfer',
      'payconic_card',
      'payconic_bank_transfer',
      'payconic_digital_wallet',
      'cash',
      'customer_credit',
      'split_payment',
    ],
  })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'partial_refund',
    ],
  })
  @Index()
  status: string;

  @Column('varchar', { nullable: true })
  externalTransactionId?: string;

  @Column('varchar', { nullable: true })
  gatewayPaymentId?: string;

  @Column('varchar', { nullable: true })
  qrCodeReference?: string;

  @Column('uuid', { nullable: true })
  staffId?: string;

  @Column('uuid', { nullable: true })
  tillId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  gatewayResponse?: Record<string, any>;

  @Column('timestamp with time zone')
  initiatedAt: Date;

  @Column('timestamp with time zone', { nullable: true })
  completedAt?: Date;

  @Column('timestamp with time zone', { nullable: true })
  failedAt?: Date;

  @Column('timestamp with time zone', { nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Audit fields
  @Column('inet', { nullable: true })
  ipAddress?: string;

  @Column('text', { nullable: true })
  userAgent?: string;

  @Column('jsonb', { nullable: true })
  auditTrail?: AuditLogEntry[];

  // Relations
  @OneToMany(() => PaymentRefund, refund => refund.originalTransaction)
  refunds: PaymentRefund[];

  @OneToMany(() => PaymentSplit, split => split.parentTransaction)
  splits: PaymentSplit[];

  @ManyToOne(() => PaymentTransaction, { nullable: true })
  @JoinColumn({ name: 'parent_transaction_id' })
  parentTransaction?: PaymentTransaction;

  @OneToMany(() => PaymentWebhook, webhook => webhook.transaction)
  webhooks: PaymentWebhook[];
}

interface AuditLogEntry {
  action: string;
  timestamp: Date;
  userId?: string;
  staffId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}
```

### Customer Credit Entity
```typescript
@Entity('customer_credits')
@Index(['customerId'])
@Index(['cafeId'])
@Index(['status'])
export class CustomerCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  customerId: string;

  @Column('uuid', { nullable: true })
  cafeId?: string; // null means global credit

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    default: 0,
  })
  balance: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    default: 0,
  })
  totalEarned: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    default: 0,
  })
  totalSpent: number;

  @Column('varchar', { length: 3, default: 'AUD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'expired', 'closed'],
    default: 'active',
  })
  status: string;

  @Column('timestamp with time zone', { nullable: true })
  expiresAt?: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => CreditTransaction, transaction => transaction.customerCredit)
  transactions: CreditTransaction[];
}
```

### Credit Transaction Entity
```typescript
@Entity('credit_transactions')
@Index(['customerId'])
@Index(['customerCreditId'])
@Index(['type'])
@Index(['orderId'])
@Index(['createdAt'])
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  customerId: string;

  @Column('uuid')
  customerCreditId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['credit', 'debit', 'refund', 'bonus', 'adjustment', 'expiry'],
  })
  type: string;

  @Column('varchar', { length: 255 })
  reason: string;

  @Column('uuid', { nullable: true })
  orderId?: string;

  @Column('uuid', { nullable: true })
  paymentTransactionId?: string;

  @Column('uuid', { nullable: true })
  staffId?: string;

  @Column('uuid', { nullable: true })
  cafeId?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  balanceBefore: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  balanceAfter: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('timestamp with time zone', { nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CustomerCredit, credit => credit.transactions)
  @JoinColumn({ name: 'customer_credit_id' })
  customerCredit: CustomerCredit;
}
```

### Cafe Tip Configuration Entity
```typescript
@Entity('cafe_tip_configurations')
@Index(['cafeId'], { unique: true })
export class CafeTipConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  cafeId: string;

  @Column('boolean', { default: true })
  tipEnabled: boolean;

  @Column({
    type: 'enum',
    enum: ['percentage', 'fixed', 'both'],
    default: 'percentage',
  })
  tipType: string;

  @Column('jsonb', { nullable: true })
  defaultPercentages?: number[]; // [10, 15, 20]

  @Column('jsonb', { nullable: true })
  fixedAmounts?: number[]; // [2.00, 5.00, 10.00]

  @Column('boolean', { default: true })
  customTipEnabled: boolean;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 50.00,
  })
  maxTipPercentage: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    default: 0.50,
  })
  minTipAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
    default: 100.00,
  })
  maxTipAmount: number;

  @Column('jsonb')
  tipDistribution: {
    kitchenStaff: number;
    serviceStaff: number;
    management: number;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TipDistribution, distribution => distribution.cafeConfiguration)
  tipDistributions: TipDistribution[];
}
```

## Supporting Entities

### Payment Refund Entity
```typescript
@Entity('payment_refunds')
@Index(['originalTransactionId'])
@Index(['status'])
@Index(['createdAt'])
export class PaymentRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  originalTransactionId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  refundAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  originalAmount: number;

  @Column('varchar', { length: 255 })
  reason: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column('varchar', { nullable: true })
  externalRefundId?: string;

  @Column('uuid', { nullable: true })
  staffId?: string;

  @Column('uuid', { nullable: true })
  cafeId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('timestamp with time zone', { nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PaymentTransaction, transaction => transaction.refunds)
  @JoinColumn({ name: 'original_transaction_id' })
  originalTransaction: PaymentTransaction;
}
```

### Payment Split Entity (for split payments)
```typescript
@Entity('payment_splits')
@Index(['parentTransactionId'])
@Index(['orderId'])
export class PaymentSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  parentTransactionId: string;

  @Column('uuid')
  orderId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  splitAmount: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  splitPercentage: number;

  @Column('varchar', { length: 100 })
  splitMethod: string; // 'equal', 'percentage', 'custom'

  @Column('uuid', { nullable: true })
  customerId?: string;

  @Column('varchar', { nullable: true })
  customerName?: string;

  @Column('varchar', { nullable: true })
  customerEmail?: string;

  @Column('varchar', { nullable: true })
  customerPhone?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column('uuid', { nullable: true })
  paymentTransactionId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PaymentTransaction, transaction => transaction.splits)
  @JoinColumn({ name: 'parent_transaction_id' })
  parentTransaction: PaymentTransaction;

  @ManyToOne(() => PaymentTransaction, { nullable: true })
  @JoinColumn({ name: 'payment_transaction_id' })
  paymentTransaction?: PaymentTransaction;
}
```

### Payment Webhook Entity
```typescript
@Entity('payment_webhooks')
@Index(['transactionId'])
@Index(['provider'])
@Index(['eventType'])
@Index(['status'])
@Index(['receivedAt'])
export class PaymentWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  provider: string; // 'payconic', 'qr_bank', etc.

  @Column('varchar', { length: 100 })
  eventType: string;

  @Column('uuid', { nullable: true })
  transactionId?: string;

  @Column('varchar', { nullable: true })
  externalTransactionId?: string;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column('varchar', { nullable: true })
  signature?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'processed', 'failed', 'ignored'],
    default: 'pending',
  })
  status: string;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column('integer', { default: 0 })
  processAttempts: number;

  @Column('timestamp with time zone')
  receivedAt: Date;

  @Column('timestamp with time zone', { nullable: true })
  processedAt?: Date;

  @Column('jsonb', { nullable: true })
  processingResult?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PaymentTransaction, transaction => transaction.webhooks, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction?: PaymentTransaction;
}
```

### Tip Distribution Entity
```typescript
@Entity('tip_distributions')
@Index(['cafeConfigurationId'])
@Index(['orderId'])
@Index(['distributionDate'])
export class TipDistribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  cafeConfigurationId: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  paymentTransactionId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  totalTipAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  kitchenStaffAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  serviceStaffAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  managementAmount: number;

  @Column('jsonb', { nullable: true })
  staffAllocations?: {
    staffId: string;
    staffName: string;
    role: string;
    amount: number;
    percentage: number;
  }[];

  @Column('date')
  distributionDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'distributed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CafeTipConfiguration, config => config.tipDistributions)
  @JoinColumn({ name: 'cafe_configuration_id' })
  cafeConfiguration: CafeTipConfiguration;
}
```

## QR Code Payment Entity
```typescript
@Entity('qr_code_payments')
@Index(['orderId'])
@Index(['cafeId'])
@Index(['status'])
@Index(['expiresAt'])
@Index(['createdAt'])
export class QRCodePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  cafeId: string;

  @Column('uuid', { nullable: true })
  customerId?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalTransformer(),
  })
  amount: number;

  @Column('varchar', { length: 50, unique: true })
  paymentReference: string;

  @Column('text')
  qrCodeData: string; // Base64 encoded QR image

  @Column('text')
  bankTransferData: string; // JSON string with bank details

  @Column('varchar', { length: 500 })
  paymentUrl: string;

  @Column({
    type: 'enum',
    enum: ['generated', 'scanned', 'paid', 'expired', 'cancelled'],
    default: 'generated',
  })
  status: string;

  @Column('timestamp with time zone')
  expiresAt: Date;

  @Column('timestamp with time zone', { nullable: true })
  scannedAt?: Date;

  @Column('timestamp with time zone', { nullable: true })
  paidAt?: Date;

  @Column('uuid', { nullable: true })
  paymentTransactionId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PaymentTransaction, { nullable: true })
  @JoinColumn({ name: 'payment_transaction_id' })
  paymentTransaction?: PaymentTransaction;
}
```

## Database Migrations

### Initial Payment System Migration
```typescript
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreatePaymentTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create payment_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'payment_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'cafe_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'tip_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'AUD'",
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: [
              'qr_bank_transfer',
              'payconic_card',
              'payconic_bank_transfer',
              'payconic_digital_wallet',
              'cash',
              'customer_credit',
              'split_payment',
            ],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'pending',
              'processing',
              'completed',
              'failed',
              'cancelled',
              'refunded',
              'partial_refund',
            ],
            default: "'pending'",
          },
          {
            name: 'external_transaction_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'gateway_payment_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'qr_code_reference',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'staff_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'till_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'gateway_response',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'initiated_at',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'audit_trail',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'parent_transaction_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['parent_transaction_id'],
            referencedTableName: 'payment_transactions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    );

    // Create indexes for payment_transactions
    await queryRunner.createIndex('payment_transactions', new Index('IDX_payment_order_id', ['order_id']));
    await queryRunner.createIndex('payment_transactions', new Index('IDX_payment_customer_id', ['customer_id']));
    await queryRunner.createIndex('payment_transactions', new Index('IDX_payment_cafe_id', ['cafe_id']));
    await queryRunner.createIndex('payment_transactions', new Index('IDX_payment_status', ['status']));
    await queryRunner.createIndex('payment_transactions', new Index('IDX_payment_method', ['payment_method']));
    await queryRunner.createIndex('payment_transactions', new Index('IDX_payment_created_at', ['created_at']));

    // Additional tables would follow similar pattern...
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payment_transactions');
  }
}
```

## Custom Transformers

### Decimal Transformer
```typescript
import { ValueTransformer } from 'typeorm';

export class DecimalTransformer implements ValueTransformer {
  to(data?: number | null): number | null {
    if (data !== null && data !== undefined) {
      return data;
    }
    return null;
  }

  from(data?: string | null): number | null {
    if (data !== null && data !== undefined) {
      const res = parseFloat(data);
      if (isNaN(res)) {
        return null;
      } else {
        return res;
      }
    }
    return null;
  }
}
```

## Repository Patterns

### Payment Transaction Repository
```typescript
@Injectable()
export class PaymentTransactionRepository {
  constructor(
    @InjectRepository(PaymentTransaction)
    private repository: Repository<PaymentTransaction>,
  ) {}

  async findByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    return this.repository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
      relations: ['refunds', 'splits', 'webhooks'],
    });
  }

  async findPendingPayments(cafeId?: string): Promise<PaymentTransaction[]> {
    const where: any = { status: 'pending' };
    if (cafeId) {
      where.cafeId = cafeId;
    }

    return this.repository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  async findExpiredQRPayments(): Promise<PaymentTransaction[]> {
    return this.repository
      .createQueryBuilder('payment')
      .where('payment.paymentMethod = :method', { method: 'qr_bank_transfer' })
      .andWhere('payment.status = :status', { status: 'pending' })
      .andWhere('payment.expiresAt < :now', { now: new Date() })
      .getMany();
  }

  async getPaymentStatistics(cafeId: string, startDate: Date, endDate: Date) {
    return this.repository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as total_transactions',
        'SUM(payment.amount) as total_amount',
        'SUM(payment.tipAmount) as total_tips',
        'payment.paymentMethod',
        'payment.status',
      ])
      .where('payment.cafeId = :cafeId', { cafeId })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('payment.paymentMethod, payment.status')
      .getRawMany();
  }
}
```

This comprehensive TypeORM entity specification provides a complete data model foundation for the payment and transaction system, ensuring data integrity, audit capabilities, and scalable performance.