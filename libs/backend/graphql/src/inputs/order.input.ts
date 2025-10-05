import { Field, InputType, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';

@InputType()
export class CreateOrderItemInput {
  @Field()
  @IsString()
  productId: string;

  @Field()
  @IsNumber()
  quantity: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  price?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class CreateOrderInput {
  @Field()
  @IsString()
  cafeId: string;

  @Field(() => [CreateOrderItemInput])
  @IsArray()
  items: CreateOrderItemInput[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  userId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class UpdateOrderInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
