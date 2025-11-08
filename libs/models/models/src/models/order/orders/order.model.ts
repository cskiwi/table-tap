import { OrderPriority, OrderStatus } from '@app/models/enums';
import { SortableField } from '@app/utils';
import { Field, ID, InputType, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
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
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { OrderItem } from './order-item.model';
import { OrderWorkflowStep } from './order-workflow-step.model';
import { Cafe, User } from '../../core';
import { Payment } from '../payments';

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

  @Field(() => OrderStatus)
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

  // Employee assigned to prepare this order
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare assignedStaffId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedStaffId' })
  declare assignedStaff: Relation<User>;

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

  // Order priority
  @Field(() => OrderPriority, { nullable: true })
  @Column('enum', { enum: OrderPriority, default: OrderPriority.NORMAL, nullable: true })
  @IsEnum(OrderPriority)
  @IsOptional()
  declare priority: OrderPriority;

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
  @OneToMany(() => OrderWorkflowStep, step => step.order, { cascade: true })
  declare workflowSteps: Relation<OrderWorkflowStep[]>;

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
  @Field(() => Boolean)
  get isActive(): boolean {
    return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.status);
  }

  @Field(() => Boolean)
  get canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  @Field(() => String, { nullable: true })
  get currentWorkflowStep(): string | null {
    if (!this.workflowSteps?.length) return null;
    const activeStep = this.workflowSteps.find(step => step.status === 'in_progress');
    return activeStep?.stepName || null;
  }

  @Field(() => Number, { nullable: true })
  get actualPrepTime(): number | null {
    if (!this.preparingAt || !this.readyAt) return null;
    return Math.round((this.readyAt.getTime() - this.preparingAt.getTime()) / 60000);
  }
}


