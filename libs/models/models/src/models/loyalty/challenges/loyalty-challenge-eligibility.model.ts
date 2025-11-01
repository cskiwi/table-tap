import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsArray, IsOptional } from 'class-validator';
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

@ObjectType('LoyaltyChallengeEligibility')
@Entity('LoyaltyChallengeEligibility')
@Index(['challengeId'], { unique: true })
export class LoyaltyChallengeEligibility extends BaseEntity {
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

  @OneToOne(() => LoyaltyChallenge, challenge => challenge.eligibility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  declare challenge: Relation<LoyaltyChallenge>;

  // Tier restrictions
  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare minTierLevel: number;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare maxTierLevel: number;

  @Field(() => [Number], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare eligibleTierLevels: number[];

  // Customer restrictions
  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare newMembersOnly: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare existingMembersOnly: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare vipMembersOnly: boolean;

  // Activity restrictions
  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare minOrdersLast30Days: number;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare maxOrdersLast30Days: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare minSpendLast30Days: number;

  // Demographics
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare ageGroups: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare locations: string[];

  // Previous participation
  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare excludePreviousWinners: boolean;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare excludeRecentParticipants: number; // Exclude if participated in last X days
}
