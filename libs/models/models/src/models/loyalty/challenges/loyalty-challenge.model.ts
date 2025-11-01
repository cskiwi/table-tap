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
  OneToMany,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { LoyaltyChallengeType, LoyaltyChallengeStatus, LoyaltyChallengeDifficulty, LoyaltyChallengeFrequency } from '@app/models/enums';
import { LoyaltyChallengeMilestone } from './loyalty-challenge-milestone.model';
import { LoyaltyChallengeGoals } from './loyalty-challenge-goals.model';
import { LoyaltyChallengeTrackingRules } from './loyalty-challenge-tracking-rules.model';
import { LoyaltyChallengeRewards } from './loyalty-challenge-rewards.model';
import { LoyaltyChallengeEligibility } from './loyalty-challenge-eligibility.model';
import { Cafe } from '../../core';

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
  @OneToOne(() => LoyaltyChallengeGoals, goals => goals.challenge, { cascade: true })
  declare goals: Relation<LoyaltyChallengeGoals>;

  // Progress tracking rules
  @OneToOne(() => LoyaltyChallengeTrackingRules, trackingRules => trackingRules.challenge, { cascade: true })
  declare trackingRules: Relation<LoyaltyChallengeTrackingRules>;

  // Rewards
  @OneToOne(() => LoyaltyChallengeRewards, rewards => rewards.challenge, { cascade: true })
  declare rewards: Relation<LoyaltyChallengeRewards>;

  // Eligibility and restrictions
  @OneToOne(() => LoyaltyChallengeEligibility, eligibility => eligibility.challenge, { cascade: true })
  declare eligibility: Relation<LoyaltyChallengeEligibility>;

  // Display and gamification
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare priority: number; // Display priority

  @Field()
  @Column({ default: '#3B82F6' })
  @IsString()
  declare color: string;

  @Field(() => [String])
  @Column('simple-array', { default: '' })
  @IsArray()
  declare tags: string[];

  @OneToMany(() => LoyaltyChallengeMilestone, milestone => milestone.challenge, { cascade: true })
  declare milestones: Relation<LoyaltyChallengeMilestone[]>;

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

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class LoyaltyChallengeUpdateInput extends PartialType(
  OmitType(LoyaltyChallenge, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'isCurrentlyActive',
    'isExpired',
    'completionRate',
    'averagePointsPerCompletion',
    'daysUntilStart',
    'daysUntilEnd',
    'difficultyColor',
    'difficultyStars',
    'displayType',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyChallengeCreateInput extends PartialType(
  OmitType(LoyaltyChallengeUpdateInput, ['id'] as const),
  InputType
) {}
