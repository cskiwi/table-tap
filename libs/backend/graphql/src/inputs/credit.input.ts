import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Credit } from '@app/models';

@InputType()
export class CreditUpdateInput extends PartialType(
  OmitType(Credit, [
    'createdAt',
    'updatedAt',
    'cafe',
    'user',
    'order',
    'performedBy',
    'isCredit',
    'isDebit',
    'absoluteAmount',
    'isExpired',
    'isPromotional',
    'hasRestrictions',
    'daysUntilExpiry',
    'isValidForUse',
    'displayDescription',
  ] as const),
  InputType
) {}

@InputType()
export class CreditCreateInput extends PartialType(
  OmitType(CreditUpdateInput, ['id'] as const),
  InputType
) {}
