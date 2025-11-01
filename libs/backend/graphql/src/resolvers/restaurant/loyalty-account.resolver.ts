import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyAccount,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltyReward,
} from '@app/models';
import { LoyaltyAccountArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyAccount)
export class LoyaltyAccountResolver {
  private readonly logger = new Logger(LoyaltyAccountResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepository: Repository<LoyaltyAccount>,
  ) {}

  // Queries
  @Query(() => [LoyaltyAccount])
  @UseGuards(PermGuard)
  async loyaltyAccounts(
    @Args('skip', { nullable: true }) skip?: number,
    @Args('take', { nullable: true }) take?: number,
    @Args('where', { nullable: true }) where?: any,
    @ReqUser() user?: User,
  ): Promise<LoyaltyAccount[]> {
    try {
      return await this.loyaltyAccountRepository.find({
        skip,
        take,
        where
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty accounts: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => LoyaltyAccount, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyAccount(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount | null> {
    try {
      return await this.loyaltyAccountRepository.findOne({ where: { id } });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty account ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => LoyaltyAccount, { nullable: true })
  @UseGuards(PermGuard)
  async myLoyaltyAccount(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount | null> {
    try {
      return await this.loyaltyAccountRepository.findOne({
        where: { userId: user.id, cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch user loyalty account: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => LoyaltyAccount, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyAccountByNumber(
    @Args('loyaltyNumber') loyaltyNumber: string,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount | null> {
    try {
      // Use repository directly for simple query
      return await this.loyaltyAccountRepository.findOne({
        where: { loyaltyNumber, cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty account by number: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // Mutations removed - require LoyaltyService which will not be implemented
  // Field Resolvers removed - require LoyaltyService and DataLoaderService which will not be implemented

  // Subscriptions
  @Subscription(() => LoyaltyAccount)
  loyaltyAccountCreated() {
    return this.pubSub.asyncIterator('loyaltyAccountCreated');
  }

  @Subscription(() => LoyaltyAccount)
  loyaltyAccountUpdated(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyAccountUpdated_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyAccountUpdated');
  }

  @Subscription(() => Object)
  loyaltyPointsAdded(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyPointsAdded_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPointsAdded');
  }

  @Subscription(() => LoyaltyAccount)
  loyaltyTierUpdated(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyTierUpdated_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyTierUpdated');
  }
}