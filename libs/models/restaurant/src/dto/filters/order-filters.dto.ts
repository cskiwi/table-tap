import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { OrderStatus } from '../../enums/order-status.enum';
import { OrderType } from '../../enums/order-type.enum';
import { DateRangeFilter, SearchFilter } from './common-filters.dto';

@InputType('OrderFilters')
export class OrderFilters {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare cafeId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare customerId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  declare counterId: string;

  @Field(() => [OrderStatus], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  declare status: OrderStatus[];

  @Field(() => [OrderType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderType, { each: true })
  declare type: OrderType[];

  @Field(() => DateRangeFilter, { nullable: true })
  @IsOptional()
  declare dateRange: DateRangeFilter;

  @Field(() => SearchFilter, { nullable: true })
  @IsOptional()
  declare search: SearchFilter;
}