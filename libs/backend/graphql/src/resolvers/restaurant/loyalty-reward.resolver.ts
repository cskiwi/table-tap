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
  LoyaltyAccount,
  CreateLoyaltyRewardInput,
  UpdateLoyaltyRewardInput,
  LoyaltyRewardFilters,
  RedeemRewardInput,
  PaginatedLoyaltyRewardResponse
} from '@app/models/models';
import { LoyaltyService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => LoyaltyReward)
export class LoyaltyRewardResolver {
  private readonly logger = new Logger(LoyaltyRewardResolver.name);
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(LoyaltyReward)
    private readonly loyaltyRewardRepository: Repository<LoyaltyReward>,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => PaginatedLoyaltyRewardResponse)
  @UseGuards(PermGuard)
  async loyaltyRewards(
    @Args('filters', { nullable: true }) filters?: LoyaltyRewardFilters,
    @ReqUser() user?: User,
  ): Promise<PaginatedLoyaltyRewardResponse> {
    try {
      return await this.loyaltyService.findRewards({ filters, pagination, sort, user });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty rewards: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyReward)
  @UseGuards(PermGuard)
  async loyaltyReward(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward> {
    try {
      return await this.loyaltyService.findRewardById(id, user);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty reward ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyReward])
  @UseGuards(PermGuard)
  async availableLoyaltyRewards(
    @Args('accountId') accountId: string,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward[]> {
    try {
      return await this.loyaltyService.getAvailableRewards(accountId, cafeId);
    } catch (error) {
      this.logger.error(`Failed to fetch available rewards for account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyReward])
  @UseGuards(PermGuard)
  async featuredLoyaltyRewards(
    @Args('cafeId') cafeId: string,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward[]> {
    try {
      return await this.loyaltyService.getFeaturedRewards(cafeId, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch featured rewards for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyReward])
  @UseGuards(PermGuard)
  async loyaltyRewardsByCategory(
    @Args('cafeId') cafeId: string,
    @Args('category') category: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit: number,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward[]> {
    try {
      return await this.loyaltyService.getRewardsByCategory(cafeId, category, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch rewards by category ${category}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  @Mutation(() => LoyaltyReward)
  @UseGuards(PermGuard)
  async createLoyaltyReward(
    @Args('input') input: CreateLoyaltyRewardInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward> {
    try {
      const reward = await this.loyaltyService.createReward(input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyRewardCreated', { loyaltyRewardCreated: reward });

      this.logger.log(`Created loyalty reward ${reward.id}: ${reward.name}`);
      return reward;
    } catch (error) {
      this.logger.error(`Failed to create loyalty reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyReward)
  @UseGuards(PermGuard)
  async updateLoyaltyReward(
    @Args('id') id: string,
    @Args('input') input: UpdateLoyaltyRewardInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyReward> {
    try {
      const reward = await this.loyaltyService.updateReward(id, input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyRewardUpdated', { loyaltyRewardUpdated: reward });

      this.logger.log(`Updated loyalty reward ${id}`);
      return reward;
    } catch (error) {
      this.logger.error(`Failed to update loyalty reward ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteLoyaltyReward(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      await this.loyaltyService.deleteReward(id, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyRewardDeleted', { loyaltyRewardDeleted: { id } });

      this.logger.log(`Deleted loyalty reward ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete loyalty reward ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyRewardRedemption)
  @UseGuards(PermGuard)
  async redeemLoyaltyReward(
    @Args('input') input: RedeemRewardInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyRewardRedemption> {
    try {
      const redemption = await this.loyaltyService.redeemReward(input, user);

      // Publish subscription events
      this.pubSub.publish('loyaltyRewardRedeemed', { loyaltyRewardRedeemed: redemption });
      this.pubSub.publish(`loyaltyRewardRedeemed_${input.loyaltyAccountId}`, {
        loyaltyRewardRedeemed: redemption
      });

      this.logger.log(`Redeemed reward ${input.rewardId} for account ${input.loyaltyAccountId}`);
      return redemption;
    } catch (error) {
      this.logger.error(`Failed to redeem reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyRewardRedemption)
  @UseGuards(PermGuard)
  async fulfillLoyaltyRedemption(
    @Args('redemptionId') redemptionId: string,
    @Args('notes', { nullable: true }) notes?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyRewardRedemption> {
    try {
      const redemption = await this.loyaltyService.fulfillRedemption(redemptionId, {
        notes,
        fulfilledBy: user?.id,
      });

      // Publish subscription event
      this.pubSub.publish('loyaltyRedemptionFulfilled', { loyaltyRedemptionFulfilled: redemption });

      this.logger.log(`Fulfilled redemption ${redemptionId}`);
      return redemption;
    } catch (error) {
      this.logger.error(`Failed to fulfill redemption ${redemptionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyRewardRedemption)
  @UseGuards(PermGuard)
  async cancelLoyaltyRedemption(
    @Args('redemptionId') redemptionId: string,
    @Args('reason', { nullable: true }) reason?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyRewardRedemption> {
    try {
      const redemption = await this.loyaltyService.cancelRedemption(redemptionId, {
        reason,
        cancelledBy: user?.id,
      });

      // Publish subscription event
      this.pubSub.publish('loyaltyRedemptionCancelled', { loyaltyRedemptionCancelled: redemption });

      this.logger.log(`Cancelled redemption ${redemptionId}`);
      return redemption;
    } catch (error) {
      this.logger.error(`Failed to cancel redemption ${redemptionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => LoyaltyAccount, { nullable: true })
  async loyaltyAccount(@Parent() reward: LoyaltyReward): Promise<LoyaltyAccount | null> {
    if (!reward.loyaltyAccountId) return null;
    if (reward.loyaltyAccount) return reward.loyaltyAccount;
    return this.dataLoader.loyaltyAccountLoader.load(reward.loyaltyAccountId);
  }

  @ResolveField(() => [LoyaltyRewardRedemption])
  async redemptions(
    @Parent() reward: LoyaltyReward,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
    @Args('status', { nullable: true }) status?: string,
  ): Promise<LoyaltyRewardRedemption[]> {
    return this.loyaltyService.getRewardRedemptions(reward.id, { limit, status });
  }

  @ResolveField(() => Number)
  async totalRedemptions(@Parent() reward: LoyaltyReward): Promise<number> {
    return this.loyaltyService.getRewardRedemptionCount(reward.id);
  }

  @ResolveField(() => Number)
  async remainingQuantity(@Parent() reward: LoyaltyReward): Promise<number> {
    if (!reward.maxQuantity) return Infinity;
    const totalRedemptions = await this.loyaltyService.getRewardRedemptionCount(reward.id);
    return Math.max(0, reward.maxQuantity - totalRedemptions);
  }

  @ResolveField(() => Boolean)
  async isAvailable(@Parent() reward: LoyaltyReward): Promise<boolean> {
    return this.loyaltyService.isRewardAvailable(reward.id);
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