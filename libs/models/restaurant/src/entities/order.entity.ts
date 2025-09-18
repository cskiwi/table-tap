import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '@app/models';
import { Cafe } from './cafe.entity';
import { Counter } from './counter.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderType } from '../enums/order-type.enum';

@ObjectType('Order')
@Entity('Orders')
@Index(['cafeId', 'status', 'createdAt'])
@Index(['customerId', 'createdAt'])
@Index(['orderNumber'], { unique: true })
export class Order extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column({ unique: true })
  @Index()
  declare orderNumber: string;

  @Field(() => OrderStatus)
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index()
  declare status: OrderStatus;

  @Field(() => OrderType)
  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.DINE_IN,
  })
  declare type: OrderType;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare subtotal: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare tax: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare tip: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare discount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare total: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare notes: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare estimatedReadyTime: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare readyTime: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare completedTime: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare tableNumber: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare customerId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare counterId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, (cafe) => cafe.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  declare customer: User;

  @Field(() => Counter, { nullable: true })
  @ManyToOne(() => Counter, (counter) => counter.orders, { nullable: true })
  @JoinColumn({ name: 'counterId' })
  declare counter: Counter;

  @Field(() => [OrderItem])
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  declare items: OrderItem[];

  @Field(() => [Payment], { nullable: true })
  @OneToMany(() => Payment, (payment) => payment.order)
  declare payments: Payment[];
}