import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Payment,
  Order,
  ProcessPaymentInput,
  RefundPaymentInput
} from '@app/models';
import { PaymentService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => Payment)
export class PaymentResolver {
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly paymentService: PaymentService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => [Payment])
  @UseGuards(PermGuard)
  async orderPayments(
    @Args('orderId') orderId: string,
    @ReqUser() user: User,
  ): Promise<Payment[]> {
    return this.paymentService.findByOrder(orderId, user);
  }

  @Query(() => Payment, { nullable: true })
  @UseGuards(PermGuard)
  async payment(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Payment | null> {
    return this.paymentService.findById(id, user);
  }

  @Query(() => Payment, { nullable: true })
  async paymentByTransaction(
    @Args('transactionId') transactionId: string,
  ): Promise<Payment | null> {
    return this.paymentService.findByTransactionId(transactionId);
  }

  // Mutations
  @Mutation(() => Payment)
  @UseGuards(PermGuard)
  async processPayment(
    @Args('input') input: ProcessPaymentInput,
    @ReqUser() user: User,
  ): Promise<Payment> {
    const payment = await this.paymentService.processPayment(input, user);

    // Publish payment confirmation
    await this.pubSub.publish('paymentProcessed', {
      paymentProcessed: payment,
      orderId: payment.orderId,
    });

    return payment;
  }

  @Mutation(() => Payment)
  @UseGuards(PermGuard)
  async refundPayment(
    @Args('input') input: RefundPaymentInput,
    @ReqUser() user: User,
  ): Promise<Payment> {
    const payment = await this.paymentService.refundPayment(input, user);

    await this.pubSub.publish('paymentRefunded', {
      paymentRefunded: payment,
      orderId: payment.orderId,
    });

    return payment;
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async cancelPayment(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason?: string,
    @ReqUser() user?: User,
  ): Promise<boolean> {
    const payment = await this.paymentService.cancelPayment(id, reason, user);

    await this.pubSub.publish('paymentCancelled', {
      paymentCancelled: payment,
      orderId: payment.orderId,
    });

    return true;
  }

  // Field Resolvers
  @ResolveField(() => Order)
  async order(@Parent() payment: Payment): Promise<Order> {
    return this.dataLoader.orderById.load(payment.orderId);
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