import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray } from 'class-validator';
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
import { OrderItem } from './order-item.model';

@ObjectType('OrderItemCustomization')
@Entity('OrderItemCustomizations')
@Index(['orderItemId'], { unique: true })
export class OrderItemCustomization extends BaseEntity {
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
  declare orderItemId: string;

  @OneToOne(() => OrderItem, orderItem => orderItem.customization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  declare orderItem: Relation<OrderItem>;

  // Customization details
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare size: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare temperature: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare milkType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare sweetness: string;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare extras: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare removals: string[];
}
