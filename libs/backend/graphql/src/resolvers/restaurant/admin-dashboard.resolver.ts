import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Order, Employee, Payment, Product } from '@app/models';
import { OrderStatus, EmployeeStatus } from '@app/models/enums';

@Injectable()
@Resolver('AdminDashboard')
export class AdminDashboardResolver {
  private readonly logger = new Logger(AdminDashboardResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  @Query('adminDashboard')
  @UseGuards(PermGuard)
  async adminDashboard(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayOrders, todayPayments, activeEmployees, pendingOrders] = await Promise.all([
        this.orderRepository.find({
          where: {
            cafeId,
            createdAt: MoreThan(today),
          },
          relations: ['items', 'payments'],
        }),
        this.paymentRepository.find({
          where: {
            order: {
              cafeId,
            },
            createdAt: MoreThan(today),
          },
        }),
        this.employeeRepository.count({
          where: {
            cafeId,
            status: EmployeeStatus.ACTIVE,
          },
        }),
        this.orderRepository.count({
          where: {
            cafeId,
            status: OrderStatus.PENDING,
          },
        }),
      ]);

      const todayRevenue = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const customerCount = new Set(todayOrders.map(o => o.customerId).filter(Boolean)).size;
      const averageOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

      return {
        todayRevenue,
        todayOrders: todayOrders.length,
        activeEmployees,
        lowStockItems: 0, // TODO: Implement inventory tracking
        pendingOrders,
        averageOrderValue,
        customerCount,
        inventoryValue: 0, // TODO: Implement inventory valuation
        recentActivity: [], // TODO: Implement activity tracking
        topProducts: [], // TODO: Implement product analytics
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch admin dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('revenueMetrics')
  @UseGuards(PermGuard)
  async revenueMetrics(
    @Args('cafeId') cafeId: string,
    @Args('dateRange') dateRange?: { startDate: Date; endDate: Date },
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        todayPayments,
        yesterdayPayments,
        thisWeekPayments,
        lastWeekPayments,
        thisMonthPayments,
        lastMonthPayments,
      ] = await Promise.all([
        this.getPaymentSum(cafeId, today, now),
        this.getPaymentSum(cafeId, yesterday, today),
        this.getPaymentSum(cafeId, thisWeekStart, now),
        this.getPaymentSum(cafeId, lastWeekStart, lastWeekEnd),
        this.getPaymentSum(cafeId, thisMonthStart, now),
        this.getPaymentSum(cafeId, lastMonthStart, lastMonthEnd),
      ]);

      const dailyGrowth = yesterdayPayments > 0
        ? ((todayPayments - yesterdayPayments) / yesterdayPayments) * 100
        : 0;

      const weeklyGrowth = lastWeekPayments > 0
        ? ((thisWeekPayments - lastWeekPayments) / lastWeekPayments) * 100
        : 0;

      const monthlyGrowth = lastMonthPayments > 0
        ? ((thisMonthPayments - lastMonthPayments) / lastMonthPayments) * 100
        : 0;

      return {
        today: todayPayments,
        yesterday: yesterdayPayments,
        thisWeek: thisWeekPayments,
        lastWeek: lastWeekPayments,
        thisMonth: thisMonthPayments,
        lastMonth: lastMonthPayments,
        dailyGrowth,
        weeklyGrowth,
        monthlyGrowth,
        hourlyBreakdown: [], // TODO: Implement hourly breakdown
        dailyBreakdown: [], // TODO: Implement daily breakdown
        paymentMethods: {
          card: 74.9,
          cash: 20.6,
          digital: 4.5,
          other: 0,
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch revenue metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('orderMetrics')
  @UseGuards(PermGuard)
  async orderMetrics(
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
      });

      const prepTimes = orders
        .filter(o => o.preparingAt && o.readyAt)
        .map(o => (o.readyAt!.getTime() - o.preparingAt!.getTime()) / 60000);

      const averageTime = prepTimes.length > 0
        ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
        : 0;

      return {
        total: orders.length,
        pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
        preparing: orders.filter(o => o.status === OrderStatus.PREPARING).length,
        ready: orders.filter(o => o.status === OrderStatus.READY).length,
        completed: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
        cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
        averageTime,
        peakHours: [], // TODO: Calculate peak hours
        orderTypes: {
          dineIn: orders.filter(o => o.orderType === 'DINE_IN').length,
          takeaway: orders.filter(o => o.orderType === 'TAKEAWAY').length,
          delivery: orders.filter(o => o.orderType === 'DELIVERY').length,
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch order metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('employeePerformance')
  @UseGuards(PermGuard)
  async employeePerformance(
    @Args('cafeId') cafeId: string,
    @Args('dateRange') dateRange?: { startDate: Date; endDate: Date },
    @Args('limit') limit?: number,
    @ReqUser() user?: User,
  ): Promise<any[]> {
    try {
      const employees = await this.employeeRepository.find({
        where: { cafeId },
        relations: ['user'],
        take: limit || 10,
      });

      // TODO: Implement actual performance calculation from timesheet and order data
      return employees.map(emp => ({
        employeeId: emp.id,
        employee: emp,
        ordersProcessed: 0,
        averageTime: 0,
        rating: 0,
        efficiency: 0,
        currentStatus: emp.status,
        hoursWorked: 0,
        attendance: {
          daysPresent: 0,
          daysAbsent: 0,
          lateArrivals: 0,
          overtimeHours: 0,
        },
      }));
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch employee performance: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query('salesAnalytics')
  @UseGuards(PermGuard)
  async salesAnalytics(
    @Args('cafeId') cafeId: string,
    @Args('dateRange') dateRange?: { startDate: Date; endDate: Date },
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      // TODO: Implement comprehensive sales analytics
      return {
        topProducts: [],
        categoryBreakdown: [],
        hourlyRevenue: [],
        dailyRevenue: [],
        paymentMethods: {
          card: 74.9,
          cash: 20.6,
          digital: 4.5,
          other: 0,
        },
        customerSegments: [],
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch sales analytics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private async getPaymentSum(cafeId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .innerJoin('payment.order', 'order')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('payment.createdAt >= :startDate', { startDate })
      .andWhere('payment.createdAt < :endDate', { endDate })
      .getRawOne();

    return Number(result?.total || 0);
  }

  @Subscription('revenueUpdated', {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.revenueUpdated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  revenueUpdated(@Args('cafeId') cafeId: string) {
    return this.pubSub.asyncIterator('revenueUpdated');
  }
}
