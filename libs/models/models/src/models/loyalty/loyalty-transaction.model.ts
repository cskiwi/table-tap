import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';
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
import { Order } from '../order/order.model';
import { LoyaltyAccount } from './loyalty-account.model';

export enum LoyaltyTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  ADJUSTED = 'adjusted',
  BONUS = 'bonus',
  REFERRAL = 'referral',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  CHALLENGE = 'challenge',
  PROMOTION = 'promotion'
}

export enum LoyaltyTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

@ObjectType('LoyaltyTransaction')
@Entity('LoyaltyTransactions')
@Index(['cafeId', 'loyaltyAccountId'])
@Index(['type', 'status'])
export class LoyaltyTransaction extends BaseEntity {
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

  @ManyToOne(() => Cafe, cafe => cafe.loyaltyTransactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Loyalty account relationship
  @Field()
  @Column('uuid')
  @Index()
  declare loyaltyAccountId: string;

  @ManyToOne(() => LoyaltyAccount, account => account.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyAccountId' })
  declare loyaltyAccount: Relation<LoyaltyAccount>;

  // Transaction details
  @Field()
  @Column('enum', { enum: LoyaltyTransactionType })
  @IsEnum(LoyaltyTransactionType)
  declare type: LoyaltyTransactionType;

  @Field()
  @Column('enum', { enum: LoyaltyTransactionStatus, default: LoyaltyTransactionStatus.COMPLETED })
  @IsEnum(LoyaltyTransactionStatus)
  declare status: LoyaltyTransactionStatus;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare points: number; // Positive for earned, negative for redeemed

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare pointsBalance: number; // Balance after this transaction

  // Transaction context
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare orderAmount: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  declare earnRate: number; // Points per dollar (e.g., 0.1 = 10 points per $1)

  // Expiry tracking
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiresAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiredAt: Date;

  // Description and metadata
  @Field()
  @Column()
  @IsString()
  declare description: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare metadata: {
    // For earned points
    productIds?: string[]
    categoryIds?: string[]
    multiplierApplied?: number;
    promotionId?: string;

    // For redeemed points
    rewardId?: string;
    rewardName?: string;
    discountAmount?: number;

    // For referrals
    referredUserId?: string;
    referrerUserId?: string;

    // For challenges/badges
    challengeId?: string;
    badgeId?: string;

    // For adjustments
    reason?: string;
    adjustedBy?: string;
    originalTransactionId?: string;
  }

  // Processing details
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare processedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedByUserId' })
  declare processedByUser: Relation<User>;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare processedAt: Date;

  // Reference to external systems
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare externalTransactionId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare externalSystem: string;

  // Computed fields
  @Field()
  get isEarned(): boolean {
    return this.type === LoyaltyTransactionType.EARNED ||
           this.type === LoyaltyTransactionType.BONUS ||
           this.type === LoyaltyTransactionType.REFERRAL ||
           this.type === LoyaltyTransactionType.BIRTHDAY ||
           this.type === LoyaltyTransactionType.ANNIVERSARY ||
           this.type === LoyaltyTransactionType.CHALLENGE ||
           this.type === LoyaltyTransactionType.PROMOTION;
  }

  @Field()
  get isRedeemed(): boolean {
    return this.type === LoyaltyTransactionType.REDEEMED;
  }

  @Field()
  get isExpired(): boolean {
    return this.status === LoyaltyTransactionStatus.EXPIRED ||
           (this.expiresAt && this.expiresAt < new Date());
  }

  @Field()
  get isPending(): boolean {
    return this.status === LoyaltyTransactionStatus.PENDING;
  }

  @Field()
  get absolutePoints(): number {
    return Math.abs(this.points);
  }

  @Field()
  get displayType(): string {
    switch (this.type) {
      case LoyaltyTransactionType.EARNED:
        return 'Points Earned';
      case LoyaltyTransactionType.REDEEMED:
        return 'Points Redeemed';
      case LoyaltyTransactionType.BONUS:
        return 'Bonus Points';
      case LoyaltyTransactionType.REFERRAL:
        return 'Referral Bonus';
      case LoyaltyTransactionType.BIRTHDAY:
        return 'Birthday Reward';
      case LoyaltyTransactionType.ANNIVERSARY:
        return 'Anniversary Bonus';
      case LoyaltyTransactionType.CHALLENGE:
        return 'Challenge Reward';
      case LoyaltyTransactionType.PROMOTION:
        return 'Promotional Bonus';
      case LoyaltyTransactionType.EXPIRED:
        return 'Points Expired';
      case LoyaltyTransactionType.ADJUSTED:
        return 'Point Adjustment';
      default:
        return this.type;
    }
  }

  @Field({ nullable: true })
  get daysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date()
    const diff = this.expiresAt.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}