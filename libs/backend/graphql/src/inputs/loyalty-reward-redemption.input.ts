import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyRewardRedemption } from '@app/models';

@InputType()
export class LoyaltyRewardRedemptionUpdateInput extends PartialType(
  OmitType(LoyaltyRewardRedemption, [
    'createdAt',
    'updatedAt',
    'cafe',
    'loyaltyAccount',
    'reward',
    'order',
    'approvedByUser',
    'redeemedByUser',
    'isPending',
    'isApproved',
    'isRedeemed',
    'isCancelled',
    'isExpired',
    'canBeCancelled',
    'daysUntilExpiry',
    'statusDisplay',
    'processingTime',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyRewardRedemptionCreateInput extends PartialType(
  OmitType(LoyaltyRewardRedemptionUpdateInput, ['id'] as const),
  InputType
) {}
