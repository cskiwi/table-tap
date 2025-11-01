import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TrainingStatus, TrainingType } from '@app/models/enums';
import { User } from '../../core';
import { Employee } from '../employee.model';

@Entity('training_records')
export class TrainingRecord {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('varchar', { length: 255 })
  declare moduleName: string;

  @Column({
    type: 'enum',
    enum: TrainingType
  })
  declare moduleType: TrainingType;

  @Column('integer', { nullable: true })
  declare estimatedDuration?: number; // minutes

  @Column('integer', { nullable: true })
  declare actualDuration?: number; // minutes

  @Column('integer', { default: 70 })
  declare passingScore: number;

  @Column('integer', { default: 0 })
  declare attempts: number;

  @Column('integer', { default: 3 })
  declare maxAttempts: number;

  @Column('timestamp')
  declare startDate: Date;

  @Column('timestamp', { nullable: true })
  declare completionDate?: Date;

  @Column('timestamp', { nullable: true })
  declare expiryDate?: Date;

  @Column({
    type: 'enum',
    enum: TrainingStatus,
    default: TrainingStatus.NOT_STARTED
  })
  declare status: TrainingStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare score?: number;

  @Column('varchar', { length: 255, nullable: true })
  declare certificateId?: string;

  @Column('uuid', { nullable: true })
  declare instructorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'instructorId' })
  declare instructor?: User;

  @Column('text', { nullable: true })
  declare notes?: string;

  @Column('boolean', { default: false })
  declare requiredForRole: boolean;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
