import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, LoyaltyAccount, LoyaltyTier, User } from '@app/models';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
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
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LoyaltyTier)
    private readonly loyaltyTierRepository: Repository<LoyaltyTier>,
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

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() account: LoyaltyAccount): Promise<Cafe> {
    if (account.cafe) return account.cafe;
    const cafe = await this.cafeRepository.findOne({ where: { id: account.cafeId } });
    if (!cafe) throw new Error(`Cafe with ID ${account.cafeId} not found`);
    return cafe;
  }

  @ResolveField(() => User)
  async user(@Parent() account: LoyaltyAccount): Promise<User> {
    if (account.user) return account.user;
    const user = await this.userRepository.findOne({ where: { id: account.userId } });
    if (!user) throw new Error(`User with ID ${account.userId} not found`);
    return user;
  }

  @ResolveField(() => LoyaltyTier, { nullable: true })
  async currentTier(@Parent() account: LoyaltyAccount): Promise<LoyaltyTier | null> {
    if (account.currentTier !== undefined) return account.currentTier;
    if (!account.currentTierId) return null;
    return this.loyaltyTierRepository.findOne({ where: { id: account.currentTierId } });
  }

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
