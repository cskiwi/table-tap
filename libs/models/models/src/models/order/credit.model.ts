import { SortableField } from '@app/utils';
import { TransactionType } from '@app/models/enums';
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
  Relation
} from 'typeorm';
import { Cafe } from '../core/cafe.model';
import { User } from '../core/user.model';
import { Order } from './order.model';

@ObjectType('Credit')
@Entity('Credits')
@Index(['cafeId', 'userId'])
@Index(['userId', 'transactionType'])
export class Credit extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // User relationship
  @Field()
  @Column('uuid')
  @Index()
  declare userId: string;

  @ManyToOne(() => User, user => user.credits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Transaction details
  @Field()
  @Column('enum', { enum: TransactionType })
  @IsEnum(TransactionType)
  declare transactionType: TransactionType;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare amount: number; // Positive for credit, negative for debit

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare balanceBefore: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare balanceAfter: number;

  // Reference information
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare referenceId: string; // Payment ID, Refund ID, etc.

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare referenceType: string; // 'payment', 'refund', 'adjustment', 'promotion'

  // Description and notes
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Source tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare source: string; // 'app', 'pos', 'admin', 'promotion', 'refund'

  // Employee who performed the transaction
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare performedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedById' })
  declare performedBy: Relation<User>;

  // Expiry information (for promotional credits)
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiresAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare promotionCode: string;

  // Restrictions (for promotional credits)
  @Field({ nullable: true })
  @Column('json', { nullable: true })
  declare restrictions: {
    minOrderAmount?: number;
    maxUsageCount?: number;
    validProducts?: string[];
    validCategories?: string[];
    validDays?: string[];
    validTimes?: {
      startTime: string;
      endTime: string;
    };
  };

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare usageCount: number; // How many times this credit has been used (for multi-use credits)

  // Computed fields
  @Field()
  get isCredit(): boolean {
    return this.amount > 0;
  }

  @Field()
  get isDebit(): boolean {
    return this.amount < 0;
  }

  @Field()
  get absoluteAmount(): number {
    return Math.abs(this.amount);
  }

  @Field()
  get isExpired(): boolean {
    return this.expiresAt != null && new Date() > this.expiresAt;
  }

  @Field()
  get isPromotional(): boolean {
    return this.promotionCode != null || this.transactionType === TransactionType.CREDIT_ADD;
  }

  @Field()
  get hasRestrictions(): boolean {
    return this.restrictions != null && Object.keys(this.restrictions).length > 0;
  }

  @Field({ nullable: true })
  get daysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const expiry = this.expiresAt;
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  @Field()
  get isValidForUse(): boolean {
    return !this.isExpired && (this.amount > 0 || this.transactionType === TransactionType.CREDIT_ADD);
  }

  @Field()
  get displayDescription(): string {
    if (this.description) return this.description;

    switch (this.transactionType) {
      case TransactionType.CREDIT_ADD:
        return 'Credit added';
      case TransactionType.CREDIT_DEDUCT:
        return 'Credit used for order';
      case TransactionType.REFUND:
        return 'Refund credited';
      case TransactionType.ADJUSTMENT:
        return 'Balance adjustment';
      default:
        return this.transactionType;
    }
  }
}