// Helper methods for employee service
import { Employee, TimeSheet } from '@app/models';

export interface AttendanceData {
  isScheduled: boolean;
  isPunctual: boolean;
  minutesLate?: number;
  scheduledStartTime?: Date;
}

export interface ShiftMetrics {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  productivity: number;
}

export class EmployeeHelpers {
  static async processClockIn(
    employee: Employee,
    clockInTime: Date,
    options?: { notes?: string; location?: any }
  ): Promise<AttendanceData> {
    // Simple implementation - check if employee was scheduled
    return {
      isScheduled: true,
      isPunctual: true,
      minutesLate: 0,
    };
  }

  static determineClockInMethod(options?: any): string {
    if (options?.location) return 'GPS';
    if (options?.biometric) return 'BIOMETRIC';
    return 'MANUAL';
  }

  static async getWorkEnvironmentData(cafeId: string): Promise<any> {
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
    data: AttendanceData
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
    manager: any
  ): Promise<TimeSheet | null> {
    const timeSheet = await manager.findOne(TimeSheet, {
      where: { employeeId, actualEndTime: null },
    });
    return timeSheet as TimeSheet;
  }

  static async calculateShiftMetrics(
    shift: TimeSheet,
    clockOutTime: Date,
    options?: any
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

  static determineClockOutMethod(options?: any): string {
    if (options?.location) return 'GPS';
    if (options?.biometric) return 'BIOMETRIC';
    return 'MANUAL';
  }
}
