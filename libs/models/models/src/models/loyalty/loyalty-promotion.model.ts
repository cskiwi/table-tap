import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsObject, IsEnum, IsBoolean, IsArray } from 'class-validator';
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
  Relation
} from 'typeorm';
import { Cafe } from '../core/cafe.model';

export enum LoyaltyPromotionType {
  DOUBLE_POINTS = 'double_points',
  BONUS_POINTS = 'bonus_points',
  POINTS_MULTIPLIER = 'points_multiplier',
  TIER_FAST_TRACK = 'tier_fast_track',
  BIRTHDAY_SPECIAL = 'birthday_special',
  ANNIVERSARY_SPECIAL = 'anniversary_special',
  REFERRAL_BONUS = 'referral_bonus',
  CHALLENGE_BONUS = 'challenge_bonus',
  NEW_MEMBER_BONUS = 'new_member_bonus',
  REACTIVATION_BONUS = 'reactivation_bonus'
}

export enum LoyaltyPromotionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum LoyaltyPromotionTrigger {
  ORDER_PLACED = 'order_placed',
  PAYMENT_COMPLETED = 'payment_completed',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  REFERRAL_SUCCESSFUL = 'referral_successful',
  TIER_ACHIEVED = 'tier_achieved',
  CHALLENGE_COMPLETED = 'challenge_completed',
  FIRST_ORDER = 'first_order',
  RETURN_CUSTOMER = 'return_customer',
  MANUAL = 'manual'
}

@ObjectType('LoyaltyPromotion')
@Entity('LoyaltyPromotions')
@Index(['cafeId', 'isActive'])
@Index(['type', 'status'])
@Index(['startDate', 'endDate'])
export class LoyaltyPromotion extends BaseEntity {
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

