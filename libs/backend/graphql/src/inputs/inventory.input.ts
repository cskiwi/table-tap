import { InputType, PartialType, OmitType, Field, registerEnumType } from '@nestjs/graphql';
import { Stock } from '@app/models';

export enum StockOperation {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  SET = 'SET',
}

registerEnumType(StockOperation, {
  name: 'StockOperation',
  description: 'Stock update operation type',
});

@InputType()
export class InventoryUpdateInput extends PartialType(
  OmitType(Stock, ['createdAt', 'updatedAt', 'cafe', 'product', 'isLowStock', 'isOutOfStock', 'stockValue'] as const),
  InputType,
) {}

@InputType()
export class InventoryCreateInput extends PartialType(OmitType(InventoryUpdateInput, ['id'] as const), InputType) {}

@InputType()
export class InventoryStockUpdateInput extends PartialType(
  OmitType(Stock, ['createdAt', 'updatedAt', 'cafe', 'product', 'isLowStock', 'isOutOfStock', 'stockValue'] as const),
  InputType,
) {
  @Field(() => StockOperation, { nullable: true })
  operation?: StockOperation;
}
