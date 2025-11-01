import { SortableField } from '@app/utils';
import { PaymentMethod, PaymentStatus, TransactionType } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Relation
} from 'typeorm';
import { PaymentProviderData } from './payment-provider-data.model';
import { PaymentReceiptData } from './payment-receipt-data.model';
import { PaymentMetadata } from './payment-metadata.model';
import { User } from '../../core';
import { Order } from '../orders';

@ObjectType('Payment')
@Entity('Payments')
@Index(['method', 'status'])
export class Payment extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Relations
  @Field()
  @Column('uuid')
  @Index('orderId')
  declare orderId: string;

  @ManyToOne(() => Order, order => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index('userId')
  declare userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Payment details
  @Field()
  @Column('enum', { enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  declare method: PaymentMethod;

  @Field()
  @Column('enum', { enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  declare status: PaymentStatus;

  @Field()
  @Column('enum', { enum: TransactionType, default: TransactionType.PURCHASE })
  @IsEnum(TransactionType)
  declare type: TransactionType;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare amount: number;

  @Field({ nullable: true })
  @Column({ name: 'transactionId', nullable: true })
  @IsString()
  @IsOptional()
  @Index('transactionId', { unique: true, where: '"transactionId" IS NOT NULL' })
  declare transactionId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare externalTransactionId: string;

  // Provider specific data (now in separate table)
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare paymentProvider: string; // 'payconic', 'stripe', 'square', etc.

  @OneToOne(() => PaymentProviderData, providerData => providerData.payment, { cascade: true, nullable: true })
  declare providerData: Relation<PaymentProviderData>;

  // Authorization and capture
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare authorizationId: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare authorizedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare capturedAt: Date;

  // Failure handling
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare failureReason: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare failureCode: string;

  // Refund information
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare refundedAmount: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare refundedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare refundReason: string;

  // Audit trail
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare processedByEmployeeId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedByEmployeeId' })
  declare processedByEmployee: Relation<User>;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare processedAt: Date;

  @OneToOne(() => PaymentMetadata, metadata => metadata.payment, { cascade: true, nullable: true })
  declare metadata: Relation<PaymentMetadata>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare processorResponse: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Receipt information (now in separate table)
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare receiptNumber: string;

  @OneToOne(() => PaymentReceiptData, receiptData => receiptData.payment, { cascade: true, nullable: true })
  declare receiptData: Relation<PaymentReceiptData>;

  // Computed fields
  @Field()
  get isSuccessful(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  @Field()
  get canBeRefunded(): boolean {
    return this.status === PaymentStatus.COMPLETED &&
           (this.refundedAmount ?? 0) < this.amount;
  }

  @Field()
  get remainingRefundableAmount(): number {
    return this.amount - (this.refundedAmount ?? 0);
  }

  @Field()
  get isFullyRefunded(): boolean {
    return this.refundedAmount != null && this.refundedAmount >= this.amount;
  }

  @Field()
  get isPending(): boolean {
    return [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED].includes(this.status);
  }
}