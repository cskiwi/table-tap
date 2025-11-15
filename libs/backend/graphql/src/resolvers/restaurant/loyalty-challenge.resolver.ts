import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyChallenge,
} from '@app/models';
import { LoyaltyChallengeArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyChallenge)
export class LoyaltyChallengeResolver {
  private readonly logger = new Logger(LoyaltyChallengeResolver.name);
  private pubSub: any = new PubSub()

  constructor(
    @InjectRepository(LoyaltyChallenge)
    private readonly loyaltyChallengeRepository: Repository<LoyaltyChallenge>,
  ) {}

  // Queries - only simple repository-based queries
  @Query(() => LoyaltyChallenge, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyChallenge(
    @Args('id') id: string,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge | null> {
    try {
      // Verify user has permission for this cafe
      const hasPermission = user.cafes?.some(cafe => cafe.id === cafeId);
      if (!hasPermission) {
        throw new Error('User does not have permission for this cafe');
      }

      return await this.loyaltyChallengeRepository.findOne({
        where: { id, cafeId }
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch loyalty challenge ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // All other queries, mutations, and field resolvers removed - require LoyaltyService which will not be implemented

  // Field Resolvers - only simple logic without service dependencies
  @ResolveField(() => Boolean)
  async hasExpired(@Parent() challenge: LoyaltyChallenge): Promise<boolean> {
    if (!challenge.endDate) return false;
    return new Date() > challenge.endDate;
  }

  @ResolveField(() => Number)
  async daysRemaining(@Parent() challenge: LoyaltyChallenge): Promise<number> {
    if (!challenge.endDate) return Infinity;
    const now = new Date()
    if (now > challenge.endDate) return 0;
    return Math.ceil((challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }


  // Subscriptions
  @Subscription(() => LoyaltyChallenge)
  loyaltyChallengeCreated(
    @Args('cafeId', { nullable: true }) cafeId?: string,
  ) {
    if (cafeId) {
      return this.pubSub.asyncIterator(`loyaltyChallengeCreated_${cafeId}`);
    }
    return this.pubSub.asyncIterator('loyaltyChallengeCreated');
  }

  @Subscription(() => LoyaltyChallenge)
  loyaltyChallengeUpdated(
    @Args('challengeId', { nullable: true }) challengeId?: string,
  ) {
    if (challengeId) {
      return this.pubSub.asyncIterator(`loyaltyChallengeUpdated_${challengeId}`);
    }
    return this.pubSub.asyncIterator('loyaltyChallengeUpdated');
  }

  @Subscription(() => GraphQLJSONObject)
  challengeJoined(
    @Args('challengeId', { nullable: true }) challengeId?: string,
  ) {
    if (challengeId) {
      return this.pubSub.asyncIterator(`challengeJoined_${challengeId}`);
    }
    return this.pubSub.asyncIterator('challengeJoined');
  }

  @Subscription(() => GraphQLJSONObject)
  challengeProgressUpdated(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`challengeProgressUpdated_${accountId}`);
    }
    return this.pubSub.asyncIterator('challengeProgressUpdated');
  }

  @Subscription(() => GraphQLJSONObject)
  challengeCompleted(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`challengeCompleted_${accountId}`);
    }
    return this.pubSub.asyncIterator('challengeCompleted');
  }

  @Subscription(() => LoyaltyChallenge)
  challengeActivated() {
    return this.pubSub.asyncIterator('challengeActivated');
  }

  @Subscription(() => LoyaltyChallenge)
  challengePaused() {
    return this.pubSub.asyncIterator('challengePaused');
  }
}
