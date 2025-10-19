import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Purchase } from '@app/models';

@InputType()
export class PurchaseUpdateInput extends PartialType(
  OmitType(Purchase, [
    
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'createdBy',
    'approvedBy',
    'items',
    'isComplete',
    'isPending',
    'isOverdue',
    'itemCount',
    'totalQuantity',
  ] as const),
  InputType
) {}

@InputType()
export class PurchaseCreateInput extends PartialType(
  OmitType(PurchaseUpdateInput, ['id'] as const),
  InputType
) {}
