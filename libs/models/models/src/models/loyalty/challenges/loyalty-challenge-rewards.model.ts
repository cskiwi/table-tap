import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { LoyaltyChallenge } from './loyalty-challenge.model';

@ObjectType('LoyaltyChallengeRewards')
@Entity('LoyaltyChallengeRewards')
@Index(['challengeId'], { unique: true })
export class LoyaltyChallengeRewards extends BaseEntity {
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
  declare challengeId: string;

  @OneToOne(() => LoyaltyChallenge, challenge => challenge.rewards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  declare challenge: Relation<LoyaltyChallenge>;

  // Points rewards
  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare completionPoints: number;

  @Field(() => [Number], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare milestonePoints: number[]; // Points for reaching milestones

  // Badge rewards
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare badgeId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare badgeName: string;

  // Special rewards
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare rewardId: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare freeItemId: string;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountPercentage: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountAmount: number;

  // Tier benefits
  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare tierBonusMultiplier: number;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare temporaryTierUpgrade: number; // Upgrade tier level for X days

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare temporaryTierDays: number;

  // Experience rewards
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare experienceType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare experienceValue: string;
}
