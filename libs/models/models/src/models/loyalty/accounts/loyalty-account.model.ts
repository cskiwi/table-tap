import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsDate, IsBoolean } from 'class-validator';
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
import { LoyaltyAccountBadge } from './loyalty-account-badge.model';
import { LoyaltyAccountChallengeProgress } from './loyalty-account-challenge-progress.model';
import { LoyaltyAccountPreferences } from './loyalty-account-preferences.model';
import { Cafe, User } from '../../core';
import { LoyaltyTier } from '../tiers';
import { LoyaltyTransaction } from '../transactions';

@ObjectType('LoyaltyAccount')
@Entity('LoyaltyAccounts')
@Index(['cafeId', 'userId'], { unique: true })
@Index(['cafeId', 'currentTierId'])
export class LoyaltyAccount extends BaseEntity {
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

  @ManyToOne(() => Cafe, cafe => cafe.loyaltyAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // User relationship
  @Field()
  @Column('uuid')
  @Index()
  declare userId: string;

  @ManyToOne(() => User, user => user.loyaltyAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Account identification
  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare loyaltyNumber: string;

  // Points and tier
  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare currentPoints: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare lifetimePoints: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare pointsRedeemed: number;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare currentTierId: string;

  @ManyToOne(() => LoyaltyTier, tier => tier.loyaltyAccounts, { nullable: true })
  @JoinColumn({ name: 'currentTierId' })
  declare currentTier: Relation<LoyaltyTier>;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare tierAchievedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare tierExpiresAt: Date;

  // Spending and activity tracking
  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare totalSpent: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare yearlySpent: number; // For tier maintenance

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare totalOrders: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare yearlyOrders: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastActivityAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastOrderAt: Date;

  // Special dates and rewards
  @Field({ nullable: true })
  @Column('date', { nullable: true })
  @IsDate()
  @IsOptional()
  declare birthDate: Date;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  @IsDate()
  @IsOptional()
  declare anniversaryDate: Date; // First order date or membership date

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastBirthdayRewardAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastAnniversaryRewardAt: Date;

  // Referral program
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare referralCount: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare referralBonusEarned: number;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare referredByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referredByUserId' })
  declare referredByUser: Relation<User>;

  // Gamification (now in separate tables)
  @OneToMany(() => LoyaltyAccountBadge, badge => badge.loyaltyAccount, { cascade: true })
  declare badges: Relation<LoyaltyAccountBadge[]>;

  @OneToMany(() => LoyaltyAccountChallengeProgress, progress => progress.loyaltyAccount, { cascade: true })
  declare challengeProgresses: Relation<LoyaltyAccountChallengeProgress[]>;

  // Preferences (now in separate table)
  @OneToOne(() => LoyaltyAccountPreferences, preferences => preferences.loyaltyAccount, { cascade: true, nullable: true })
  declare preferences: Relation<LoyaltyAccountPreferences>;

  // Account status
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isVip: boolean;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Relations
  @OneToMany(() => LoyaltyTransaction, transaction => transaction.loyaltyAccount)
  declare transactions: Relation<LoyaltyTransaction[]>

  // Computed fields
  @Field()
  get availablePoints(): number {
    return this.currentPoints;
  }

  @Field()
  get pointsToNextTier(): number {
    // This would be calculated based on the next tier's requirements
    // For now, returning a placeholder
    return 1000; // This should be calculated dynamically
  }

  @Field()
  get tierProgress(): number {
    // Calculate progress as percentage to next tier
    const current = this.currentPoints;
    const needed = this.pointsToNextTier;
    return needed > 0 ? Math.min((current / (current + needed)) * 100, 100) : 100;
  }

  @Field()
  get isBirthdayMonth(): boolean {
    if (!this.birthDate) return false;
    const now = new Date()
    return this.birthDate.getMonth() === now.getMonth()
  }

  @Field()
  get isAnniversaryMonth(): boolean {
    if (!this.anniversaryDate) return false;
    const now = new Date()
    return this.anniversaryDate.getMonth() === now.getMonth()
  }

  @Field()
  get daysSinceLastActivity(): number {
    if (!this.lastActivityAt) return 999;
    const now = new Date()
    return Math.floor((now.getTime() - this.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  @Field()
  get badgeCount(): number {
    return this.badges?.length || 0;
  }

  @Field()
  get activeChallenges(): number {
    if (!this.challengeProgresses) return 0;
    return Object.values(this.challengeProgresses).filter(
      challenge => !challenge.completedAt
    ).length;
  }
}
