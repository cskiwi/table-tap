import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyTransaction,
} from '@app/models';
import { LoyaltyTransactionArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyTransaction)
export class LoyaltyTransactionResolver {
  private readonly logger = new Logger(LoyaltyTransactionResolver.name);
  private pubSub: any = new PubSub()

  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
  ) {}

  // Queries - only simple repository-based queries
  @Query(() => LoyaltyTransaction, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyTransaction(
    @Args('id') id: string,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTransaction | null> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some(cafe => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      return await this.loyaltyTransactionRepository.findOne({
        where: { id, cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty transaction ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [LoyaltyTransaction])
  @UseGuards(PermGuard)
  async loyaltyTransactionsByAccount(
    @Args('accountId') accountId: string,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
    @Args('type', { nullable: true }) type?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyTransaction[]> {
    try {
      const where: any = { loyaltyAccountId: accountId };
      if (type) where.type = type;

      return await this.loyaltyTransactionRepository.find({
        where,
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch transactions for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [LoyaltyTransaction])
  @UseGuards(PermGuard)
  async myLoyaltyTransactions(
    @Args('cafeId') cafeId: string,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
    @ReqUser() user: User,
  ): Promise<LoyaltyTransaction[]> {
    try {
      return await this.loyaltyTransactionRepository.find({
        where: { cafeId, loyaltyAccount: { userId: user.id } },
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' },
        relations: ['loyaltyAccount']
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch user transactions: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // All other queries, mutations, and field resolvers removed - require LoyaltyService which will not be implemented

  // Subscriptions
  @Subscription(() => LoyaltyTransaction)
  loyaltyTransactionCreated(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyTransactionCreated_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyTransactionCreated');
  }

  @Subscription(() => LoyaltyTransaction)
  loyaltyTransactionVoided() {
    return this.pubSub.asyncIterator('loyaltyTransactionVoided');
  }

  @Subscription(() => LoyaltyTransaction)
  loyaltyTransactionAdjusted() {
    return this.pubSub.asyncIterator('loyaltyTransactionAdjusted');
  }

  @Subscription(() => GraphQLJSONObject)
  loyaltyPointsEarned(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyPointsEarned_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPointsEarned');
  }

  @Subscription(() => GraphQLJSONObject)
  loyaltyPointsRedeemed(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyPointsRedeemed_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPointsRedeemed');
  }
}
