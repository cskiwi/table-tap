import { SortableField } from '@app/utils';
import { ShiftStatus } from '@app/models/enums';
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
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TimeEntry } from './time-entry.model';
import { Cafe } from '../../core';
import { Employee } from '../employee.model';

@ObjectType('TimeSheet')
@Entity('TimeSheets')
@Index(['cafeId', 'employeeId', 'shiftDate'], { unique: true })
@Index(['employeeId', 'shiftDate'])
export class TimeSheet extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  // Employee relationship
  @Field()
  @Column('uuid')
  @Index()
  declare employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.timeSheets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Shift details
  @Field()
  @Column('date')
  declare shiftDate: Date;

  @Field()
  @Column('enum', { enum: ShiftStatus, default: ShiftStatus.SCHEDULED })
  @IsEnum(ShiftStatus)
  declare status: ShiftStatus;

  // Scheduled times
  @Field({ nullable: true })
  @Column('time', { nullable: true })
  declare scheduledStartTime: string; // HH:MM format

  @Field({ nullable: true })
  @Column('time', { nullable: true })
  declare scheduledEndTime: string; // HH:MM format

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare scheduledHours: number;

  // Actual times (calculated from entries)
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare actualStartTime: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare actualEndTime: Date;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare actualHours: number;

  // Break tracking
  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare breakMinutes: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare paidBreakMinutes: number;

  // Pay calculation
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare hourlyRate: number; // Snapshot at time of shift

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare regularPay: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare overtimePay: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare totalPay: number;

  // Position and location
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare position: string; // Position worked during this shift

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare countersWorked: string[]; // Counter IDs worked during shift

  // Verification and approval
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isApproved: boolean;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare approvedById: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare approvedAt: Date;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare employeeNotes: string;

  // Relations
  @OneToMany(() => TimeEntry, (entry) => entry.timeSheet, { cascade: true })
  declare entries: TimeEntry[];

  // Computed fields
  @Field()
  get isComplete(): boolean {
    return this.status === ShiftStatus.COMPLETED && this.actualEndTime != null;
  }

  @Field()
  get isActive(): boolean {
    return this.status === ShiftStatus.STARTED;
  }

  @Field()
  get isOvertime(): boolean {
    if (!this.actualHours || !this.scheduledHours) return false;
    return this.actualHours > this.scheduledHours;
  }

  @Field({ nullable: true })
  get overtimeHours(): number | null {
    if (!this.isOvertime) return null;
    return this.actualHours - this.scheduledHours;
  }

  @Field({ nullable: true })
  get workingHours(): number | null {
    if (!this.actualHours || !this.breakMinutes) return this.actualHours;
    return this.actualHours - this.breakMinutes / 60;
  }

  @Field()
  get hasTimeEntries(): boolean {
    return this.entries?.length > 0;
  }

  @Field()
  get lastEntry(): TimeEntry | null {
    if (!this.entries?.length) return null;
    return this.entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  @Field()
  get isClockedIn(): boolean {
    const lastEntry = this.lastEntry;
    return lastEntry?.entryType === 'clock_in' || lastEntry?.entryType === 'break_end';
  }

  @Field()
  get isOnBreak(): boolean {
    const lastEntry = this.lastEntry;
    return lastEntry?.entryType === 'break_start';
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class TimeSheetUpdateInput extends PartialType(
  OmitType(TimeSheet, [
    'createdAt',
    'updatedAt',
    'cafe',
    'employee',
    'entries',
    'isComplete',
    'isActive',
    'isOvertime',
    'overtimeHours',
    'workingHours',
    'hasTimeEntries',
    'lastEntry',
    'isClockedIn',
    'isOnBreak',
  ] as const),
  InputType
) {}

@InputType()
export class TimeSheetCreateInput extends PartialType(
  OmitType(TimeSheetUpdateInput, ['id'] as const),
  InputType
) {}
