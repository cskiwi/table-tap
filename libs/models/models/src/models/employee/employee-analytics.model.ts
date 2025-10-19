import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cafe } from '../core/cafe.model';

@Entity('employee_analytics')
export class EmployeeAnalytics {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid', { nullable: true })
  declare cafeId?: string;

  @ManyToOne(() => Cafe, { nullable: true })
  @JoinColumn({ name: 'cafeId' })
  declare cafe?: Cafe;

  @Column('timestamp')
  declare periodStart: Date;

  @Column('timestamp')
  declare periodEnd: Date;

  // Overview metrics
  @Column('integer')
  declare totalEmployees: number;

  @Column('integer')
  declare activeEmployees: number;

  @Column('integer')
  declare inactiveEmployees: number;

  @Column('integer')
  declare newHiresThisMonth: number;

  @Column('integer')
  declare terminationsThisMonth: number;

  // Role, department, and status distribution (stored as JSONB)
  @Column('jsonb')
  declare employeesByRole: Record<string, number>;

  @Column('jsonb')
  declare employeesByDepartment: Record<string, number>;

  @Column('jsonb')
  declare employeesByStatus: Record<string, number>;

  // Tenure analytics
  @Column('decimal', { precision: 10, scale: 2 })
  declare averageTenure: number; // months

  @Column('jsonb')
  declare tenureDistribution: Array<{ range: string; count: number }>;

  @Column('decimal', { precision: 5, scale: 2 })
  declare turnoverRate: number; // percentage

  @Column('decimal', { precision: 5, scale: 2 })
  declare retentionRate: number; // percentage

  // Compensation analytics
  @Column('decimal', { precision: 10, scale: 2 })
  declare averageHourlyRate: number;

  @Column('jsonb')
  declare hourlyRateRange: { min: number; max: number };

  @Column('decimal', { precision: 10, scale: 2 })
  declare totalLaborCost: number;

  @Column('jsonb')
  declare laborCostTrend: Array<{ period: string; cost: number }>;

  // Performance analytics (stored as JSONB)
  @Column('jsonb')
  declare productivityMetrics: {
    averageProductivity: number;
    productivityTrend: Array<{ period: string; score: number }>;
    topPerformers: Array<{ employeeId: string; name: string; score: number }>;
    underPerformers: Array<{ employeeId: string; name: string; score: number }>;
    performanceDistribution: Record<string, number>;
  };

  // Attendance analytics (stored as JSONB)
  @Column('jsonb')
  declare attendanceMetrics: {
    averageAttendanceRate: number;
    averagePunctualityScore: number;
    attendanceTrend: Array<{ period: string; rate: number }>;
    chronicallyLateEmployees: Array<{ employeeId: string; name: string; lateCount: number }>;
    highAbsenteeismEmployees: Array<{ employeeId: string; name: string; absentRate: number }>;
    mostReliableEmployees: Array<{ employeeId: string; name: string; reliabilityScore: number }>;
  };

  // Training analytics (stored as JSONB)
  @Column('jsonb')
  declare trainingMetrics: {
    averageCompletionRate: number;
    totalTrainingHours: number;
    trainingCost: number;
    expiredCertifications: number;
    upcomingRenewals: Array<{ employeeId: string; certification: string; expiryDate: Date }>;
    skillGaps: Array<{ skill: string; gapPercentage: number }>;
    trainingEffectiveness: number;
  };

  // Scheduling analytics (stored as JSONB)
  @Column('jsonb')
  declare schedulingMetrics: {
    averageScheduleUtilization: number;
    scheduleCompliance: number;
    lastMinuteChanges: number;
    shiftSwapRequests: number;
    overtimeHours: number;
    overtimeCost: number;
    coverageGaps: number;
  };

  // Engagement & satisfaction (stored as JSONB)
  @Column('jsonb', { nullable: true })
  declare engagementMetrics?: {
    satisfactionScore?: number;
    engagementScore?: number;
    feedbackResponseRate?: number;
    suggestionCount?: number;
    recognitionCount?: number;
    promotionRate?: number;
  };

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
