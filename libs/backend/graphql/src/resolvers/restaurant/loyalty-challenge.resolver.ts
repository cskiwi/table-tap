import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  LoyaltyChallenge,
  LoyaltyAccount,
  CreateLoyaltyChallengeInput,
  UpdateLoyaltyChallengeInput,
  LoyaltyChallengeFilters,
  PaginatedLoyaltyChallengeResponse,
  LoyaltyChallengeType,
  LoyaltyChallengeStatus,
  Cafe
} from '@app/models/models';
import { LoyaltyService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => LoyaltyChallenge)
export class LoyaltyChallengeResolver {
  private readonly logger = new Logger(LoyaltyChallengeResolver.name);
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(LoyaltyChallenge)
    private readonly loyaltyChallengeRepository: Repository<LoyaltyChallenge>,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => PaginatedLoyaltyChallengeResponse)
  @UseGuards(PermGuard)
  async loyaltyChallenges(
    @Args('filters', { nullable: true }) filters?: LoyaltyChallengeFilters,
    @ReqUser() user?: User,
  ): Promise<PaginatedLoyaltyChallengeResponse> {
    try {
      return await this.loyaltyService.findChallenges({ filters, pagination, sort, user });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty challenges: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => LoyaltyChallenge)
  @UseGuards(PermGuard)
  async loyaltyChallenge(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge> {
    try {
      return await this.loyaltyService.findChallengeById(id, user);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty challenge ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyChallenge])
  @UseGuards(PermGuard)
  async activeLoyaltyChallenges(
    @Args('cafeId') cafeId: string,
    @Args('type', { nullable: true }) type?: LoyaltyChallengeType,
    @ReqUser() user?: User,
  ): Promise<LoyaltyChallenge[]> {
    try {
      return await this.loyaltyService.getActiveChallenges(cafeId, type);
    } catch (error) {
      this.logger.error(`Failed to fetch active challenges for cafe ${cafeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyChallenge])
  @UseGuards(PermGuard)
  async availableChallenges(
    @Args('accountId') accountId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge[]> {
    try {
      return await this.loyaltyService.getAvailableChallenges(accountId);
    } catch (error) {
      this.logger.error(`Failed to fetch available challenges for account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [LoyaltyChallenge])
  @UseGuards(PermGuard)
  async myChallenges(
    @Args('cafeId') cafeId: string,
    @Args('status', { nullable: true }) status?: LoyaltyChallengeStatus,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge[]> {
    try {
      return await this.loyaltyService.getUserChallenges(user.id, cafeId, status);
    } catch (error) {
      this.logger.error(`Failed to fetch user challenges: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => Object)
  @UseGuards(PermGuard)
  async challengeProgress(
    @Args('challengeId') challengeId: string,
    @Args('accountId') accountId: string,
    @ReqUser() user: User,
  ): Promise<any> {
    try {
      return await this.loyaltyService.getChallengeProgress(challengeId, accountId);
    } catch (error) {
      this.logger.error(`Failed to fetch challenge progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [Object])
  @UseGuards(PermGuard)
  async challengeLeaderboard(
    @Args('challengeId') challengeId: string,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
    @ReqUser() user?: User,
  ): Promise<any[]> {
    try {
      return await this.loyaltyService.getChallengeLeaderboard(challengeId, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch challenge leaderboard for ${challengeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  @Mutation(() => LoyaltyChallenge)
  @UseGuards(PermGuard)
  async createLoyaltyChallenge(
    @Args('input') input: CreateLoyaltyChallengeInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge> {
    try {
      const challenge = await this.loyaltyService.createChallenge(input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyChallengeCreated', { loyaltyChallengeCreated: challenge });

      this.logger.log(`Created loyalty challenge ${challenge.id}: ${challenge.name}`);
      return challenge;
    } catch (error) {
      this.logger.error(`Failed to create loyalty challenge: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyChallenge)
  @UseGuards(PermGuard)
  async updateLoyaltyChallenge(
    @Args('id') id: string,
    @Args('input') input: UpdateLoyaltyChallengeInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge> {
    try {
      const challenge = await this.loyaltyService.updateChallenge(id, input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyChallengeUpdated', { loyaltyChallengeUpdated: challenge });

      this.logger.log(`Updated loyalty challenge ${id}`);
      return challenge;
    } catch (error) {
      this.logger.error(`Failed to update loyalty challenge ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteLoyaltyChallenge(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      await this.loyaltyService.deleteChallenge(id, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyChallengeDeleted', { loyaltyChallengeDeleted: { id } });

      this.logger.log(`Deleted loyalty challenge ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete loyalty challenge ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async joinChallenge(
    @Args('challengeId') challengeId: string,
    @Args('accountId') accountId: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      const result = await this.loyaltyService.joinChallenge(challengeId, accountId);

      // Publish subscription event
      this.pubSub.publish('challengeJoined', {
        challengeJoined: {
          challengeId,
          accountId,
          joinedAt: new Date()
        }
      });

      this.logger.log(`Account ${accountId} joined challenge ${challengeId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to join challenge ${challengeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async leaveChallenge(
    @Args('challengeId') challengeId: string,
    @Args('accountId') accountId: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      const result = await this.loyaltyService.leaveChallenge(challengeId, accountId);

      // Publish subscription event
      this.pubSub.publish('challengeLeft', {
        challengeLeft: {
          challengeId,
          accountId,
          leftAt: new Date()
        }
      });

      this.logger.log(`Account ${accountId} left challenge ${challengeId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to leave challenge ${challengeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Object)
  @UseGuards(PermGuard)
  async updateChallengeProgress(
    @Args('challengeId') challengeId: string,
    @Args('accountId') accountId: string,
    @Args('progress') progress: number,
    @Args('orderId', { nullable: true }) orderId?: string,
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      const result = await this.loyaltyService.updateChallengeProgress(
        challengeId,
        accountId,
        progress,
        { orderId, updatedBy: user?.id }
      );

      // Publish subscription event
      this.pubSub.publish('challengeProgressUpdated', {
        challengeProgressUpdated: {
          challengeId,
          accountId,
          progress: result.progress,
          completed: result.completed
        }
      });

      if (result.completed) {
        this.pubSub.publish('challengeCompleted', {
          challengeCompleted: {
            challengeId,
            accountId,
            completedAt: new Date(),
            reward: result.reward
          }
        });
      }

      this.logger.log(`Updated challenge progress for ${accountId} in ${challengeId}: ${progress}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update challenge progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyChallenge)
  @UseGuards(PermGuard)
  async activateChallenge(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyChallenge> {
    try {
      const challenge = await this.loyaltyService.activateChallenge(id, user);

      // Publish subscription event
      this.pubSub.publish('challengeActivated', { challengeActivated: challenge });

      this.logger.log(`Activated loyalty challenge ${id}`);
      return challenge;
    } catch (error) {
      this.logger.error(`Failed to activate loyalty challenge ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyChallenge)
  @UseGuards(PermGuard)
  async pauseChallenge(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyChallenge> {
    try {
      const challenge = await this.loyaltyService.pauseChallenge(id, reason, user);

      // Publish subscription event
      this.pubSub.publish('challengePaused', { challengePaused: challenge });

      this.logger.log(`Paused loyalty challenge ${id}`);
      return challenge;
    } catch (error) {
      this.logger.error(`Failed to pause loyalty challenge ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => Cafe)
  async cafe(@Parent() challenge: LoyaltyChallenge): Promise<Cafe> {
    if (challenge.cafe) return challenge.cafe;
    return this.dataLoader.cafeLoader.load(challenge.cafeId);
  }

  @ResolveField(() => User, { nullable: true })
  async createdBy(@Parent() challenge: LoyaltyChallenge): Promise<User | null> {
    if (!challenge.createdById) return null;
    if (challenge.createdBy) return challenge.createdBy;
    return this.dataLoader.userLoader.load(challenge.createdById);
  }

  @ResolveField(() => Number)
  async participantCount(@Parent() challenge: LoyaltyChallenge): Promise<number> {
    return this.loyaltyService.getChallengeParticipantCount(challenge.id);
  }

  @ResolveField(() => Number)
  async completionCount(@Parent() challenge: LoyaltyChallenge): Promise<number> {
    return this.loyaltyService.getChallengeCompletionCount(challenge.id);
  }

  @ResolveField(() => Boolean)
  async isActive(@Parent() challenge: LoyaltyChallenge): Promise<boolean> {
    return this.loyaltyService.isChallengeActive(challenge.id);
  }

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

  @ResolveField(() => Number)
  async completionRate(@Parent() challenge: LoyaltyChallenge): Promise<number> {
    const participants = await this.loyaltyService.getChallengeParticipantCount(challenge.id);
    const completions = await this.loyaltyService.getChallengeCompletionCount(challenge.id);
    return participants > 0 ? (completions / participants) * 100 : 0;
  }

  @ResolveField(() => Object)
  async rules(@Parent() challenge: LoyaltyChallenge): Promise<any> {
    return challenge.rules || {};
  }

  @ResolveField(() => Object)
  async rewards(@Parent() challenge: LoyaltyChallenge): Promise<any> {
    return challenge.rewards || {};
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

  @Subscription(() => Object)
  challengeJoined(
    @Args('challengeId', { nullable: true }) challengeId?: string,
  ) {
    if (challengeId) {
      return this.pubSub.asyncIterator(`challengeJoined_${challengeId}`);
    }
    return this.pubSub.asyncIterator('challengeJoined');
  }

  @Subscription(() => Object)
  challengeProgressUpdated(
    @Args('accountId', { nullable: true }) accountId?: string,
  ) {
    if (accountId) {
      return this.pubSub.asyncIterator(`challengeProgressUpdated_${accountId}`);
    }
    return this.pubSub.asyncIterator('challengeProgressUpdated');
  }

  @Subscription(() => Object)
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