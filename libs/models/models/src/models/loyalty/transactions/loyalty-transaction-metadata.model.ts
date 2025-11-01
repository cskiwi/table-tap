import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
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
import { LoyaltyTransaction } from './loyalty-transaction.model';

@ObjectType('LoyaltyTransactionMetadata')
@Entity('LoyaltyTransactionMetadata')
@Index(['transactionId'], { unique: true })
export class LoyaltyTransactionMetadata extends BaseEntity {
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
  declare transactionId: string;

  @OneToOne(() => LoyaltyTransaction, transaction => transaction.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  declare transaction: Relation<LoyaltyTransaction>;

  // For earned points
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare productIds: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare categoryIds: string[];

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare multiplierApplied: number;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare promotionId: string;

  // For redeemed points
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare rewardId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare rewardName: string;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountAmount: number;

  // For referrals
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare referredUserId: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare referrerUserId: string;

  // Tier progression
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare previousTierId: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare newTierId: string;
}
