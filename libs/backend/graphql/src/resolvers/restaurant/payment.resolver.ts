import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Order, Payment, User } from '@app/models';
import { PaymentArgs } from '../../args';

@Injectable()
@Resolver(() => Payment)
export class PaymentResolver {
  private pubSub: any = new PubSub()

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Queries - Use dynamic Args for flexible querying
  @Query(() => [Payment])
  @UseGuards(PermGuard)
  async payments(
    @Args('args', { type: () => PaymentArgs, nullable: true })
    inputArgs?: InstanceType<typeof PaymentArgs>,
    @ReqUser() user?: User,
  ): Promise<Payment[]> {
    const args = PaymentArgs.toFindManyOptions(inputArgs);
    return this.paymentRepository.find(args);
  }

  @Query(() => Payment, { nullable: true })
  @UseGuards(PermGuard)
  async payment(
    @Args('id') id: string,
    @ReqUser() user?: User,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }

  // Mutations removed - require PaymentService which will not be implemented

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Order)
  async order(@Parent() payment: Payment): Promise<Order> {
    // If order is already loaded, return it
    if (payment.order) {
      return payment.order;
    }
    // Otherwise, lazy load using parent's orderId
    const order = await this.orderRepository.findOne({
      where: { id: payment.orderId },
    });
    if (!order) {
      throw new Error(`Order with ID ${payment.orderId} not found`);
    }
    return order;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() payment: Payment): Promise<User | null> {
    // If user is already loaded, return it
    if (payment.user !== undefined) {
      return payment.user;
    }
    // If no userId, return null
    if (!payment.userId) {
      return null;
    }
    // Otherwise, lazy load using parent's userId
    return this.userRepository.findOne({
      where: { id: payment.userId },
    });
  }

  // Subscriptions
  @Subscription(() => Payment, {
    filter: (payload, variables) => {
      if (variables.orderId) {
        return payload.paymentProcessed.orderId === variables.orderId;
      }
      return true;
    },
  })
  paymentProcessed(@Args('orderId', { nullable: true }) orderId?: string) {
    return this.pubSub.asyncIterator('paymentProcessed');
  }

  @Subscription(() => Payment)
  paymentConfirmations(@Args('orderId') orderId: string) {
    return this.pubSub.asyncIterator([
      'paymentProcessed',
      'paymentRefunded',
      'paymentCancelled'
    ]);
  }
}