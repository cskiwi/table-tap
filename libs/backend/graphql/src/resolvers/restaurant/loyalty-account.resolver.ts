import { PermGuard, ReqUser } from '@app/backend-authorization';
import { LoyaltyAccount, User } from '@app/models';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { LoyaltyAccountArgs } from '../../args';

@Injectable()
@Resolver(() => LoyaltyAccount)
export class LoyaltyAccountResolver {
  private readonly logger = new Logger(LoyaltyAccountResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepository: Repository<LoyaltyAccount>,
  ) {}

  // Queries
  @Query(() => [LoyaltyAccount])
  @UseGuards(PermGuard)
  async loyaltyAccounts(
    @Args('args', { type: () => LoyaltyAccountArgs, nullable: true })
    inputArgs?: InstanceType<typeof LoyaltyAccountArgs>,
    @ReqUser() user?: User,
  ): Promise<LoyaltyAccount[]> {
    try {
      const args = LoyaltyAccountArgs.toFindOneOptions(inputArgs);

      return this.loyaltyAccountRepository.find({
        ...args,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch loyalty accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Query(() => LoyaltyAccount, { nullable: true })
  @UseGuards(PermGuard)
  async loyaltyAccount(@Args('id') id: string, @ReqUser() user: User): Promise<LoyaltyAccount | null> {
    try {
      return await this.loyaltyAccountRepository.findOne({ where: { id } });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch loyalty account ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Query(() => LoyaltyAccount, { nullable: true })
  @UseGuards(PermGuard)
  async myLoyaltyAccount(@Args('cafeId') cafeId: string, @ReqUser() user: User): Promise<LoyaltyAccount | null> {
    try {
      return await this.loyaltyAccountRepository.findOne({
        where: { userId: user.id, cafeId },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch user loyalty account: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
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
      // Use repository directly for simple query
      return await this.loyaltyAccountRepository.findOne({
        where: { loyaltyNumber, cafeId },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch loyalty account by number: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Mutations removed - require LoyaltyService which will not be implemented
  // Field Resolvers removed - require LoyaltyService and DataLoaderService which will not be implemented

  // Subscriptions
  @Subscription(() => LoyaltyAccount)
  loyaltyAccountCreated() {
    return this.pubSub.asyncIterator('loyaltyAccountCreated');
  }

  @Subscription(() => LoyaltyAccount)
  loyaltyAccountUpdated(@Args('accountId', { nullable: true }) accountId?: string) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyAccountUpdated_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyAccountUpdated');
  }

  @Subscription(() => GraphQLJSONObject)
  loyaltyPointsAdded(@Args('accountId', { nullable: true }) accountId?: string) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyPointsAdded_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyPointsAdded');
  }

  @Subscription(() => LoyaltyAccount)
  loyaltyTierUpdated(@Args('accountId', { nullable: true }) accountId?: string) {
    if (accountId) {
      return this.pubSub.asyncIterator(`loyaltyTierUpdated_${accountId}`);
    }
    return this.pubSub.asyncIterator('loyaltyTierUpdated');
  }
}
