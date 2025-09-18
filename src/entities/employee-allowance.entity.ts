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
import { AllowanceType } from '../enums/allowance-type.enum';
import { AllowancePeriod } from '../enums/allowance-period.enum';
import { RolloverPolicy } from '../enums/rollover-policy.enum';

@ObjectType('EmployeeAllowance')
@Entity('EmployeeAllowances')
@Index(['employeeId', 'type', 'period'])
@Index(['resetDate'])
export class EmployeeAllowance extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => AllowanceType)
  @Column({
    type: 'enum',
    enum: AllowanceType,
  })
  declare type: AllowanceType;

  @Field(() => AllowancePeriod)
  @Column({
    type: 'enum',
    enum: AllowancePeriod,
  })
  declare period: AllowancePeriod;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare amount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare usedAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare rolloverAmount: number;

  @SortableField()
  @Column()
  declare startDate: Date;

  @SortableField()
  @Column()
  @Index()
  declare resetDate: Date;

  @Field(() => RolloverPolicy)
  @Column({
    type: 'enum',
    enum: RolloverPolicy,
    default: RolloverPolicy.NONE,
  })
  declare rolloverPolicy: RolloverPolicy;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare maxRolloverAmount: number;

  @Field(() => Boolean, { defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isAutoRenewing: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare notes: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare conditions: {
    minimumShiftHours?: number;
    maximumPerTransaction?: number;
    allowedDaysOfWeek?: number[];
    allowedTimeRanges?: { start: string; end: string }[];
    requiredApprovalAmount?: number;
    locationRestrictions?: string[];
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare usageHistory: {
    date: string;
    amount: number;
    orderId?: string;
    description?: string;
  }[];

  @SortableField()
  @Column()
  @Index()
  declare employeeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare grantedBy: string; // Employee ID who granted this allowance

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare lastUsedAt: Date;

  // Relations
  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.allowances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Computed fields
  @Field(() => Float)
  get remainingAmount(): number {
    const total = this.amount + this.rolloverAmount;
    return Number((total - this.usedAmount).toFixed(2));
  }

  @Field(() => Float)
  get totalAmount(): number {
    return Number((this.amount + this.rolloverAmount).toFixed(2));
  }

  @Field(() => Boolean)
  get isExpired(): boolean {
    return new Date() > this.resetDate;
  }

  @Field(() => Boolean)
  get isFullyUsed(): boolean {
    return this.remainingAmount <= 0;
  }

  @Field(() => Float)
  get usagePercentage(): number {
    if (this.totalAmount === 0) return 0;
    return Number(((this.usedAmount / this.totalAmount) * 100).toFixed(2));
  }

  @Field(() => Boolean)
  get needsRenewal(): boolean {
    return this.isAutoRenewing && this.isExpired;
  }

  @Field(() => Boolean)
  get canUseAmount(): boolean {
    return this.isActive && !this.isExpired && !this.isFullyUsed;
  }

  @Field(() => Float)
  get dailyAverageUsage(): number {
    if (!this.usageHistory || this.usageHistory.length === 0) return 0;

    const daysSinceStart = Math.max(1,
      Math.floor((new Date().getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    return Number((this.usedAmount / daysSinceStart).toFixed(2));
  }

  @Field(() => Int)
  get daysUntilReset(): number {
    const diffTime = this.resetDate.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Methods for allowance management
  canUse(amount: number): boolean {
    if (!this.canUseAmount) return false;
    return this.remainingAmount >= amount;
  }

  wouldRequireApproval(amount: number): boolean {
    return this.conditions?.requiredApprovalAmount &&
           amount > this.conditions.requiredApprovalAmount;
  }

  isUsageAllowedAt(date: Date): boolean {
    if (!this.conditions) return true;

    // Check day of week restrictions
    if (this.conditions.allowedDaysOfWeek &&
        !this.conditions.allowedDaysOfWeek.includes(date.getDay())) {
      return false;
    }

    // Check time range restrictions
    if (this.conditions.allowedTimeRanges) {
      const currentTime = date.toTimeString().slice(0, 5); // HH:MM format
      const isInAllowedTime = this.conditions.allowedTimeRanges.some(range =>
        currentTime >= range.start && currentTime <= range.end
      );
      if (!isInAllowedTime) return false;
    }

    return true;
  }
}