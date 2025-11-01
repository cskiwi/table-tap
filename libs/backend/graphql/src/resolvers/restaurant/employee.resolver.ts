import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Employee, TimeSheet, Cafe, Counter } from '@app/models';
import { EmployeeStatus } from '@app/models/enums';

@Injectable()
@Resolver(() => Employee)
export class EmployeeResolver {
  private readonly logger = new Logger(EmployeeResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
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
  //   } catch (error: unknown) {
  //     this.logger.error(`Failed to fetch employees for cafe ${cafeId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      return await this.employeeRepository.findOne({
        where: { id, cafeId: user.cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
  //   } catch (error: unknown) {
  //     this.logger.error(`Failed to get performance metrics for employee ${employeeId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
  //     throw error;
  //   }
  // }

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
  //   } catch (error: unknown) {
  //     this.logger.error(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
  //   } catch (error: unknown) {
  //     this.logger.error(`Failed to update employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
  //     throw error;
  //   }
  // }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deactivateEmployee(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      await this.employeeRepository.softDelete({ id, cafeId: user.cafeId });

      await this.pubSub.publish('employeeDeactivated', {
        employeeDeactivated: { id },
      });

      return true;
    } catch (error: unknown) {
      this.logger.error(`Failed to deactivate employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
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