import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Between, Not, MoreThan, LessThan, In, IsNull } from 'typeorm';
import { RedisPubSubService, RedisCacheService } from './lib/redis-placeholder.service'; // Using placeholder services
import { User } from '@app/models';
import {
  Employee,
  TimeSheet,
  Cafe,
  Counter,
  Order,
  OrderItem
} from '@app/models';
import { EmployeeStatus, UserRole as UserRole, UserRole } from '@app/models/enums';
import { UserRole as RestaurantUserRole } from '@app/models';
import { EmployeeHelpers, AttendanceData, ShiftMetrics } from './employee-helpers';

// Enhanced interfaces for employee management
export interface CreateEmployeeInput {
  userId: string;
  cafeId: string;
  employeeId: string;
  role: UserRole;
  hourlyRate?: number;
  hireDate?: Date;
  department?: string;
  permissions?: string[]
  assignedCounterId?: string;
  workingHours?: WorkingHours;
  emergencyContact?: EmergencyContact;
  certifications?: string[]
  trainingModules?: string[]
}

export interface UpdateEmployeeInput {
  role?: UserRole;
  status?: EmployeeStatus;
  hourlyRate?: number;
  department?: string;
  permissions?: string[]
  assignedCounterId?: string;
  workingHours?: WorkingHours;
  emergencyContact?: EmergencyContact;
  certifications?: string[]
  trainingModules?: string[]
}

export interface ShiftInput {
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  breakMinutes?: number;
  notes?: string;
  scheduledShiftId?: string;
  counterId?: string;
}

export interface ScheduleShiftInput {
  employeeId: string;
  startTime: Date;
  endTime: Date;
  role?: UserRole;
  counterId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

export interface WorkingHours {
  [key: string]: {
    isWorking: boolean;
    startTime?: string;
    endTime?: string;
  }
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface RecurringPattern {
  type: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  endDate?: Date;
  maxOccurrences?: number;
}

export interface ScheduledShift {
  id: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  role?: UserRole;
  counterId?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  isRecurring: boolean;
  recurringShiftId?: string;
  createdBy: string;
  createdAt: Date;
  modifiedAt?: Date;
}

export interface AttendanceRecord {
  employeeId: string;
  date: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  breakMinutes: number;
  totalHours: number;
  overtimeHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE' | 'PARTIAL';
  notes?: string;
}

export interface PerformanceMetrics {
  employeeId: string;
  period: { start: Date; end: Date }
  totalHours: number;
  scheduledHours: number;
  overtimeHours: number;
  shiftsWorked: number;
  shiftsScheduled: number;
  averageShiftLength: number;
  punctualityScore: number; // 0-100
  attendanceRate: number; // 0-100
  productivity: number; // 0-100
  ordersProcessed?: number;
  averageOrderValue?: number;
  customerRating?: number;
  taskCompletionRate?: number;
  trainingProgress?: number;
  performanceRating?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';
}

export interface PayrollData {
  employeeId: string;
  payPeriod: { start: Date; end: Date }
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  sickHours: number;
  vacationHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  bonuses: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  taxes: {
    federal: number;
    state: number;
    local: number;
    socialSecurity: number;
    medicare: number;
  }
  benefits: {
    healthInsurance: number;
    dentalInsurance: number;
    retirement401k: number;
    other: number;
  }
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  moduleName: string;
  moduleType: 'ONBOARDING' | 'SAFETY' | 'SKILLS' | 'COMPLIANCE' | 'CERTIFICATION';
  startDate: Date;
  completionDate?: Date;
  expiryDate?: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  score?: number;
  certificateId?: string;
  instructorId?: string;
  notes?: string;
  requiredForRole: boolean;
}

export interface CertificationRecord {
  id: string;
  employeeId: string;
  certificationName: string;
  certificationBody: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  renewalRequired: boolean;
  attachmentUrl?: string;
}

export interface EmployeeAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  employeesByRole: Record<UserRole, number>;
  employeesByDepartment: Record<string, number>;
  averageTenure: number; // months
  turnoverRate: number; // percentage
  averageHourlyRate: number;
  totalLaborCost: number;
  productivityMetrics: {
    averageProductivity: number;
    topPerformers: Array<{ employeeId: string; name: string; score: number }>;
    underPerformers: Array<{ employeeId: string; name: string; score: number }>;
  }
  attendanceMetrics: {
    averageAttendanceRate: number;
    chronicallyLateEmployees: string[]
    highAbsenteeismEmployees: string[]
  }
  trainingMetrics: {
    averageCompletionRate: number;
    expiredCertifications: number;
    upcomingRenewals: Array<{ employeeId: string; certification: string; expiryDate: Date }>;
  }
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  targetEmployeeId: string;
  originalShiftId: string;
  proposedShiftId?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'WITHDRAWN';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface ScheduleConflict {
  type: 'OVERTIME' | 'DOUBLE_BOOKING' | 'INSUFFICIENT_REST' | 'UNAVAILABLE_HOURS' | 'SKILL_MISMATCH';
  employeeId: string;
  shiftId: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedResolution?: string;
}

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  // In-memory storage for advanced features (would be replaced with database tables)
  private scheduledShifts: Map<string, ScheduledShift> = new Map()
  private trainingRecords: Map<string, TrainingRecord[]> = new Map()
  private certificationRecords: Map<string, CertificationRecord[]> = new Map()
  private shiftSwapRequests: Map<string, ShiftSwapRequest> = new Map()

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(TimeSheet)
    private readonly timeSheetRepository: Repository<TimeSheet>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
    private readonly pubsub: RedisPubSubService,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * EMPLOYEE MANAGEMENT METHODS
   */

