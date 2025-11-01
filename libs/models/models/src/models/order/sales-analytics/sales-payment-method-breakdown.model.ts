import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
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
import { SalesAnalytics } from './sales-analytics.model';

@ObjectType('SalesPaymentMethodBreakdown')
@Entity('SalesPaymentMethodBreakdowns')
@Index(['salesAnalyticsId'], { unique: true })
export class SalesPaymentMethodBreakdown extends BaseEntity {
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
  declare salesAnalyticsId: string;

  @OneToOne(() => SalesAnalytics, analytics => analytics.paymentMethodBreakdown, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salesAnalyticsId' })
  declare salesAnalytics: Relation<SalesAnalytics>;

  // Payment method breakdown
  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare card: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare cash: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare digital: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare other: number;
}
