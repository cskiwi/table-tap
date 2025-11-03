import { Resolver, Query, Subscription, Args } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan, MoreThan } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Stock } from '@app/models';

@Injectable()
@Resolver()
export class InventoryAlertsResolver {
  private readonly logger = new Logger(InventoryAlertsResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  @Query(() => [Stock], { name: 'lowStockItems' })
  @UseGuards(PermGuard)
  async lowStockItems(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'limit', nullable: true }) limit?: number,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      const lowStockItems = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.product', 'product')
        .where('stock.cafeId = :cafeId', { cafeId })
        .andWhere('stock.currentQuantity <= stock.reorderLevel')
        .andWhere('stock.currentQuantity > 0')
        .andWhere('stock.isActive = :isActive', { isActive: true })
        .orderBy('stock.currentQuantity', 'ASC')
        .limit(limit || 50)
        .getMany();

      await this.triggerLowStockAlerts(cafeId, lowStockItems);

      return lowStockItems;
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch low stock items: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [Stock], { name: 'outOfStockItems' })
  @UseGuards(PermGuard)
  async outOfStockItems(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'limit', nullable: true }) limit?: number,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      return await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.product', 'product')
        .where('stock.cafeId = :cafeId', { cafeId })
        .andWhere('stock.currentQuantity <= 0')
        .andWhere('stock.isActive = :isActive', { isActive: true })
        .orderBy('stock.lastSoldAt', 'DESC')
        .limit(limit || 50)
        .getMany();
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch out of stock items: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [Stock], { name: 'expiringItems' })
  @UseGuards(PermGuard)
  async expiringItems(
    @Args('cafeId') cafeId: string,
    @Args({ name: 'daysAhead', nullable: true }) daysAhead?: number,
    @Args({ name: 'limit', nullable: true }) limit?: number,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      const daysToCheck = daysAhead || 7;
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + daysToCheck);

      return await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.product', 'product')
        .where('stock.cafeId = :cafeId', { cafeId })
        .andWhere('stock.expiryDate IS NOT NULL')
        .andWhere('stock.expiryDate <= :expiryThreshold', { expiryThreshold })
        .andWhere('stock.currentQuantity > 0')
        .andWhere('stock.isActive = :isActive', { isActive: true })
        .orderBy('stock.expiryDate', 'ASC')
        .limit(limit || 50)
        .getMany();
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch expiring items: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => Object, { name: 'inventoryAlertsSummary' })
  @UseGuards(PermGuard)
  async inventoryAlertsSummary(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      const [lowStockCount, outOfStockCount, expiringCount, overStockCount] = await Promise.all([
        this.stockRepository
          .createQueryBuilder('stock')
          .where('stock.cafeId = :cafeId', { cafeId })
          .andWhere('stock.currentQuantity <= stock.reorderLevel')
          .andWhere('stock.currentQuantity > 0')
          .andWhere('stock.isActive = :isActive', { isActive: true })
          .getCount(),
        this.stockRepository.count({
          where: {
            cafeId,
            currentQuantity: LessThanOrEqual(0),
            isActive: true,
          }
        }),
        this.stockRepository
          .createQueryBuilder('stock')
          .where('stock.cafeId = :cafeId', { cafeId })
          .andWhere('stock.expiryDate IS NOT NULL')
          .andWhere('stock.expiryDate <= :threshold', { threshold: this.getDateAhead(7) })
          .andWhere('stock.isActive = :isActive', { isActive: true })
          .getCount(),
        this.stockRepository
          .createQueryBuilder('stock')
          .where('stock.cafeId = :cafeId', { cafeId })
          .andWhere('stock.currentQuantity > stock.maxLevel')
          .andWhere('stock.isActive = :isActive', { isActive: true })
          .getCount(),
      ]);

      return {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        expiringSoon: expiringCount,
        overStock: overStockCount,
        totalAlerts: lowStockCount + outOfStockCount + expiringCount + overStockCount,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch inventory alerts summary: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Subscription(() => Object, {
    name: 'inventoryAlertCreated',
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.inventoryAlertCreated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  inventoryAlertCreated(@Args('cafeId') cafeId: string) {
    return this.pubSub.asyncIterator('inventoryAlertCreated');
  }

  private getDateAhead(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private async triggerLowStockAlerts(cafeId: string, items: Stock[]): Promise<void> {
    const criticalItems = items.filter(
      item => item.currentQuantity < item.reorderLevel * 0.2
    );

    if (criticalItems.length > 0) {
      await this.pubSub.publish('inventoryAlertCreated', {
        inventoryAlertCreated: {
          cafeId,
          alertType: 'CRITICAL_LOW_STOCK',
          items: criticalItems,
          count: criticalItems.length,
          timestamp: new Date(),
        },
      });
    }
  }
}
