import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Relation
} from 'typeorm';
import { LoyaltyRewardType, LoyaltyRewardCategory, LoyaltyRewardStatus } from '@app/models/enums';
import { LoyaltyRewardRedemption } from './loyalty-reward-redemption.model';
import { LoyaltyRewardApplicableProducts } from './loyalty-reward-applicable-products.model';
import { LoyaltyRewardSpecialProperties } from './loyalty-reward-special-properties.model';
import { Cafe } from '../../core';

@ObjectType('LoyaltyReward')
@Entity('LoyaltyRewards')
@Index(['cafeId', 'isActive'])
@Index(['category', 'type'])
@Index(['validFrom', 'validUntil'])
export class LoyaltyReward extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField({ nullable: true })
  @DeleteDateColumn({ nullable: true })
  declare deletedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, cafe => cafe.loyaltyRewards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Reward identification
  @Field()
  @Column()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare image: string;

  @Field()
  @Column('enum', { enum: LoyaltyRewardType })
  @IsEnum(LoyaltyRewardType)
  declare type: LoyaltyRewardType;

  @Field()
  @Column('enum', { enum: LoyaltyRewardCategory })
  @IsEnum(LoyaltyRewardCategory)
  declare category: LoyaltyRewardCategory;

  @Field()
  @Column('enum', { enum: LoyaltyRewardStatus, default: LoyaltyRewardStatus.ACTIVE })
  @IsEnum(LoyaltyRewardStatus)
  declare status: LoyaltyRewardStatus;

  // Cost and value
  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare pointsCost: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare cashValue: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountPercentage: number; // For percentage discounts (0.1 = 10%)

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountAmount: number; // For fixed amount discounts

  // Availability and restrictions
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare validFrom: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare validUntil: Date;

  @Field()
  @Column('int', { default: -1 })
  @IsNumber()
  declare totalQuantity: number; // -1 = unlimited

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare redeemedQuantity: number;

  @Field()
  @Column('int', { default: 1 })
  @IsNumber()
  declare maxRedemptionsPerUser: number;

  @Field()
  @Column('int', { default: 1 })
  @IsNumber()
  declare maxRedemptionsPerDay: number;

  // Tier restrictions
  @Field(() => [Number])
  @Column('simple-array', { default: '' })
  @IsArray()
  declare requiredTierLevels: number[]; // [] = all tiers, [2,3,4] = silver and above

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare minimumSpend: number; // Minimum order amount to redeem

  // Product restrictions (now in separate table)
  @OneToOne(() => LoyaltyRewardApplicableProducts, products => products.loyaltyReward, { cascade: true, nullable: true })
  declare applicableProducts: Relation<LoyaltyRewardApplicableProducts>;

  // Terms and conditions
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare terms: string;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare canCombineWithOtherOffers: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare requiresApproval: boolean;

  // Priority and visibility
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare priority: number; // Higher number = higher priority in display

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isVisible: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isFeatured: boolean;

  // Special reward properties (now in separate table)
  @OneToOne(() => LoyaltyRewardSpecialProperties, properties => properties.loyaltyReward, { cascade: true, nullable: true })
  declare specialProperties: Relation<LoyaltyRewardSpecialProperties>;

  // Analytics and tracking
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare viewCount: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare redemptionCount: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastRedeemedAt: Date;

  // Relations
  @OneToMany(() => LoyaltyRewardRedemption, redemption => redemption.reward)
  declare redemptions: Relation<LoyaltyRewardRedemption[]>

  // Computed fields
  @Field()
  get isAvailable(): boolean {
    if (!this.isActive || this.status !== LoyaltyRewardStatus.ACTIVE) return false;

    const now = new Date()
    if (this.validFrom && this.validFrom > now) return false;
    if (this.validUntil && this.validUntil < now) return false;

    if (this.totalQuantity !== -1 && this.redeemedQuantity >= this.totalQuantity) return false;

    return true;
  }

  @Field()
  get remainingQuantity(): number {
    return this.totalQuantity === -1 ? -1 : this.totalQuantity - this.redeemedQuantity;
  }

  @Field()
  get redemptionRate(): number {
    return this.viewCount > 0 ? (this.redemptionCount / this.viewCount) * 100 : 0;
  }

  @Field()
  get isLimitedTime(): boolean {
    return this.validUntil !== null;
  }

  @Field()
  get isLimitedQuantity(): boolean {
    return this.totalQuantity !== -1;
  }

  @Field({ nullable: true })
  get daysUntilExpiry(): number | null {
    if (!this.validUntil) return null;
    const now = new Date()
    const diff = this.validUntil.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field()
  get isNearExpiry(): boolean {
    const days = this.daysUntilExpiry;
    return days !== null && days <= 7 && days > 0;
  }

  @Field()
  get displayValue(): string {
    switch (this.type) {
      case LoyaltyRewardType.DISCOUNT_PERCENTAGE:
        return `${(this.discountPercentage! * 100).toFixed(0)}% off`;
      case LoyaltyRewardType.DISCOUNT_FIXED:
        return `$${this.discountAmount!.toFixed(2)} off`;
      case LoyaltyRewardType.FREE_ITEM:
        return `Free ${this.specialProperties?.freeProductName || 'Item'}`;
      case LoyaltyRewardType.FREE_DELIVERY:
        return 'Free Delivery';
      case LoyaltyRewardType.BONUS_POINTS:
        return `${this.specialProperties?.bonusPointsAmount || 0} bonus points`;
      case LoyaltyRewardType.CASH_CREDIT:
        return `$${this.cashValue!.toFixed(2)} credit`;
      default:
        return this.name;
    }
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class LoyaltyRewardUpdateInput extends PartialType(
  OmitType(LoyaltyReward, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'redemptions',
    'isAvailable',
    'remainingQuantity',
    'redemptionRate',
    'isLimitedTime',
    'isLimitedQuantity',
    'daysUntilExpiry',
    'isNearExpiry',
    'displayValue',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyRewardCreateInput extends PartialType(
  OmitType(LoyaltyRewardUpdateInput, ['id'] as const),
  InputType
) {}