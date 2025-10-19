import { SortableField } from '@app/utils';
import { OrderStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation
} from 'typeorm';
import { Cafe } from '../core/cafe.model';
import { User } from '../core/user.model';
import { OrderItem } from './order-item.model';
import { Payment } from './payment.model';

@ObjectType('Order')
@Entity('Orders')
@Index(['cafeId', 'status'])
@Index(['cafeId', 'orderNumber'])
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

  @SortableField({ nullable: true })
  @DeleteDateColumn({ nullable: true })
  declare deletedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, cafe => cafe.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Order identification
  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare orderNumber: string;

  @Field()
  @Column('enum', { enum: OrderStatus, default: OrderStatus.PENDING })
  @IsEnum(OrderStatus)
  declare status: OrderStatus;

  // Customer information
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index()
  declare customerId: string;

  @ManyToOne(() => User, user => user.orders, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  declare customer: Relation<User>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare customerName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare customerPhone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare customerEmail: string;

  // Employee who created the order (for proxy orders)
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare createdByEmployeeId: string;

  @ManyToOne(() => User, user => user.ordersCreatedByEmployee, { nullable: true })
  @JoinColumn({ name: 'createdByEmployeeId' })
  declare createdByEmployee: Relation<User>;

  // Order details
  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare subtotal: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare taxAmount: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare serviceCharge: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare discountAmount: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare totalAmount: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  get total(): number {
    return this.totalAmount;
  }
  set total(value: number) {
    this.totalAmount = value;
  }

  // Order type and preferences
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare orderType: string; // 'dine_in', 'takeaway', 'delivery'

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare tableNumber: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare specialInstructions: string;

  // Counter assignment
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare counterId: string;

  // Timing
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare estimatedPrepTime: number; // in minutes

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare confirmedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare preparingAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare readyAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare deliveredAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare cancelledAt: Date;

  // Workflow tracking
  @Field({ nullable: true })
  @Column('json', { nullable: true })
  declare workflowSteps: {
    stepName: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedCounterId?: string;
    startedAt?: Date;
    completedAt?: Date;
  }[];

  // Source tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare source: string; // 'app', 'pos', 'web', 'kiosk'

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isPaid: boolean;

  // Relations
  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  declare items: Relation<OrderItem[]>;

  @OneToMany(() => Payment, payment => payment.order)
  declare payments: Relation<Payment[]>;

  // Computed fields
  @Field()
  get isActive(): boolean {
    return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.status);
  }

  @Field()
  get canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  @Field({ nullable: true })
  get currentWorkflowStep(): string | null {
    if (!this.workflowSteps?.length) return null;
    const activeStep = this.workflowSteps.find(step => step.status === 'in_progress');
    return activeStep?.stepName || null;
  }

  @Field({ nullable: true })
  get actualPrepTime(): number | null {
    if (!this.preparingAt || !this.readyAt) return null;
    return Math.round((this.readyAt.getTime() - this.preparingAt.getTime()) / 60000);
  }
}