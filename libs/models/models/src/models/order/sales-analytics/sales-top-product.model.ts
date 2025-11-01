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

@ObjectType('SalesTopProduct')
@Entity('SalesTopProducts')
@Index(['salesAnalyticsId', 'productId'])
export class SalesTopProduct extends BaseEntity {
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

  @ManyToOne(() => SalesAnalytics, analytics => analytics.topProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salesAnalyticsId' })
  declare salesAnalytics: Relation<SalesAnalytics>;

  // Product details
  @Field()
  @Column('uuid')
  @Index()
  declare productId: string;

  @Field()
  @Column()
  @IsString()
  declare productName: string;

  @Field()
  @Column('int')
  @IsNumber()
  declare quantitySold: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2 })
  @IsNumber()
  declare revenue: number;

  @Field()
  @Column('decimal', { precision: 7, scale: 2 })
  @IsNumber()
  declare growthRate: number;
}
