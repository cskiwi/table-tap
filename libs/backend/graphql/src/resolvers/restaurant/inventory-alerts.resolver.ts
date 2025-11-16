import { Resolver, Query, Subscription, Args, ResolveField, Parent } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan, MoreThan } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Stock, Cafe, Product } from '@app/models';
import { StockArgs } from '../../args';

@Injectable()
@Resolver(() => Stock)
export class InventoryAlertsResolver {
  private readonly logger = new Logger(InventoryAlertsResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Queries - Use dynamic Args for flexible querying (specific alert queries can be done via where clauses)
  @Query(() => [Stock], { name: 'stockAlerts' })
  @UseGuards(PermGuard)
  async stockAlerts(
    @Args('args', { type: () => StockArgs, nullable: true })
    inputArgs?: InstanceType<typeof StockArgs>,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      const args = StockArgs.toFindManyOptions(inputArgs);
      return await this.stockRepository.find(args);
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch stock alerts: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => GraphQLJSONObject, { name: 'inventoryAlertsSummary' })
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

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() stock: Stock): Promise<Cafe> {
    if (stock.cafe) return stock.cafe;
    const cafe = await this.cafeRepository.findOne({ where: { id: stock.cafeId } });
    if (!cafe) throw new Error(`Cafe with ID ${stock.cafeId} not found`);
    return cafe;
  }

  @ResolveField(() => Product)
  async product(@Parent() stock: Stock): Promise<Product> {
    if (stock.product) return stock.product;
    const product = await this.productRepository.findOne({ where: { id: stock.productId } });
    if (!product) throw new Error(`Product with ID ${stock.productId} not found`);
    return product;
  }

  @Subscription(() => GraphQLJSONObject, {
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
