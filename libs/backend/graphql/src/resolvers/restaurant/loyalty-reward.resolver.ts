import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, LoyaltyReward, LoyaltyRewardRedemption, User } from '@app/models';
import { LoyaltyRewardArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyReward)
export class LoyaltyRewardResolver {
  private readonly logger = new Logger(LoyaltyRewardResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyReward)
    private readonly loyaltyRewardRepository: Repository<LoyaltyReward>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
  ) {}

  // Queries - only simple repository-based queries
  @Query(() => LoyaltyReward, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyReward(
    @Args('id') id: string,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward | null> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some(cafe => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      return await this.loyaltyRewardRepository.findOne({
        where: { id, cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty reward ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // All other queries, mutations removed - require LoyaltyService which will not be implemented

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() reward: LoyaltyReward): Promise<Cafe> {
    if (reward.cafe) return reward.cafe;
    const cafe = await this.cafeRepository.findOne({ where: { id: reward.cafeId } });
    if (!cafe) throw new Error(`Cafe with ID ${reward.cafeId} not found`);
    return cafe;
  }

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
