import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Payment,
  Order
} from '@app/models';

@Injectable()
@Resolver(() => Payment)
export class PaymentResolver {
  private pubSub: any = new PubSub()

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  // Queries - Use repository directly for simple reads
  @Query(() => [Payment])
  @UseGuards(PermGuard)
  async orderPayments(
    @Args('orderId') orderId: string,
    @ReqUser() user: User,
  ): Promise<Payment[]> {
    // Use repository directly for simple read
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' }
    });
  }

  @Query(() => Payment, { nullable: true })
  @UseGuards(PermGuard)
  async payment(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Payment | null> {
    // Use repository directly for simple read
    return this.paymentRepository.findOne({ where: { id } });
  }

  @Query(() => Payment, { nullable: true })
  async paymentByTransaction(
    @Args('transactionId') transactionId: string,
  ): Promise<Payment | null> {
    // Use repository directly for simple read
    return this.paymentRepository.findOne({ where: { transactionId } });
  }

  // Mutations removed - require PaymentService which will not be implemented

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