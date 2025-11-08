import { SortableField } from '@app/utils';
import { ShiftStatus, UserRole } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsBoolean, IsDate, IsArray, IsNumber } from 'class-validator';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employee.model';
import { Counter, User } from '../../core';

@ObjectType('ScheduledShift')
@Entity('scheduled_shifts')
@Index(['employeeId', 'startTime'])
@Index(['status'])
@Index(['counterId'])
export class ScheduledShift extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare modifiedAt?: Date;

  // Employee relationship
  @Field()
  @Column('uuid')
  @Index()
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Shift timing
  @Field()
  @Column('timestamp')
  @IsDate()
  declare startTime: Date;

  @Field()
  @Column('timestamp')
  @IsDate()
  declare endTime: Date;

  // Role and location
  @Field(() => UserRole, { nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsEnum(UserRole)
  @IsOptional()
  declare role?: UserRole;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare counterId?: string;

  @ManyToOne(() => Counter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'counterId' })
  declare counter?: Counter;

  // Status
  @Field(() => ShiftStatus)
  @Column('enum', {
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED,
  })
  @IsEnum(ShiftStatus)
  declare status: ShiftStatus;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes?: string;

  // Recurring shifts
  @Field()
  @Column('boolean', { default: false })
  @IsBoolean()
  declare isRecurring: boolean;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare recurringShiftId?: string;

  // Shift details
  @Field()
  @Column('varchar', { length: 50, default: 'REGULAR' })
  @IsString()
  declare shiftType: string; // 'REGULAR' | 'OVERTIME' | 'SPLIT' | 'ON_CALL' | 'HOLIDAY'

  @Field()
  @Column('varchar', { length: 50, default: 'MEDIUM' })
  @IsString()
  declare priority: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  @Field(() => [String])
  @Column('simple-array', { default: '' })
  @IsArray()
  declare requiredSkills: string[];

  @Field()
  @Column('integer', { default: 30 })
  @IsNumber()
  declare estimatedBreakMinutes: number;

  // Creation tracking
  @Field()
  @Column('uuid')
  @IsString()
  declare createdBy: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdBy' })
  declare creator: User;

  // Computed fields
  @Field(() => Number)
  get durationHours(): number {
    const diffMs = this.endTime.getTime() - this.startTime.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  @Field()
  get isPast(): boolean {
    return this.endTime < new Date();
  }

  @Field()
  get isCurrent(): boolean {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now;
  }

  @Field()
  get isFuture(): boolean {
    return this.startTime > new Date();
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class ScheduledShiftUpdateInput extends PartialType(
  OmitType(ScheduledShift, [
    'createdAt',
    'modifiedAt',
    'employee',
    'counter',
    'creator',
    'durationHours',
    'isPast',
    'isCurrent',
    'isFuture',
  ] as const),
  InputType,
) {}

@InputType()
export class ScheduledShiftCreateInput extends PartialType(OmitType(ScheduledShiftUpdateInput, ['id'] as const), InputType) {}
