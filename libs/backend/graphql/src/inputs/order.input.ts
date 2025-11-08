import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Order } from '@app/models';

@InputType()
export class OrderUpdateInput extends PartialType(
  OmitType(Order, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'customer',
    'createdByEmployee',
    'items',
    'payments',
    'orderNumber',
    'total',
    'isActive',
    'canBeCancelled',
    'currentWorkflowStep',
    'actualPrepTime',
  ] as const),
  InputType
) {}

@InputType()
export class OrderCreateInput extends PartialType(
  OmitType(OrderUpdateInput, ['id'] as const),
  InputType
) {}



