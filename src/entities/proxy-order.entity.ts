import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
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
import { Employee } from './employee.entity';
import { Order } from './order.entity';
import { User } from '@app/models';

@ObjectType('ProxyOrder')
@Entity('ProxyOrders')
@Index(['employeeId', 'processedAt'])
@Index(['orderId'], { unique: true })
@Index(['customerId', 'processedAt'])
export class ProxyOrder extends BaseEntity {
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
  @Column()
  declare processedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare customerName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare customerPhone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare customerEmail: string;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare tipAmount: number;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare tipDistribution: {
    employeeId: string;
    amount: number;
    percentage: number;
  }[];

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare notes: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare customerNotes: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare tableNumber: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare processingTimeSeconds: number;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare customerInteraction: {
    language?: string;
    specialRequests?: string[];
    loyaltyCardUsed?: boolean;
    paymentMethod?: string;
    customerSatisfactionRating?: number;
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare performanceMetrics: {
    upsellAttempts?: number;
    upsellSuccessful?: number;
    recommendationsMade?: number;
    accuracyScore?: number;
    speedScore?: number;
  };

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isComplimentaryOrder: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare requiresFollowUp: boolean;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare followUpDate: Date;

  @SortableField()
  @Column({ unique: true })
  @Index()
  declare orderId: string;

  @SortableField()
  @Column()
  @Index()
  declare employeeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare customerId: string;

  // Relations
  @Field(() => Order)
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Order;

  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.proxyOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  declare customer: User;

  // Computed fields
  @Field(() => Float, { nullable: true })
  get tipPercentage(): number {
    if (!this.tipAmount || !this.order) return null;
    return Number(((this.tipAmount / this.order.subtotal) * 100).toFixed(2));
  }

  @Field(() => Boolean)
  get hasCustomerInfo(): boolean {
    return !!(this.customerId || this.customerName || this.customerPhone);
  }

  @Field(() => Boolean)
  get isHighValueOrder(): boolean {
    return this.order && this.order.total > 50; // Configurable threshold
  }

  @Field(() => Int, { nullable: true })
  get efficiencyScore(): number {
    if (!this.processingTimeSeconds) return null;
    // Calculate efficiency based on order complexity and processing time
    const itemCount = this.order?.items?.length || 1;
    const expectedTime = itemCount * 30; // 30 seconds per item baseline
    const efficiency = Math.max(0, Math.min(100,
      Math.round((expectedTime / this.processingTimeSeconds) * 100)
    ));
    return efficiency;
  }

  @Field(() => Boolean)
  get needsManagerReview(): boolean {
    return this.isComplimentaryOrder ||
           (this.order && this.order.total > 100) ||
           this.requiresFollowUp;
  }
}