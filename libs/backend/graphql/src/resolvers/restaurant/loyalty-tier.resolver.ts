import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyTier,
  LoyaltyAccount,
} from '@app/models';
import { LoyaltyTierArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyTier)
export class LoyaltyTierResolver {
  private readonly logger = new Logger(LoyaltyTierResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyTier)
    private readonly loyaltyTierRepository: Repository<LoyaltyTier>,
  ) {}

  // Queries - only simple repository-based queries
  @Query(() => LoyaltyTier, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyTier(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier | null> {
    try {
      return await this.loyaltyTierRepository.findOne({
        where: { id, cafeId: user.cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty tier ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Query(() => [LoyaltyTier])
  @UseGuards(PermGuard)
  async loyaltyTiersByCafe(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier[]> {
    try {
      return await this.loyaltyTierRepository.find({
        where: { cafeId, isActive: true },
        order: { level: 'ASC' }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty tiers for cafe ${cafeId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // All other queries, mutations, and field resolvers removed - require LoyaltyService which will not be implemented

  // Field Resolvers - only simple logic without service dependencies
  @ResolveField(() => Number)
  async pointsRequired(@Parent() tier: LoyaltyTier): Promise<number> {
    return tier.minPoints || 0;
  }

  @ResolveField(() => Object)
  async benefits(@Parent() tier: LoyaltyTier): Promise<any> {
    return tier.benefit || {};
  }

  @ResolveField(() => Boolean)
  async isActive(@Parent() tier: LoyaltyTier): Promise<boolean> {
    return tier.isActive;
  }

  // Subscriptions
  @Subscription(() => LoyaltyTier)
  loyaltyTierCreated(
    @Args('cafeId', { nullable: true }) cafeId?: string,
  ) {
    if (cafeId) {
      return this.pubSub.asyncIterator(`loyaltyTierCreated_${cafeId}`);
    }
    return this.pubSub.asyncIterator('loyaltyTierCreated');
  }

  @Subscription(() => LoyaltyTier)
  loyaltyTierUpdated(
    @Args('tierId', { nullable: true }) tierId?: string,
  ) {
    if (tierId) {
      return this.pubSub.asyncIterator(`loyaltyTierUpdated_${tierId}`);
    }
    return this.pubSub.asyncIterator('loyaltyTierUpdated');
  }

  @Subscription(() => LoyaltyAccount)
  loyaltyTierPromotion(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyTierPromotion_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyTierPromotion');
  }

  @Subscription(() => Object)
  tierEligibilityRecalculated() {
    return this.pubSub.asyncIterator('tierEligibilityRecalculated');
  }
}
