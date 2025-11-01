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
  ManyToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { SalesAnalytics } from './sales-analytics.model';

@ObjectType('SalesPeakHour')
@Entity('SalesPeakHours')
@Index(['salesAnalyticsId', 'hour'])
export class SalesPeakHour extends BaseEntity {
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
  @Index()
  declare salesAnalyticsId: string;

  @ManyToOne(() => SalesAnalytics, analytics => analytics.peakHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salesAnalyticsId' })
  declare salesAnalytics: Relation<SalesAnalytics>;

  // Peak hour details
  @Field()
  @Column('int')
  @IsNumber()
  declare hour: number; // 0-23

  @Field()
  @Column('int')
  @IsNumber()
  declare orderCount: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2 })
  @IsNumber()
  declare revenue: number;
}
