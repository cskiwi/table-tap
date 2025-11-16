import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, CafeHostname, CafeSettings, Employee, Order, Product, User } from '@app/models';
import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
// not working
import { CafeArgs } from '../../args';
import { CafeCreateInput, CafeUpdateInput } from '../../inputs';

@Injectable()
@Resolver(() => Cafe)
export class CafeResolver {
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(CafeHostname)
    private readonly cafeHostnameRepository: Repository<CafeHostname>,
    @InjectRepository(CafeSettings)
    private readonly cafeSettingsRepository: Repository<CafeSettings>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  // Queries
  @Query(() => [Cafe])
  @UseGuards(PermGuard)
  async cafes(
    @Args('args', { type: () => CafeArgs, nullable: true })
    inputArgs?: InstanceType<typeof CafeArgs>,
    @ReqUser()
    user?: User,
  ): Promise<Cafe[]> {
    const args = CafeArgs.toFindOneOptions(inputArgs);

    return this.cafeRepository.find({
      ...args,
    });
  }

  @Query(() => Cafe, { nullable: true })
  @UseGuards(PermGuard)
  async cafe(@Args('id') id: string, @ReqUser() user: User): Promise<Cafe | null> {
    // Use repository directly for simple CRUD
    return this.cafeRepository.findOne({
      where: { id },
    });
  }

  @Query(() => [Cafe])
  @UseGuards(PermGuard)
  async myCafes(@ReqUser() user: User): Promise<Cafe[]> {
    // Return all cafes the user has permission for (many-to-many relationship)
    // The cafes are already loaded by PermGuard with relations: ['cafes']
    return user.cafes || [];
  }

  // /**
  //  * Query to find a cafe by its hostname.
  //  * This is used for hostname-based cafe detection and does NOT require authentication.
  //  * This allows the frontend to detect which cafe is being visited before login.
  //  *
  //  * @param hostname - The hostname to lookup (e.g., "my-cafe.tabletap.com", "localhost:4200")
  //  * @returns The cafe associated with the hostname, or null if not found
  //  */
  // @Query(() => Cafe, { nullable: true })
  // async cafeByHostname(@Args('hostname') hostname: string): Promise<Cafe | null> {
  //   // Find the hostname entry
  //   const cafeHostname = await this.cafeHostnameRepository.findOne({
  //     where: { hostname, isActive: true },
  //     relations: ['cafe'],
  //   });

  //   if (!cafeHostname) {
  //     return null;
  //   }

  //   // Return the associated cafe with its hostnames
  //   return this.cafeRepository.findOne({
  //     where: { id: cafeHostname.cafeId },
  //     relations: ['hostnames'],
  //   });
  // }

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
      where: { id },
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

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => [CafeHostname])
  async hostnames(@Parent() cafe: Cafe): Promise<CafeHostname[]> {
    // If hostnames are already loaded, return them
    if (cafe.hostnames) {
      return cafe.hostnames;
    }
    // Otherwise, lazy load using parent's ID
    return this.cafeHostnameRepository.find({
      where: { cafeId: cafe.id },
    });
  }

  @ResolveField(() => CafeSettings, { nullable: true })
  async settings(@Parent() cafe: Cafe): Promise<CafeSettings | null> {
    // If settings are already loaded, return them
    if (cafe.settings !== undefined) {
      return cafe.settings;
    }
    // Otherwise, lazy load using parent's ID
    return this.cafeSettingsRepository.findOne({
      where: { cafeId: cafe.id },
    });
  }

  @ResolveField(() => [Product])
  async products(@Parent() cafe: Cafe): Promise<Product[]> {
    // If products are already loaded, return them
    if (cafe.products) {
      return cafe.products;
    }
    // Otherwise, lazy load using parent's ID
    return this.productRepository.find({
      where: { cafeId: cafe.id },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  @ResolveField(() => [Order])
  async orders(@Parent() cafe: Cafe): Promise<Order[]> {
    // If orders are already loaded, return them
    if (cafe.orders) {
      return cafe.orders;
    }
    // Otherwise, lazy load using parent's ID (with reasonable limit)
    return this.orderRepository.find({
      where: { cafeId: cafe.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  @ResolveField(() => [Employee])
  async employees(@Parent() cafe: Cafe): Promise<Employee[]> {
    // If employees are already loaded, return them
    if (cafe.employees) {
      return cafe.employees;
    }
    // Otherwise, lazy load using parent's ID
    return this.employeeRepository.find({
      where: { cafeId: cafe.id },
    });
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

  @Subscription(() => GraphQLJSONObject)
  cafeDeleted() {
    return this.pubSub.asyncIterator('cafeDeleted');
  }
}
