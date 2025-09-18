import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
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
import { PersonalOrderStatus } from '../enums/personal-order-status.enum';
import { AllowancePeriod } from '../enums/allowance-period.enum';

@ObjectType('PersonalOrder')
@Entity('PersonalOrders')
@Index(['employeeId', 'consumedAt'])
@Index(['period', 'employeeId'])
@Index(['orderId'], { unique: true })
export class PersonalOrder extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => PersonalOrderStatus)
  @Column({
    type: 'enum',
    enum: PersonalOrderStatus,
    default: PersonalOrderStatus.PENDING,
  })
  declare status: PersonalOrderStatus;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare amount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare allowanceUsed: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare personalPayment: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare payrollDeduction: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare discountApplied: number;

  @SortableField()
  @Column()
  declare consumedAt: Date;

  @Field()
  @Column()
  @Index()
  declare period: string; // YYYY-MM-DD format for daily tracking

  @Field(() => AllowancePeriod)
  @Column({
    type: 'enum',
    enum: AllowancePeriod,
    default: AllowancePeriod.DAILY,
  })
  declare allowancePeriodUsed: AllowancePeriod;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare notes: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare requiresApproval: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isApproved: boolean;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare approvedBy: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare approvedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare approvalNotes: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare metadata: {
    location?: string;
    shiftId?: string;
    breakId?: string;
    loyaltyPointsUsed?: number;
    specialOccasion?: string;
  };

  @SortableField()
  @Column()
  @Index()
  declare employeeId: string;

  @SortableField()
  @Column({ unique: true })
  @Index()
  declare orderId: string;

  // Relations
  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.personalOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Field(() => Order)
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Order;

  // Computed fields
  @Field(() => Boolean)
  get isOverBudget(): boolean {
    return this.personalPayment > 0;
  }

  @Field(() => Float)
  get totalSavings(): number {
    return this.allowanceUsed + this.discountApplied;
  }

  @Field(() => Boolean)
  get needsManagerApproval(): boolean {
    return this.requiresApproval && !this.isApproved;
  }

  @Field(() => Float)
  get effectiveCost(): number {
    return this.personalPayment + this.payrollDeduction;
  }
}