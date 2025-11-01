import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyReward,
  LoyaltyRewardRedemption,
} from '@app/models';
import { LoyaltyRewardArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyReward)
export class LoyaltyRewardResolver {
  private readonly logger = new Logger(LoyaltyRewardResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyReward)
    private readonly loyaltyRewardRepository: Repository<LoyaltyReward>,
  ) {}

  // Queries - only simple repository-based queries
  @Query(() => LoyaltyReward, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyReward(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward | null> {
    try {
      return await this.loyaltyRewardRepository.findOne({
        where: { id, cafeId: user.cafeId }
      });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty reward ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // All other queries, mutations, and field resolvers removed - require LoyaltyService which will not be implemented

  // Field Resolvers removed - properties don't exist on model

  // Subscriptions
  @Subscription(() => LoyaltyReward)
  loyaltyRewardCreated(
    @Args('cafeId', { nullable: true }) cafeId?: string,
  ) {
    if (cafeId) {
      return this.pubSub.asyncIterator(`loyaltyRewardCreated_${cafeId}`);
    }
    return this.pubSub.asyncIterator('loyaltyRewardCreated');
  }

  @Subscription(() => LoyaltyReward)
  loyaltyRewardUpdated(
    @Args('rewardId', { nullable: true }) rewardId?: string,
  ) {
    if (rewardId) {
      return this.pubSub.asyncIterator(`loyaltyRewardUpdated_${rewardId}`);
    }
    return this.pubSub.asyncIterator('loyaltyRewardUpdated');
  }

  @Subscription(() => LoyaltyRewardRedemption)
  loyaltyRewardRedeemed(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyRewardRedeemed_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyRewardRedeemed');
  }

  @Subscription(() => LoyaltyRewardRedemption)
  loyaltyRedemptionFulfilled() {
    return this.pubSub.asyncIterator('loyaltyRedemptionFulfilled');
  }
}
