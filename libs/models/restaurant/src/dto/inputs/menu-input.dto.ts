import { Field, InputType, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsUUID, IsArray, Min, IsUrl } from 'class-validator';
import { MenuItemStatus } from '../../enums/menu-item-status.enum';

@InputType('CreateMenuItemInput')
export class CreateMenuItemInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  declare price: number;

  @Field(() => MenuItemStatus, { defaultValue: MenuItemStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(MenuItemStatus)
  declare status: MenuItemStatus;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare preparationTime: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  declare imageUrl: string;

  @Field({ nullable: true })
  @IsOptional()
  declare nutritionalInfo: Record<string, any>;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare allergens: string[];

  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  declare sortOrder: number;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare cafeId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare categoryId: string;
}

@InputType('UpdateMenuItemInput')
export class UpdateMenuItemInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare price: number;

  @Field(() => MenuItemStatus, { nullable: true })
  @IsOptional()
  @IsEnum(MenuItemStatus)
  declare status: MenuItemStatus;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare preparationTime: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  declare imageUrl: string;

  @Field({ nullable: true })
  @IsOptional()
  declare nutritionalInfo: Record<string, any>;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare allergens: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  declare sortOrder: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare categoryId: string;
}

@InputType('CreateMenuCategoryInput')
export class CreateMenuCategoryInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  declare imageUrl: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  declare sortOrder: number;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare cafeId: string;
}