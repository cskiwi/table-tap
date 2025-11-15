import { SortableField } from '@app/utils';
import { AttendanceStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber, IsDate, IsObject } from 'class-validator';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employee.model';
import { ScheduledShift } from '../scheduling';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('AttendanceRecord')
@Entity('attendance_records')
@Index(['employeeId', 'date'])
@Index(['shiftId'])
export class AttendanceRecord extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Employee relationship
  @Field()
  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Shift relationship (optional)
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare shiftId?: string;

  @ManyToOne(() => ScheduledShift, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shiftId' })
  declare shift?: ScheduledShift;

  // Attendance date
  @Field()
  @Column('timestamp')
  @IsDate()
  declare date: Date;

  // Clock in/out times
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsDate()
  @IsOptional()
  declare clockIn?: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsDate()
  @IsOptional()
  declare clockOut?: Date;

  // Attendance status
  @Field(() => AttendanceStatus)
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  declare status: AttendanceStatus;

  // Hours tracking
  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare hoursWorked?: number;

  // Notes
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes?: string;

  // Location tracking
  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('jsonb', { nullable: true })
  @IsObject()
  @IsOptional()
  declare geoLocation?: {
    latitude: number;
    longitude: number;
  };

  // Device information
  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('jsonb', { nullable: true })
  @IsObject()
  @IsOptional()
  declare deviceInfo?: {
    deviceId: string;
    deviceType: string;
    ipAddress: string;
  };

  // Computed fields
  @Field()
  get isClockedIn(): boolean {
    return this.clockIn != null && this.clockOut == null;
  }

  @Field()
  get isComplete(): boolean {
    return this.clockIn != null && this.clockOut != null;
  }

  @Field(() => Number, { nullable: true })
  get actualHours(): number | null {
    if (!this.clockIn || !this.clockOut) return null;
    const diffMs = this.clockOut.getTime() - this.clockIn.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }
}

