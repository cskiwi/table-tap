import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { GlassMovement } from '@app/models';

@InputType()
export class GlassMovementUpdateInput extends PartialType(
  OmitType(GlassMovement, [
    'createdAt',
    'glass',
    'order',
    'customer',
    'employee',
  ] as const),
  InputType
) {}

@InputType()
export class GlassMovementCreateInput extends PartialType(
  OmitType(GlassMovementUpdateInput, ['id'] as const),
  InputType
) {}
