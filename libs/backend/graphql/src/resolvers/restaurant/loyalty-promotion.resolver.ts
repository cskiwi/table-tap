import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyPromotion,
} from '@app/models';
import { LoyaltyPromotionArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyPromotion)
export class LoyaltyPromotionResolver {
  private readonly logger = new Logger(LoyaltyPromotionResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyPromotion)
    private readonly loyaltyPromotionRepository: Repository<LoyaltyPromotion>,
  ) {}

  // Queries - only simple repository-based queries
  @Query(() => LoyaltyPromotion, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyPromotion(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyPromotion | null> {
    try {
      return await this.loyaltyPromotionRepository.findOne({
        where: { id, cafeId: user.cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty promotion ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // All other queries, mutations, and field resolvers removed - require LoyaltyService which will not be implemented

  // Field Resolvers - only simple logic without service dependencies
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
