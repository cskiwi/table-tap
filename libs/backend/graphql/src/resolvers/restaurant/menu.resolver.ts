import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Product, Cafe, ProductUpdateInput, ProductCreateInput } from '@app/models';

@Injectable()
@Resolver(() => Product)
export class MenuResolver {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Queries
  @Query(() => [Product])
  async cafeMenu(
    @Args('cafeId') cafeId: string,
    @Args('category', { nullable: true }) category?: string,
  ): Promise<Product[]> {
    // Use repository directly for simple queries
    const where: any = { cafeId };
    if (category) where.category = category;

    return this.productRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  @Query(() => [Product])
  async availableMenuItems(
    @Args('cafeId') cafeId: string,
    @Args('category', { nullable: true }) category?: string,
  ): Promise<Product[]> {
    // Use repository directly - only available products
    const where: any = { cafeId, isAvailable: true };
    if (category) where.category = category;

    return this.productRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  @Query(() => Product, { nullable: true })
  @UseGuards(PermGuard)
  async menuItem(
    @Args('id') id: string,
    @ReqUser() user?: User,
  ): Promise<Product | null> {
    // Use repository directly
    return this.productRepository.findOne({
      where: { id, cafeId: user?.cafeId }
    });
  }

  // Mutations
  @Mutation(() => Product)
  @UseGuards(PermGuard)
  async createMenuItem(
    @Args('input') input: ProductCreateInput,
    @ReqUser() user: User,
  ): Promise<Product> {
    // Use repository directly for simple CRUD
    const product = this.productRepository.create({
      ...input,
      cafeId: user.cafeId,
    });
    return this.productRepository.save(product);
  }

  @Mutation(() => Product)
  @UseGuards(PermGuard)
  async updateMenuItem(
    @Args('id') id: string,
    @Args('input') input: ProductUpdateInput,
    @ReqUser() user: User,
  ): Promise<Product> {
    // Use repository directly for simple CRUD
    await this.productRepository.update(
      { id, cafeId: user.cafeId },
      input
    );
    const product = await this.productRepository.findOne({
      where: { id, cafeId: user.cafeId }
    });
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    return product;
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteMenuItem(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    // Use repository directly (soft delete)
    await this.productRepository.softDelete({ id, cafeId: user.cafeId });
    return true;
  }
}