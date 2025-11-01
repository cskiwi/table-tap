import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsEnum, IsOptional } from 'class-validator';
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
import { CounterProcessingStatus } from '@app/models/enums';
import { OrderItem } from './order-item.model';
import { Counter } from '../../core';

@ObjectType('OrderItemCounterStatus')
@Entity('OrderItemCounterStatuses')
@Index(['orderItemId', 'counterId'])
export class OrderItemCounterStatus extends BaseEntity {
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
  declare orderItemId: string;

  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  declare orderItem: Relation<OrderItem>;

  @Field()
  @Column('uuid')
  @Index()
  declare counterId: string;

  @ManyToOne(() => Counter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counterId' })
  declare counter: Relation<Counter>;

  // Status tracking
  @Field()
  @Column('enum', { enum: CounterProcessingStatus, default: CounterProcessingStatus.PENDING })
  @IsEnum(CounterProcessingStatus)
  declare status: CounterProcessingStatus;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare startedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare completedAt: Date;
}
