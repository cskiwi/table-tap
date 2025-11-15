import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Order, User } from '@app/models';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Repository } from 'typeorm';
import { OrderCreateInput, OrderUpdateInput } from '../../inputs/order.input';

@Injectable()
@Resolver(() => Order)
export class OrderResolver {
  private readonly logger = new Logger(OrderResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // Queries - Read directly from repository
  @Query(() => [Order])
  @UseGuards(PermGuard)
  async orders(@ReqUser() user?: User): Promise<Order[]> {
    try {
      // Simple read - no service needed
      return await this.orderRepository.find({
        order: { createdAt: 'DESC' },
        take: 100,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Query(() => Order, { nullable: true })
  @UseGuards(PermGuard)
  async order(@Args('id') id: string, @ReqUser() user: User): Promise<Order | null> {
    try {
      // Simple read - directly from repository
      return await this.orderRepository.findOne({ where: { id } });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch order ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Query(() => Order, { nullable: true })
  async orderByNumber(@Args('orderNumber') orderNumber: string, @Args('cafeId') cafeId: string): Promise<Order | null> {
    // Simple read - directly from repository
    return await this.orderRepository.findOne({
      where: { orderNumber, cafeId },
    });
  }

  @Query(() => [Order])
  @UseGuards(PermGuard)
  async cafeOrders(@Args('cafeId') cafeId: string, @ReqUser() user?: User): Promise<Order[]> {
    // Simple read with filter - directly from repository
    return await this.orderRepository.find({
      where: { cafeId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  @Query(() => [Order])
  @UseGuards(PermGuard)
  async myOrders(@ReqUser() user: User): Promise<Order[]> {
    // Simple read - directly from repository
    return await this.orderRepository.find({
      where: { customerId: user.id },
      order: { createdAt: 'DESC' },
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
  async createOrder(@Args('input') input: OrderCreateInput, @ReqUser() user: User): Promise<Order> {
    try {
      // Order creation has complex business logic - use service
      // (validation, inventory deduction, counter assignment, payment checks)
      // TODO: Implement OrderService
      // throw new Error('OrderService not implemented');
      const order = null as Order | null; // await this.orderService.create(input, user);
      if (!order) throw new Error('OrderService not implemented');

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
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async updateOrderStatus(@Args('id') id: string, @Args('input') input: OrderUpdateInput, @ReqUser() user: User): Promise<Order> {
    try {
      // Status updates have business logic (workflow validation, inventory restoration)
      // TODO: Implement OrderService
      // throw new Error('OrderService not implemented');
      const order = null as Order | null; // await this.orderService.updateStatus(id, input, user);
      if (!order) throw new Error('OrderService not implemented');

      // Publish order status update
      await this.pubSub.publish('orderStatusUpdated', {
        orderStatusUpdated: order,
        cafeId: order.cafeId,
      });

      return order;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => Order)
  @UseGuards(PermGuard)
  async updateOrder(@Args('id') id: string, @Args('input') input: OrderUpdateInput, @ReqUser() user: User): Promise<Order> {
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
  async assignOrderToCounter(@Args('orderId') orderId: string, @Args('counterId') counterId: string, @ReqUser() user: User): Promise<Order> {
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
  async cancelOrder(@Args('id') id: string, @Args('reason', { nullable: true }) reason?: string, @ReqUser() user?: User): Promise<boolean> {
    // Cancellation has business logic (inventory restoration, payment handling)
    // TODO: Implement OrderService
    // throw new Error('OrderService not implemented');
    const order = null as Order | null; // await this.orderService.cancel(id, reason, user);
    if (!order) throw new Error('OrderService not implemented');

    await this.pubSub.publish('orderCancelled', {
      orderCancelled: order,
      cafeId: order.cafeId,
    });

    return true;
  }

  // Field Resolvers removed - DataLoader not available

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

  @Subscription(() => GraphQLJSONObject, {
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
