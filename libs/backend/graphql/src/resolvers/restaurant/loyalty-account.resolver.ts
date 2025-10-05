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
import { LoyaltyService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';

@Injectable()
@Resolver(() => LoyaltyAccount)
export class LoyaltyAccountResolver {
  private readonly logger = new Logger(LoyaltyAccountResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepository: Repository<LoyaltyAccount>,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => [LoyaltyAccount])
  @UseGuards(PermGuard)
  async loyaltyAccounts(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyAccount[]> {
    try {
      return await this.loyaltyAccountRepository.find({
        where: { cafeId },
        skip: pagination?.skip || 0,
        take: pagination?.take || 20,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty accounts: ${error.message}`, error.stack);
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
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty account ${id}: ${error.message}`, error.stack);
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
    } catch (error) {
      this.logger.error(`Failed to fetch user loyalty account: ${error.message}`, error.stack);
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
      return await this.loyaltyService.findAccountByLoyaltyNumber(loyaltyNumber, cafeId);
    } catch (error) {
      this.logger.error(`Failed to fetch loyalty account by number: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations
  @Mutation(() => LoyaltyAccount)
  @UseGuards(PermGuard)
  async createLoyaltyAccount(
    @Args('input') input: CreateLoyaltyAccountInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount> {
    try {
      const account = await this.loyaltyService.createAccount(input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyAccountCreated', { loyaltyAccountCreated: account });

      this.logger.log(`Created loyalty account ${account.id} for user ${input.userId}`);
      return account;
    } catch (error) {
      this.logger.error(`Failed to create loyalty account: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyAccount)
  @UseGuards(PermGuard)
  async updateLoyaltyAccount(
    @Args('id') id: string,
    @Args('input') input: UpdateLoyaltyAccountInput,
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount> {
    try {
      const account = await this.loyaltyService.updateAccount(id, input, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyAccountUpdated', { loyaltyAccountUpdated: account });

      this.logger.log(`Updated loyalty account ${id}`);
      return account;
    } catch (error) {
      this.logger.error(`Failed to update loyalty account ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteLoyaltyAccount(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    try {
      await this.loyaltyService.deleteAccount(id, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyAccountDeleted', { loyaltyAccountDeleted: { id } });

      this.logger.log(`Deleted loyalty account ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete loyalty account ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyAccount)
  @UseGuards(PermGuard)
  async addLoyaltyPoints(
    @Args('accountId') accountId: string,
    @Args('points') points: number,
    @Args('orderId', { nullable: true }) orderId?: string,
    @Args('description', { nullable: true }) description?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyAccount> {
    try {
      const result = await this.loyaltyService.addPoints(accountId, points, {
        orderId,
        description,
        performedBy: user?.id,
      });

      // Publish subscription event
      this.pubSub.publish('loyaltyPointsAdded', {
        loyaltyPointsAdded: {
          account: result.account,
          transaction: result.transaction,
          pointsAdded: points
        }
      });

      this.logger.log(`Added ${points} points to loyalty account ${accountId}`);
      return result.account;
    } catch (error) {
      this.logger.error(`Failed to add points to account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyAccount)
  @UseGuards(PermGuard)
  async deductLoyaltyPoints(
    @Args('accountId') accountId: string,
    @Args('points') points: number,
    @Args('rewardId', { nullable: true }) rewardId?: string,
    @Args('description', { nullable: true }) description?: string,
    @ReqUser() user?: User,
  ): Promise<LoyaltyAccount> {
    try {
      const result = await this.loyaltyService.deductPoints(accountId, points, {
        rewardId,
        description,
        performedBy: user?.id,
      });

      // Publish subscription event
      this.pubSub.publish('loyaltyPointsDeducted', {
        loyaltyPointsDeducted: {
          account: result.account,
          transaction: result.transaction,
          pointsDeducted: points
        }
      });

      this.logger.log(`Deducted ${points} points from loyalty account ${accountId}`);
      return result.account;
    } catch (error) {
      this.logger.error(`Failed to deduct points from account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => LoyaltyAccount)
  @UseGuards(PermGuard)
  async updateLoyaltyTier(
    @Args('accountId') accountId: string,
    @Args('tierId') tierId: string,
    @ReqUser() user: User,
  ): Promise<LoyaltyAccount> {
    try {
      const account = await this.loyaltyService.updateAccountTier(accountId, tierId, user);

      // Publish subscription event
      this.pubSub.publish('loyaltyTierUpdated', { loyaltyTierUpdated: account });

      this.logger.log(`Updated tier for loyalty account ${accountId} to ${tierId}`);
      return account;
    } catch (error) {
      this.logger.error(`Failed to update tier for account ${accountId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Field Resolvers
  @ResolveField(() => User)
  async user(@Parent() account: LoyaltyAccount): Promise<User> {
    if (account.user) return account.user;
    return this.dataLoader.userLoader.load(account.userId);
  }

  @ResolveField(() => LoyaltyTier, { nullable: true })
  async currentTier(@Parent() account: LoyaltyAccount): Promise<LoyaltyTier | null> {
    if (!account.currentTierId) return null;
    if (account.currentTier) return account.currentTier;
    return this.dataLoader.loyaltyTierLoader.load(account.currentTierId);
  }

  @ResolveField(() => [LoyaltyTransaction])
  async transactions(
    @Parent() account: LoyaltyAccount,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
  ): Promise<LoyaltyTransaction[]> {
    return this.loyaltyService.getAccountTransactions(account.id, { limit });
  }

  @ResolveField(() => [LoyaltyReward])
  async availableRewards(@Parent() account: LoyaltyAccount): Promise<LoyaltyReward[]> {
    return this.loyaltyService.getAvailableRewards(account.id);
  }

  @ResolveField(() => Number)
  async pointsToNextTier(@Parent() account: LoyaltyAccount): Promise<number> {
    return this.loyaltyService.calculatePointsToNextTier(account.id);
  }

  @ResolveField(() => Number)
  async tierProgress(@Parent() account: LoyaltyAccount): Promise<number> {
    return this.loyaltyService.calculateTierProgress(account.id);
  }

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