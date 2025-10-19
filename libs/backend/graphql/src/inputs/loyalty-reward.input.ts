import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyReward } from '@app/models';

@InputType()
export class LoyaltyRewardUpdateInput extends PartialType(
  OmitType(LoyaltyReward, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'redemptions',
    'isAvailable',
    'remainingQuantity',
    'redemptionRate',
    'isLimitedTime',
    'isLimitedQuantity',
    'daysUntilExpiry',
    'isNearExpiry',
    'displayValue',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyRewardCreateInput extends PartialType(
  OmitType(LoyaltyRewardUpdateInput, ['id'] as const),
  InputType
) {}
