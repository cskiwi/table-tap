import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan, Between } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Order, OrderItem, Employee, Counter } from '@app/models';
import {
  OrderStatus,
  PreparationStatus,
  StaffStatus,
  EmployeeStatus,
  TimerStatus,
  TimerType,
  TimerPriority,
  AlertSeverity,
  AlertType,
  StationType,
  StationStatus,
  EquipmentStatus,
  EquipmentType,
  OrderPriority,
} from '@app/models/enums';

@Injectable()
@Resolver('KitchenDashboard')
export class KitchenDashboardResolver {
  private readonly logger = new Logger(KitchenDashboardResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  @Query('kitchenDashboard')
  @UseGuards(PermGuard)
  async kitchenDashboard(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [orders, activeStaff] = await Promise.all([
        this.orderRepository.find({
          where: {
            cafeId,
            createdAt: MoreThan(today),
          },
          relations: ['items'],
        }),
        this.employeeRepository.count({
          where: {
            cafeId,
            status: EmployeeStatus.ACTIVE,
          },
        }),
      ]);

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED).length;
      const inProgressOrders = orders.filter(o => o.status === OrderStatus.PREPARING).length;
      const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

      const prepTimes = orders
        .filter(o => o.preparingAt && o.readyAt)
        .map(o => (o.readyAt!.getTime() - o.preparingAt!.getTime()) / 60000);

      const averagePrepTime = prepTimes.length > 0
        ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
        : 0;

      return {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        averagePrepTime,
        activeTimers: 0, // TODO: Implement timer tracking
        criticalAlerts: 0, // TODO: Implement alert system
        activeStaff,
        stationStatus: [], // TODO: Implement station tracking
        recentOrders: orders.slice(0, 10),
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch kitchen dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('kitchenOrders')
  @UseGuards(PermGuard)
  async kitchenOrders(
    @Args('cafeId') cafeId: string,
    @Args('status') status?: OrderStatus[],
    @Args('priority') priority?: string[],
    @Args('counter') counter?: string,
    @Args('dateRange') dateRange?: { startDate: Date; endDate: Date },
    @ReqUser() user?: User,
  ): Promise<Order[]> {
    try {
      const query: any = { cafeId };

      if (status && status.length > 0) {
        query.status = In(status);
      }

      if (counter) {
        query.counterId = counter;
      }

      if (dateRange) {
        query.createdAt = Between(dateRange.startDate, dateRange.endDate);
      }

      const orders = await this.orderRepository.find({
        where: query,
        relations: ['items', 'items.product', 'assignedStaff', 'counter'],
        order: { createdAt: 'DESC' },
        take: 100,
      });

      return orders;
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch kitchen orders: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('kitchenOrder')
  @UseGuards(PermGuard)
  async kitchenOrder(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Order | null> {
    try {
      return await this.orderRepository.findOne({
        where: { id },
        relations: ['items', 'items.product', 'assignedStaff', 'counter'],
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch kitchen order ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('kitchenMetrics')
  @UseGuards(PermGuard)
  async kitchenMetrics(
    @Args('cafeId') cafeId: string,
    @Args('dateRange') dateRange?: { startDate: Date; endDate: Date },
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = dateRange?.startDate || today;
      const endDate = dateRange?.endDate || new Date();

      const orders = await this.orderRepository.find({
        where: {
          cafeId,
          createdAt: Between(startDate, endDate),
        },
        relations: ['items'],
      });

      const totalOrdersToday = orders.length;

      const prepTimes = orders
        .filter(o => o.preparingAt && o.readyAt)
        .map(o => (o.readyAt!.getTime() - o.preparingAt!.getTime()) / 60000);

      const averagePrepTime = prepTimes.length > 0
        ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
        : 0;

      const onTimeOrders = orders.filter(o => {
        if (!o.preparingAt || !o.readyAt || !o.estimatedPrepTime) return false;
        const actualTime = (o.readyAt.getTime() - o.preparingAt.getTime()) / 60000;
        return actualTime <= o.estimatedPrepTime;
      }).length;

      const onTimeCompletionRate = orders.length > 0
        ? (onTimeOrders / orders.length) * 100
        : 0;

      return {
        totalOrdersToday,
        averagePrepTime,
        onTimeCompletionRate,
        peakHourOrders: 0,
        averageWaitTime: averagePrepTime,
        ordersByPriority: {
          normal: orders.filter(o => o.priority === OrderPriority.NORMAL).length,
          high: orders.filter(o => o.priority === OrderPriority.HIGH).length,
          urgent: orders.filter(o => o.priority === OrderPriority.URGENT).length,
          rush: orders.filter(o => o.priority === OrderPriority.RUSH).length,
        },
        ordersByStatus: {
          pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
          confirmed: orders.filter(o => o.status === OrderStatus.CONFIRMED).length,
          preparing: orders.filter(o => o.status === OrderStatus.PREPARING).length,
          ready: orders.filter(o => o.status === OrderStatus.READY).length,
          completed: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
          cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
        },
        preparationEfficiency: onTimeCompletionRate,
        staffUtilization: 75.0, // TODO: Calculate from actual staff data
        equipmentUtilization: 68.0, // TODO: Calculate from equipment tracking
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch kitchen metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation('updateKitchenOrderStatus')
  @UseGuards(PermGuard)
  async updateKitchenOrderStatus(
    @Args('id') id: string,
    @Args('status') status: OrderStatus,
    @ReqUser() user: User,
  ): Promise<Order> {
    try {
      const updateData: any = { status };

      if (status === OrderStatus.PREPARING && !await this.orderRepository.findOne({ where: { id }, select: ['preparingAt'] }).then(o => o?.preparingAt)) {
        updateData.preparingAt = new Date();
      } else if (status === OrderStatus.READY && !await this.orderRepository.findOne({ where: { id }, select: ['readyAt'] }).then(o => o?.readyAt)) {
        updateData.readyAt = new Date();
      }

      await this.orderRepository.update(id, updateData);

      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['items', 'assignedStaff', 'counter'],
      });

      if (!order) {
        throw new Error(`Order with ID ${id} not found`);
      }

      await this.pubSub.publish('kitchenOrderUpdated', {
        kitchenOrderUpdated: order,
        cafeId: order.cafeId,
      });

      return order;
    } catch (error: unknown) {
      this.logger.error(`Failed to update kitchen order status: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation('updateOrderItemStatus')
  @UseGuards(PermGuard)
  async updateOrderItemStatus(
    @Args('id') id: string,
    @Args('status') status: PreparationStatus,
    @ReqUser() user: User,
  ): Promise<OrderItem> {
    try {
      // TODO: Implement OrderItem repository and update logic
      throw new Error('OrderItem status update not yet implemented');
    } catch (error: unknown) {
      this.logger.error(`Failed to update order item status: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation('assignOrderToStaff')
  @UseGuards(PermGuard)
  async assignOrderToStaff(
    @Args('orderId') orderId: string,
    @Args('staffId') staffId: string,
    @ReqUser() user: User,
  ): Promise<Order> {
    try {
      await this.orderRepository.update(orderId, { assignedStaffId: staffId });

      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['items', 'assignedStaff', 'counter'],
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      return order;
    } catch (error: unknown) {
      this.logger.error(`Failed to assign order to staff: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Subscription('kitchenOrderUpdated', {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.kitchenOrderUpdated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  kitchenOrderUpdated(@Args('cafeId') cafeId: string) {
    return this.pubSub.asyncIterator('kitchenOrderUpdated');
  }
}
