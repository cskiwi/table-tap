import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Cafe,
  Menu,
  Order,
  Counter,
  Employee,
  Stock
} from '@app/models';
import { CafeService } from '@app/backend-services';
import { DataLoaderService } from '../../dataloaders';
import { CreateCafeInput, UpdateCafeInput } from '../../inputs';
import { CafeArgs } from '../../args';

@Injectable()
@Resolver(() => Cafe)
export class CafeResolver {
  private pubSub = new PubSub()

  constructor(
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    private readonly cafeService: CafeService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => [Cafe])
  @UseGuards(PermGuard)
  async cafes(
    @Args() args: typeof CafeArgs,
    @ReqUser() user?: User,
  ): Promise<Cafe[]> {
    const options = CafeArgs.toFindManyOptions(args);
    return this.cafeRepository.find(options);
  }

  @Query(() => Cafe, { nullable: true })
  @UseGuards(PermGuard)
  async cafe(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<Cafe | null> {
    return this.cafeService.findById(id, user);
  }

  @Query(() => [Cafe])
  @UseGuards(PermGuard)
  async myCafes(@ReqUser() user: User): Promise<Cafe[]> {
    return this.cafeService.findByOwner(user.id);
  }

  // Mutations
  @Mutation(() => Cafe)
  @UseGuards(PermGuard)
  async createCafe(
    @Args('input') input: CreateCafeInput,
    @ReqUser() user?: User,
  ): Promise<Cafe> {
    const cafe = await this.cafeService.create(input, user);

    // Publish cafe creation event
    await this.pubSub.publish('cafeCreated', { cafeCreated: cafe });

    return cafe;
  }

  @Mutation(() => Cafe)
  @UseGuards(PermGuard)
  async updateCafe(
    @Args('id') id: string,
    @Args('input') input: UpdateCafeInput,
    @ReqUser() user?: User,
  ): Promise<Cafe> {
    const cafe = await this.cafeService.update(id, input, user);

    // Publish cafe update event
    await this.pubSub.publish('cafeUpdated', { cafeUpdated: cafe });

    return cafe;
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteCafe(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    await this.cafeService.delete(id, user);

    // Publish cafe deletion event
    await this.pubSub.publish('cafeDeleted', { cafeDeleted: { id } });

    return true;
  }

  // Field Resolvers (using DataLoader for N+1 prevention)
  @ResolveField(() => [Menu])
  async menus(@Parent() cafe: Cafe): Promise<Menu[]> {
    return this.dataLoader.menusByCafeId.load(cafe.id);
  }

  @ResolveField(() => [Order])
  async orders(@Parent() cafe: Cafe): Promise<Order[]> {
    return this.dataLoader.ordersByCafeId.load(cafe.id);
  }

  @ResolveField(() => [Counter])
  async counters(@Parent() cafe: Cafe): Promise<Counter[]> {
    return this.dataLoader.countersByCafeId.load(cafe.id);
  }

  @ResolveField(() => [Employee])
  async employees(@Parent() cafe: Cafe): Promise<Employee[]> {
    return this.dataLoader.employeesByCafeId.load(cafe.id);
  }

  @ResolveField(() => [Stock])
  async inventory(@Parent() cafe: Cafe): Promise<Stock[]> {
    return this.dataLoader.inventoryByCafeId.load(cafe.id);
  }

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