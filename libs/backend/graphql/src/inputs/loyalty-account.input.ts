import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyAccount } from '@app/models';

@InputType()
export class LoyaltyAccountUpdateInput extends PartialType(
  OmitType(LoyaltyAccount, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'user',
    'currentTier',
    'referredByUser',
    'transactions',
    'availablePoints',
    'pointsToNextTier',
    'tierProgress',
    'isBirthdayMonth',
    'isAnniversaryMonth',
    'daysSinceLastActivity',
    'badgeCount',
    'activeChallenges',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyAccountCreateInput extends PartialType(
  OmitType(LoyaltyAccountUpdateInput, ['id'] as const),
  InputType
) {}
