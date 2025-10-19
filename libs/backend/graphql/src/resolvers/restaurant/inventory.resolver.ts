import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Stock, Cafe } from '@app/models';
// import { InventoryService } from '@app/backend-services'; // TODO: Implement InventoryService
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => Stock)
export class InventoryResolver {
  private readonly logger = new Logger(InventoryResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Stock)
    private readonly inventoryRepository: Repository<Stock>,
    // private readonly inventoryService: InventoryService, // TODO: Implement InventoryService
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries - Read directly from repository
  @Query(() => [Stock])
  @UseGuards(PermGuard)
  @UseInterceptors(CacheInterceptor)
  async inventory(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      // Read directly from repository - no service needed for simple CRUD
      return await this.inventoryRepository.find({
        where: { cafeId },
        order: { product: { name: 'ASC' } }
      });
    } catch (error) {
      this.logger.error(`Failed to fetch inventory for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [Stock])
  @UseGuards(PermGuard)
  @UseInterceptors(CacheInterceptor)
  async lowStockItems(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Stock[]> {
    try {
      // Read directly from repository with business rule query
      return await this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.cafeId = :cafeId', { cafeId })
        .andWhere('inventory.currentQuantity <= inventory.minimumStock')
        .andWhere('inventory.currentQuantity > 0')
        .andWhere('inventory.status = :status', { status: 'ACTIVE' })
        .orderBy('inventory.currentQuantity', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to fetch low stock items for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [Stock])
  @UseGuards(PermGuard)
  async outOfStockItems(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Stock[]> {
    // Read directly from repository
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.cafeId = :cafeId', { cafeId })
      .andWhere('inventory.currentQuantity = 0')
      .andWhere('inventory.status = :status', { status: 'ACTIVE' })
      .orderBy('inventory.product.name', 'ASC')
      .getMany();
  }

  @Query(() => [Stock])
  @UseGuards(PermGuard)
  async expiringItems(
    @Args('cafeId') cafeId: string,
    @Args('days', { defaultValue: 7 }) days: number,
    @ReqUser() user: User,
  ): Promise<Stock[]> {
    // Read directly from repository with date calculation
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.cafeId = :cafeId', { cafeId })
      .andWhere('inventory.expiryDate IS NOT NULL')
      .andWhere('inventory.expiryDate <= :futureDate', { futureDate })
      .andWhere('inventory.status = :status', { status: 'ACTIVE' })
      .orderBy('inventory.expiryDate', 'ASC')
      .getMany();
  }

  @Query(() => Stock, { nullable: true })
  @UseGuards(PermGuard)
  async inventoryItem(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Stock | null> {
    // Read directly from repository
    return await this.inventoryRepository.findOne({ where: { id } });
  }

  @Query(() => [Stock])
  @UseGuards(PermGuard)
  async searchInventory(
    @Args('cafeId') cafeId: string,
    @Args('query') query: string,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    // Read directly from repository with search
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.cafeId = :cafeId', { cafeId })
      .andWhere(
        '(inventory.product.name ILIKE :query OR inventory.sku ILIKE :query OR inventory.description ILIKE :query)',
        { query: `%${query}%` }
      )
      .take(50)
      .getMany();
  }

  // Mutations - Use service ONLY for business logic (validation, alerts)
  @Mutation(() => Stock)
  @UseGuards(PermGuard)
  async createInventoryItem(
    @Args('input') input: Stock,
    @ReqUser() user: User,
  ): Promise<Stock> {
    // Use service for validation and business logic
    // TODO: Implement InventoryService
    // throw new Error('InventoryService not implemented');
    const item: Stock | null = null; // await this.inventoryService.createItem(input, user);
    if (!item) throw new Error('InventoryService not implemented');

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'CREATED',
    });

    return item;
  }

  @Mutation(() => Stock)
  @UseGuards(PermGuard)
  async updateInventoryItem(
    @Args('id') id: string,
    @Args('input') input: Partial<Stock>,
    @ReqUser() user: User,
  ): Promise<Stock> {
    // Use service for validation logic
    // TODO: Implement InventoryService
    // throw new Error('InventoryService not implemented');
    const item: Stock | null = null; // await this.inventoryService.updateItem(id, input, user);
    if (!item) throw new Error('InventoryService not implemented');

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'UPDATED',
    });

    return item;
  }

  @Mutation(() => Stock)
  @UseGuards(PermGuard)
  async updateInventoryStock(
    @Args('id') id: string,
    @Args('input') input: Partial<Stock> & { operation?: 'ADD' | 'SUBTRACT' | 'SET' },
    @ReqUser() user: User,
  ): Promise<Stock> {
    try {
      // Use service for stock update logic (includes alert generation)
      // TODO: Implement InventoryService
      // throw new Error('InventoryService not implemented');
      const item: Stock | null = null; // await this.inventoryService.updateStock(id, input, user);
      if (!item) throw new Error('InventoryService not implemented');

      // Clear related caches
      this.dataLoader.clearCacheByPattern(`cafeInventory:${item.cafeId}`);
      this.dataLoader.clearCacheByPattern(`lowStock:${item.cafeId}`);
      this.dataLoader.inventoryById.clear(id);

      await this.pubSub.publish('inventoryUpdated', {
        inventoryUpdated: item,
        cafeId: item.cafeId,
        action: 'STOCK_UPDATED',
      });

      // Service handles alert generation, we just publish them
      // TODO: Implement InventoryService
      const alerts: Array<{ type: string; item: Stock; severity: string; message: string }> = [];
      // const alerts = await this.inventoryService.getStockAlerts([item]);
      if (alerts.length > 0) {
        for (const alert of alerts) {
          await this.pubSub.publish('stockAlert', {
            stockAlert: {
              type: alert.type,
              item: alert.item,
              cafeId: item.cafeId,
              severity: alert.severity,
              message: alert.message,
            },
          });
        }
      }

      return item;
    } catch (error) {
      this.logger.error(`Failed to update inventory stock: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteInventoryItem(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    // Simple delete - can go directly to repository
    const item = await this.inventoryRepository.findOne({ where: { id } });

    if (!item) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }

    await this.inventoryRepository.remove(item);

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'DELETED',
    });

    return true;
  }

  // Field Resolvers
  @ResolveField(() => Cafe)
  async cafe(@Parent() inventory: Stock): Promise<Cafe> {
    return this.dataLoader.cafeById.load(inventory.cafeId);
  }

  // Subscriptions
  @Subscription(() => Object, {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.inventoryUpdated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  inventoryUpdates(@Args('cafeId') cafeId: string) {
    return this.pubSub.asyncIterator('inventoryUpdated');
  }

  @Subscription(() => Object, {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.stockAlert.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  stockAlerts(@Args('cafeId') cafeId: string) {
    return this.pubSub.asyncIterator('stockAlert');
  }
}