import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyTransaction } from '@app/models';

@InputType()
export class LoyaltyTransactionUpdateInput extends PartialType(
  OmitType(LoyaltyTransaction, [
    
    'createdAt',
    'updatedAt',
    'cafe',
    'loyaltyAccount',
    'order',
    'processedByUser',
    'isEarned',
    'isRedeemed',
    'isExpired',
    'isPending',
    'absolutePoints',
    'displayType',
    'daysUntilExpiry',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyTransactionCreateInput extends PartialType(
  OmitType(LoyaltyTransactionUpdateInput, ['id'] as const),
  InputType
) {}
