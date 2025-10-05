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
  CreateLoyaltyTierInput,
  UpdateLoyaltyTierInput,
  LoyaltyTierFilters,
  PaginatedLoyaltyTierResponse,
  Cafe
} from '@app/models/models';
import { LoyaltyService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => LoyaltyTier)
export class LoyaltyTierResolver {
  private readonly logger = new Logger(LoyaltyTierResolver.name);
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(LoyaltyTier)
    private readonly loyaltyTierRepository: Repository<LoyaltyTier>,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => PaginatedLoyaltyTierResponse)
  @UseGuards(PermGuard)
  async loyaltyTiers(
    @Args('filters', { nullable: true }) filters?: LoyaltyTierFilters,
    @ReqUser() user?: User,
  ): Promise<PaginatedLoyaltyTierResponse> {
    try {
      return await this.loyaltyService.findTiers({ filters, pagination, sort, user });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty tiers: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyTier)
  @UseGuards(PermGuard)
  async loyaltyTier(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier> {
    try {
      return await this.loyaltyService.findTierById(id, user);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty tier ${id}: ${error.message}`, error.stack);
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
      return await this.loyaltyService.getTiersByCafe(cafeId);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty tiers for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyTier, { nullable: true })
  @UseGuards(PermGuard)
  async nextLoyaltyTier(
    @Args('currentTierId') currentTierId: string,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier | null> {
    try {
      return await this.loyaltyService.getNextTier(currentTierId, cafeId);
    } catch (error) {
      this.logger.error(`Failed to fetch next tier for ${currentTierId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyTier, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyTierByPoints(
    @Args('points') points: number,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier | null> {
    try {
      return await this.loyaltyService.getTierByPoints(points, cafeId);
    } catch (error) {
      this.logger.error(`Failed to fetch tier by points ${points}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [Object])
  @UseGuards(PermGuard)
  async loyaltyTierStatistics(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<any[]> {
    try {
      return await this.loyaltyService.getTierStatistics(cafeId);
    } catch (error) {
      this.logger.error(`Failed to fetch tier statistics for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  @Mutation(() => LoyaltyTier)
  @UseGuards(PermGuard)
  async createLoyaltyTier(
    @Args('input') input: CreateLoyaltyTierInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier> {
    try {
      const tier = await this.loyaltyService.createTier(input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTierCreated', { loyaltyTierCreated: tier });

      this.logger.log(`Created loyalty tier ${tier.id}: ${tier.name}`);
      return tier;
    } catch (error) {
      this.logger.error(`Failed to create loyalty tier: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyTier)
  @UseGuards(PermGuard)
  async updateLoyaltyTier(
    @Args('id') id: string,
    @Args('input') input: UpdateLoyaltyTierInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyTier> {
    try {
      const tier = await this.loyaltyService.updateTier(id, input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTierUpdated', { loyaltyTierUpdated: tier });

      this.logger.log(`Updated loyalty tier ${id}`);
      return tier;
    } catch (error) {
      this.logger.error(`Failed to update loyalty tier ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteLoyaltyTier(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      await this.loyaltyService.deleteTier(id, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTierDeleted', { loyaltyTierDeleted: { id } });

      this.logger.log(`Deleted loyalty tier ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete loyalty tier ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => [LoyaltyAccount])
  @UseGuards(PermGuard)
  async promoteMembersToTier(
    @Args('tierId') tierId: string,
    @Args('accountIds', { type: () => [String] }) accountIds: string[],
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount[]> {
    try {
      const accounts = await this.loyaltyService.promoteMembersToTier(tierId, accountIds, user);

      // Publish subscription events for each account
      accounts.forEach(account => {
        this.pubSub.publish('loyaltyTierPromotion', { loyaltyTierPromotion: account });
        this.pubSub.publish(`loyaltyTierPromotion_${account.id}`, {
          loyaltyTierPromotion: account
        });
      });

      this.logger.log(`Promoted ${accounts.length} members to tier ${tierId}`);
      return accounts;
    } catch (error) {
      this.logger.error(`Failed to promote members to tier ${tierId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Number)
  @UseGuards(PermGuard)
  async recalculateTierEligibility(
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<number> {
    try {
      const updatedCount = await this.loyaltyService.recalculateTierEligibility(cafeId);

      // Publish subscription event
      this.pubSub.publish('tierEligibilityRecalculated', {
        tierEligibilityRecalculated: { cafeId, updatedCount }
      });

      this.logger.log(`Recalculated tier eligibility for ${updatedCount} accounts in cafe ${cafeId}`);
      return updatedCount;
    } catch (error) {
      this.logger.error(`Failed to recalculate tier eligibility for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => Cafe)
  async cafe(@Parent() tier: LoyaltyTier): Promise<Cafe> {
    if (tier.cafe) return tier.cafe;
    return this.dataLoader.cafeLoader.load(tier.cafeId);
  }

  @ResolveField(() => [LoyaltyAccount])
  async loyaltyAccounts(
    @Parent() tier: LoyaltyTier,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<LoyaltyAccount[]> {
    return this.loyaltyService.getAccountsByTier(tier.id, limit);
  }

  @ResolveField(() => Number)
  async memberCount(@Parent() tier: LoyaltyTier): Promise<number> {
    return this.loyaltyService.getTierMemberCount(tier.id);
  }

  @ResolveField(() => Number)
  async pointsRequired(@Parent() tier: LoyaltyTier): Promise<number> {
    return tier.minPoints || 0;
  }

  @ResolveField(() => Number)
  async pointsToNextTier(@Parent() tier: LoyaltyTier): Promise<number> {
    const nextTier = await this.loyaltyService.getNextTier(tier.id, tier.cafeId);
    if (!nextTier) return 0;
    return (nextTier.minPoints || 0) - (tier.minPoints || 0);
  }

  @ResolveField(() => LoyaltyTier, { nullable: true })
  async nextTier(@Parent() tier: LoyaltyTier): Promise<LoyaltyTier | null> {
    return this.loyaltyService.getNextTier(tier.id, tier.cafeId);
  }

  @ResolveField(() => LoyaltyTier, { nullable: true })
  async previousTier(@Parent() tier: LoyaltyTier): Promise<LoyaltyTier | null> {
    return this.loyaltyService.getPreviousTier(tier.id, tier.cafeId);
  }

  @ResolveField(() => Object)
  async benefits(@Parent() tier: LoyaltyTier): Promise<any> {
    return tier.benefits || {};
  }

  @ResolveField(() => Boolean)
  async isActive(@Parent() tier: LoyaltyTier): Promise<boolean> {
    return tier.isActive;
  }

  @ResolveField(() => Number)
  async averageSpendPerMember(@Parent() tier: LoyaltyTier): Promise<number> {
    return this.loyaltyService.getTierAverageSpend(tier.id);
  }

  @ResolveField(() => Number)
  async totalRevenueGenerated(@Parent() tier: LoyaltyTier): Promise<number> {
    return this.loyaltyService.getTierTotalRevenue(tier.id);
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