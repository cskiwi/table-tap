import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber } from 'class-validator';
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
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';
import { SalesTopProduct } from './sales-top-product.model';
import { SalesCategoryBreakdown } from './sales-category-breakdown.model';
import { SalesPaymentMethodBreakdown } from './sales-payment-method-breakdown.model';
import { SalesOrderTypeBreakdown } from './sales-order-type-breakdown.model';
import { SalesPeakHour } from './sales-peak-hour.model';
import { Cafe } from '../../core';

@ObjectType('SalesAnalytics')
@Entity('SalesAnalytics')
@Index(['cafeId', 'periodType', 'periodStart'])
@Index(['cafeId', 'periodType', 'periodEnd'])
export class SalesAnalytics extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Period definition
  @Field()
  @Column()
  @IsString()
  declare periodType: string;

  @Field()
  @Column('timestamp')
  declare periodStart: Date;

  @Field()
  @Column('timestamp')
  declare periodEnd: Date;

  // Revenue metrics
  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare totalRevenue: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare netRevenue: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare taxCollected: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare serviceCharges: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare discountsGiven: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare refundsIssued: number;

  // Order metrics
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare totalOrders: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare completedOrders: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare cancelledOrders: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare averageOrderValue: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare averageOrderTime: number;

  // Customer metrics
  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare uniqueCustomers: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare newCustomers: number;

  @Field()
  @Column('int', { default: 0 })
  @IsNumber()
  declare returningCustomers: number;

  // Product metrics (now in separate tables)
  @OneToMany(() => SalesTopProduct, topProduct => topProduct.salesAnalytics, { cascade: true })
  declare topProducts: Relation<SalesTopProduct[]>;

  @OneToMany(() => SalesCategoryBreakdown, categoryBreakdown => categoryBreakdown.salesAnalytics, { cascade: true })
  declare categoryBreakdowns: Relation<SalesCategoryBreakdown[]>;

  // Payment method breakdown (now in separate table)
  @OneToOne(() => SalesPaymentMethodBreakdown, paymentBreakdown => paymentBreakdown.salesAnalytics, { cascade: true, nullable: true })
  declare paymentMethodBreakdown: Relation<SalesPaymentMethodBreakdown>;

  // Order type breakdown (now in separate table)
  @OneToOne(() => SalesOrderTypeBreakdown, orderBreakdown => orderBreakdown.salesAnalytics, { cascade: true, nullable: true })
  declare orderTypeBreakdown: Relation<SalesOrderTypeBreakdown>;

  // Peak performance (now in separate table)
  @OneToMany(() => SalesPeakHour, peakHour => peakHour.salesAnalytics, { cascade: true })
  declare peakHours: Relation<SalesPeakHour[]>;

  // Growth metrics
  @Field()
  @Column('decimal', { precision: 7, scale: 2, default: 0 })
  @IsNumber()
  declare revenueGrowthRate: number;

  @Field()
  @Column('decimal', { precision: 7, scale: 2, default: 0 })
  @IsNumber()
  declare orderGrowthRate: number;

  // Additional metrics - kept as JSON for flexible custom metrics
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  declare additionalMetrics: string; // JSON string for flexible storage

  // Computed fields
  @Field()
  get conversionRate(): number {
    if (this.totalOrders === 0) return 0;
    return (this.completedOrders / this.totalOrders) * 100;
  }

  @Field()
  get cancellationRate(): number {
    if (this.totalOrders === 0) return 0;
    return (this.cancelledOrders / this.totalOrders) * 100;
  }

  @Field()
  get repeatCustomerRate(): number {
    if (this.uniqueCustomers === 0) return 0;
    return (this.returningCustomers / this.uniqueCustomers) * 100;
  }

  @Field()
  get profitMargin(): number {
    if (this.totalRevenue === 0) return 0;
    return ((this.netRevenue - this.discountsGiven - this.refundsIssued) / this.totalRevenue) * 100;
  }
}
