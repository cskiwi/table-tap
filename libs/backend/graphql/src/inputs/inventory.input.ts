import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Stock } from '@app/models';

@InputType()
export class InventoryUpdateInput extends PartialType(
  OmitType(Stock, ['createdAt', 'updatedAt', 'cafe', 'product', 'isLowStock', 'isOutOfStock', 'stockValue'] as const),
  InputType,
) {}

@InputType()
export class InventoryCreateInput extends PartialType(OmitType(InventoryUpdateInput, ['id'] as const), InputType) {}
