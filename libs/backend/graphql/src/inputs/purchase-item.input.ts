import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { PurchaseItem } from '@app/models';

@InputType()
export class PurchaseItemUpdateInput extends PartialType(
  OmitType(PurchaseItem, [
    
    'createdAt',
    'updatedAt',
    'purchase',
  ] as const),
  InputType
) {}

@InputType()
export class PurchaseItemCreateInput extends PartialType(
  OmitType(PurchaseItemUpdateInput, ['id'] as const),
  InputType
) {}
