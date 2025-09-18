import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int, Float } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Menu } from './menu.entity';

@ObjectType('OrderItem')
@Entity('OrderItems')
@Index(['orderId', 'menuItemId'])
export class OrderItem extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => Int)
  @Column()
  declare quantity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare unitPrice: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare totalPrice: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare specialInstructions: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare customizations: Record<string, any>;

  @SortableField()
  @Column()
  @Index()
  declare orderId: string;

  @SortableField()
  @Column()
  @Index()
  declare menuItemId: string;

  // Relations
  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Order;

  @Field(() => Menu)
  @ManyToOne(() => Menu, (menuItem) => menuItem.orderItems)
  @JoinColumn({ name: 'menuItemId' })
  declare menuItem: Menu;
}