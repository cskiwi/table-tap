import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.model';
import { Counter } from '../core/counter.model';
import { User } from '../core/user.model';
import { ShiftStatus, UserRole } from '@app/models/enums';
import { RecurringPatternType } from '@app/models/enums';

@Entity('scheduled_shifts')
export class ScheduledShift {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('timestamp')
  declare startTime: Date;

  @Column('timestamp')
  declare endTime: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  declare role?: UserRole;

  @Column('uuid', { nullable: true })
  declare counterId?: string;

  @ManyToOne(() => Counter, { nullable: true })
  @JoinColumn({ name: 'counterId' })
  declare counter?: Counter;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED
  })
  declare status: ShiftStatus;

  @Column('text', { nullable: true })
  declare notes?: string;

  @Column('boolean', { default: false })
  declare isRecurring: boolean;

  @Column('uuid', { nullable: true })
  declare recurringShiftId?: string;

  @Column('varchar', { length: 50, default: 'REGULAR' })
  declare shiftType: string; // 'REGULAR' | 'OVERTIME' | 'SPLIT' | 'ON_CALL' | 'HOLIDAY'

  @Column('varchar', { length: 50, default: 'MEDIUM' })
  declare priority: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  @Column('simple-array', { default: '' })
  declare requiredSkills: string[];

  @Column('integer', { default: 30 })
  declare estimatedBreakMinutes: number;

  @Column('uuid')
  declare createdBy: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  declare creator: User;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare modifiedAt?: Date;
}
