import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
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
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { LoyaltyPromotionType, LoyaltyPromotionStatus, LoyaltyPromotionTrigger } from '@app/models/enums';
import { LoyaltyPromotionRules } from './loyalty-promotion-rules.model';
import { LoyaltyPromotionTargeting } from './loyalty-promotion-targeting.model';
import { LoyaltyPromotionMessaging } from './loyalty-promotion-messaging.model';
import { Cafe } from '../../core';

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

  @Field(() => LoyaltyPromotionType)
  @Column('enum', { enum: LoyaltyPromotionType })
  @IsEnum(LoyaltyPromotionType)
  declare type: LoyaltyPromotionType;

  @Field(() => LoyaltyPromotionStatus)
  @Column('enum', { enum: LoyaltyPromotionStatus, default: LoyaltyPromotionStatus.DRAFT })
  @IsEnum(LoyaltyPromotionStatus)
  declare status: LoyaltyPromotionStatus;

  @Field(() => LoyaltyPromotionTrigger)
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
  @OneToOne(() => LoyaltyPromotionRules, rules => rules.promotion, { cascade: true })
  declare rules: Relation<LoyaltyPromotionRules>;

  // Targeting
  @OneToOne(() => LoyaltyPromotionTargeting, targeting => targeting.promotion, { cascade: true })
  declare targeting: Relation<LoyaltyPromotionTargeting>;

  // Communication
  @OneToOne(() => LoyaltyPromotionMessaging, messaging => messaging.promotion, { cascade: true })
  declare messaging: Relation<LoyaltyPromotionMessaging>;

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

  @Field(() => Number, { nullable: true })
  get daysUntilStart(): number | null {
    if (!this.startDate) return null;
    const now = new Date()
    const diff = this.startDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field(() => Number, { nullable: true })
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
    return !!(this.rules.eligibleDaysOfWeek?.length || this.rules.eligibleHoursStart || this.rules.eligibleHoursEnd);
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

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class LoyaltyPromotionUpdateInput extends PartialType(
  OmitType(LoyaltyPromotion, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'isScheduled',
    'isCurrentlyActive',
    'isExpired',
    'redemptionRate',
    'averagePointsPerRedemption',
    'averageRevenuePerRedemption',
    'daysUntilStart',
    'daysUntilEnd',
    'hasUsageLimit',
    'isTimeRestricted',
    'displayType',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyPromotionCreateInput extends PartialType(
  OmitType(LoyaltyPromotionUpdateInput, ['id'] as const),
  InputType
) {}