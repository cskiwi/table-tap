import { Field, InputType, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

@InputType()
export class CreateInventoryItemInput {
  @Field()
  @IsString()
  cafeId: string;

  @Field()
  @IsString()
  productId: string;

  @Field(() => Float)
  @IsNumber()
  currentQuantity: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  minLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  maxLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  reorderQuantity?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  unit?: string;
}

@InputType()
export class UpdateInventoryItemInput {
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  currentQuantity?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  minLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  maxLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  reorderQuantity?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  unit?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class UpdateInventoryStockInput {
  @Field(() => Float)
  @IsNumber()
  quantityChange: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
