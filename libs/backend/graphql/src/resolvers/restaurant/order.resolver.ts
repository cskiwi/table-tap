import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Order,
  OrderItem,
  Payment,
  Cafe,
  Counter,
} from '@app/models';
import { OrderService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => Order)
export class OrderResolver {
  private readonly logger = new Logger(OrderResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @UseGuards(PermGuard)
  async orders(
    @ReqUser() user?: User,
    try {
      return await this.orderService.findAll({ filters, pagination, sort, user });
    } catch (error) {
      this.logger.error(`Failed to fetch orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => Order, { nullable: true })
  @UseGuards(PermGuard)
  async order(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Order | null> {
    try {
      return await this.orderService.findById(id, user);
    } catch (error) {
      this.logger.error(`Failed to fetch order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => Order, { nullable: true })
  async orderByNumber(
    @Args('orderNumber') orderNumber: string,
    @Args('cafeId') cafeId: string,
  ): Promise<Order | null> {
    return this.orderService.findByOrderNumber(orderNumber, cafeId);
  }

  @Query(() => [Order])
  @UseGuards(PermGuard)
  async cafeOrders(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<Order[]> {
    return this.orderService.findByCafe(cafeId, { user });
  }

  @Query(() => [Order])
  @UseGuards(PermGuard)
  async myOrders(@ReqUser() user: User): Promise<Order[]> {
    return this.orderService.findByCustomer(user.id);
  }

  @Query(() => Order, { nullable: true })
  @UseGuards(PermGuard)
  async nextOrder(
    @Args('cafeId') cafeId: string,
    @Args('counterId', { nullable: true }) counterId?: string,
    @ReqUser() user?: User,
  ): Promise<Order | null> {
    return this.orderService.getNextOrder(cafeId, counterId, user);
  }

  // Mutations
  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async createOrder(
    @ReqUser() user: User,
  ): Promise<Order> {
    try {
      const order = await this.orderService.create(input, user);

      // Clear related caches
      this.dataLoader.clearCacheByPattern(`cafeOrders:${order.cafeId}`);
      this.dataLoader.clearCacheByPattern(`customerOrders:${user.id}`);

      // Publish new order event
      await this.pubSub.publish('orderCreated', {
        orderCreated: order,
        cafeId: order.cafeId,
      });

      if (order.counterId) {
        await this.pubSub.publish('counterNotification', {
          counterNotification: {
            type: 'NEW_ORDER',
            counterId: order.counterId,
            order,
          },
        });
      }

      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async updateOrderStatus(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Order> {
    try {
      const order = await this.orderService.updateStatus(id, input, user);

      // Clear related caches
      this.dataLoader.clearCacheByPattern(`cafeOrders:${order.cafeId}`);
      if (order.customerId) {
        this.dataLoader.clearCacheByPattern(`customerOrders:${order.customerId}`);
      }

      // Publish order status update
      await this.pubSub.publish('orderStatusUpdated', {
        orderStatusUpdated: order,
        cafeId: order.cafeId,
      });

      return order;
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async updateOrder(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Order> {
    const order = await this.orderService.update(id, input, user);

    await this.pubSub.publish('orderUpdated', {
      orderUpdated: order,
      cafeId: order.cafeId,
    });

    return order;
  }

  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async assignOrderToCounter(
    @Args('orderId') orderId: string,
    @Args('counterId') counterId: string,
    @ReqUser() user: User,
  ): Promise<Order> {
    const order = await this.orderService.assignToCounter(orderId, counterId, user);

    await this.pubSub.publish('orderAssigned', {
      orderAssigned: order,
      counterId,
    });

    return order;
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async cancelOrder(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason?: string,
    @ReqUser() user?: User,
  ): Promise<boolean> {
    const order = await this.orderService.cancel(id, reason, user);

    await this.pubSub.publish('orderCancelled', {
      orderCancelled: order,
      cafeId: order.cafeId,
    });

    return true;
  }

  // Field Resolvers
  @ResolveField(() => [OrderItem])
  async items(@Parent() order: Order): Promise<OrderItem[]> {
    return this.dataLoader.orderItemsByOrderId.load(order.id);
  }

  @ResolveField(() => [Payment])
  async payments(@Parent() order: Order): Promise<Payment[]> {
    return this.dataLoader.paymentsByOrderId.load(order.id);
  }

  @ResolveField(() => Cafe)
  async cafe(@Parent() order: Order): Promise<Cafe> {
    return this.dataLoader.cafeById.load(order.cafeId);
  }

  @ResolveField(() => User, { nullable: true })
  async customer(@Parent() order: Order): Promise<User | null> {
    if (!order.customerId) return null;
    return this.dataLoader.userById.load(order.customerId);
  }

  @ResolveField(() => Counter, { nullable: true })
  async counter(@Parent() order: Order): Promise<Counter | null> {
    if (!order.counterId) return null;
    return this.dataLoader.counterById.load(order.counterId);
  }

  // Subscriptions
  @Subscription(() => Order, {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.orderCreated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  orderCreated(@Args('cafeId', { nullable: true }) cafeId?: string) {
    return this.pubSub.asyncIterator('orderCreated');
  }

  @Subscription(() => Order, {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.orderStatusUpdated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  orderStatusUpdated(@Args('cafeId', { nullable: true }) cafeId?: string) {
    return this.pubSub.asyncIterator('orderStatusUpdated');
  }

  @Subscription(() => Object, {
    filter: (payload, variables) => {
      if (variables.counterId) {
        return payload.counterNotification.counterId === variables.counterId;
      }
      return true;
    },
  })
  counterNotifications(@Args('counterId') counterId: string) {
    return this.pubSub.asyncIterator('counterNotification');
  }
}