  /**
   * Create new employee with enhanced onboarding
   */
  async createEmployee(input: CreateEmployeeInput, user: User): Promise<Employee> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      try {
        this.logger.log(`Creating employee ${input.employeeId} for cafe ${input.cafeId}`);

        // Validate cafe exists
        const cafe = await manager.findOne(Cafe, {
          where: { id: input.cafeId } as any,
          select: ['id', 'name', 'isActive'],
        });

        if (!cafe) {
          throw new NotFoundException(`Cafe with ID ${input.cafeId} not found`);
        }

        // Validate user exists
        const employeeUser = await manager.findOne(User, {
          where: { id: input.userId },
          select: ['id', 'firstName', 'lastName', 'email'],
        });

        if (!employeeUser) {
          throw new NotFoundException(`User with ID ${input.userId} not found`);
        }

        // Check if user is already an employee at this cafe
        const existingEmployee = await manager.findOne(Employee, {
          where: { userId: input.userId, cafeId: input.cafeId }
        });

        if (existingEmployee) {
          throw new BadRequestException(`User is already an employee at this cafe`);
        }

        // Check for duplicate employee ID
        const duplicateEmployeeId = await manager.findOne(Employee, {
          where: { employeeId: input.employeeId, cafeId: input.cafeId }
        });

        if (duplicateEmployeeId) {
          throw new BadRequestException(`Employee ID ${input.employeeId} already exists`);
        }

        // Validate assigned counter if provided
        if (input.assignedCounterId) {
          const counter = await manager.findOne(Counter, {
            where: { id: input.assignedCounterId, cafeId: input.cafeId } as any
          });

          if (!counter) {
            throw new NotFoundException(`Counter with ID ${input.assignedCounterId} not found`);
          }
        }

        // Validate role permissions
        this.validateRolePermissions(input.role, input.permissions || []);

        const employee = manager.create(Employee, {
          cafeId: input.cafeId,
          userId: input.userId,
          employeeId: input.employeeId,
          firstName: "", // TODO: Add to CreateEmployeeInput if needed
          lastName: "", // TODO: Add to CreateEmployeeInput if needed
          email: "", // TODO: Add to CreateEmployeeInput if needed
          phone: "", // TODO: Add to CreateEmployeeInput if needed
          position: input.role,
          status: EmployeeStatus.ACTIVE,
          hireDate: input.hireDate || new Date(),
          hourlyRate: input.hourlyRate || 0,
          salary: 0, // TODO: Add to CreateEmployeeInput if needed
          maxHoursPerWeek: 40, // TODO: Add to CreateEmployeeInput if needed
          notes: "" // TODO: Add to CreateEmployeeInput if needed;
        });
        const savedEmployee = await manager.save(Employee, employee) as Employee;

        // Initialize training records for required modules
        await this.initializeEmployeeTraining(savedEmployee.id, input.role);

        // Publish employee created event
        await this.pubsub.publish('employeeCreated', {
          employeeId: savedEmployee.id,
          cafeId: savedEmployee.cafeId,
          userId: savedEmployee.userId,
          role: savedEmployee.position,
        });

        this.logger.log(`Employee ${savedEmployee.employeeId} created successfully`);
        return savedEmployee;

      } catch (error) {
        this.logger.error(`Failed to create employee: ${(error as Error).message}`, (error as Error).stack);
        throw error;
      }
    });
  }

  /**
   * Enhanced clock in with geolocation and photo verification support
   */
  async clockIn(
    employeeId: string,
    user: User,
    options?: {
      notes?: string;
      location?: { latitude: number; longitude: number }
      photoVerification?: string; // base64 image
      scheduledShiftId?: string;
    }
  ): Promise<TimeSheet> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const employee = await manager.findOne(Employee, { where: { id: employeeId } });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      if (employee.status !== EmployeeStatus.ACTIVE) {
        throw new BadRequestException(`Employee is not active`);
      }

      // Check if already clocked in
      const activeShift = await manager.findOne(TimeSheet, {
        where: { employeeId, actualEndTime: IsNull() }
      });

      if (activeShift) {
        throw new BadRequestException(`Employee is already clocked in`);
      }

      const clockInTime = new Date()

      // Check for scheduled shift and calculate lateness
      let scheduledShift: ScheduledShift | undefined;
      let isLate = false;
      let lateMinutes = 0;

      if (options?.scheduledShiftId) {
        scheduledShift = this.scheduledShifts.get(options.scheduledShiftId);
        if (scheduledShift && clockInTime > scheduledShift.startTime) {
          isLate = true;
          lateMinutes = Math.floor((clockInTime.getTime() - scheduledShift.startTime.getTime()) / (1000 * 60));
        }
      }

      // Process clock-in with helpers
      const attendanceData = await EmployeeHelpers.processClockIn(
        employee as Employee,
        clockInTime,
        options
      );

      const clockInMethod = EmployeeHelpers.determineClockInMethod(options);
      const environmentData = await EmployeeHelpers.getWorkEnvironmentData(employee.cafeId);

      const timeSheet = manager.create(TimeSheet, {
        employeeId,
        cafeId: employee.cafeId,
        shiftDate: clockInTime,
        actualStartTime: clockInTime,
        status: 'STARTED' as any,
        notes: options?.notes,
        // Store isScheduled if field exists
        // isScheduled: !!scheduledShift,
      });

      const savedTimeSheet = await manager.save(TimeSheet, timeSheet) as TimeSheet;

      // Update attendance and send notifications
      await EmployeeHelpers.updateAttendanceRecord(
        employee as Employee,
        savedTimeSheet,
        'clock-in'
      );

      await EmployeeHelpers.sendClockInNotifications(
        employee as Employee,
        savedTimeSheet,
        attendanceData
      );

      EmployeeHelpers.updateRealTimeMetrics(
        employeeId,
        'clock-in',
        savedTimeSheet
      );

      // Update scheduled shift status
      if (scheduledShift) {
        scheduledShift.status = 'CONFIRMED';
        this.scheduledShifts.set(scheduledShift.id, scheduledShift);
      }

      this.logger.log(`Employee ${employee.employeeId} clocked in at ${savedTimeSheet.actualStartTime}${isLate ? ` (${lateMinutes} minutes late)` : ''}`);
      return savedTimeSheet;
    });
  }

  /**
   * Enhanced clock out with shift summary
   */
  async clockOut(
    employeeId: string,
    user: User,
    options?: {
      notes?: string;
      location?: { latitude: number; longitude: number }
      shiftSummary?: string;
    }
  ): Promise<TimeSheet> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const employee = await manager.findOne(Employee, { where: { id: employeeId } });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      // Find active shift using helper
      const activeShift = await EmployeeHelpers.findActiveShift(employeeId, manager);

      if (!activeShift) {
        throw new BadRequestException(`Employee is not currently clocked in`);
      }

      const clockOutTime = new Date();

      // Calculate shift metrics
      const shiftMetrics = await EmployeeHelpers.calculateShiftMetrics(
        activeShift,
        clockOutTime,
        options
      );

      // Combine notes
      const combinedNotes = EmployeeHelpers.combineNotes(
        activeShift.notes,
        options?.notes
      );

      const clockOutMethod = EmployeeHelpers.determineClockOutMethod(options);

      await manager.update(TimeSheet, activeShift.id, {
        actualEndTime: clockOutTime,
        actualHours: shiftMetrics.totalHours,
        status: 'COMPLETED' as any,
        notes: combinedNotes,
      });

      const updatedTimeSheet = await manager.findOne(TimeSheet, { where: { id: activeShift.id } }) as TimeSheet;

      // Update metrics
      EmployeeHelpers.updateRealTimeMetrics(
        employeeId,
        'clock-out',
        updatedTimeSheet
      );

      this.logger.log(`Employee ${employee.employeeId} clocked out. Shift duration: ${shiftMetrics.totalHours.toFixed(2)} hours${shiftMetrics.overtimeHours > 0 ? ` (${shiftMetrics.overtimeHours.toFixed(2)} overtime)` : ''}`);
      return updatedTimeSheet;
    });
  }

  /**
   * Enhanced break recording with break type tracking
   */
  async recordBreak(
    timeSheetId: string,
    breakMinutes: number,
    user: User,
    options?: {
      breakType?: 'MEAL' | 'REST' | 'SMOKE' | 'PERSONAL' | 'OTHER';
      notes?: string;
    }
  ): Promise<TimeSheet> {
    const timeSheet = await this.timeSheetRepository.findOne({ where: { id: timeSheetId } });

    if (!timeSheet) {
      throw new NotFoundException(`Time sheet with ID ${timeSheetId} not found`);
    }

    const currentBreaks = (timeSheet as any).metadata?.breaks || []
    const newBreak = {
      timestamp: new Date(),
      minutes: breakMinutes,
      type: options?.breakType || 'OTHER',
      notes: options?.notes,
    }

    await this.timeSheetRepository.update(timeSheetId, {
      breakMinutes: (timeSheet.breakMinutes || 0) + breakMinutes,
      // Note: metadata field may not exist on TimeSheet entity
      // metadata: {
      //   ...(timeSheet as any).metadata,
      //   breaks: [...currentBreaks, newBreak],
      // }
    });

    const updatedTimeSheet = await this.timeSheetRepository.findOne({ where: { id: timeSheetId } });

    this.logger.log(`Break recorded: ${breakMinutes} minutes (${options?.breakType || 'OTHER'}) for time sheet ${timeSheetId}`);
    return updatedTimeSheet!;
  }

  /**
   * SHIFT SCHEDULING METHODS
   */

  /**
   * Create scheduled shift with conflict detection
   */
  async scheduleShift(input: ScheduleShiftInput, user: User): Promise<ScheduledShift> {
    try {
      // Validate employee exists and is available
      const employee = await this.employeeRepository.findOne({ where: { id: input.employeeId } });
      if (!employee) {
        throw new NotFoundException(`Employee with ID ${input.employeeId} not found`);
      }

      // Check for scheduling conflicts
      const conflicts = await this.checkSchedulingConflicts(input);
      if (conflicts.some(c => c.severity === 'CRITICAL')) {
        throw new BadRequestException(`Critical scheduling conflicts: ${conflicts.map(c => c.message).join(', ')}`);
      }

      const shiftId = this.generateShiftId()
      const scheduledShift: ScheduledShift = {
        id: shiftId,
        employeeId: input.employeeId,
        startTime: input.startTime,
        endTime: input.endTime,
        role: input.role, // Note: employee.role field may not exist
        counterId: input.counterId,
        status: 'SCHEDULED',
        notes: input.notes,
        isRecurring: input.isRecurring || false,
        createdBy: user.id,
        createdAt: new Date(),
      }

      this.scheduledShifts.set(shiftId, scheduledShift);

      // Handle recurring shifts
      if (input.isRecurring && input.recurringPattern) {
        await this.createRecurringShifts(scheduledShift, input.recurringPattern, user);
      }

      // Cache shift data
      await this.cache.set(`scheduled_shift:${shiftId}`, scheduledShift, 86400);

      this.logger.log(`Shift scheduled for employee ${employee.employeeId}: ${input.startTime} - ${input.endTime}`);
      return scheduledShift;

    } catch (error) {
      this.logger.error(`Failed to schedule shift: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get comprehensive performance metrics for an employee
   */
  async getPerformanceMetrics(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    user: User,
  ): Promise<PerformanceMetrics> {
    try {
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      // Get time sheets for the period
      const timeSheets = await this.timeSheetRepository.find({
        where: {
          employeeId,
          actualStartTime: Between(startDate, endDate),
          actualEndTime: Not(IsNull()),
        },
        order: { actualStartTime: 'ASC' }
      });

      // Get scheduled shifts for comparison
      const scheduledShifts = Array.from(this.scheduledShifts.values()).filter(shift =>
        shift.employeeId === employeeId &&
        shift.startTime >= startDate &&
        shift.endTime <= endDate
      );

      // Calculate basic metrics
      const totalHours = timeSheets.reduce((sum, sheet) => sum + (sheet.actualHours || 0), 0);
      const scheduledHours = scheduledShifts.reduce((sum, shift) => {
        const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const overtimeHours = timeSheets.reduce((sum, sheet) => {
        const metadata = (sheet as any).metadata || {};
        return sum + (metadata.overtimeHours || 0);
      }, 0);

      const shiftsWorked = timeSheets.length;
      const shiftsScheduled = scheduledShifts.length;
      const averageShiftLength = shiftsWorked > 0 ? totalHours / shiftsWorked : 0;

      // Calculate punctuality score
      const punctualityScore = this.calculatePunctualityScore(timeSheets, scheduledShifts);

      // Calculate attendance rate
      const attendanceRate = shiftsScheduled > 0 ? (shiftsWorked / shiftsScheduled) * 100 : 100;

      // Get order processing metrics
      const orderMetrics = await this.getOrderProcessingMetrics(employeeId, startDate, endDate);

      // Get training progress
      const trainingProgress = await this.getTrainingProgress(employeeId);

      // Calculate overall productivity score
      const productivity = this.calculateProductivityScore({
        punctualityScore,
        attendanceRate,
        orderMetrics,
        trainingProgress,
      });

      const performanceMetrics: PerformanceMetrics = {
        employeeId,
        period: { start: startDate, end: endDate },
        totalHours,
        scheduledHours,
        overtimeHours,
        shiftsWorked,
        shiftsScheduled,
        averageShiftLength,
        punctualityScore,
        attendanceRate,
        productivity,
        ordersProcessed: orderMetrics.ordersProcessed,
        averageOrderValue: orderMetrics.averageOrderValue,
        customerRating: orderMetrics.customerRating,
        taskCompletionRate: orderMetrics.taskCompletionRate,
        trainingProgress,
        performanceRating: this.calculatePerformanceRating(productivity),
      }

      // Cache metrics
      const cacheKey = `performance_metrics:${employeeId}:${startDate.toISOString()}:${endDate.toISOString()}`;
      await this.cache.set(cacheKey, performanceMetrics, 3600);

      return performanceMetrics;

    } catch (error) {
      this.logger.error(`Failed to get performance metrics: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Generate payroll data for a pay period
   */
  async generatePayrollData(
    employeeId: string,
    payPeriodStart: Date,
    payPeriodEnd: Date,
    user: User,
  ): Promise<PayrollData> {
    try {
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      // Get time sheets for the pay period
      const timeSheets = await this.timeSheetRepository.find({
        where: {
          employeeId,
          actualStartTime: Between(payPeriodStart, payPeriodEnd),
          actualEndTime: Not(IsNull()),
        }
      });

      // Calculate hours
      let regularHours = 0;
      let overtimeHours = 0;
      let holidayHours = 0; // Would check against holiday calendar

      timeSheets.forEach(sheet => {
        const metadata = (sheet as any).metadata || {};
        const shiftHours = sheet.actualHours || 0;
        const shiftOvertimeHours = metadata.overtimeHours || 0;

        regularHours += shiftHours - shiftOvertimeHours;
        overtimeHours += shiftOvertimeHours;
      });

      // Calculate pay rates
      const hourlyRate = employee.hourlyRate || 0;
      const overtimeRate = hourlyRate * 1.5; // Time and a half
      const holidayRate = hourlyRate * 2; // Double time

      // Calculate gross pay
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const holidayPay = holidayHours * holidayRate;
      const bonuses = 0; // Would calculate from bonus records
      const grossPay = regularPay + overtimePay + holidayPay + bonuses;

      // Calculate taxes (simplified rates)
      const taxes = {
        federal: grossPay * 0.12,
        state: grossPay * 0.05,
        local: grossPay * 0.01,
        socialSecurity: grossPay * 0.062,
        medicare: grossPay * 0.0145,
      }

      // Calculate benefits (simplified)
      const benefits = {
        healthInsurance: 150,
        dentalInsurance: 25,
        retirement401k: grossPay * 0.04,
        other: 0,
      }

      const totalTaxes = Object.values(taxes).reduce((sum, tax) => sum + tax, 0);
      const totalBenefits = Object.values(benefits).reduce((sum, benefit) => sum + benefit, 0);
      const deductions = totalTaxes + totalBenefits;
      const netPay = grossPay - deductions;

      const payrollData: PayrollData = {
        employeeId,
        payPeriod: { start: payPeriodStart, end: payPeriodEnd },
        regularHours,
        overtimeHours,
        holidayHours,
        sickHours: 0, // Would track sick time usage
        vacationHours: 0, // Would track vacation time usage
        regularPay,
        overtimePay,
        holidayPay,
        bonuses,
        deductions,
        grossPay,
        netPay,
        taxes,
        benefits,
      }

      this.logger.log(`Generated payroll data for employee ${employee.employeeId}: $${grossPay.toFixed(2)} gross, $${netPay.toFixed(2)} net`);
      return payrollData;

    } catch (error) {
      this.logger.error(`Failed to generate payroll data: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Assign training module to employee
   */
  async assignTraining(
    employeeId: string,
    moduleName: string,
    moduleType: TrainingRecord['moduleType'],
    requiredForRole: boolean,
    user: User,
  ): Promise<TrainingRecord> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const trainingId = this.generateTrainingId()
    const trainingRecord: TrainingRecord = {
      id: trainingId,
      employeeId,
      moduleName,
      moduleType,
      startDate: new Date(),
      status: 'NOT_STARTED',
      requiredForRole,
    }

    const employeeTraining = this.trainingRecords.get(employeeId) || []
    employeeTraining.push(trainingRecord);
    this.trainingRecords.set(employeeId, employeeTraining);

    // Cache training data
    await this.cache.set(`training:${employeeId}`, employeeTraining, 86400);

    this.logger.log(`Training module "${moduleName}" assigned to employee ${employee.employeeId}`);
    return trainingRecord;
  }

  /**
   * Add certification for employee
   */
  async addCertification(
    employeeId: string,
    certificationData: Omit<CertificationRecord, 'id' | 'employeeId'>,
    user: User,
  ): Promise<CertificationRecord> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const certificationId = this.generateCertificationId()
    const certification: CertificationRecord = {
      id: certificationId,
      employeeId,
      ...certificationData,
    }

    const employeeCertifications = this.certificationRecords.get(employeeId) || []
    employeeCertifications.push(certification);
    this.certificationRecords.set(employeeId, employeeCertifications);

    // Cache certification data
    await this.cache.set(`certifications:${employeeId}`, employeeCertifications, 86400);

    this.logger.log(`Certification "${certificationData.certificationName}" added for employee ${employee.employeeId}`);
    return certification;
  }

  /**
   * Get current shift status for employee
   */
  async getCurrentShiftStatus(employeeId: string): Promise<{
    isOnShift: boolean;
    currentShift?: TimeSheet;
    todayHours: number;
    weekHours: number;
    scheduledShift?: ScheduledShift;
    upcomingShifts: ScheduledShift[]
  }> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Get current active shift
    const currentShift = await this.timeSheetRepository.findOne({
      where: { employeeId, actualEndTime: IsNull() }
    });

    // Get today's total hours
    const today = new Date()
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayShifts = await this.timeSheetRepository.find({
      where: {
        employeeId,
        actualStartTime: Between(today, tomorrow)
      }
    });

    const todayHours = todayShifts.reduce((sum, shift) => {
      if (shift.actualEndTime) {
        return sum + (shift.actualHours || 0);
      } else if (currentShift && shift.id === currentShift.id) {
        const now = new Date()
        return sum + ((now.getTime() - shift.actualStartTime.getTime()) / (1000 * 60 * 60));
      }
      return sum;
    }, 0);

    // Get this week's total hours
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekShifts = await this.timeSheetRepository.find({
      where: {
        employeeId,
        actualStartTime: Between(weekStart, weekEnd),
        actualEndTime: Not(IsNull()),
      }
    });

    const weekHours = weekShifts.reduce((sum, shift) => sum + (shift.actualHours || 0), 0) +
                    (currentShift ? todayHours : 0);

    // Get current scheduled shift
    const scheduledShift = Array.from(this.scheduledShifts.values()).find(shift =>
      shift.employeeId === employeeId &&
      shift.startTime <= new Date() &&
      shift.endTime >= new Date() &&
      shift.status !== 'CANCELLED'
    );

    // Get upcoming shifts (next 7 days)
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingShifts = Array.from(this.scheduledShifts.values())
      .filter(shift =>
        shift.employeeId === employeeId &&
        shift.startTime > new Date() &&
        shift.startTime <= weekFromNow &&
        shift.status !== 'CANCELLED'
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5); // Next 5 shifts

    return {
      isOnShift: !!currentShift,
      currentShift: currentShift || undefined,
      todayHours,
      weekHours,
      scheduledShift,
      upcomingShifts,
    }
  }

  /**
   * Generate comprehensive schedule report for a cafe
   */
  async generateScheduleReport(
    cafeId: string,
    startDate: Date,
    endDate: Date,
    user: User,
  ): Promise<{
    employees: Employee[]
    schedules: ScheduledShift[]
    actualHours: Array<{ employeeId: string; scheduledHours: number; actualHours: number; variance: number }>;
    totalScheduledHours: number;
    totalActualHours: number;
    laborCost: number;
    overtimeCost: number;
    attendanceRate: number;
    punctualityScore: number;
    conflicts: ScheduleConflict[]
    recommendations: string[]
  }> {
    const employees = await this.findByCafe(cafeId, { status: EmployeeStatus.ACTIVE });

    // Get scheduled shifts
    const schedules = Array.from(this.scheduledShifts.values()).filter(shift =>
      employees.some(emp => emp.id === shift.employeeId) &&
      shift.startTime >= startDate &&
      shift.endTime <= endDate &&
      shift.status !== 'CANCELLED'
    );

    // Get actual time sheets
    const timeSheets = await this.timeSheetRepository.find({
      where: {
        employee: { cafeId },
        actualStartTime: Between(startDate, endDate),
        actualEndTime: Not(IsNull()),
      },
      relations: ['employee'],
    });

    // Calculate scheduled vs actual hours
    const actualHours = employees.map(employee => {
      const employeeSchedules = schedules.filter(s => s.employeeId === employee.id);
      const employeeTimeSheets = timeSheets.filter(ts => ts.employeeId === employee.id);

      const scheduledHours = employeeSchedules.reduce((sum, schedule) => {
        const hours = (schedule.endTime.getTime() - schedule.startTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const actualWorkedHours = employeeTimeSheets.reduce((sum, sheet) => sum + (sheet.actualHours || 0), 0);
      const variance = actualWorkedHours - scheduledHours;

      return {
        employeeId: employee.id,
        scheduledHours,
        actualHours: actualWorkedHours,
        variance,
      }
    });

    const totalScheduledHours = actualHours.reduce((sum, ah) => sum + ah.scheduledHours, 0);
    const totalActualHours = actualHours.reduce((sum, ah) => sum + ah.actualHours, 0);

    // Calculate costs
    const laborCost = timeSheets.reduce((sum, sheet) => {
      const hourlyRate = sheet.employee.hourlyRate || 15; // Default minimum wage
      const regularHours = Math.min(sheet.actualHours || 0, 8);
      const overtimeHours = Math.max((sheet.actualHours || 0) - 8, 0);
      return sum + (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5);
    }, 0);

    const overtimeCost = timeSheets.reduce((sum, sheet) => {
      const hourlyRate = sheet.employee.hourlyRate || 15;
      const overtimeHours = Math.max((sheet.actualHours || 0) - 8, 0);
      return sum + (overtimeHours * hourlyRate * 0.5); // Extra 50% for overtime
    }, 0);

    // Calculate attendance and punctuality
    const scheduledShiftsCount = schedules.length;
    const workedShiftsCount = timeSheets.length;
    const attendanceRate = scheduledShiftsCount > 0 ? (workedShiftsCount / scheduledShiftsCount) * 100 : 100;

    const punctualityScore = this.calculatePunctualityScore(timeSheets, schedules);

    // Check for conflicts
    const conflicts: ScheduleConflict[] = []
    for (const schedule of schedules) {
      const scheduleConflicts = await this.checkSchedulingConflicts({
        employeeId: schedule.employeeId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
      conflicts.push(...scheduleConflicts.map(c => ({ ...c, shiftId: schedule.id })));
    }

    // Generate recommendations
    const recommendations = this.generateScheduleRecommendations({
      attendanceRate,
      punctualityScore,
      overtimeCost,
      conflicts,
      totalActualHours,
      totalScheduledHours,
    });

    return {
      employees,
      schedules,
      actualHours,
      totalScheduledHours,
      totalActualHours,
      laborCost,
      overtimeCost,
      attendanceRate,
      punctualityScore,
      conflicts,
      recommendations,
    }
  }

  async findById(id: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { id },
      relations: ['user', 'cafe', 'assignedCounter'],
    });
  }

  async findByCafe(
    cafeId: string,
    options?: {
      status?: EmployeeStatus;
      role?: UserRole;
      department?: string;
      limit?: number;
    }
  ): Promise<Employee[]> {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.assignedCounter', 'counter')
      .where('employee.cafeId = :cafeId', { cafeId });

    if (options?.status) {
      queryBuilder.andWhere('employee.status = :status', { status: options.status });
    }

    if (options?.role) {
      queryBuilder.andWhere('employee.role = :role', { role: options.role });
    }

    if (options?.department) {
      queryBuilder.andWhere('employee.department = :department', { department: options.department });
    }

    queryBuilder.orderBy('user.firstName', 'ASC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return queryBuilder.getMany()
  }

  async updateEmployee(id: string, input: UpdateEmployeeInput, user: User): Promise<Employee> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const employee = await manager.findOne(Employee, { where: { id } });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }

      // Validate counter assignment if changed
      if (input.assignedCounterId) { // Note: employee.assignedCounterId field may not exist
        const counter = await manager.findOne(Counter, {
          where: { id: input.assignedCounterId, cafeId: employee.cafeId }
        });

        if (!counter) {
          throw new NotFoundException(`Counter with ID ${input.assignedCounterId} not found`);
        }
      }

      // Validate role permissions if role is changing
      if (input.role) { // Note: employee.role field may not exist
        this.validateRolePermissions(input.role, input.permissions || []); // Note: employee.permissions field may not exist
      }

      // Handle workingHours type conversion if needed
      const updateData = { ...input }
      if (updateData.workingHours) {
        // Convert WorkingHours object to proper format for database
        updateData.workingHours = JSON.stringify(updateData.workingHours) as any;
      }

      await manager.update(Employee, id, updateData);

      const updatedEmployee = await manager.findOne(Employee, { where: { id } });

      this.logger.log(`Employee ${employee.employeeId} updated successfully`);
      return updatedEmployee!;
    });
  }

  async deleteEmployee(id: string, user: User): Promise<boolean> {
    const employee = await this.employeeRepository.findOne({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Don't delete, just deactivate
    await this.employeeRepository.update(id, { status: EmployeeStatus.INACTIVE });

    this.logger.log(`Employee ${employee.employeeId} deactivated`);
    return true;
  }

  // Private helper methods

  private async initializeEmployeeTraining(employeeId: string, role: UserRole): Promise<void> {
    const requiredModules = this.getRequiredTrainingModules(role);
    const trainingRecords: TrainingRecord[] = []

    for (const module of requiredModules) {
      const trainingRecord: TrainingRecord = {
        id: this.generateTrainingId(),
        employeeId,
        moduleName: module.name,
        moduleType: module.type,
        startDate: new Date(),
        status: 'NOT_STARTED',
        requiredForRole: true,
      }
      trainingRecords.push(trainingRecord);
    }

    this.trainingRecords.set(employeeId, trainingRecords);
  }

  private async checkSchedulingConflicts(input: {
    employeeId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = []

    // Check for overlapping shifts
    const overlappingShifts = Array.from(this.scheduledShifts.values()).filter(shift =>
      shift.employeeId === input.employeeId &&
      shift.status !== 'CANCELLED' &&
      (
        (input.startTime >= shift.startTime && input.startTime < shift.endTime) ||
        (input.endTime > shift.startTime && input.endTime <= shift.endTime) ||
        (input.startTime <= shift.startTime && input.endTime >= shift.endTime)
      )
    );

    if (overlappingShifts.length > 0) {
      conflicts.push({
        type: 'DOUBLE_BOOKING',
        employeeId: input.employeeId,
        shiftId: '', // Would be set by caller
        message: 'Employee has overlapping shift scheduled',
        severity: 'CRITICAL',
        suggestedResolution: 'Reschedule one of the conflicting shifts',
      });
    }

    return conflicts;
  }

  private async createRecurringShifts(
    templateShift: ScheduledShift,
    pattern: RecurringPattern,
    user: User,
  ): Promise<void> {
    // Implementation for recurring shifts
    this.logger.log(`Creating recurring shifts for pattern: ${pattern.type}`);
  }

  private calculatePunctualityScore(
    timeSheets: TimeSheet[],
    scheduledShifts: ScheduledShift[]
  ): number {
    if (timeSheets.length === 0) return 100;

    let onTimeShifts = 0;
    let totalShifts = timeSheets.length;

    for (const timeSheet of timeSheets) {
      const metadata = (timeSheet as any).metadata || {};
      const isLate = metadata.isLate || false;

      if (!isLate) {
        onTimeShifts++;
      }
    }

    return (onTimeShifts / totalShifts) * 100;
  }

  private async getOrderProcessingMetrics(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    ordersProcessed: number;
    averageOrderValue: number;
    customerRating: number;
    taskCompletionRate: number;
  }> {
    // Mock implementation - would query actual order data
    return {
      ordersProcessed: Math.floor(Math.random() * 100) + 50,
      averageOrderValue: Math.random() * 50 + 15,
      customerRating: Math.random() * 2 + 3,
      taskCompletionRate: Math.random() * 20 + 80,
    }
  }

  private async getTrainingProgress(employeeId: string): Promise<number> {
    const training = this.trainingRecords.get(employeeId) || []
    if (training.length === 0) return 100;

    const completedTraining = training.filter(t => t.status === 'COMPLETED').length;
    return (completedTraining / training.length) * 100;
  }

  private calculateProductivityScore(metrics: {
    punctualityScore: number;
    attendanceRate: number;
    orderMetrics: any;
    trainingProgress: number;
  }): number {
    // Weighted average calculation
    const weights = { punctuality: 0.25, attendance: 0.25, orders: 0.25, training: 0.25 }
    const orderScore = Math.min(100, (metrics.orderMetrics.ordersProcessed / 75) * 100);

    return (
      metrics.punctualityScore * weights.punctuality +
      metrics.attendanceRate * weights.attendance +
      orderScore * weights.orders +
      metrics.trainingProgress * weights.training
    );
  }

  private calculatePerformanceRating(productivity: number): PerformanceMetrics['performanceRating'] {
    if (productivity >= 90) return 'EXCELLENT';
    if (productivity >= 80) return 'GOOD';
    if (productivity >= 70) return 'SATISFACTORY';
    if (productivity >= 60) return 'NEEDS_IMPROVEMENT';
    return 'UNSATISFACTORY';
  }

  private generateScheduleRecommendations(metrics: any): string[] {
    const recommendations: string[] = []

    if (metrics.attendanceRate < 90) {
      recommendations.push('Low attendance rate detected. Consider reviewing employee availability and scheduling policies.');
    }

    if (metrics.punctualityScore < 85) {
      recommendations.push('Punctuality issues identified. Consider implementing time tracking improvements or employee coaching.');
    }

    return recommendations;
  }

  private getRequiredTrainingModules(role: UserRole): Array<{
    name: string;
    type: TrainingRecord['moduleType']
  }> {
    const commonModules = [
      { name: 'Workplace Safety', type: 'SAFETY' as const },
      { name: 'Customer Service Basics', type: 'SKILLS' as const },
      { name: 'Food Handling', type: 'COMPLIANCE' as const },];
    return commonModules; // Simplified for brevity
  }

  private validateRolePermissions(role: UserRole, permissions: string[]): void {
    const requiredPermissions = this.getRequiredPermissions(role);
    const hasAllRequired = requiredPermissions.every(perm => permissions.includes(perm));

    if (!hasAllRequired) {
      throw new BadRequestException(`Role ${role} requires permissions: ${requiredPermissions.join(', ')}`);
    }
  }

  private getDefaultPermissions(role: UserRole): string[] {
    const permissionMap: Record<string, string[]> = {
      [UserRole.MANAGER]: [
        'view_all_orders', 'manage_orders', 'view_inventory', 'manage_inventory',
        'view_employees', 'manage_employees', 'view_reports', 'manage_cafe',
        'view_schedule', 'manage_schedule', 'view_performance', 'manage_training'
      ],
      [UserRole.CASHIER]: [
        'view_orders', 'create_orders', 'process_payments', 'view_schedule'
      ],
      [UserRole.BARISTA]: [
        'view_orders', 'update_order_status', 'view_inventory', 'view_schedule'
      ],
      [RestaurantUserRole.KITCHEN_STAFF]: [
        'view_orders', 'update_order_status', 'view_inventory', 'view_schedule'
      ],
      [RestaurantUserRole.SERVER]: [
        'view_orders', 'create_orders', 'update_order_status', 'view_schedule'
      ],
      [UserRole.ADMIN]: ['*'], // All permissions
    }

    return permissionMap[role] || []
  }

  private getRequiredPermissions(role: UserRole): string[] {
    return this.getDefaultPermissions(role);
  }

  // ID generation helpers
  private generateShiftId(): string {
    return `SHIFT_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  }

  private generateTrainingId(): string {
    return `TRAIN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  }

  private generateCertificationId(): string {
    return `CERT_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  }
}