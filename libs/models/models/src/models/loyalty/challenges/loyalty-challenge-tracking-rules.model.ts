import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';
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

@ObjectType('LoyaltyChallengeTrackingRules')
@Entity('LoyaltyChallengeTrackingRules')
@Index(['challengeId'], { unique: true })
export class LoyaltyChallengeTrackingRules extends BaseEntity {
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

  @OneToOne(() => LoyaltyChallenge, challenge => challenge.trackingRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  declare challenge: Relation<LoyaltyChallenge>;

  // What counts towards progress
  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare countOnlyCompletedOrders: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare countOnlyPaidOrders: boolean;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare minimumOrderValue: number;

  // Reset conditions
  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare resetOnFailedDay: boolean;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare allowMissedDays: number;

  // Timing rules
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare trackingStartTime: string; // '00:00' for daily challenges

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare trackingEndTime: string; // '23:59' for daily challenges

  // Exclusions
  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare excludeRefunds: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare excludeCancellations: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare excludeEmployeeOrders: boolean;
}
