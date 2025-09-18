import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Inventory,
  Cafe,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  UpdateInventoryStockInput,
  PaginationInput,
  SortInput,
  PaginatedInventoryResponse
} from '@app/models/restaurant';
import { InventoryService } from '../services/inventory.service';
import { DataLoader } from '../../dataloaders';

@Injectable()
@Resolver(() => Inventory)
export class InventoryResolver {
  private pubSub = new PubSub();

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly inventoryService: InventoryService,
    private readonly dataLoader: DataLoader,
  ) {}

  // Queries
  @Query(() => PaginatedInventoryResponse)
  @UseGuards(PermGuard)
  async inventory(
    @Args('cafeId') cafeId: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('sort', { nullable: true }) sort?: SortInput,
    @ReqUser() user?: User,
  ): Promise<PaginatedInventoryResponse> {
    return this.inventoryService.findByCafe(cafeId, { pagination, sort, user });
  }

  @Query(() => [Inventory])
  @UseGuards(PermGuard)
  async lowStockItems(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Inventory[]> {
    return this.inventoryService.findLowStockItems(cafeId, user);
  }

  @Query(() => [Inventory])
  @UseGuards(PermGuard)
  async outOfStockItems(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Inventory[]> {
    return this.inventoryService.findOutOfStockItems(cafeId, user);
  }

  @Query(() => [Inventory])
  @UseGuards(PermGuard)
  async expiringItems(
    @Args('cafeId') cafeId: string,
    @Args('days', { defaultValue: 7 }) days: number,
    @ReqUser() user: User,
  ): Promise<Inventory[]> {
    return this.inventoryService.findExpiringItems(cafeId, days, user);
  }

  @Query(() => Inventory, { nullable: true })
  @UseGuards(PermGuard)
  async inventoryItem(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Inventory | null> {
    return this.inventoryService.findById(id, user);
  }

  @Query(() => [Inventory])
  @UseGuards(PermGuard)
  async searchInventory(
    @Args('cafeId') cafeId: string,
    @Args('query') query: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @ReqUser() user?: User,
  ): Promise<Inventory[]> {
    return this.inventoryService.search(cafeId, query, { pagination, user });
  }

  // Mutations
  @Mutation(() => Inventory)
  @UseGuards(PermGuard)
  async createInventoryItem(
    @Args('input') input: CreateInventoryItemInput,
    @ReqUser() user: User,
  ): Promise<Inventory> {
    const item = await this.inventoryService.createItem(input, user);

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'CREATED',
    });

    return item;
  }

  @Mutation(() => Inventory)
  @UseGuards(PermGuard)
  async updateInventoryItem(
    @Args('id') id: string,
    @Args('input') input: UpdateInventoryItemInput,
    @ReqUser() user: User,
  ): Promise<Inventory> {
    const item = await this.inventoryService.updateItem(id, input, user);

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'UPDATED',
    });

    return item;
  }

  @Mutation(() => Inventory)
  @UseGuards(PermGuard)
  async updateInventoryStock(
    @Args('id') id: string,
    @Args('input') input: UpdateInventoryStockInput,
    @ReqUser() user: User,
  ): Promise<Inventory> {
    const item = await this.inventoryService.updateStock(id, input, user);

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
  async cafe(@Parent() inventory: Inventory): Promise<Cafe> {
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