import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.model';
import { PerformanceRating } from '@app/models/enums';

@Entity('performance_metrics')
export class PerformanceMetrics {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('timestamp')
  declare periodStart: Date;

  @Column('timestamp')
  declare periodEnd: Date;

  // Time & Attendance
  @Column('decimal', { precision: 10, scale: 2 })
  declare totalHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare scheduledHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare overtimeHours: number;

  @Column('integer')
  declare shiftsWorked: number;

  @Column('integer')
  declare shiftsScheduled: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare averageShiftLength: number;

  @Column('decimal', { precision: 5, scale: 2 })
  declare punctualityScore: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2 })
  declare attendanceRate: number; // 0-100

  @Column('integer')
  declare lateCount: number;

  @Column('integer')
  declare absentCount: number;

  @Column('integer')
  declare earlyDepartureCount: number;

  // Productivity & Performance
  @Column('decimal', { precision: 5, scale: 2 })
  declare productivity: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2 })
  declare efficiency: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2 })
  declare qualityScore: number; // 0-100

  @Column('integer', { nullable: true })
  declare ordersProcessed?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare averageOrderValue?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare averageOrderProcessingTime?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare customerRating?: number;

  @Column('integer', { nullable: true })
  declare customerCompliments?: number;

  @Column('integer', { nullable: true })
  declare customerComplaints?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare taskCompletionRate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare errorRate?: number;

  // Skills & Development
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare trainingProgress?: number;

  @Column('jsonb', { nullable: true })
  declare skillAssessmentScores?: Record<string, number>;

  @Column('jsonb', { nullable: true })
  declare certificationStatus?: Record<string, string>;

  // Goals & Achievements
  @Column('integer', { nullable: true })
  declare goalsSet?: number;

  @Column('integer', { nullable: true })
  declare goalsAchieved?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare goalCompletionRate?: number;

  @Column('simple-array', { nullable: true })
  declare achievements?: string[];

  // Overall Rating
  @Column({
    type: 'enum',
    enum: PerformanceRating,
    nullable: true
  })
  declare performanceRating?: PerformanceRating;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  declare managerRating?: number; // 1-5

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  declare peerRating?: number; // 1-5

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  declare selfRating?: number; // 1-5

  // Comparative metrics
  @Column('integer', { nullable: true })
  declare rankInCafe?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare percentileInRole?: number;

  @Column('varchar', { length: 50, nullable: true })
  declare improvementTrend?: string; // 'IMPROVING' | 'STABLE' | 'DECLINING'

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
