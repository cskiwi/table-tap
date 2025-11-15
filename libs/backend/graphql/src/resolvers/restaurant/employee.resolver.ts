import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Employee, TimeSheet, User } from '@app/models';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { EmployeeArgs } from '../../args';
import { EmployeeCreateInput, EmployeeUpdateInput } from '../../inputs';

@Injectable()
@Resolver(() => Employee)
export class EmployeeResolver {
  private readonly logger = new Logger(EmployeeResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  @Query(() => [Employee])
  @UseGuards(PermGuard)
  @UseInterceptors(CacheInterceptor)
  async employees(
    @Args('cafeId') cafeId: string,
    @Args('args', { type: () => EmployeeArgs, nullable: true })
    inputArgs?: InstanceType<typeof EmployeeArgs>,
    @ReqUser() user?: User,
  ): Promise<Employee[]> {
    try {
      // Build where clause with filters
      const args = EmployeeArgs.toFindOneOptions(inputArgs);

      return this.employeeRepository.find({
        ...args,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch employees for cafe ${cafeId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Query(() => Employee, { nullable: true })
  @UseGuards(PermGuard)
  async employee(@Args('id') id: string, @Args('cafeId') cafeId: string, @ReqUser() user: User): Promise<Employee | null> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some((cafe) => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      return await this.employeeRepository.findOne({
        where: { id, cafeId },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => Employee)
  @UseGuards(PermGuard)
  async createEmployee(@Args('input') input: EmployeeCreateInput, @Args('cafeId') cafeId: string, @ReqUser() user: User): Promise<Employee> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some((cafe) => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      const employee = this.employeeRepository.create({
        ...input,
        cafeId,
      });
      const savedEmployee = await this.employeeRepository.save(employee);

      await this.pubSub.publish('employeeCreated', {
        employeeCreated: savedEmployee,
        cafeId: savedEmployee.cafeId,
      });

      return savedEmployee;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => Employee)
  @UseGuards(PermGuard)
  async updateEmployee(
    @Args('id') id: string,
    @Args('input') input: EmployeeUpdateInput,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Employee> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some((cafe) => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      await this.employeeRepository.update({ id, cafeId }, input);
      const employee = await this.employeeRepository.findOne({
        where: { id, cafeId },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      await this.pubSub.publish('employeeUpdated', {
        employeeUpdated: employee,
        cafeId: employee.cafeId,
      });

      return employee;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deactivateEmployee(@Args('id') id: string, @Args('cafeId') cafeId: string, @ReqUser() user: User): Promise<boolean> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some((cafe) => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      await this.employeeRepository.softDelete({ id, cafeId });

      await this.pubSub.publish('employeeDeactivated', {
        employeeDeactivated: { id },
      });

      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to deactivate employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
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
