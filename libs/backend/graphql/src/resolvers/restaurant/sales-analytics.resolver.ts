import { Resolver, Query, Args } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Order, OrderItem, Payment, Product } from '@app/models';
import { DateRangeInput } from '../../inputs/date-range.input';

@Injectable()
@Resolver()
export class SalesAnalyticsResolver {
  private readonly logger = new Logger(SalesAnalyticsResolver.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Query(() => [GraphQLJSONObject], { name: 'topProducts' })
  @UseGuards(PermGuard)
  async topProducts(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'dateRange', nullable: true, type: () => DateRangeInput }) dateRange?: DateRangeInput,
    @Args({ name: 'limit', nullable: true }) limit?: number,
    @ReqUser() user?: User,
  ): Promise<any[]> {
    try {
      const startDate = dateRange?.startDate || this.getStartOfMonth();
      const endDate = dateRange?.endDate || new Date();

      const topProducts = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .select('orderItem.productId', 'productId')
        .addSelect('SUM(orderItem.quantity)', 'quantitySold')
        .addSelect('SUM(orderItem.price * orderItem.quantity)', 'revenue')
        .innerJoin('orderItem.order', 'order')
        .where('order.cafeId = :cafeId', { cafeId })
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('orderItem.productId')
        .orderBy('revenue', 'DESC')
        .limit(limit || 10)
        .getRawMany();

      const productsData = await Promise.all(
        topProducts.map(async (item) => {
          const product = await this.productRepository.findOne({ where: { id: item.productId } });

          const previousPeriod = this.getPreviousPeriod(startDate, endDate);
          const previousRevenue = await this.getProductRevenue(
            cafeId,
            item.productId,
            previousPeriod.start,
            previousPeriod.end
          );

          const growthRate = previousRevenue > 0
            ? ((Number(item.revenue) - previousRevenue) / previousRevenue) * 100
            : 0;

          return {
            productId: item.productId,
            productName: product?.name || 'Unknown',
            quantity: Number(item.quantitySold),
            revenue: Number(item.revenue),
            growthRate,
          };
        })
      );

      return productsData;
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch top products: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [GraphQLJSONObject], { name: 'categoryBreakdown' })
  @UseGuards(PermGuard)
  async categoryBreakdown(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'dateRange', nullable: true, type: () => DateRangeInput }) dateRange?: DateRangeInput,
    @ReqUser() user?: User,
  ): Promise<any[]> {
    try {
      const startDate = dateRange?.startDate || this.getStartOfMonth();
      const endDate = dateRange?.endDate || new Date();

      const categoryData = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .select('product.category', 'category')
        .addSelect('SUM(orderItem.quantity)', 'quantitySold')
        .addSelect('SUM(orderItem.price * orderItem.quantity)', 'revenue')
        .innerJoin('orderItem.product', 'product')
        .innerJoin('orderItem.order', 'order')
        .where('order.cafeId = :cafeId', { cafeId })
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('product.category')
        .getRawMany();

      const totalRevenue = categoryData.reduce(
        (sum, cat) => sum + Number(cat.revenue),
        0
      );

      return categoryData.map(cat => ({
        category: cat.category,
        quantitySold: Number(cat.quantitySold),
        revenue: Number(cat.revenue),
        percentage: totalRevenue > 0 ? (Number(cat.revenue) / totalRevenue) * 100 : 0,
      }));
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch category breakdown: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [GraphQLJSONObject], { name: 'hourlyRevenue' })
  @UseGuards(PermGuard)
  async hourlyRevenue(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'dateRange', nullable: true, type: () => DateRangeInput }) dateRange?: DateRangeInput,
    @ReqUser() user?: User,
  ): Promise<any[]> {
    try {
      const startDate = dateRange?.startDate || this.getStartOfDay();
      const endDate = dateRange?.endDate || new Date();

      const hourlyData = await this.orderRepository
        .createQueryBuilder('order')
        .select('EXTRACT(HOUR FROM order.createdAt)', 'hour')
        .addSelect('COUNT(order.id)', 'orders')
        .addSelect('SUM(order.total)', 'revenue')
        .where('order.cafeId = :cafeId', { cafeId })
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('hour')
        .orderBy('hour', 'ASC')
        .getRawMany();

      const fullHourlyData: any[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const data = hourlyData.find(d => Number(d.hour) === hour);
        fullHourlyData.push({
          hour,
          revenue: data ? Number(data.revenue) : 0,
          orders: data ? Number(data.orders) : 0,
        });
      }

      return fullHourlyData;
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch hourly revenue: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [GraphQLJSONObject], { name: 'dailyRevenue' })
  @UseGuards(PermGuard)
  async dailyRevenue(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'dateRange', nullable: true, type: () => DateRangeInput }) dateRange?: DateRangeInput,
    @ReqUser() user?: User,
  ): Promise<any[]> {
    try {
      const startDate = dateRange?.startDate || this.getStartOfMonth();
      const endDate = dateRange?.endDate || new Date();

      const dailyData = await this.orderRepository
        .createQueryBuilder('order')
        .select('DATE(order.createdAt)', 'date')
        .addSelect('COUNT(order.id)', 'orders')
        .addSelect('SUM(order.total)', 'revenue')
        .where('order.cafeId = :cafeId', { cafeId })
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      return dailyData.map(day => ({
        date: new Date(day.date),
        revenue: Number(day.revenue),
        orders: Number(day.orders),
      }));
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch daily revenue: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getStartOfDay(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private getPreviousPeriod(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration),
      end: start,
    };
  }

  private async getProductRevenue(
    cafeId: string,
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('SUM(orderItem.price * orderItem.quantity)', 'revenue')
      .innerJoin('orderItem.order', 'order')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('orderItem.productId = :productId', { productId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .getRawOne();

    return Number(result?.revenue || 0);
  }
}
