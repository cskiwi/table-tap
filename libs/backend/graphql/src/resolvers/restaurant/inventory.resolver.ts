import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Stock, Cafe } from '@app/models';
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  UpdateInventoryStockInput
} from '../../inputs';
import { InventoryService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => Stock)
export class InventoryResolver {
  private readonly logger = new Logger(InventoryResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Stock)
    private readonly inventoryRepository: Repository<Stock>,
    private readonly inventoryService: InventoryService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => [Stock])
  @UseGuards(PermGuard)
  @UseInterceptors(CacheInterceptor)
  async inventory(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      return await this.inventoryService.findByCafe(cafeId, { user });
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
      // Use DataLoader for caching
      return await this.dataLoader.lowStockItemsByCafeId.load(cafeId);
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
    return this.inventoryService.findOutOfStockItems(cafeId, user);
  }

  @Query(() => [Stock])
  @UseGuards(PermGuard)
  async expiringItems(
    @Args('cafeId') cafeId: string,
    @Args('days', { defaultValue: 7 }) days: number,
    @ReqUser() user: User,
  ): Promise<Stock[]> {
    return this.inventoryService.findExpiringItems(cafeId, days, user);
  }

  @Query(() => Stock, { nullable: true })
  @UseGuards(PermGuard)
  async inventoryItem(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Stock | null> {
    return this.inventoryService.findById(id, user);
  }

  @Query(() => [Stock])
  @UseGuards(PermGuard)
  async searchInventory(
    @Args('cafeId') cafeId: string,
    @Args('query') query: string,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    return this.inventoryService.search(cafeId, query, { user });
  }

  // Mutations
  @Mutation(() => Stock)
  @UseGuards(PermGuard)
  async createInventoryItem(
    @Args('input') input: CreateInventoryItemInput,
    @ReqUser() user: User,
  ): Promise<Stock> {
    const item = await this.inventoryService.createItem(input, user);

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
    @Args('input') input: UpdateInventoryItemInput,
    @ReqUser() user: User,
  ): Promise<Stock> {
    const item = await this.inventoryService.updateItem(id, input, user);

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
    @Args('input') input: UpdateInventoryStockInput,
    @ReqUser() user: User,
  ): Promise<Stock> {
    try {
      const item = await this.inventoryService.updateStock(id, input, user);

      // Clear related caches
      this.dataLoader.clearCacheByPattern(`cafeInventory:${item.cafeId}`);
      this.dataLoader.clearCacheByPattern(`lowStock:${item.cafeId}`);
      this.dataLoader.inventoryById.clear(id);

      await this.pubSub.publish('inventoryUpdated', {
        inventoryUpdated: item,
        cafeId: item.cafeId,
        action: 'STOCK_UPDATED',
      });

      // Check for low stock alert
      if (item.isLowStock) {
        await this.pubSub.publish('stockAlert', {
          stockAlert: {
            type: 'LOW_STOCK',
            item,
            cafeId: item.cafeId,
          },
        });
      }

      // Check for out of stock alert
      if (item.isOutOfStock) {
        await this.pubSub.publish('stockAlert', {
          stockAlert: {
            type: 'OUT_OF_STOCK',
            item,
            cafeId: item.cafeId,
          },
        });
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
    const item = await this.inventoryService.deleteItem(id, user);

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