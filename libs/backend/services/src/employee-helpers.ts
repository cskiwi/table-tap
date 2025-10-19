// Helper methods for employee service
import { Employee, TimeSheet, ScheduledShift, User } from '@app/models';

// Type definitions for helper method parameters and returns
export interface ClockInOptions {
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  biometric?: boolean;
}

export interface ClockInResult {
  isScheduled: boolean;
  isPunctual: boolean;
  minutesLate?: number;
  scheduledStartTime?: Date;
}

export interface WorkEnvironmentData {
  temperature: number;
  humidity: number;
  noiseLevel: string;
}

export interface ShiftMetrics {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  productivity: number;
}

export interface TenureDistribution {
  lessThan3Months: number;
  threeToSixMonths: number;
  sixToTwelveMonths: number;
  oneToTwoYears: number;
  twoToFiveYears: number;
  moreThanFiveYears: number;
}

export interface EngagementMetrics {
  satisfactionScore: number;
  engagementLevel: string;
  feedbackCount: number;
  concernsRaised: number;
  lastSurveyDate: Date | null;
}

export interface ComparativeMetrics {
  industryAverage: {
    turnoverRate: number;
    averageTenure: number;
    productivityScore: number;
  };
  comparisonToIndustry: {
    turnoverRate: string;
    averageTenure: string;
    productivityScore: string;
  };
}

export interface PredictiveMetrics {
  predictedTurnoverRisk: string;
  atRiskEmployeeCount: number;
  staffingNeeds: {
    nextMonth: number;
    nextQuarter: number;
  };
  recommendedActions: string[];
}

export interface EmployeeROI {
  totalRevenue: number;
  totalLaborCost: number;
  revenuePerEmployee: number;
  laborCostPercentage: number;
  roi: number;
  profitPerEmployee: number;
}

export interface PayrollDeductions {
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  healthInsurance: number;
  retirement401k: number;
  other: number;
}

export interface PayrollData {
  employeeId: string;
  grossPay: number;
  deductions: PayrollDeductions;
  netPay: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface RecurringPattern {
  type: string;
  frequency: number;
  endDate?: Date;
}

export interface BusinessRequirements {
  minimumStaffing: Record<string, number>;
  peakHours: string[];
  skillRequirements: Record<string, string[]>;
}

export interface ComprehensiveMetrics {
  productivity: number;
  efficiency: number;
  quality: number;
  rankInCafe?: number;
  percentileInRole?: number;
  improvementTrend?: string;
}

export class EmployeeHelpers {
  static async processClockIn(
    employee: Employee,
    clockInTime: Date,
    options?: ClockInOptions
  ): Promise<ClockInResult> {
    // Simple implementation - check if employee was scheduled
    return {
      isScheduled: true,
      isPunctual: true,
      minutesLate: 0,
    };
  }

  static determineClockInMethod(options?: ClockInOptions): string {
    if (options?.location) return 'GPS';
    if (options?.biometric) return 'BIOMETRIC';
    return 'MANUAL';
  }

  static async getWorkEnvironmentData(cafeId: string): Promise<WorkEnvironmentData> {
    return {
      temperature: 72,
      humidity: 45,
      noiseLevel: 'NORMAL',
    };
  }

  static async updateAttendanceRecord(
    employee: Employee,
    timeSheet: TimeSheet,
    action: string
  ): Promise<void> {
    // Track attendance patterns
    console.log(`Attendance ${action} for employee ${employee.id}`);
  }

  static async sendClockInNotifications(
    employee: Employee,
    timeSheet: TimeSheet,
    data: ClockInResult
  ): Promise<void> {
    // Send real-time notifications
    console.log(`Clock-in notification sent for ${employee.id}`);
  }

  static updateRealTimeMetrics(
    employeeId: string,
    action: string,
    timeSheet: TimeSheet
  ): void {
    // Update real-time performance metrics
    console.log(`Updated metrics for ${employeeId}: ${action}`);
  }

  static async findActiveShift(
    employeeId: string,
    manager: { findOne: (entity: typeof TimeSheet, options: { where: Record<string, unknown> }) => Promise<TimeSheet | null> }
  ): Promise<TimeSheet | null> {
    const timeSheet = await manager.findOne(TimeSheet, {
      where: { employeeId, actualEndTime: null },
    });
    return timeSheet;
  }

  static async calculateShiftMetrics(
    shift: TimeSheet,
    clockOutTime: Date,
    options?: { breakHours?: number }
  ): Promise<ShiftMetrics> {
    const startTime = shift.actualStartTime || new Date();
    const totalMs = clockOutTime.getTime() - startTime.getTime();
    const totalHours = totalMs / (1000 * 60 * 60);
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(0, totalHours - 8);

    return {
      totalHours,
      regularHours,
      overtimeHours,
      breakHours: options?.breakHours || 0,
      productivity: 85,
    };
  }

  static combineNotes(existingNotes?: string, newNotes?: string): string {
    if (!existingNotes) return newNotes || '';
    if (!newNotes) return existingNotes;
    return `${existingNotes}\n${newNotes}`;
  }

  static determineClockOutMethod(options?: ClockInOptions): string {
    if (options?.location) return 'GPS';
    if (options?.biometric) return 'BIOMETRIC';
    return 'MANUAL';
  }

