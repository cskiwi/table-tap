import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Cafe } from '@app/models';

@InputType()
export class CafeUpdateInput extends PartialType(
  OmitType(Cafe, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'users',
    'products',
    'orders',
    'counters',
    'employees',
    'configurations',
    'loyaltyAccounts',
    'loyaltyTiers',
    'loyaltyTransactions',
    'loyaltyRewards',
    'loyaltyRedemptions',
    'loyaltyChallenges',
    'loyaltyPromotions',
  ] as const),
  InputType
) {}

@InputType()
export class CafeCreateInput extends PartialType(
  OmitType(CafeUpdateInput, ['id'] as const),
  InputType
) {}
