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
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { LoyaltyRedemptionStatus } from '@app/models/enums';
import { LoyaltyReward } from './loyalty-reward.model';
import { LoyaltyRewardRedemptionMetadata } from './loyalty-reward-redemption-metadata.model';
import { Cafe, User } from '../../core';
import { Order } from '../../order';
import { LoyaltyAccount } from '../accounts';

@ObjectType('LoyaltyRewardRedemption')
@Entity('LoyaltyRewardRedemptions')
@Index(['cafeId', 'loyaltyAccountId'])
export class LoyaltyRewardRedemption extends BaseEntity {
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

  @ManyToOne(() => Cafe, cafe => cafe.loyaltyRedemptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Loyalty account relationship
  @Field()
  @Column('uuid')
  @Index()
  declare loyaltyAccountId: string;

  @ManyToOne(() => LoyaltyAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyAccountId' })
  declare loyaltyAccount: Relation<LoyaltyAccount>;

  // Reward relationship
  @Field()
  @Column('uuid')
  @Index()
  declare rewardId: string;

  @ManyToOne(() => LoyaltyReward, reward => reward.redemptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rewardId' })
  declare reward: Relation<LoyaltyReward>;

  // Order relationship (if redeemed during an order)
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  // Redemption details
  @Field(() => LoyaltyRedemptionStatus)
  @Column('enum', { enum: LoyaltyRedemptionStatus, default: LoyaltyRedemptionStatus.PENDING })
  @IsEnum(LoyaltyRedemptionStatus)
  declare status: LoyaltyRedemptionStatus;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare pointsUsed: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountAmount: number; // Actual discount applied

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare cashValue: number; // Cash equivalent value

  // Redemption code for tracking
  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare redemptionCode: string;

  // Timing
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare approvedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare redeemedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiresAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare cancelledAt: Date;

  // Processing details
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare approvedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedByUserId' })
  declare approvedByUser: Relation<User>;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare redeemedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'redeemedByUserId' })
  declare redeemedByUser: Relation<User>;

  // Notes and metadata
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare cancellationReason: string;

  @OneToOne(() => LoyaltyRewardRedemptionMetadata, metadata => metadata.redemption, { cascade: true })
  declare metadata: Relation<LoyaltyRewardRedemptionMetadata>;

  // Computed fields
  @Field()
  get isPending(): boolean {
    return this.status === LoyaltyRedemptionStatus.PENDING;
  }

  @Field()
  get isApproved(): boolean {
    return this.status === LoyaltyRedemptionStatus.APPROVED;
  }

  @Field()
  get isRedeemed(): boolean {
    return this.status === LoyaltyRedemptionStatus.REDEEMED;
  }

  @Field()
  get isCancelled(): boolean {
    return this.status === LoyaltyRedemptionStatus.CANCELLED;
  }

  @Field()
  get isExpired(): boolean {
    return this.status === LoyaltyRedemptionStatus.EXPIRED ||
           (this.expiresAt && this.expiresAt < new Date());
  }

  @Field()
  get canBeCancelled(): boolean {
    return this.status === LoyaltyRedemptionStatus.PENDING ||
           this.status === LoyaltyRedemptionStatus.APPROVED;
  }

  @Field(() => Number, { nullable: true })
  get daysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date()
    const diff = this.expiresAt.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field()
  get statusDisplay(): string {
    switch (this.status) {
      case LoyaltyRedemptionStatus.PENDING:
        return 'Pending Approval';
      case LoyaltyRedemptionStatus.APPROVED:
        return 'Ready to Redeem';
      case LoyaltyRedemptionStatus.REDEEMED:
        return 'Redeemed';
      case LoyaltyRedemptionStatus.CANCELLED:
        return 'Cancelled';
      case LoyaltyRedemptionStatus.EXPIRED:
        return 'Expired';
      default:
        return this.status;
    }
  }

  @Field()
  get processingTime(): number {
    if (!this.approvedAt) return 0;
    return Math.round((this.approvedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)); // minutes
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class LoyaltyRewardRedemptionUpdateInput extends PartialType(
  OmitType(LoyaltyRewardRedemption, [
    'createdAt',
    'updatedAt',
    'cafe',
    'loyaltyAccount',
    'reward',
    'order',
    'approvedByUser',
    'redeemedByUser',
    'isPending',
    'isApproved',
    'isRedeemed',
    'isCancelled',
    'isExpired',
    'canBeCancelled',
    'daysUntilExpiry',
    'statusDisplay',
    'processingTime',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyRewardRedemptionCreateInput extends PartialType(
  OmitType(LoyaltyRewardRedemptionUpdateInput, ['id'] as const),
  InputType
) {}