import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional } from 'class-validator';
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
import { LoyaltyChallenge } from './loyalty-challenge.model';

@ObjectType('LoyaltyChallengeMilestone')
@Entity('LoyaltyChallengeMilestones')
@Index(['challengeId', 'percentage'], { unique: true })
@Index(['challengeId', 'sortOrder'])
export class LoyaltyChallengeMilestone extends BaseEntity {
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
  @Index()
  declare challengeId: string;

  @ManyToOne(() => LoyaltyChallenge, challenge => challenge.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  declare challenge: Relation<LoyaltyChallenge>;

  // Milestone details
  @Field()
  @Column('int')
  @IsNumber()
  declare percentage: number; // 25, 50, 75, 100

  @Field()
  @Column()
  @IsString()
  declare title: string;

  @Field()
  @Column('text')
  @IsString()
  declare description: string;

  // Reward details
  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare rewardPoints: number;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare rewardBadgeId: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare rewardMessage: string;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare sortOrder: number;
}
