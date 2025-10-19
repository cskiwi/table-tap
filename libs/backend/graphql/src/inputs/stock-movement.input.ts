import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { StockMovement } from '@app/models';

@InputType()
export class StockMovementUpdateInput extends PartialType(
  OmitType(StockMovement, [
    
    'createdAt',
    'updatedAt',
    'cafe',
    'product',
    'performedBy',
    'isIncrease',
    'isDecrease',
    'absoluteQuantity',
  ] as const),
  InputType
) {}

@InputType()
export class StockMovementCreateInput extends PartialType(
  OmitType(StockMovementUpdateInput, ['id'] as const),
  InputType
) {}
