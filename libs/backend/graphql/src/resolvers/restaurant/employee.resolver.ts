import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Employee,
  TimeSheet,
  Cafe,
  Counter,
  EmployeeStatus,
  // CreateEmployeeInput, // TODO: Create these DTOs
  // UpdateEmployeeInput,
  // ShiftInput,
  // PerformanceMetrics,
  // PaginatedEmployeeResponse
} from '@app/models';
import { EmployeeService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => Employee)
export class EmployeeResolver {
  private readonly logger = new Logger(EmployeeResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly employeeService: EmployeeService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  // TODO: Uncomment when PaginatedEmployeeResponse DTO is created
  // @Query(() => PaginatedEmployeeResponse)
  // @UseGuards(PermGuard)
  // @UseInterceptors(CacheInterceptor)
  // async employees(
  //   @Args('cafeId') cafeId: string,
  //   @Args('filters', { nullable: true }) filters?: {
  //     status?: EmployeeStatus;
  //     department?: string;
  //   },
  //   @ReqUser() user?: User,
  // ): Promise<PaginatedEmployeeResponse> {
  //   try {
  //     const employees = await this.employeeService.findByCafe(cafeId, {
  //       ...filters,
  //       take: pagination?.take,
  //       skip: pagination?.skip,
  //     });
  //     return {
  //       data: employees,
  //       total: employees.length,
  //       skip: pagination?.skip || 0,
  //       take: pagination?.take || 20,
  //       totalPages: Math.ceil(employees.length / (pagination?.take || 20)),
  //     }
  //   } catch (error) {
  //     this.logger.error(`Failed to fetch employees for cafe ${cafeId}: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  @Query(() => Employee, { nullable: true })
  @UseGuards(PermGuard)
  async employee(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Employee | null> {
    try {
      return await this.dataLoader.employeeById.load(id);
    } catch (error) {
      this.logger.error(`Failed to fetch employee ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => Object)
  @UseGuards(PermGuard)
  async employeeShiftStatus(
    @Args('employeeId') employeeId: string,
    @ReqUser() user: User,
  ): Promise<{
    isOnShift: boolean;
    currentShift?: TimeSheet;
    todayHours: number;
    weekHours: number;
  }> {
    try {
      return await this.employeeService.getCurrentShiftStatus(employeeId);
    } catch (error) {
      this.logger.error(`Failed to get shift status for employee ${employeeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // TODO: Uncomment when PerformanceMetrics DTO is created
  // @Query(() => PerformanceMetrics)
  // @UseGuards(PermGuard)
  // async employeePerformance(
  //   @Args('employeeId') employeeId: string,
  //   @Args('startDate') startDate: Date,
  //   @Args('endDate') endDate: Date,
  //   @ReqUser() user: User,
  // ): Promise<PerformanceMetrics> {
  //   try {
  //     return await this.employeeService.getPerformanceMetrics(employeeId, startDate, endDate, user);
  //   } catch (error) {
  //     this.logger.error(`Failed to get performance metrics for employee ${employeeId}: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  @Query(() => Object)
  @UseGuards(PermGuard)
  async cafeScheduleReport(
    @Args('cafeId') cafeId: string,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date,
    @ReqUser() user: User,
  ): Promise<any> {
    try {
      return await this.employeeService.generateScheduleReport(cafeId, startDate, endDate, user);
    } catch (error) {
      this.logger.error(`Failed to generate schedule report for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  // TODO: Uncomment when CreateEmployeeInput DTO is created
  // @Mutation(() => Employee)
  // @UseGuards(PermGuard)
  // async createEmployee(
  //   @Args('input') input: CreateEmployeeInput,
  //   @ReqUser() user: User,
  // ): Promise<Employee> {
  //   try {
  //     const employee = await this.employeeService.createEmployee(input, user);
  //     this.dataLoader.clearCacheByPattern(`cafeEmployees:${employee.cafeId}`);
  //     await this.pubSub.publish('employeeCreated', {
  //       employeeCreated: employee,
  //       cafeId: employee.cafeId,
  //     });
  //     return employee;
  //   } catch (error) {
  //     this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  // TODO: Uncomment when UpdateEmployeeInput DTO is created
  // @Mutation(() => Employee)
  // @UseGuards(PermGuard)
  // async updateEmployee(
  //   @Args('id') id: string,
  //   @Args('input') input: UpdateEmployeeInput,
  //   @ReqUser() user: User,
  // ): Promise<Employee> {
  //   try {
  //     const employee = await this.employeeService.updateEmployee(id, input, user);
  //     this.dataLoader.employeeById.clear(id);
  //     this.dataLoader.clearCacheByPattern(`cafeEmployees:${employee.cafeId}`);
  //     await this.pubSub.publish('employeeUpdated', {
  //       employeeUpdated: employee,
  //       cafeId: employee.cafeId,
  //     });
  //     return employee;
  //   } catch (error) {
  //     this.logger.error(`Failed to update employee ${id}: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  @Mutation(() => TimeSheet)
  @UseGuards(PermGuard)
  async clockIn(
    @Args('employeeId') employeeId: string,
    @Args('notes', { nullable: true }) notes?: string,
    @ReqUser() user?: User,
  ): Promise<TimeSheet> {
    try {
      const timeSheet = await this.employeeService.clockIn(employeeId, user!, { notes });

      // Clear related caches
      this.dataLoader.activeShiftByEmployeeId.clear(employeeId);
      this.dataLoader.timeSheetsByEmployeeId.clear(employeeId);

      await this.pubSub.publish('shiftStarted', {
        shiftStarted: timeSheet,
        employeeId,
      });

      return timeSheet;
    } catch (error) {
      this.logger.error(`Failed to clock in employee ${employeeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => TimeSheet)
  @UseGuards(PermGuard)
  async clockOut(
    @Args('employeeId') employeeId: string,
    @Args('notes', { nullable: true }) notes?: string,
    @ReqUser() user?: User,
  ): Promise<TimeSheet> {
    try {
      const timeSheet = await this.employeeService.clockOut(employeeId, user!, { notes });

      // Clear related caches
      this.dataLoader.activeShiftByEmployeeId.clear(employeeId);
      this.dataLoader.timeSheetsByEmployeeId.clear(employeeId);

      await this.pubSub.publish('shiftEnded', {
        shiftEnded: timeSheet,
        employeeId,
      });

      return timeSheet;
    } catch (error) {
      this.logger.error(`Failed to clock out employee ${employeeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => TimeSheet)
  @UseGuards(PermGuard)
  async recordBreak(
    @Args('timeSheetId') timeSheetId: string,
    @Args('breakMinutes') breakMinutes: number,
    @ReqUser() user: User,
  ): Promise<TimeSheet> {
    try {
      const timeSheet = await this.employeeService.recordBreak(timeSheetId, breakMinutes, user);

      await this.pubSub.publish('breakRecorded', {
        breakRecorded: timeSheet,
        employeeId: timeSheet.employeeId,
        breakMinutes,
      });

      return timeSheet;
    } catch (error) {
      this.logger.error(`Failed to record break for timesheet ${timeSheetId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deactivateEmployee(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      const result = await this.employeeService.deleteEmployee(id, user);

      // Clear related caches
      this.dataLoader.employeeById.clear(id);

      // We'd need to get the employee's cafeId before deletion for this
      // this.dataLoader.clearCacheByPattern(`cafeEmployees:${cafeId}`);

      await this.pubSub.publish('employeeDeactivated', {
        employeeDeactivated: { id },
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to deactivate employee ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => User)
  async user(@Parent() employee: Employee): Promise<User> {
    return this.dataLoader.userById.load(employee.userId);
  }

  @ResolveField(() => Cafe)
  async cafe(@Parent() employee: Employee): Promise<Cafe> {
    return this.dataLoader.cafeById.load(employee.cafeId);
  }

  // TODO: Add assignedCounterId to Employee model if needed
  // @ResolveField(() => Counter, { nullable: true })
  // async assignedCounter(@Parent() employee: Employee): Promise<Counter | null> {
  //   if (!employee.assignedCounterId) return null;
  //   return this.dataLoader.counterById.load(employee.assignedCounterId);
  // }

  @ResolveField(() => [TimeSheet])
  async timeSheets(@Parent() employee: Employee): Promise<TimeSheet[]> {
    return this.dataLoader.timeSheetsByEmployeeId.load(employee.id);
  }

  @ResolveField(() => TimeSheet, { nullable: true })
  async currentShift(@Parent() employee: Employee): Promise<TimeSheet | null> {
    return this.dataLoader.activeShiftByEmployeeId.load(employee.id);
  }

  @ResolveField(() => Object)
  async shiftStatus(@Parent() employee: Employee): Promise<any> {
    try {
      return await this.employeeService.getCurrentShiftStatus(employee.id);
    } catch (error) {
      this.logger.error(`Failed to get shift status for employee ${employee.id}: ${error.message}`);
      return {
        isOnShift: false,
        todayHours: 0,
        weekHours: 0,
      }
    }
  }

  // Subscriptions
  @Subscription(() => Employee, {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.employeeCreated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  employeeCreated(@Args('cafeId', { nullable: true }) cafeId?: string) {
    return this.pubSub.asyncIterator('employeeCreated');
  }

  @Subscription(() => Employee, {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.employeeUpdated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  employeeUpdated(@Args('cafeId', { nullable: true }) cafeId?: string) {
    return this.pubSub.asyncIterator('employeeUpdated');
  }

  @Subscription(() => TimeSheet, {
    filter: (payload, variables) => {
      if (variables.employeeId) {
        return payload.shiftStarted.employeeId === variables.employeeId;
      }
      return true;
    },
  })
  shiftUpdates(@Args('employeeId', { nullable: true }) employeeId?: string) {
    return this.pubSub.asyncIterator(['shiftStarted', 'shiftEnded', 'breakRecorded']);
  }
}