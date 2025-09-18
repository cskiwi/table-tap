import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeBreak } from './employee-break.entity';
import { ShiftStatus } from '../enums/shift-status.enum';

@ObjectType('EmployeeShift')
@Entity('EmployeeShifts')
@Index(['employeeId', 'scheduledStart'])
@Index(['cafeId', 'scheduledStart'])
export class EmployeeShift extends BaseEntity {
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
  declare scheduledStart: Date;

  @SortableField()
  @Column()
  declare scheduledEnd: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare actualStart: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare actualEnd: Date;

  @Field(() => ShiftStatus)
  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED,
  })
  declare status: ShiftStatus;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare scheduledMinutes: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare actualMinutes: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare breakMinutes: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare overtimeMinutes: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare regularHours: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare overtimeHours: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare notes: string;

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
  @Column({ type: 'json', nullable: true })
  declare clockInLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare clockOutLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare performanceMetrics: {
    ordersProcessed?: number;
    averageOrderTime?: number;
    customerSatisfactionScore?: number;
    revenueGenerated?: number;
  };

  @SortableField()
  @Column()
  @Index()
  declare employeeId: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.shifts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Field(() => [EmployeeBreak], { nullable: true })
  @OneToMany(() => EmployeeBreak, (employeeBreak) => employeeBreak.shift, { cascade: true })
  declare breaks: EmployeeBreak[];

  // Computed fields
  @Field(() => Float, { nullable: true })
  get totalHours(): number {
    if (!this.actualStart || !this.actualEnd) return null;
    const diffMs = this.actualEnd.getTime() - this.actualStart.getTime();
    return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  @Field(() => Boolean)
  get isOvertime(): boolean {
    return this.overtimeMinutes > 0;
  }

  @Field(() => Boolean)
  get isLate(): boolean {
    if (!this.actualStart) return false;
    return this.actualStart > this.scheduledStart;
  }

  @Field(() => Int, { nullable: true })
  get lateMinutes(): number {
    if (!this.isLate) return 0;
    const diffMs = this.actualStart.getTime() - this.scheduledStart.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }
}