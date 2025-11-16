import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, Employee, TimeSheet, User } from '@app/models';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
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
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() employee: Employee): Promise<Cafe> {
    // If cafe is already loaded, return it
    if (employee.cafe) {
      return employee.cafe;
    }
    // Otherwise, lazy load using parent's cafeId
    const cafe = await this.cafeRepository.findOne({
      where: { id: employee.cafeId },
    });
    if (!cafe) {
      throw new Error(`Cafe with ID ${employee.cafeId} not found`);
    }
    return cafe;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() employee: Employee): Promise<User | null> {
    // If user is already loaded, return it
    if (employee.user !== undefined) {
      return employee.user;
    }
    // If no userId, return null
    if (!employee.userId) {
      return null;
    }
    // Otherwise, lazy load using parent's userId
    return this.userRepository.findOne({
      where: { id: employee.userId },
    });
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
