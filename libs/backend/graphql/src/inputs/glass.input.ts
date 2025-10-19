import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Glass } from '@app/models';

@InputType()
export class GlassUpdateInput extends PartialType(
  OmitType(Glass, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'currentCustomer',
    'currentOrder',
    'movements',
    'isAvailable',
    'isInUse',
    'needsCleaning',
    'isLost',
    'isBroken',
    'daysSinceLastUse',
    'daysSinceLastClean',
  ] as const),
  InputType
) {}

@InputType()
export class GlassCreateInput extends PartialType(
  OmitType(GlassUpdateInput, ['id'] as const),
  InputType
) {}
