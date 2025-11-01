import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AttendanceStatus } from '@app/models/enums';
import { Employee } from '../employee.model';
import { ScheduledShift } from '../scheduling';

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('uuid', { nullable: true })
  declare shiftId?: string;

  @ManyToOne(() => ScheduledShift, { nullable: true })
  @JoinColumn({ name: 'shiftId' })
  declare shift?: ScheduledShift;

  @Column('timestamp')
  declare date: Date;

  @Column('timestamp', { nullable: true })
  declare clockIn?: Date;

  @Column('timestamp', { nullable: true })
  declare clockOut?: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT
  })
  declare status: AttendanceStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare hoursWorked?: number;

  @Column('text', { nullable: true })
  declare notes?: string;

  @Column('jsonb', { nullable: true })
  declare geoLocation?: {
    latitude: number;
    longitude: number;
  };

  @Column('jsonb', { nullable: true })
  declare deviceInfo?: {
    deviceId: string;
    deviceType: string;
    ipAddress: string;
  };

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
