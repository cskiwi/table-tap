import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';
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
import { LoyaltyTier } from './loyalty-tier.model';

@ObjectType('LoyaltyTierBenefit')
@Entity('LoyaltyTierBenefits')
@Index(['loyaltyTierId'], { unique: true })
export class LoyaltyTierBenefit extends BaseEntity {
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
  declare loyaltyTierId: string;

  @OneToOne(() => LoyaltyTier, tier => tier.benefit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyTierId' })
  declare loyaltyTier: Relation<LoyaltyTier>;

  // Free items benefits
  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare freeItemsPerMonth: number;

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare freeItemCategories: string[];

  // Special access
  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare earlyAccess: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare exclusiveOffers: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare personalizedService: boolean;

  // Birthday benefits
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare birthdayBonus: number;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare birthdayFreeItem: boolean;

  // Other perks
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare doublePointsDays: string[]; // ['monday', 'friday']

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare specialEventInvites: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare customizations: boolean;
}
