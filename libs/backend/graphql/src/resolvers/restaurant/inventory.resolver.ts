import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLJSONObject } from 'graphql-type-json';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Stock, Cafe, Product } from '@app/models';
import { InventoryCreateInput, InventoryUpdateInput, InventoryStockUpdateInput } from '../../inputs/inventory.input';
import { StockArgs } from '../../args';

@Injectable()
@Resolver(() => Stock)
export class InventoryResolver {
  private readonly logger = new Logger(InventoryResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Stock)
    private readonly inventoryRepository: Repository<Stock>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Queries - Use dynamic Args for flexible querying
  @Query(() => [Stock])
  @UseGuards(PermGuard)
  @UseInterceptors(CacheInterceptor)
  async inventory(
    @Args('args', { type: () => StockArgs, nullable: true })
    inputArgs?: InstanceType<typeof StockArgs>,
    @ReqUser() user?: User,
  ): Promise<Stock[]> {
    try {
      const args = StockArgs.toFindManyOptions(inputArgs);
      return await this.inventoryRepository.find(args);
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch inventory: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => Stock, { nullable: true })
  @UseGuards(PermGuard)
  async inventoryItem(
    @Args('id') id: string,
    @ReqUser() user?: User,
  ): Promise<Stock | null> {
    return await this.inventoryRepository.findOne({ where: { id } });
  }

  // Mutations - Use service ONLY for business logic (validation, alerts)
  @Mutation(() => Stock, { name: 'createInventoryItem' })
  @UseGuards(PermGuard)
  async createInventoryItem(
    @Args('input') input: InventoryCreateInput,
    @ReqUser() user: User,
  ): Promise<Stock> {
    // Use service for validation and business logic
    // TODO: Implement InventoryService
    // throw new Error('InventoryService not implemented');
    const item = null as Stock | null; // await this.inventoryService.createItem(input, user);
    if (!item) throw new Error('InventoryService not implemented');

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'CREATED',
    });

    return item;
  }

  @Mutation(() => Stock, { name: 'updateInventoryItem' })
  @UseGuards(PermGuard)
  async updateInventoryItem(
    @Args('id') id: string,
    @Args('input') input: InventoryUpdateInput,
    @ReqUser() user: User,
  ): Promise<Stock> {
    // Use service for validation logic
    // TODO: Implement InventoryService
    // throw new Error('InventoryService not implemented');
    const item = null as Stock | null; // await this.inventoryService.updateItem(id, input, user);
    if (!item) throw new Error('InventoryService not implemented');

    await this.pubSub.publish('inventoryUpdated', {
      inventoryUpdated: item,
      cafeId: item.cafeId,
      action: 'UPDATED',
    });

    return item;
  }

  @Mutation(() => Stock, { name: 'updateInventoryStock' })
  @UseGuards(PermGuard)
  async updateInventoryStock(
    @Args('id') id: string,
    @Args('input') input: InventoryStockUpdateInput,
    @ReqUser() user: User,
  ): Promise<Stock> {
    try {
      // Use service for stock update logic (includes alert generation)
      // TODO: Implement InventoryService
      // throw new Error('InventoryService not implemented');
      const item = null as Stock | null; // await this.inventoryService.updateStock(id, input, user);
      if (!item) throw new Error('InventoryService not implemented');

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
    } catch (error: unknown) {
      this.logger.error(`Failed to update inventory stock: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteInventoryItem' })
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

  // Subscriptions
  @Subscription(() => GraphQLJSONObject, {
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

  @Subscription(() => GraphQLJSONObject, {
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