import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.model';
import { User } from '../core/user.model';
import { PerformanceRating } from '@app/models/enums';

@Entity('employee_reviews')
export class EmployeeReview {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('timestamp')
  declare reviewDate: Date;

  @Column('varchar', { length: 50 })
  declare reviewType: string;

  @Column({
    type: 'enum',
    enum: PerformanceRating
  })
  declare overallRating: PerformanceRating;

  @Column('uuid')
  declare reviewerId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'reviewerId' })
  declare reviewer: User;

  @Column('jsonb', { nullable: true })
  declare categoryRatings?: Record<string, PerformanceRating>;

  @Column('text', { nullable: true })
  declare strengths?: string;

  @Column('text', { nullable: true })
  declare areasForImprovement?: string;

  @Column('text', { nullable: true })
  declare goals?: string;

  @Column('text', { nullable: true })
  declare employeeComments?: string;

  @Column('timestamp', { nullable: true })
  declare nextReviewDate?: Date;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
