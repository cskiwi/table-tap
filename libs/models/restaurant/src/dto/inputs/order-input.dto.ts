import { Field, InputType, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsArray, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../../enums/order-type.enum';
import { OrderStatus } from '../../enums/order-status.enum';

@InputType('OrderItemInput')
export class OrderItemInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare menuItemId: string;

  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  declare quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare specialInstructions: string;

  @Field({ nullable: true })
  @IsOptional()
  declare customizations: Record<string, any>;
}

@InputType('CreateOrderInput')
export class CreateOrderInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare cafeId: string;

  @Field(() => OrderType, { defaultValue: OrderType.DINE_IN })
  @IsOptional()
  @IsEnum(OrderType)
  declare type: OrderType;

  @Field(() => [OrderItemInput])
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  declare items: OrderItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare notes: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare tableNumber: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare tip: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare customerId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare counterId: string;
}

@InputType('UpdateOrderStatusInput')
export class UpdateOrderStatusInput {
  @Field(() => OrderStatus)
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  declare status: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare notes: string;
}

@InputType('UpdateOrderInput')
export class UpdateOrderInput {
  @Field(() => OrderType, { nullable: true })
  @IsOptional()
  @IsEnum(OrderType)
  declare type: OrderType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare notes: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare tableNumber: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare tip: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare counterId: string;
}