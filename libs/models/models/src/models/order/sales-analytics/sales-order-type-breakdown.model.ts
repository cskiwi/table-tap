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

@ObjectType('SalesOrderTypeBreakdown')
@Entity('SalesOrderTypeBreakdowns')
@Index(['salesAnalyticsId'], { unique: true })
export class SalesOrderTypeBreakdown extends BaseEntity {
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

  @OneToOne(() => SalesAnalytics, analytics => analytics.orderTypeBreakdown, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salesAnalyticsId' })
  declare salesAnalytics: Relation<SalesAnalytics>;

  // Order type breakdown
  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare dineIn: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare takeaway: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @IsNumber()
  declare delivery: number;
}
