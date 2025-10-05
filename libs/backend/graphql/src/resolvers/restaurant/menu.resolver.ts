import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import {
  Menu,
  MenuCategory,
  Cafe,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  CreateMenuCategoryInput,
  PaginatedMenuResponse
} from '@app/models';
import { MenuService } from '@app/backend-services';
import { DataLoader } from '../../dataloaders';

@Injectable()
@Resolver(() => Menu)
export class MenuResolver {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly menuService: MenuService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  // Queries
  @Query(() => PaginatedMenuResponse)
  async cafeMenu(
    @Args('cafeId') cafeId: string,
    @Args('categoryId', { nullable: true }) categoryId?: string,
  ): Promise<PaginatedMenuResponse> {
    return this.menuService.findByCafe(cafeId, { categoryId, pagination, sort });
  }

  @Query(() => [Menu])
  async availableMenuItems(
    @Args('cafeId') cafeId: string,
    @Args('categoryId', { nullable: true }) categoryId?: string,
  ): Promise<Menu[]> {
    return this.menuService.findAvailableItems(cafeId, categoryId);
  }

  @Query(() => Menu, { nullable: true })
  @UseGuards(PermGuard)
  async menuItem(
    @Args('id') id: string,
    @ReqUser() user?: User,
  ): Promise<Menu | null> {
    return this.menuService.findById(id, user);
  }

  @Query(() => [Menu])
  async searchMenuItems(
    @Args('cafeId') cafeId: string,
    @Args('query') query: string,
  ): Promise<Menu[]> {
    return this.menuService.search(cafeId, query, pagination);
  }

  // Mutations
  @Mutation(() => Menu)
  @UseGuards(PermGuard)
  async createMenuItem(
    @Args('input') input: CreateMenuItemInput,
    @ReqUser() user: User,
  ): Promise<Menu> {
    return this.menuService.createItem(input, user);
  }

  @Mutation(() => Menu)
  @UseGuards(PermGuard)
  async updateMenuItem(
    @Args('id') id: string,
    @Args('input') input: UpdateMenuItemInput,
    @ReqUser() user: User,
  ): Promise<Menu> {
    return this.menuService.updateItem(id, input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(PermGuard)
  async deleteMenuItem(
    @Args('id') id: string,
    @ReqUser() user: User,
  ): Promise<boolean> {
    await this.menuService.deleteItem(id, user);
    return true;
  }

  @Mutation(() => MenuCategory)
  @UseGuards(PermGuard)
  async createMenuCategory(
    @Args('input') input: CreateMenuCategoryInput,
    @ReqUser() user: User,
  ): Promise<MenuCategory> {
    return this.menuService.createCategory(input, user);
  }

  // Field Resolvers
  @ResolveField(() => Cafe)
  async cafe(@Parent() menu: Menu): Promise<Cafe> {
    return this.dataLoader.cafeById.load(menu.cafeId);
  }

  @ResolveField(() => MenuCategory, { nullable: true })
  async category(@Parent() menu: Menu): Promise<MenuCategory | null> {
    if (!menu.categoryId) return null;
    return this.dataLoader.menuCategoryById.load(menu.categoryId);
  }
}

@Injectable()
@Resolver(() => MenuCategory)
export class MenuCategoryResolver {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
    private readonly menuService: MenuService,
    private readonly dataLoader: DataLoaderService,
  ) {}

  @Query(() => [MenuCategory])
  async menuCategories(
    @Args('cafeId') cafeId: string,
    @Args('activeOnly', { defaultValue: true }) activeOnly: boolean,
  ): Promise<MenuCategory[]> {
    return this.menuService.findCategories(cafeId, activeOnly);
  }

  @ResolveField(() => [Menu])
  async menuItems(@Parent() category: MenuCategory): Promise<Menu[]> {
    return this.dataLoader.menuItemsByCategoryId.load(category.id);
  }

  @ResolveField(() => Cafe)
  async cafe(@Parent() category: MenuCategory): Promise<Cafe> {
    return this.dataLoader.cafeById.load(category.cafeId);
  }
}