import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employee.model';
import { User } from '../../core';

@Entity('employee_goals')
export class EmployeeGoal {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('varchar', { length: 255 })
  declare title: string;

  @Column('text')
  declare description: string;

  @Column('varchar', { length: 50 })
  declare category: string;

  @Column('timestamp')
  declare targetDate: Date;

  @Column('varchar', { length: 50 })
  declare status: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  declare progress: number;

  @Column('uuid', { nullable: true })
  declare assignedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedBy' })
  declare assigner?: User;

  @Column('jsonb', { nullable: true })
  declare milestones?: Array<{
    title: string;
    completed: boolean;
    completedDate?: Date;
  }>;

  @Column('text', { nullable: true })
  declare notes?: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
