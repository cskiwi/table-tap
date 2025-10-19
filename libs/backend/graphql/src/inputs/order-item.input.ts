import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { OrderItem } from '@app/models';

@InputType()
export class OrderItemUpdateInput extends PartialType(
  OmitType(OrderItem, [
    
    'createdAt',
    'updatedAt',
    'order',
    'product',
    'hasCustomizations',
    'isCompleted',
    'totalCustomizationPrice',
  ] as const),
  InputType
) {}

@InputType()
export class OrderItemCreateInput extends PartialType(
  OmitType(OrderItemUpdateInput, ['id'] as const),
  InputType
) {}
