import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { EmployeeShift } from '../entities/employee-shift.entity';
import { EmployeeBreak } from '../entities/employee-break.entity';
import { TimeSheet } from '../entities/time-sheet.entity';
import { ShiftStatus } from '../enums/shift-status.enum';
import { BreakType, BreakStatus } from '../enums/break-type.enum';
import { GeolocationService } from './geolocation.service';
import { NotificationService } from './notification.service';
import { PerformanceMetricsService } from './performance-metrics.service';

export interface ClockInData {
  employeeId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp?: Date;
  shiftId?: string;
}

export interface ClockOutData {
  employeeId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp?: Date;
  notes?: string;
}

export interface BreakStartData {
  shiftId: string;
  type: BreakType;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
}

export interface ShiftSummary {
  shift: EmployeeShift;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakTime: number;
  isLate: boolean;
  lateMinutes: number;
  performanceScore?: number;
}

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(EmployeeShift)
    private shiftRepository: Repository<EmployeeShift>,
    @InjectRepository(EmployeeBreak)
    private breakRepository: Repository<BreakRepository>,
    @InjectRepository(TimeSheet)
    private timesheetRepository: Repository<TimeSheet>,
    private geolocationService: GeolocationService,
    private notificationService: NotificationService,
    private performanceMetricsService: PerformanceMetricsService,
  ) {}

  /**
   * Clock in an employee for their shift
   */
  async clockIn(data: ClockInData): Promise<EmployeeShift> {
    const employee = await this.employeeRepository.findOne({
      where: { id: data.employeeId },
      relations: ['cafe'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if employee is already clocked in
    const activeShift = await this.getActiveShift(data.employeeId);
    if (activeShift) {
      throw new ConflictException('Employee is already clocked in');
    }

    // Verify location if required
    if (employee.locationSettings?.requireLocationVerification && data.location) {
      const isLocationValid = await this.geolocationService.verifyLocation(
        data.location,
        employee.locationSettings.allowedLocations,
        employee.locationSettings.radiusMeters
      );

      if (!isLocationValid) {
        throw new BadRequestException('Location verification failed');
      }
    }

    const now = data.timestamp || new Date();

    // Find scheduled shift for this time
    let shift = data.shiftId
      ? await this.shiftRepository.findOne({ where: { id: data.shiftId } })
      : await this.findScheduledShift(data.employeeId, now);

    if (!shift) {
      // Create ad-hoc shift if no scheduled shift found
      shift = this.shiftRepository.create({
        employeeId: data.employeeId,
        cafeId: employee.cafeId,
        scheduledStart: now,
        scheduledEnd: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours default
        status: ShiftStatus.STARTED,
        actualStart: now,
        clockInLocation: data.location,
      });
    } else {
      // Update existing scheduled shift
      shift.actualStart = now;
      shift.status = ShiftStatus.STARTED;
      shift.clockInLocation = data.location;
    }

    await this.shiftRepository.save(shift);

    // Create or update timesheet entry
    await this.updateTimeSheet(shift);

    // Send notifications
    await this.notificationService.sendClockInNotification(employee, shift);

    // Record performance metric
    if (shift.scheduledStart) {
      const punctualityScore = this.calculatePunctualityScore(shift.scheduledStart, now);
      await this.performanceMetricsService.recordMetric({
        employeeId: data.employeeId,
        metricType: 'PUNCTUALITY_SCORE',
        value: punctualityScore,
        contextData: { shiftId: shift.id, lateMinutes: shift.lateMinutes },
      });
    }

    return shift;
  }

  /**
   * Clock out an employee from their shift
   */
  async clockOut(data: ClockOutData): Promise<EmployeeShift> {
    const activeShift = await this.getActiveShift(data.employeeId);
    if (!activeShift) {
      throw new BadRequestException('Employee is not clocked in');
    }

    // End any active breaks
    await this.endActiveBreaks(activeShift.id);

    const now = data.timestamp || new Date();

    // Verify location if required
    const employee = await this.employeeRepository.findOne({
      where: { id: data.employeeId },
    });

    if (employee?.locationSettings?.requireLocationVerification && data.location) {
      const isLocationValid = await this.geolocationService.verifyLocation(
        data.location,
        employee.locationSettings.allowedLocations,
        employee.locationSettings.radiusMeters
      );

      if (!isLocationValid) {
        throw new BadRequestException('Location verification failed for clock out');
      }
    }

    // Update shift
    activeShift.actualEnd = now;
    activeShift.status = ShiftStatus.COMPLETED;
    activeShift.clockOutLocation = data.location;
    activeShift.notes = data.notes;

    // Calculate hours
    const shiftCalculation = this.calculateShiftHours(activeShift);
    Object.assign(activeShift, shiftCalculation);

    await this.shiftRepository.save(activeShift);

    // Update timesheet
    await this.updateTimeSheet(activeShift);

    // Send notifications
    await this.notificationService.sendClockOutNotification(employee, activeShift);

    // Record performance metrics
    await this.recordShiftPerformanceMetrics(activeShift);

    return activeShift;
  }

  /**
   * Start a break for an employee
   */
  async startBreak(data: BreakStartData): Promise<EmployeeBreak> {
    const shift = await this.shiftRepository.findOne({
      where: { id: data.shiftId },
      relations: ['breaks'],
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.status !== ShiftStatus.STARTED) {
      throw new BadRequestException('Cannot start break on inactive shift');
    }

    // Check if there's already an active break
    const activeBreak = shift.breaks?.find(b => !b.isCompleted);
    if (activeBreak) {
      throw new ConflictException('Employee is already on break');
    }

    const now = new Date();
    const breakDuration = this.getBreakDuration(data.type);

    const employeeBreak = this.breakRepository.create({
      shiftId: data.shiftId,
      type: data.type,
      scheduledStart: now,
      actualStart: now,
      scheduledDuration: breakDuration,
      location: data.location,
      notes: data.notes,
      isPaid: this.isBreakPaid(data.type),
    });

    await this.breakRepository.save(employeeBreak);

    // Update shift status
    shift.status = ShiftStatus.ON_BREAK;
    await this.shiftRepository.save(shift);

    // Set break end reminder
    await this.notificationService.scheduleBreakEndReminder(
      shift.employeeId,
      employeeBreak.id,
      breakDuration
    );

    return employeeBreak;
  }

  /**
   * End a break for an employee
   */
  async endBreak(breakId: string): Promise<EmployeeBreak> {
    const employeeBreak = await this.breakRepository.findOne({
      where: { id: breakId },
      relations: ['shift'],
    });

    if (!employeeBreak) {
      throw new NotFoundException('Break not found');
    }

    if (employeeBreak.isCompleted) {
      throw new BadRequestException('Break is already completed');
    }

    const now = new Date();
    employeeBreak.actualEnd = now;
    employeeBreak.isCompleted = true;

    if (employeeBreak.actualStart) {
      const durationMs = now.getTime() - employeeBreak.actualStart.getTime();
      employeeBreak.actualDuration = Math.floor(durationMs / (1000 * 60));
    }

    await this.breakRepository.save(employeeBreak);

    // Update shift status back to started
    const shift = employeeBreak.shift;
    shift.status = ShiftStatus.STARTED;
    await this.shiftRepository.save(shift);

    // Record break compliance metric
    const isCompliant = employeeBreak.actualDuration <= employeeBreak.scheduledDuration + 5; // 5 min grace
    await this.performanceMetricsService.recordMetric({
      employeeId: shift.employeeId,
      metricType: 'BREAK_COMPLIANCE',
      value: isCompliant ? 100 : 0,
      contextData: {
        breakId: employeeBreak.id,
        scheduledDuration: employeeBreak.scheduledDuration,
        actualDuration: employeeBreak.actualDuration,
      },
    });

    return employeeBreak;
  }

  /**
   * Get employee's active shift
   */
  async getActiveShift(employeeId: string): Promise<EmployeeShift | null> {
    return this.shiftRepository.findOne({
      where: {
        employeeId,
        status: ShiftStatus.STARTED,
      },
      relations: ['breaks'],
    });
  }

  /**
   * Get shift summary for a specific shift
   */
  async getShiftSummary(shiftId: string): Promise<ShiftSummary> {
    const shift = await this.shiftRepository.findOne({
      where: { id: shiftId },
      relations: ['breaks', 'employee'],
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const breakTime = shift.breaks?.reduce((total, break_) =>
      total + (break_.actualDuration || 0), 0
    ) || 0;

    const performanceScore = await this.calculateShiftPerformanceScore(shift);

    return {
      shift,
      totalHours: shift.totalHours || 0,
      regularHours: shift.regularHours || 0,
      overtimeHours: shift.overtimeHours || 0,
      breakTime,
      isLate: shift.isLate,
      lateMinutes: shift.lateMinutes || 0,
      performanceScore,
    };
  }

  /**
   * Get employee timesheets for a period
   */
  async getEmployeeTimesheets(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSheet[]> {
    return this.timesheetRepository.find({
      where: {
        employeeId,
        date: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
      },
      order: { date: 'DESC' },
    });
  }

  /**
   * Approve timesheets
   */
  async approveTimesheet(
    timesheetId: string,
    approvedBy: string,
    notes?: string
  ): Promise<TimeSheet> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id: timesheetId },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.isApproved) {
      throw new BadRequestException('Timesheet is already approved');
    }

    timesheet.isApproved = true;
    timesheet.notes = notes;
    // Note: approvedBy would need to be added to TimeSheet entity

    return this.timesheetRepository.save(timesheet);
  }

  // Private helper methods
  private async findScheduledShift(employeeId: string, time: Date): Promise<EmployeeShift | null> {
    const dayStart = new Date(time);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(time);
    dayEnd.setHours(23, 59, 59, 999);

    return this.shiftRepository.findOne({
      where: {
        employeeId,
        status: ShiftStatus.SCHEDULED,
        scheduledStart: Between(dayStart, dayEnd),
      },
    });
  }

  private calculateShiftHours(shift: EmployeeShift): Partial<EmployeeShift> {
    if (!shift.actualStart || !shift.actualEnd) {
      return {};
    }

    const totalMs = shift.actualEnd.getTime() - shift.actualStart.getTime();
    const totalMinutes = Math.floor(totalMs / (1000 * 60));

    // Calculate break time
    const breakMinutes = shift.breakMinutes || 0;
    const workedMinutes = totalMinutes - breakMinutes;

    // Standard work day is 8 hours (480 minutes)
    const regularMinutes = Math.min(workedMinutes, 480);
    const overtimeMinutes = Math.max(0, workedMinutes - 480);

    return {
      actualMinutes: totalMinutes,
      regularHours: Number((regularMinutes / 60).toFixed(2)),
      overtimeHours: Number((overtimeMinutes / 60).toFixed(2)),
      overtimeMinutes,
    };
  }

  private async updateTimeSheet(shift: EmployeeShift): Promise<void> {
    const date = shift.actualStart?.toISOString().split('T')[0] ||
                  shift.scheduledStart.toISOString().split('T')[0];

    let timesheet = await this.timesheetRepository.findOne({
      where: { employeeId: shift.employeeId, date },
    });

    if (!timesheet) {
      timesheet = this.timesheetRepository.create({
        employeeId: shift.employeeId,
        date,
      });
    }

    timesheet.clockIn = shift.actualStart;
    timesheet.clockOut = shift.actualEnd;
    timesheet.totalMinutes = shift.actualMinutes;
    timesheet.regularHours = shift.regularHours;
    timesheet.overtimeHours = shift.overtimeHours;
    timesheet.overtimeMinutes = shift.overtimeMinutes;

    await this.timesheetRepository.save(timesheet);
  }

  private async endActiveBreaks(shiftId: string): Promise<void> {
    const activeBreaks = await this.breakRepository.find({
      where: { shiftId, isCompleted: false },
    });

    for (const break_ of activeBreaks) {
      await this.endBreak(break_.id);
    }
  }

  private calculatePunctualityScore(scheduled: Date, actual: Date): number {
    const diffMinutes = Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60));

    if (diffMinutes <= 0) return 100; // On time or early
    if (diffMinutes <= 5) return 90;  // Up to 5 minutes late
    if (diffMinutes <= 15) return 70; // Up to 15 minutes late
    if (diffMinutes <= 30) return 50; // Up to 30 minutes late
    return 0; // More than 30 minutes late
  }

  private getBreakDuration(type: BreakType): number {
    const durations = {
      [BreakType.MEAL]: 30,
      [BreakType.REST]: 15,
      [BreakType.SMOKE]: 10,
      [BreakType.PERSONAL]: 15,
      [BreakType.EMERGENCY]: 0, // No limit
      [BreakType.TRAINING]: 60,
      [BreakType.MEETING]: 30,
    };

    return durations[type] || 15;
  }

  private isBreakPaid(type: BreakType): boolean {
    const paidBreaks = [BreakType.REST, BreakType.TRAINING, BreakType.MEETING];
    return paidBreaks.includes(type);
  }

  private async calculateShiftPerformanceScore(shift: EmployeeShift): Promise<number> {
    // Implementation would calculate based on various metrics
    // This is a simplified version
    let score = 100;

    // Deduct for lateness
    if (shift.isLate) {
      score -= Math.min(20, shift.lateMinutes);
    }

    // Deduct for break overruns
    const totalScheduledBreaks = shift.breaks?.reduce((sum, b) => sum + b.scheduledDuration, 0) || 0;
    const totalActualBreaks = shift.breaks?.reduce((sum, b) => sum + (b.actualDuration || 0), 0) || 0;
    const breakOverrun = Math.max(0, totalActualBreaks - totalScheduledBreaks);
    score -= Math.min(15, breakOverrun);

    return Math.max(0, score);
  }

  private async recordShiftPerformanceMetrics(shift: EmployeeShift): Promise<void> {
    const summary = await this.getShiftSummary(shift.id);

    // Record various performance metrics
    const metrics = [
      {
        metricType: 'ATTENDANCE_RATE',
        value: 100, // Present for the shift
      },
      {
        metricType: 'PUNCTUALITY_SCORE',
        value: this.calculatePunctualityScore(shift.scheduledStart, shift.actualStart || shift.scheduledStart),
      },
      {
        metricType: 'OVERTIME_HOURS',
        value: shift.overtimeHours || 0,
      },
    ];

    for (const metric of metrics) {
      await this.performanceMetricsService.recordMetric({
        employeeId: shift.employeeId,
        ...metric,
        contextData: { shiftId: shift.id },
      });
    }
  }
}