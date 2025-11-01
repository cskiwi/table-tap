import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ShiftSwapStatus } from '@app/models/enums';
import { ScheduledShift } from './scheduled-shift.model';
import { Employee } from '../employee.model';
import { User } from '../../core';

@Entity('shift_swap_requests')
export class ShiftSwapRequest {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare requestingEmployeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'requestingEmployeeId' })
  declare requestingEmployee: Employee;

  @Column('uuid')
  declare targetEmployeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'targetEmployeeId' })
  declare targetEmployee: Employee;

  @Column('uuid')
  declare requestingShiftId: string;

  @ManyToOne(() => ScheduledShift, { nullable: false })
  @JoinColumn({ name: 'requestingShiftId' })
  declare requestingShift: ScheduledShift;

  @Column('uuid')
  declare targetShiftId: string;

  @ManyToOne(() => ScheduledShift, { nullable: false })
  @JoinColumn({ name: 'targetShiftId' })
  declare targetShift: ScheduledShift;

  @Column({
    type: 'enum',
    enum: ShiftSwapStatus,
    default: ShiftSwapStatus.PENDING
  })
  declare status: ShiftSwapStatus;

  @Column('text', { nullable: true })
  declare reason?: string;

  @Column('uuid', { nullable: true })
  declare approvedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  declare approver?: User;

  @Column('timestamp', { nullable: true })
  declare approvedAt?: Date;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
