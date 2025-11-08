import { SortableField } from '@app/utils';
import { ShiftSwapStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
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
} from 'typeorm';
import { ScheduledShift } from './scheduled-shift.model';
import { Employee } from '../employee.model';
import { User } from '../../core';

@ObjectType('ShiftSwapRequest')
@Entity('shift_swap_requests')
@Index(['requestingEmployeeId', 'status'])
@Index(['targetEmployeeId', 'status'])
export class ShiftSwapRequest extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Requesting employee
  @Field()
  @Column('uuid')
  @Index()
  declare requestingEmployeeId: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestingEmployeeId' })
  declare requestingEmployee: Employee;

  // Target employee
  @Field()
  @Column('uuid')
  @Index()
  declare targetEmployeeId: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetEmployeeId' })
  declare targetEmployee: Employee;

  // Requesting shift
  @Field()
  @Column('uuid')
  @Index()
  declare requestingShiftId: string;

  @ManyToOne(() => ScheduledShift, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestingShiftId' })
  declare requestingShift: ScheduledShift;

  // Target shift
  @Field()
  @Column('uuid')
  @Index()
  declare targetShiftId: string;

  @ManyToOne(() => ScheduledShift, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetShiftId' })
  declare targetShift: ScheduledShift;

  // Status and reason
  @Field(() => ShiftSwapStatus)
  @Column({
    type: 'enum',
    enum: ShiftSwapStatus,
    default: ShiftSwapStatus.PENDING
  })
  @IsEnum(ShiftSwapStatus)
  declare status: ShiftSwapStatus;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare reason?: string;

  // Approval tracking
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare approvedBy?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approvedBy' })
  declare approver?: User;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsDate()
  @IsOptional()
  declare approvedAt?: Date;

  // Computed fields
  @Field()
  get isPending(): boolean {
    return this.status === ShiftSwapStatus.PENDING;
  }

  @Field()
  get isApproved(): boolean {
    return this.status === ShiftSwapStatus.APPROVED;
  }

  @Field()
  get isRejected(): boolean {
    return this.status === ShiftSwapStatus.REJECTED;
  }
}

