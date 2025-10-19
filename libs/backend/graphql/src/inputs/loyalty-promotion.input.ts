import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyPromotion } from '@app/models';

@InputType()
export class LoyaltyPromotionUpdateInput extends PartialType(
  OmitType(LoyaltyPromotion, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'isScheduled',
    'isCurrentlyActive',
    'isExpired',
    'redemptionRate',
    'averagePointsPerRedemption',
    'averageRevenuePerRedemption',
    'daysUntilStart',
    'daysUntilEnd',
    'hasUsageLimit',
    'isTimeRestricted',
    'displayType',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyPromotionCreateInput extends PartialType(
  OmitType(LoyaltyPromotionUpdateInput, ['id'] as const),
  InputType
) {}
