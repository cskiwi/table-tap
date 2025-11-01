import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsArray } from 'class-validator';
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

@ObjectType('LoyaltyRewardApplicableProducts')
@Entity('LoyaltyRewardApplicableProducts')
@Index(['loyaltyRewardId'], { unique: true })
export class LoyaltyRewardApplicableProducts extends BaseEntity {
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

  @OneToOne(() => LoyaltyReward, reward => reward.applicableProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyRewardId' })
  declare loyaltyReward: Relation<LoyaltyReward>;

  // Product restrictions
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare productIds: string[];

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare categoryIds: string[];

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare excludeProductIds: string[];

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare excludeCategoryIds: string[];
}
