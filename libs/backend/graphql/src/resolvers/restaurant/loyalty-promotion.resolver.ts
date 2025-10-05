import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyPromotion,
  LoyaltyAccount,
  CreateLoyaltyPromotionInput,
  UpdateLoyaltyPromotionInput,
  LoyaltyPromotionFilters,
  PaginatedLoyaltyPromotionResponse,
  LoyaltyPromotionType,
  LoyaltyPromotionStatus,
  Cafe
} from '@app/models/models';
import { LoyaltyService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => LoyaltyPromotion)
export class LoyaltyPromotionResolver {
  private readonly logger = new Logger(LoyaltyPromotionResolver.name);
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(LoyaltyPromotion)
    private readonly loyaltyPromotionRepository: Repository<LoyaltyPromotion>,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => PaginatedLoyaltyPromotionResponse)
  @UseGuards(PermGuard)
  async loyaltyPromotions(
    @Args('filters', { nullable: true }) filters?: LoyaltyPromotionFilters,
    @ReqUser() user?: User,
  ): Promise<PaginatedLoyaltyPromotionResponse> {
    try {
      return await this.loyaltyService.findPromotions({ filters, pagination, sort, user });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty promotions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyPromotion)
  @UseGuards(PermGuard)
  async loyaltyPromotion(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyPromotion> {
    try {
      return await this.loyaltyService.findPromotionById(id, user);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty promotion ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyPromotion])
  @UseGuards(PermGuard)
  async activeLoyaltyPromotions(
    @Args('cafeId') cafeId: string,
    @Args('type', { nullable: true }) type?: LoyaltyPromotionType,
    @ReqUser() user?: User,
  ): Promise<LoyaltyPromotion[]> {
    try {
      return await this.loyaltyService.getActivePromotions(cafeId, type);
    } catch (error) {
      this.logger.error(`Failed to fetch active promotions for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyPromotion])
  @UseGuards(PermGuard)
  async eligiblePromotions(
    @Args('accountId') accountId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyPromotion[]> {
    try {
      return await this.loyaltyService.getEligiblePromotions(accountId);
    } catch (error) {
      this.logger.error(`Failed to fetch eligible promotions for account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyPromotion])
  @UseGuards(PermGuard)
  async featuredPromotions(
    @Args('cafeId') cafeId: string,
    @Args('limit', { nullable: true, defaultValue: 5 }) limit: number,
    @ReqUser() user?: User,
  ): Promise<LoyaltyPromotion[]> {
    try {
      return await this.loyaltyService.getFeaturedPromotions(cafeId, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch featured promotions for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => Object)
  @UseGuards(PermGuard)
  async promotionEligibility(
    @Args('promotionId') promotionId: string,
    @Args('accountId') accountId: string,
    @ReqUser() user: User,
  ): Promise<any> {
    try {
      return await this.loyaltyService.checkPromotionEligibility(promotionId, accountId);
    } catch (error) {
      this.logger.error(`Failed to check promotion eligibility: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  @Mutation(() => LoyaltyPromotion)
  @UseGuards(PermGuard)
  async createLoyaltyPromotion(
    @Args('input') input: CreateLoyaltyPromotionInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyPromotion> {
    try {
      const promotion = await this.loyaltyService.createPromotion(input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyPromotionCreated', { loyaltyPromotionCreated: promotion });

      this.logger.log(`Created loyalty promotion ${promotion.id}: ${promotion.name}`);
      return promotion;
    } catch (error) {
      this.logger.error(`Failed to create loyalty promotion: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyPromotion)
  @UseGuards(PermGuard)
  async updateLoyaltyPromotion(
    @Args('id') id: string,
    @Args('input') input: UpdateLoyaltyPromotionInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyPromotion> {
    try {
      const promotion = await this.loyaltyService.updatePromotion(id, input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyPromotionUpdated', { loyaltyPromotionUpdated: promotion });

      this.logger.log(`Updated loyalty promotion ${id}`);
      return promotion;
    } catch (error) {
      this.logger.error(`Failed to update loyalty promotion ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteLoyaltyPromotion(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      await this.loyaltyService.deletePromotion(id, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyPromotionDeleted', { loyaltyPromotionDeleted: { id } });

      this.logger.log(`Deleted loyalty promotion ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete loyalty promotion ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyPromotion)
  @UseGuards(PermGuard)
  async activatePromotion(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyPromotion> {
    try {
      const promotion = await this.loyaltyService.activatePromotion(id, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyPromotionActivated', { loyaltyPromotionActivated: promotion });

      this.logger.log(`Activated loyalty promotion ${id}`);
      return promotion;
    } catch (error) {
      this.logger.error(`Failed to activate loyalty promotion ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyPromotion)
  @UseGuards(PermGuard)
  async deactivatePromotion(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyPromotion> {
    try {
      const promotion = await this.loyaltyService.deactivatePromotion(id, reason, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyPromotionDeactivated', { loyaltyPromotionDeactivated: promotion });

      this.logger.log(`Deactivated loyalty promotion ${id}`);
      return promotion;
    } catch (error) {
      this.logger.error(`Failed to deactivate loyalty promotion ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async applyPromotion(
    @Args('promotionId') promotionId: string,
    @Args('accountId') accountId: string,
    @Args('orderId', { nullable: true }) orderId?: string,
    @ReqUser() user?: User,
  ): Promise<boolean> {
    try {
      const result = await this.loyaltyService.applyPromotion(promotionId, accountId, {
        orderId,
        appliedBy: user?.id,
      });

      // Publish subscription event
      this.pubSub.publish('promotionApplied', {
        promotionApplied: {
          promotionId,
          accountId,
          orderId,
          result
        }
      });

      this.logger.log(`Applied promotion ${promotionId} to account ${accountId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to apply promotion ${promotionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Number)
  @UseGuards(PermGuard)
  async sendPromotionNotifications(
    @Args('promotionId') promotionId: string,
    @Args('accountIds', { type: () => [String], nullable: true }) accountIds?: string[],
    @ReqUser() user?: User,
  ): Promise<number> {
    try {
      const sentCount = await this.loyaltyService.sendPromotionNotifications(promotionId, accountIds);

      this.logger.log(`Sent ${sentCount} promotion notifications for ${promotionId}`);
      return sentCount;
    } catch (error) {
      this.logger.error(`Failed to send promotion notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => Cafe)
  async cafe(@Parent() promotion: LoyaltyPromotion): Promise<Cafe> {
    if (promotion.cafe) return promotion.cafe;
    return this.dataLoader.cafeLoader.load(promotion.cafeId);
  }

  @ResolveField(() => User, { nullable: true })
  async createdBy(@Parent() promotion: LoyaltyPromotion): Promise<User | null> {
    if (!promotion.createdById) return null;
    if (promotion.createdBy) return promotion.createdBy;
    return this.dataLoader.userLoader.load(promotion.createdById);
  }

  @ResolveField(() => Number)
  async totalParticipants(@Parent() promotion: LoyaltyPromotion): Promise<number> {
    return this.loyaltyService.getPromotionParticipantCount(promotion.id);
  }

  @ResolveField(() => Number)
  async totalRedemptions(@Parent() promotion: LoyaltyPromotion): Promise<number> {
    return this.loyaltyService.getPromotionRedemptionCount(promotion.id);
  }

  @ResolveField(() => Boolean)
  async isActive(@Parent() promotion: LoyaltyPromotion): Promise<boolean> {
    return this.loyaltyService.isPromotionActive(promotion.id);
  }

  @ResolveField(() => Boolean)
  async hasExpired(@Parent() promotion: LoyaltyPromotion): Promise<boolean> {
    if (!promotion.endDate) return false;
    return new Date() > promotion.endDate;
  }

  @ResolveField(() => Number)
  async daysRemaining(@Parent() promotion: LoyaltyPromotion): Promise<number> {
    if (!promotion.endDate) return Infinity;
    const now = new Date()
    if (now > promotion.endDate) return 0;
    return Math.ceil((promotion.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  @ResolveField(() => Number)
  async redemptionRate(@Parent() promotion: LoyaltyPromotion): Promise<number> {
    const participants = await this.loyaltyService.getPromotionParticipantCount(promotion.id);
    const redemptions = await this.loyaltyService.getPromotionRedemptionCount(promotion.id);
    return participants > 0 ? (redemptions / participants) * 100 : 0;
  }

  @ResolveField(() => Object)
  async conditions(@Parent() promotion: LoyaltyPromotion): Promise<any> {
    return promotion.conditions || {};
  }

  @ResolveField(() => Object)
  async rewards(@Parent() promotion: LoyaltyPromotion): Promise<any> {
    return promotion.rewards || {};
  }

  // Subscriptions
  @Subscription(() => LoyaltyPromotion)
  loyaltyPromotionCreated(
    @Args('cafeId', { nullable: true }) cafeId?: string,
  ) {
    if (cafeId) {
      return this.pubSub.asyncIterator(`loyaltyPromotionCreated_${cafeId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPromotionCreated');
  }

  @Subscription(() => LoyaltyPromotion)
  loyaltyPromotionUpdated(
    @Args('promotionId', { nullable: true }) promotionId?: string,
  ) {
    if (promotionId) {
      return this.pubSub.asyncIterator(`loyaltyPromotionUpdated_${promotionId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPromotionUpdated');
  }

  @Subscription(() => LoyaltyPromotion)
  loyaltyPromotionActivated() {
    return this.pubSub.asyncIterator('loyaltyPromotionActivated');
  }

  @Subscription(() => LoyaltyPromotion)
  loyaltyPromotionDeactivated() {
    return this.pubSub.asyncIterator('loyaltyPromotionDeactivated');
  }

  @Subscription(() => Object)
  promotionApplied(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`promotionApplied_${accountId}`);
    }
    return this.pubSub.asyncIterator('promotionApplied');
  }
}