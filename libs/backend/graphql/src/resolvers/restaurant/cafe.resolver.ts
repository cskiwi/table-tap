import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, User, CafeCreateInput, CafeUpdateInput } from '@app/models';
import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { CafeArgs } from '../../args';

@Injectable()
@Resolver(() => Cafe)
export class CafeResolver {
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
  ) {}

  // Queries
  @Query(() => [Cafe])
  @UseGuards(PermGuard)
  async cafes(
    @Args('skip', { nullable: true }) skip?: number,
    @Args('take', { nullable: true }) take?: number,
    @Args('where', { nullable: true }) where?: any,
    @ReqUser() user?: User
  ): Promise<Cafe[]> {
    return this.cafeRepository.find({
      skip,
      take,
      where
    });
  }

  @Query(() => Cafe, { nullable: true })
  @UseGuards(PermGuard)
  async cafe(@Args('id') id: string, @ReqUser() user: User): Promise<Cafe | null> {
    // Use repository directly for simple CRUD
    return this.cafeRepository.findOne({
      where: { id }
    });
  }

  @Query(() => [Cafe])
  @UseGuards(PermGuard)
  async myCafes(@ReqUser() user: User): Promise<Cafe[]> {
    // Use repository directly - get user's cafe
    return this.cafeRepository.find({
      where: { id: user.cafeId }
    });
  }

  // Mutations
  @Mutation(() => Cafe)
  @UseGuards(PermGuard)
  async createCafe(@Args('input') input: CafeCreateInput, @ReqUser() user?: User): Promise<Cafe> {
    // Use repository directly for simple CRUD
    const cafe = this.cafeRepository.create(input);
    const savedCafe = await this.cafeRepository.save(cafe);

    // Publish cafe creation event
    await this.pubSub.publish('cafeCreated', { cafeCreated: savedCafe });

    return savedCafe;
  }

  @Mutation(() => Cafe)
  @UseGuards(PermGuard)
  async updateCafe(@Args('id') id: string, @Args('input') input: CafeUpdateInput, @ReqUser() user?: User): Promise<Cafe> {
    // Use repository directly for simple CRUD
    await this.cafeRepository.update({ id }, input);
    const updatedCafe = await this.cafeRepository.findOne({
      where: { id }
    });

    // Publish cafe update event
    await this.pubSub.publish('cafeUpdated', { cafeUpdated: updatedCafe });

    return updatedCafe!;
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteCafe(@Args('id') id: string, @ReqUser() user: User): Promise<boolean> {
    // Use repository directly for simple CRUD (soft delete)
    await this.cafeRepository.softDelete({ id });

    // Publish cafe deletion event
    await this.pubSub.publish('cafeDeleted', { cafeDeleted: { id } });

    return true;
  }

  // Field Resolvers removed - DataLoader not available

  // Subscriptions
  @Subscription(() => Cafe)
  cafeCreated() {
    return this.pubSub.asyncIterator('cafeCreated');
  }

  @Subscription(() => Cafe)
  cafeUpdated(@Args('cafeId', { nullable: true }) cafeId?: string) {
    return this.pubSub.asyncIterator('cafeUpdated');
  }

  @Subscription(() => Object)
  cafeDeleted() {
    return this.pubSub.asyncIterator('cafeDeleted');
  }
}
