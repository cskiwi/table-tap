import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsObject, IsEmail, IsPhoneNumber } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { User } from './user.model';
import { Product } from '../order/product.model';
import { Order } from '../order/order.model';
import { Counter } from './counter.model';
import { Employee } from '../employee/employee.model';
import { Configuration } from './configuration.model';
import { LoyaltyAccount } from '../loyalty/loyalty-account.model';
import { LoyaltyTier } from '../loyalty/loyalty-tier.model';
import { LoyaltyTransaction } from '../loyalty/loyalty-transaction.model';
import { LoyaltyReward } from '../loyalty/loyalty-reward.model';
import { LoyaltyRewardRedemption } from '../loyalty/loyalty-reward-redemption.model';
import { LoyaltyChallenge } from '../loyalty/loyalty-challenge.model';
import { LoyaltyPromotion } from '../loyalty/loyalty-promotion.model';

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

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare settings: {
    currency?: string;
    timezone?: string;
    taxRate?: number;
    serviceCharge?: number;
    enableGlassTracking?: boolean;
    enableCredits?: boolean;
    workflowSteps?: string[];
    paymentMethods?: string[];
    orderPrefix?: string;
    receiptFooter?: string;
  };

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare businessHours: {
    [key: string]: {
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
    };
  };

  // Relations
  @OneToMany(() => User, (user) => user.cafe, { cascade: true })
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