  @ManyToOne(() => Cafe, cafe => cafe.loyaltyPromotions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Promotion identification
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
  @Column('enum', { enum: LoyaltyPromotionType })
  @IsEnum(LoyaltyPromotionType)
  declare type: LoyaltyPromotionType;

  @Field()
  @Column('enum', { enum: LoyaltyPromotionStatus, default: LoyaltyPromotionStatus.DRAFT })
  @IsEnum(LoyaltyPromotionStatus)
  declare status: LoyaltyPromotionStatus;

  @Field()
  @Column('enum', { enum: LoyaltyPromotionTrigger })
  @IsEnum(LoyaltyPromotionTrigger)
  declare trigger: LoyaltyPromotionTrigger;

  // Timing
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare startDate: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare endDate: Date;

  // Promotion rules
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare rules: {
    // Points rules
    pointsMultiplier?: number; // 2.0 = double points
    bonusPoints?: number; // Fixed bonus points
    minimumSpend?: number; // Minimum order amount
    maximumBonusPoints?: number; // Cap on bonus points

    // Eligibility rules
    eligibleTierLevels?: number[]; // [] = all tiers
    newMembersOnly?: boolean;
    firstTimeCustomers?: boolean;
    inactiveCustomers?: boolean; // Haven't ordered in X days
    inactiveDays?: number;

    // Usage limits
    maxUsesPerCustomer?: number;
    maxUsesTotal?: number;
    maxUsesPerDay?: number;

    // Product/category restrictions
    eligibleProductIds?: string[]
    eligibleCategoryIds?: string[]
    excludeProductIds?: string[]
    excludeCategoryIds?: string[]

    // Day/time restrictions
    eligibleDaysOfWeek?: string[]; // ['monday', 'tuesday']
    eligibleHours?: { start: string; end: string }; // { start: '09:00', end: '17:00' }

    // Special conditions
    requiresCouponCode?: boolean;
    couponCode?: string;
    stackableWithOtherPromotions?: boolean;
  }

  // Targeting
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare targeting: {
    // Geographic targeting
    locations?: string[]
    excludeLocations?: string[]

    // Customer segments
    customerSegments?: string[]
    loyaltyTiers?: number[]
    ageGroups?: string[]
    genderTargeting?: string[]

    // Behavioral targeting
    orderFrequency?: string; // 'high', 'medium', 'low'
    averageOrderValue?: { min?: number; max?: number }
    preferredCategories?: string[]
    lastOrderDays?: { min?: number; max?: number }; // Days since last order

    // Custom attributes
    customAttributes?: { [key: string]: any }
  }

  // Communication
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare messaging: {
    // Notification messages
    notificationTitle?: string;
    notificationMessage?: string;
    emailSubject?: string;
    emailContent?: string;
    smsMessage?: string;

    // Call-to-action
    ctaText?: string;
    ctaUrl?: string;

    // Visual elements
    bannerImage?: string;
    iconUrl?: string;
    backgroundColor?: string;
    textColor?: string;
  }

  // Analytics and tracking
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare timesTriggered: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare successfulRedemptions: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare totalPointsAwarded: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare totalRevenue: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastTriggeredAt: Date;

  // Configuration
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare requiresApproval: boolean;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare priority: number; // Higher number = higher priority

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare internalNotes: string;

  // Computed fields
  @Field()
  get isScheduled(): boolean {
    return this.status === LoyaltyPromotionStatus.SCHEDULED;
  }

  @Field()
  get isCurrentlyActive(): boolean {
    if (this.status !== LoyaltyPromotionStatus.ACTIVE) return false;

    const now = new Date()
    if (this.startDate && this.startDate > now) return false;
    if (this.endDate && this.endDate < now) return false;

    return true;
  }

  @Field()
  get isExpired(): boolean {
    return this.endDate !== null && this.endDate < new Date()
  }

  @Field()
  get redemptionRate(): number {
    return this.timesTriggered > 0 ? (this.successfulRedemptions / this.timesTriggered) * 100 : 0;
  }

  @Field()
  get averagePointsPerRedemption(): number {
    return this.successfulRedemptions > 0 ? this.totalPointsAwarded / this.successfulRedemptions : 0;
  }

  @Field()
  get averageRevenuePerRedemption(): number {
    return this.successfulRedemptions > 0 ? this.totalRevenue / this.successfulRedemptions : 0;
  }

  @Field({ nullable: true })
  get daysUntilStart(): number | null {
    if (!this.startDate) return null;
    const now = new Date()
    const diff = this.startDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field({ nullable: true })
  get daysUntilEnd(): number | null {
    if (!this.endDate) return null;
    const now = new Date()
    const diff = this.endDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field()
  get hasUsageLimit(): boolean {
    return !!(this.rules.maxUsesPerCustomer || this.rules.maxUsesTotal || this.rules.maxUsesPerDay);
  }

  @Field()
  get isTimeRestricted(): boolean {
    return !!(this.rules.eligibleDaysOfWeek?.length || this.rules.eligibleHours);
  }

  @Field()
  get displayType(): string {
    switch (this.type) {
      case LoyaltyPromotionType.DOUBLE_POINTS:
        return 'Double Points';
      case LoyaltyPromotionType.BONUS_POINTS:
        return 'Bonus Points';
      case LoyaltyPromotionType.POINTS_MULTIPLIER:
        return `${this.rules.pointsMultiplier}x Points`;
      case LoyaltyPromotionType.TIER_FAST_TRACK:
        return 'Tier Fast Track';
      case LoyaltyPromotionType.BIRTHDAY_SPECIAL:
        return 'Birthday Special';
      case LoyaltyPromotionType.ANNIVERSARY_SPECIAL:
        return 'Anniversary Special';
      case LoyaltyPromotionType.REFERRAL_BONUS:
        return 'Referral Bonus';
      case LoyaltyPromotionType.NEW_MEMBER_BONUS:
        return 'New Member Bonus';
      case LoyaltyPromotionType.REACTIVATION_BONUS:
        return 'Welcome Back Bonus';
      default:
        return this.name;
    }
  }
}