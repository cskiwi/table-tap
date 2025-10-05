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
  Relation,
} from 'typeorm';
import { Cafe } from '../core/cafe.model';

export enum LoyaltyChallengeType {
  ORDER_COUNT = 'order_count',
  SPEND_AMOUNT = 'spend_amount',
  POINTS_EARNED = 'points_earned',
  PRODUCT_VARIETY = 'product_variety',
  CATEGORY_EXPLORATION = 'category_exploration',
  CONSECUTIVE_DAYS = 'consecutive_days',
  WEEKLY_VISITS = 'weekly_visits',
  MONTHLY_GOAL = 'monthly_goal',
  REFERRAL_COUNT = 'referral_count',
  REVIEW_COUNT = 'review_count',
  SOCIAL_SHARING = 'social_sharing',
  CUSTOM = 'custom',
}

export enum LoyaltyChallengeStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum LoyaltyChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export enum LoyaltyChallengeFrequency {
  ONE_TIME = 'one_time',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
}

@ObjectType('LoyaltyChallenge')
@Entity('LoyaltyChallenges')
@Index(['cafeId', 'isActive'])
@Index(['type', 'difficulty'])
@Index(['startDate', 'endDate'])
export class LoyaltyChallenge extends BaseEntity {
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

  @ManyToOne(() => Cafe, (cafe) => cafe.loyaltyChallenges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Challenge identification
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
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare shortDescription: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare icon: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare image: string;

  @Field()
  @Column('enum', { enum: LoyaltyChallengeType })
  @IsEnum(LoyaltyChallengeType)
  declare type: LoyaltyChallengeType;

  @Field()
  @Column('enum', { enum: LoyaltyChallengeStatus, default: LoyaltyChallengeStatus.DRAFT })
  @IsEnum(LoyaltyChallengeStatus)
  declare status: LoyaltyChallengeStatus;

  @Field()
  @Column('enum', { enum: LoyaltyChallengeDifficulty })
  @IsEnum(LoyaltyChallengeDifficulty)
  declare difficulty: LoyaltyChallengeDifficulty;

  @Field()
  @Column('enum', { enum: LoyaltyChallengeFrequency })
  @IsEnum(LoyaltyChallengeFrequency)
  declare frequency: LoyaltyChallengeFrequency;

  // Timing
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare startDate: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare endDate: Date;

  @Field()
  @Column('int', { default: 30 })
  @IsNumber()
  declare durationDays: number; // Duration for completion

  // Challenge goals and rules
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare goals: {
    // Numeric targets
    targetValue?: number; // e.g., 5 orders, $100 spend, 500 points
    minimumOrderValue?: number;

    // Product/category specific
    requiredProductIds?: string[];
    requiredCategoryIds?: string[];
    uniqueProductsCount?: number;
    uniqueCategoriesCount?: number;

    // Time-based goals
    consecutiveDays?: number;
    dailyTarget?: number;
    weeklyTarget?: number;

    // Social/referral goals
    referralsNeeded?: number;
    reviewsNeeded?: number;
    socialShares?: number;

    // Custom goals
    customMetric?: string;
    customTarget?: number;
  };

  // Progress tracking rules
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare trackingRules: {
    // What counts towards progress
    countOnlyCompletedOrders?: boolean;
    countOnlyPaidOrders?: boolean;
    minimumOrderValue?: number;

    // Reset conditions
    resetOnFailedDay?: boolean;
    allowMissedDays?: number;

    // Timing rules
    trackingStartTime?: string; // '00:00' for daily challenges
    trackingEndTime?: string; // '23:59' for daily challenges

    // Exclusions
    excludeRefunds?: boolean;
    excludeCancellations?: boolean;
    excludeEmployeeOrders?: boolean;
  };

  // Rewards
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare rewards: {
    // Points rewards
    completionPoints?: number;
    milestonePoints?: number[]; // Points for reaching milestones

    // Badge rewards
    badgeId?: string;
    badgeName?: string;

    // Special rewards
    rewardId?: string;
    freeItemId?: string;
    discountPercentage?: number;
    discountAmount?: number;

    // Tier benefits
    tierBonusMultiplier?: number;
    temporaryTierUpgrade?: number; // Upgrade tier level for X days
    temporaryTierDays?: number;

    // Experience rewards
    experienceType?: string;
    experienceValue?: string;
  };

  // Eligibility and restrictions
  @Field()
  @Column('json', { default: () => "'{}'" })
  @IsObject()
  declare eligibility: {
    // Tier restrictions
    minTierLevel?: number;
    maxTierLevel?: number;
    eligibleTierLevels?: number[];

    // Customer restrictions
    newMembersOnly?: boolean;
    existingMembersOnly?: boolean;
    vipMembersOnly?: boolean;

    // Activity restrictions
    minOrdersLast30Days?: number;
    maxOrdersLast30Days?: number;
    minSpendLast30Days?: number;

    // Demographics
    ageGroups?: string[];
    locations?: string[];

    // Previous participation
    excludePreviousWinners?: boolean;
    excludeRecentParticipants?: number; // Exclude if participated in last X days
  };

  // Display and gamification
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare priority: number; // Display priority

  @Field()
  @Column({ default: '#3B82F6' })
  @IsString()
  declare color: string;

  @Field()
  @Column('json', { default: () => "'[]'" })
  @IsArray()
  declare tags: string[];

  @Field()
  @Column('json', { default: () => "'[]'" })
  @IsArray()
  declare milestones: {
    percentage: number; // 25, 50, 75, 100
    title: string;
    description: string;
    reward?: {
      points?: number;
      badgeId?: string;
      message?: string;
    };
  }[];

  // Analytics
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare participantCount: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare completionCount: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare totalPointsAwarded: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastCompletedAt: Date;

  // Configuration
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isVisible: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isFeatured: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare autoStart: boolean; // Automatically start for eligible users

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare allowMultipleParticipants: boolean;

  // Computed fields
  @Field()
  get isCurrentlyActive(): boolean {
    if (this.status !== LoyaltyChallengeStatus.ACTIVE) return false;

    const now = new Date();
    if (this.startDate && this.startDate > now) return false;
    if (this.endDate && this.endDate < now) return false;

    return true;
  }

  @Field()
  get isExpired(): boolean {
    return this.endDate !== null && this.endDate < new Date();
  }

  @Field()
  get completionRate(): number {
    return this.participantCount > 0 ? (this.completionCount / this.participantCount) * 100 : 0;
  }

  @Field()
  get averagePointsPerCompletion(): number {
    return this.completionCount > 0 ? this.totalPointsAwarded / this.completionCount : 0;
  }

  @Field({ nullable: true })
  get daysUntilStart(): number | null {
    if (!this.startDate) return null;
    const now = new Date();
    const diff = this.startDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field({ nullable: true })
  get daysUntilEnd(): number | null {
    if (!this.endDate) return null;
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @Field()
  get difficultyColor(): string {
    switch (this.difficulty) {
      case LoyaltyChallengeDifficulty.EASY:
        return '#10B981'; // Green
      case LoyaltyChallengeDifficulty.MEDIUM:
        return '#F59E0B'; // Yellow
      case LoyaltyChallengeDifficulty.HARD:
        return '#EF4444'; // Red
      case LoyaltyChallengeDifficulty.EXPERT:
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  }

  @Field()
  get difficultyStars(): number {
    switch (this.difficulty) {
      case LoyaltyChallengeDifficulty.EASY:
        return 1;
      case LoyaltyChallengeDifficulty.MEDIUM:
        return 2;
      case LoyaltyChallengeDifficulty.HARD:
        return 3;
      case LoyaltyChallengeDifficulty.EXPERT:
        return 4;
      default:
        return 1;
    }
  }

  @Field()
  get displayType(): string {
    switch (this.type) {
      case LoyaltyChallengeType.ORDER_COUNT:
        return 'Order Challenge';
      case LoyaltyChallengeType.SPEND_AMOUNT:
        return 'Spending Challenge';
      case LoyaltyChallengeType.POINTS_EARNED:
        return 'Points Challenge';
      case LoyaltyChallengeType.PRODUCT_VARIETY:
        return 'Variety Challenge';
      case LoyaltyChallengeType.CATEGORY_EXPLORATION:
        return 'Explorer Challenge';
      case LoyaltyChallengeType.CONSECUTIVE_DAYS:
        return 'Streak Challenge';
      case LoyaltyChallengeType.WEEKLY_VISITS:
        return 'Weekly Challenge';
      case LoyaltyChallengeType.MONTHLY_GOAL:
        return 'Monthly Challenge';
      case LoyaltyChallengeType.REFERRAL_COUNT:
        return 'Referral Challenge';
      case LoyaltyChallengeType.SOCIAL_SHARING:
        return 'Social Challenge';
      default:
        return 'Challenge';
    }
  }
}
