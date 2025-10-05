import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsObject, IsArray } from 'class-validator';
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
  Relation
} from 'typeorm';
import { Cafe } from '../core/cafe.model';
import { LoyaltyAccount } from './loyalty-account.model';

@ObjectType('LoyaltyTier')
@Entity('LoyaltyTiers')
@Index(['cafeId', 'level'])
@Index(['cafeId', 'isActive'])
export class LoyaltyTier extends BaseEntity {
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

  @ManyToOne(() => Cafe, cafe => cafe.loyaltyTiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Tier information
  @Field()
  @Column()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @Field()
  @Column('int')
  @IsNumber()
  @Index()
  declare level: number; // 1 = Bronze, 2 = Silver, 3 = Gold, 4 = Platinum, etc.

  @Field()
  @Column({ default: '#6B7280' })
  @IsString()
  declare color: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare icon: string;

  // Requirements to reach this tier
  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare pointsRequired: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare totalSpendRequired: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare ordersRequired: number;

  // Benefits
  @Field()
  @Column('decimal', { precision: 5, scale: 4, default: 1 })
  @IsNumber()
  declare pointsMultiplier: number; // 1.0 = 1x points, 1.5 = 1.5x points

  @Field()
  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  @IsNumber()
  declare discountPercentage: number; // 0.05 = 5% discount

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare freeDeliveryThreshold: number; // Free delivery above this amount

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare priority: number; // Higher number = higher priority in queues

  // Special benefits
  @Field()
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare benefits: {
    // Free items
    freeItemsPerMonth?: number;
    freeItemCategories?: string[]

    // Special access
    earlyAccess?: boolean;
    exclusiveOffers?: boolean;
    personalizedService?: boolean;

    // Birthday benefits
    birthdayBonus?: number;
    birthdayFreeItem?: boolean;

    // Other perks
    doublePointsDays?: string[]; // ['monday', 'friday']
    specialEventInvites?: boolean;
    customizations?: boolean;
  }

  // Tier maintenance
  @Field()
  @Column('int', { default: 365 })
  @IsNumber()
  declare validityDays: number; // Days to maintain tier without activity

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare maintenanceSpendRequired: number; // Annual spend to maintain tier

  @Field()
  @Column({ default: true })
  declare isActive: boolean;

  // Relations
  @OneToMany(() => LoyaltyAccount, account => account.currentTier)
  declare loyaltyAccounts: Relation<LoyaltyAccount[]>

  // Computed fields
  @Field()
  get tierName(): string {
    return `${this.name} (Level ${this.level})`;
  }

  @Field()
  get hasSpecialBenefits(): boolean {
    return this.benefits && Object.keys(this.benefits).length > 0;
  }

  @Field()
  get isTopTier(): boolean {
    // This would be calculated based on whether this is the highest level tier
    return this.level >= 5; // Assuming 5+ is top tier
  }

  // Aliases for frontend compatibility
  @Field()
  get minPoints(): number {
    return this.pointsRequired;
  }

  @Field()
  get minAnnualSpending(): number {
    return this.maintenanceSpendRequired;
  }
}