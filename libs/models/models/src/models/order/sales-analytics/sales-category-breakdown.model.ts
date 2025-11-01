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
  Relation
} from 'typeorm';
import { SalesAnalytics } from './sales-analytics.model';

@ObjectType('SalesCategoryBreakdown')
@Entity('SalesCategoryBreakdowns')
@Index(['salesAnalyticsId', 'category'])
export class SalesCategoryBreakdown extends BaseEntity {
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

  @ManyToOne(() => SalesAnalytics, analytics => analytics.categoryBreakdowns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salesAnalyticsId' })
  declare salesAnalytics: Relation<SalesAnalytics>;

  // Category details
  @Field()
  @Column()
  @IsString()
  declare category: string;

  @Field()
  @Column('int')
  @IsNumber()
  declare quantitySold: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2 })
  @IsNumber()
  declare revenue: number;

  @Field()
  @Column('decimal', { precision: 5, scale: 2 })
  @IsNumber()
  declare percentage: number;
}
