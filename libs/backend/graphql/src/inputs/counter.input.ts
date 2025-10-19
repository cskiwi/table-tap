import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Counter } from '@app/models';

@InputType()
export class CounterUpdateInput extends PartialType(
  OmitType(Counter, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'isAvailable',
    'isOverloaded',
    'canAcceptOrders',
    'displayLabel',
    'loadPercentage',
  ] as const),
  InputType
) {}

@InputType()
export class CounterCreateInput extends PartialType(
  OmitType(CounterUpdateInput, ['id'] as const),
  InputType
) {}
