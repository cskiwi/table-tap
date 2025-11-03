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
import { LoyaltyPromotion } from './loyalty-promotion.model';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('LoyaltyPromotionTargeting')
@Entity('LoyaltyPromotionTargeting')
@Index(['promotionId'], { unique: true })
export class LoyaltyPromotionTargeting extends BaseEntity {
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
  declare promotionId: string;

  @OneToOne(() => LoyaltyPromotion, promotion => promotion.targeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotionId' })
  declare promotion: Relation<LoyaltyPromotion>;

  // Geographic targeting
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare locations: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare excludeLocations: string[];

  // Customer segments
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare customerSegments: string[];

  @Field(() => [Number], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare loyaltyTiers: number[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare ageGroups: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare genderTargeting: string[];

  // Behavioral targeting
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare orderFrequency: string; // 'high', 'medium', 'low'

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare averageOrderValueMin: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare averageOrderValueMax: number;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare preferredCategories: string[];

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare lastOrderDaysMin: number; // Days since last order

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare lastOrderDaysMax: number;

  // Custom attributes (keeping as JSON since it's truly dynamic)
  @Field(() => GraphQLJSONObject,{ nullable: true })
  @Column('json', { nullable: true })
  @IsOptional()
  declare customAttributes: Record<string, any>;
}
