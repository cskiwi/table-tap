import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, Product, ProductAttribute, User } from '@app/models';
import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCreateInput, ProductUpdateInput } from '../../inputs';
import { ProductArgs } from '../../args';
import { PublicAccess } from '../../middleware/role-access-control.middleware';

@Injectable()
@Resolver(() => Product)
export class MenuResolver {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepository: Repository<ProductAttribute>,
  ) {}

  // Queries - Use dynamic Args for flexible querying
  @Query(() => [Product])
  @PublicAccess() // Public: Customers need to view menu without authentication
  async products(
    @Args('args', { type: () => ProductArgs, nullable: true })
    inputArgs?: InstanceType<typeof ProductArgs>,
  ): Promise<Product[]> {
    const args = ProductArgs.toFindManyOptions(inputArgs);
    return this.productRepository.find(args);
  }

  @Query(() => Product, { nullable: true })
  @PublicAccess() // Public: Customers need to view individual products without authentication
  async product(
    @Args('id') id: string,
  ): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
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

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() product: Product): Promise<Cafe> {
    // If cafe is already loaded, return it
    if (product.cafe) {
      return product.cafe;
    }
    // Otherwise, lazy load using parent's cafeId
    const cafe = await this.cafeRepository.findOne({
      where: { id: product.cafeId },
    });
    if (!cafe) {
      throw new Error(`Cafe with ID ${product.cafeId} not found`);
    }
    return cafe;
  }

  @ResolveField(() => ProductAttribute, { nullable: true })
  async attributes(@Parent() product: Product): Promise<ProductAttribute | null> {
    // If attributes are already loaded, return them
    if (product.attributes !== undefined) {
      return product.attributes;
    }
    // Otherwise, lazy load using parent's ID
    return this.productAttributeRepository.findOne({
      where: { productId: product.id },
    });
  }
}