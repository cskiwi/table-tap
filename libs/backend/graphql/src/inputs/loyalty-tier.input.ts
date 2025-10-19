import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyTier } from '@app/models';

@InputType()
export class LoyaltyTierUpdateInput extends PartialType(
  OmitType(LoyaltyTier, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'loyaltyAccounts',
    'tierName',
    'hasSpecialBenefits',
    'isTopTier',
    'minPoints',
    'minAnnualSpending',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyTierCreateInput extends PartialType(
  OmitType(LoyaltyTierUpdateInput, ['id'] as const),
  InputType
) {}
