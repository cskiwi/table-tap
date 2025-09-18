import { Type } from '@nestjs/common';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType('PageInfo')
export class PageInfo {
  @Field(() => Int)
  declare total: number;

  @Field(() => Int)
  declare totalPages: number;

  @Field(() => Int)
  declare currentPage: number;

  @Field(() => Int)
  declare pageSize: number;

  @Field()
  declare hasNextPage: boolean;

  @Field()
  declare hasPreviousPage: boolean;
}

export function PaginatedResponse<T>(classRef: Type<T>): Type<any> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef], { nullable: true })
    declare items: T[];

    @Field(() => PageInfo)
    declare pageInfo: PageInfo;
  }
  return PaginatedType;
}

// Specific paginated response types
@ObjectType()
export class PaginatedOrderResponse extends PaginatedResponse(class Order {}) {}

@ObjectType()
export class PaginatedMenuResponse extends PaginatedResponse(class Menu {}) {}

@ObjectType()
export class PaginatedInventoryResponse extends PaginatedResponse(class Inventory {}) {}

@ObjectType()
export class PaginatedEmployeeResponse extends PaginatedResponse(class Employee {}) {}