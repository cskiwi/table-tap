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
// import { OrderService } from '@app/backend-services'; // TODO: Implement OrderService
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => Order)
export class OrderResolver {
  private readonly logger = new Logger(OrderResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    // private readonly orderService: OrderService, // TODO: Implement OrderService
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries - Read directly from repository
  @Query(() => [Order])
  @UseGuards(PermGuard)
  async orders(
    @ReqUser() user?: User,
  ): Promise<Order[]> {
    try {
      // Simple read - no service needed
      return await this.orderRepository.find({
        order: { createdAt: 'DESC' },
        take: 100
      });
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
      // Simple read - directly from repository
      return await this.orderRepository.findOne({ where: { id } });
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
    // Simple read - directly from repository
    return await this.orderRepository.findOne({
      where: { orderNumber, cafeId }
    });
  }

  @Query(() => [Order])
  @UseGuards(PermGuard)
  async cafeOrders(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<Order[]> {
    // Simple read with filter - directly from repository
    return await this.orderRepository.find({
      where: { cafeId },
      order: { createdAt: 'DESC' },
      take: 100
    });
  }

  @Query(() => [Order])
  @UseGuards(PermGuard)
  async myOrders(@ReqUser() user: User): Promise<Order[]> {
    // Simple read - directly from repository
    return await this.orderRepository.find({
      where: { customerId: user.id },
      order: { createdAt: 'DESC' }
    });
  }

  @Query(() => Order, { nullable: true })
  @UseGuards(PermGuard)
  async nextOrder(
    @Args('cafeId') cafeId: string,
    @Args('counterId', { nullable: true }) counterId?: string,
    @ReqUser() user?: User,
  ): Promise<Order | null> {
    // Business logic query - read from repository with complex filtering
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['PENDING', 'PREPARING'],
      })
      .orderBy('order.createdAt', 'ASC');

    if (counterId) {
      queryBuilder.andWhere('order.counterId = :counterId', { counterId });
    }

    return await queryBuilder.getOne();
  }

  // Mutations - Use service for business logic (validation, payments, inventory)
  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async createOrder(
    @Args('input') input: any,
    @ReqUser() user: User,
  ): Promise<Order> {
    try {
      // Order creation has complex business logic - use service
      // (validation, inventory deduction, counter assignment, payment checks)
      // TODO: Implement OrderService
      // throw new Error('OrderService not implemented');
      const order: Order | null = null; // await this.orderService.create(input, user);
      if (!order) throw new Error('OrderService not implemented');

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
    @Args('input') input: any,
    @ReqUser() user: User,
  ): Promise<Order> {
    try {
      // Status updates have business logic (workflow validation, inventory restoration)
      // TODO: Implement OrderService
      // throw new Error('OrderService not implemented');
      const order: Order | null = null; // await this.orderService.updateStatus(id, input, user);
      if (!order) throw new Error('OrderService not implemented');

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
    @Args('input') input: any,
    @ReqUser() user: User,
  ): Promise<Order> {
    // Simple update - can go directly to repository
    await this.orderRepository.update(id, input);
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }

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
    // Simple assignment - can go directly to repository
    await this.orderRepository.update(orderId, { counterId });
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

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
    // Cancellation has business logic (inventory restoration, payment handling)
    // TODO: Implement OrderService
    // throw new Error('OrderService not implemented');
    const order: Order | null = null; // await this.orderService.cancel(id, reason, user);
    if (!order) throw new Error('OrderService not implemented');

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