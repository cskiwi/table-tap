import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyTransaction,
  LoyaltyAccount,
  Order,
  LoyaltyReward,
  CreateLoyaltyTransactionInput,
  LoyaltyTransactionFilters,
  PaginatedLoyaltyTransactionResponse,
  LoyaltyTransactionType,
  LoyaltyTransactionStatus
} from '@app/models/models';
import { LoyaltyService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => LoyaltyTransaction)
export class LoyaltyTransactionResolver {
  private readonly logger = new Logger(LoyaltyTransactionResolver.name);
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => PaginatedLoyaltyTransactionResponse)
  @UseGuards(PermGuard)
  async loyaltyTransactions(
    @Args('filters', { nullable: true }) filters?: LoyaltyTransactionFilters,
    @ReqUser() user?: User,
  ): Promise<PaginatedLoyaltyTransactionResponse> {
    try {
      return await this.loyaltyService.findTransactions({ filters, pagination, sort, user });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyTransaction)
  @UseGuards(PermGuard)
  async loyaltyTransaction(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTransaction> {
    try {
      return await this.loyaltyService.findTransactionById(id, user);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty transaction ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyTransaction])
  @UseGuards(PermGuard)
  async loyaltyTransactionsByAccount(
    @Args('accountId') accountId: string,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
    @Args('type', { nullable: true }) type?: LoyaltyTransactionType,
    @ReqUser() user?: User,
  ): Promise<LoyaltyTransaction[]> {
    try {
      return await this.loyaltyService.getAccountTransactions(accountId, {
        limit,
        offset,
        type,
        user
      });
    } catch (error) {
      this.logger.error(`Failed to fetch transactions for account ${accountId}: ${error.message}`, error.stack);
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
      return await this.loyaltyService.getUserTransactions(user.id, cafeId, { limit, offset });
    } catch (error) {
      this.logger.error(`Failed to fetch user transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => Number)
  @UseGuards(PermGuard)
  async loyaltyTransactionSummary(
    @Args('accountId') accountId: string,
    @Args('fromDate', { nullable: true }) fromDate?: Date,
    @Args('toDate', { nullable: true }) toDate?: Date,
    @Args('type', { nullable: true }) type?: LoyaltyTransactionType,
    @ReqUser() user?: User,
  ): Promise<number> {
    try {
      return await this.loyaltyService.getTransactionSummary(accountId, {
        fromDate,
        toDate,
        type,
        user
      });
    } catch (error) {
      this.logger.error(`Failed to fetch transaction summary for account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  @Mutation(() => LoyaltyTransaction)
  @UseGuards(PermGuard)
  async createLoyaltyTransaction(
    @Args('input') input: CreateLoyaltyTransactionInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyTransaction> {
    try {
      const transaction = await this.loyaltyService.createTransaction(input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTransactionCreated', { loyaltyTransactionCreated: transaction });
      this.pubSub.publish(`loyaltyTransactionCreated_${input.loyaltyAccountId}`, {
        loyaltyTransactionCreated: transaction
      });

      this.logger.log(`Created loyalty transaction ${transaction.id} for account ${input.loyaltyAccountId}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create loyalty transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyTransaction)
  @UseGuards(PermGuard)
  async voidLoyaltyTransaction(
    @Args('id') id: string,
    @Args('reason') reason: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTransaction> {
    try {
      const transaction = await this.loyaltyService.voidTransaction(id, reason, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTransactionVoided', { loyaltyTransactionVoided: transaction });

      this.logger.log(`Voided loyalty transaction ${id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to void loyalty transaction ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyTransaction)
  @UseGuards(PermGuard)
  async adjustLoyaltyTransaction(
    @Args('id') id: string,
    @Args('newAmount') newAmount: number,
    @Args('reason') reason: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTransaction> {
    try {
      const transaction = await this.loyaltyService.adjustTransaction(id, newAmount, reason, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTransactionAdjusted', { loyaltyTransactionAdjusted: transaction });

      this.logger.log(`Adjusted loyalty transaction ${id} to ${newAmount} points`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to adjust loyalty transaction ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => LoyaltyAccount)
  async loyaltyAccount(@Parent() transaction: LoyaltyTransaction): Promise<LoyaltyAccount> {
    if (transaction.loyaltyAccount) return transaction.loyaltyAccount;
    return this.dataLoader.loyaltyAccountLoader.load(transaction.loyaltyAccountId);
  }

  @ResolveField(() => Order, { nullable: true })
  async order(@Parent() transaction: LoyaltyTransaction): Promise<Order | null> {
    if (!transaction.orderId) return null;
    if (transaction.order) return transaction.order;
    return this.dataLoader.orderLoader.load(transaction.orderId);
  }

  @ResolveField(() => LoyaltyReward, { nullable: true })
  async reward(@Parent() transaction: LoyaltyTransaction): Promise<LoyaltyReward | null> {
    if (!transaction.rewardId) return null;
    if (transaction.reward) return transaction.reward;
    return this.dataLoader.loyaltyRewardLoader.load(transaction.rewardId);
  }

  @ResolveField(() => User, { nullable: true })
  async performedBy(@Parent() transaction: LoyaltyTransaction): Promise<User | null> {
    if (!transaction.performedById) return null;
    if (transaction.performedBy) return transaction.performedBy;
    return this.dataLoader.userLoader.load(transaction.performedById);
  }

  @ResolveField(() => Number)
  async runningBalance(@Parent() transaction: LoyaltyTransaction): Promise<number> {
    return this.loyaltyService.calculateRunningBalance(transaction.loyaltyAccountId, transaction.createdAt);
  }

  @ResolveField(() => Boolean)
  async canVoid(@Parent() transaction: LoyaltyTransaction): Promise<boolean> {
    return this.loyaltyService.canVoidTransaction(transaction.id);
  }

  @ResolveField(() => Boolean)
  async canAdjust(@Parent() transaction: LoyaltyTransaction): Promise<boolean> {
    return this.loyaltyService.canAdjustTransaction(transaction.id);
  }

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

  @Subscription(() => Object)
  loyaltyPointsEarned(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyPointsEarned_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPointsEarned');
  }

  @Subscription(() => Object)
  loyaltyPointsRedeemed(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyPointsRedeemed_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPointsRedeemed');
  }
}