import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Product, User } from '@app/models';
import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCreateInput, ProductUpdateInput } from '../../inputs';

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
    @Args('cafeId', { nullable: true }) cafeId?: string,
  ): Promise<Product | null> {
    // Use repository directly
    const where: any = { id };
    if (cafeId) {
      where.cafeId = cafeId;
    }
    return this.productRepository.findOne({ where });
  }

  @Query(() => [Product])
  async menuCategories(
    @Args('cafeId') cafeId: string,
    @Args('activeOnly', { nullable: true, defaultValue: true }) activeOnly?: boolean,
  ): Promise<Product[]> {
    // Get all products for the cafe, optionally filtering by availability
    const where: any = { cafeId };
    if (activeOnly) {
      where.isAvailable = true;
    }

    return this.productRepository.find({
      where,
      order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' }
    });
  }

  // Mutations
  @Mutation(() => Product)
  @UseGuards(PermGuard)
  async createMenuItem(
    @Args('input') input: ProductCreateInput,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Product> {
    // Verify user has permission for this cafe
    const hasPermission = user.cafes?.some(cafe => cafe.id === cafeId);
    if (!hasPermission) {
      throw new Error('User does not have permission for this cafe');
    }

    // Use repository directly for simple CRUD
    const product = this.productRepository.create({
      ...input,
      cafeId,
    });
    return this.productRepository.save(product);
  }

  @Mutation(() => Product)
  @UseGuards(PermGuard)
  async updateMenuItem(
    @Args('id') id: string,
    @Args('input') input: ProductUpdateInput,
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<Product> {
    // Verify user has permission for this cafe
    const hasPermission = user.cafes?.some(cafe => cafe.id === cafeId);
    if (!hasPermission) {
      throw new Error('User does not have permission for this cafe');
    }

    // Use repository directly for simple CRUD
    await this.productRepository.update(
      { id, cafeId },
      input
    );
    const product = await this.productRepository.findOne({
      where: { id, cafeId }
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
    @Args('cafeId') cafeId: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    // Verify user has permission for this cafe
    const hasPermission = user.cafes?.some(cafe => cafe.id === cafeId);
    if (!hasPermission) {
      throw new Error('User does not have permission for this cafe');
    }

    // Use repository directly (soft delete)
    await this.productRepository.softDelete({ id, cafeId });
    return true;
  }
}