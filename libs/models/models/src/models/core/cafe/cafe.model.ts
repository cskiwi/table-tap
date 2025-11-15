import { SortableField } from '@app/utils';
import { Field, ID, InputType, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Employee } from '../../employee';
import {
  LoyaltyAccount,
  LoyaltyChallenge,
  LoyaltyPromotion,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyTier,
  LoyaltyTransaction,
} from '../../loyalty';
import { Order, Product } from '../../order';
import { Configuration } from '../configuration';
import { Counter } from '../counter';
import { User } from '../user';
import { CafeBusinessHours } from './cafe-business-hours.model';
import { CafeHostname } from './cafe-hostname.model';
import { CafeSettings } from './cafe-settings.model';

@ObjectType('Cafe')
@Entity('Cafes')
export class Cafe extends BaseEntity {
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

  @Field()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare city: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare country: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare zipCode: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsEmail()
  @IsOptional()
  declare email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  declare phone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare logo: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare website: string;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: 'active' })
  @IsString()
  @IsOptional()
  declare status: string;

  // Relations to settings and business hours
  @OneToOne(() => CafeSettings, (settings) => settings.cafe, { cascade: true })
  declare settings: Relation<CafeSettings>;

  @OneToMany(() => CafeBusinessHours, (hours) => hours.cafe, { cascade: true })
  declare businessHours: Relation<CafeBusinessHours[]>;

  @OneToMany(() => CafeHostname, (hostname) => hostname.cafe, { cascade: true })
  declare hostnames: Relation<CafeHostname[]>;

  // Relations - Many-to-many relationship with users through UserCafes join table
  @ManyToMany(() => User, (user) => user.cafes)
  declare users: Relation<User[]>;

  @OneToMany(() => Product, (product) => product.cafe, { cascade: true })
  declare products: Relation<Product[]>;

  @OneToMany(() => Order, (order) => order.cafe, { cascade: true })
  declare orders: Relation<Order[]>;

  @OneToMany(() => Counter, (counter) => counter.cafe, { cascade: true })
  declare counters: Relation<Counter[]>;

  @OneToMany(() => Employee, (employee) => employee.cafe, { cascade: true })
  declare employees: Relation<Employee[]>;

  @OneToMany(() => Configuration, (config) => config.cafe, { cascade: true })
  declare configurations: Relation<Configuration[]>;

  @OneToMany(() => LoyaltyAccount, (account) => account.cafe, { cascade: true })
  declare loyaltyAccounts: Relation<LoyaltyAccount[]>;

  @OneToMany(() => LoyaltyTier, (tier) => tier.cafe, { cascade: true })
  declare loyaltyTiers: Relation<LoyaltyTier[]>;

  @OneToMany(() => LoyaltyTransaction, (transaction) => transaction.cafe, { cascade: true })
  declare loyaltyTransactions: Relation<LoyaltyTransaction[]>;

  @OneToMany(() => LoyaltyReward, (reward) => reward.cafe, { cascade: true })
  declare loyaltyRewards: Relation<LoyaltyReward[]>;

  @OneToMany(() => LoyaltyRewardRedemption, (redemption) => redemption.cafe, { cascade: true })
  declare loyaltyRedemptions: Relation<LoyaltyRewardRedemption[]>;

  @OneToMany(() => LoyaltyChallenge, (challenge) => challenge.cafe, { cascade: true })
  declare loyaltyChallenges: Relation<LoyaltyChallenge[]>;

  @OneToMany(() => LoyaltyPromotion, (promotion) => promotion.cafe, { cascade: true })
  declare loyaltyPromotions: Relation<LoyaltyPromotion[]>;
}