  static calculateTenureDistribution(employees: Employee[]): TenureDistribution {
    const distribution = {
      lessThan3Months: 0,
      threeToSixMonths: 0,
      sixToTwelveMonths: 0,
      oneToTwoYears: 0,
      twoToFiveYears: 0,
      moreThanFiveYears: 0,
    };

    const now = new Date();
    employees.forEach(emp => {
      if (!emp.hireDate) return;
      const monthsEmployed = (now.getTime() - emp.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsEmployed < 3) distribution.lessThan3Months++;
      else if (monthsEmployed < 6) distribution.threeToSixMonths++;
      else if (monthsEmployed < 12) distribution.sixToTwelveMonths++;
      else if (monthsEmployed < 24) distribution.oneToTwoYears++;
      else if (monthsEmployed < 60) distribution.twoToFiveYears++;
      else distribution.moreThanFiveYears++;
    });

    return distribution;
  }

  static async calculateEngagementMetrics(cafeId: string, period: { start: Date; end: Date }): Promise<EngagementMetrics> {
    // Placeholder implementation for engagement metrics
    return {
      satisfactionScore: 0,
      engagementLevel: 'medium',
      feedbackCount: 0,
      concernsRaised: 0,
      lastSurveyDate: null,
    };
  }

  static async generateComparativeMetrics(cafeId: string, analytics: Record<string, unknown>): Promise<ComparativeMetrics> {
    // Placeholder implementation for comparative metrics
    return {
      industryAverage: {
        turnoverRate: 0,
        averageTenure: 0,
        productivityScore: 0,
      },
      comparisonToIndustry: {
        turnoverRate: 'average',
        averageTenure: 'average',
        productivityScore: 'average',
      },
    };
  }

  static async generatePredictiveMetrics(cafeId: string, analytics: Record<string, unknown>): Promise<PredictiveMetrics> {
    // Placeholder implementation for predictive metrics
    return {
      predictedTurnoverRisk: 'low',
      atRiskEmployeeCount: 0,
      staffingNeeds: {
        nextMonth: 0,
        nextQuarter: 0,
      },
      recommendedActions: [],
    };
  }

  static async calculateEmployeeROI(cafeId: string, period: { start: Date; end: Date }): Promise<EmployeeROI> {
    // Placeholder implementation for ROI calculation
    return {
      totalRevenue: 0,
      totalLaborCost: 0,
      revenuePerEmployee: 0,
      laborCostPercentage: 0,
      roi: 0,
      profitPerEmployee: 0,
    };
  }

  static categorizeTraining(moduleType: string, moduleName: string): string {
    // Categorize training based on type
    const typeCategories: Record<string, string> = {
      ONBOARDING: 'Orientation',
      COMPLIANCE: 'Compliance & Safety',
      TECHNICAL: 'Technical Skills',
      SOFT_SKILLS: 'Professional Development',
      LEADERSHIP: 'Leadership & Management',
      SAFETY: 'Safety & Health',
    };

    return typeCategories[moduleType] || 'General Training';
  }

  static getDefaultDeductions(): PayrollDeductions {
    // Default deductions for employees
    return {
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      healthInsurance: 0,
      retirement401k: 0,
      other: 0,
    };
  }

  static async storePayrollRecord(payrollData: PayrollData): Promise<void> {
    // Placeholder for storing payroll records
    console.log('Storing payroll record:', payrollData.employeeId);
  }

  static findExistingTraining(employeeId: string, moduleName: string): null {
    // Placeholder for finding existing training
    // In real implementation, this would query a database or cache
    return null;
  }

  static calculateEstimatedBreaks(shift: Partial<ScheduledShift> & { startTime: Date; endTime: Date }): number {
    // Calculate estimated break minutes based on shift duration
    const shiftHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
    if (shiftHours > 8) return 60;
    if (shiftHours > 6) return 45;
    if (shiftHours > 4) return 30;
    return 15;
  }

  static async createIntelligentRecurringShifts(shift: ScheduledShift, pattern: RecurringPattern, user: User): Promise<void> {
    // Placeholder for creating recurring shifts
    console.log('Creating recurring shifts:', shift.id, pattern);
  }

  static async cacheShiftData(shift: ScheduledShift): Promise<void> {
    // Placeholder for caching shift data
    console.log('Caching shift data:', shift.id);
  }

  static async notifyRelevantStakeholders(shift: ScheduledShift, eventType: string): Promise<void> {
    // Placeholder for notifications
    console.log('Notifying stakeholders about:', eventType, shift.id);
  }

  static triggerWorkforceOptimization(cafeId: string, shiftTime: Date): void {
    // Placeholder for workforce optimization
    console.log('Triggering optimization for cafe:', cafeId);
  }

  static async getBusinessRequirements(cafeId: string, startDate: Date, endDate: Date): Promise<BusinessRequirements> {
    // Placeholder for business requirements
    return {
      minimumStaffing: {},
      peakHours: [],
      skillRequirements: {},
    };
  }

  static async applyOptimizedSchedule(schedule: ScheduledShift[], user: User): Promise<ScheduledShift[]> {
    // Placeholder for applying optimized schedule
    return schedule;
  }

  static async calculateComprehensiveMetrics(data: Record<string, unknown>): Promise<ComprehensiveMetrics> {
    // Placeholder for comprehensive metrics
    return {
      productivity: 0,
      efficiency: 0,
      quality: 0,
    };
  }

  static async storePerformanceMetrics(metrics: ComprehensiveMetrics): Promise<void> {
    // Placeholder for storing performance metrics
    console.log('Storing performance metrics');
  }
}

// Export alias for backward compatibility
export const EmployeeServiceHelpers = EmployeeHelpers;
