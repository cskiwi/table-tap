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
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { LoyaltyReward } from './loyalty-reward.model';

@ObjectType('LoyaltyRewardSpecialProperties')
@Entity('LoyaltyRewardSpecialProperties')
@Index(['loyaltyRewardId'], { unique: true })
export class LoyaltyRewardSpecialProperties extends BaseEntity {
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
  declare loyaltyRewardId: string;

  @OneToOne(() => LoyaltyReward, reward => reward.specialProperties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyRewardId' })
  declare loyaltyReward: Relation<LoyaltyReward>;

  // For free items
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare freeProductId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare freeProductName: string;

  // For experiences
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare experienceType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare experienceLocation: string;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare experienceDuration: number;

  // For merchandise
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare itemSku: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare itemSize: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare itemColor: string;

  // For tier upgrades
  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare upgradeToTierLevel: number;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare upgradeDuration: number; // days

  // For bonus points
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare bonusPointsAmount: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  declare bonusPointsMultiplier: number;
}
