import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { LoyaltyChallenge } from '@app/models';

@InputType()
export class LoyaltyChallengeUpdateInput extends PartialType(
  OmitType(LoyaltyChallenge, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'isCurrentlyActive',
    'isExpired',
    'completionRate',
    'averagePointsPerCompletion',
    'daysUntilStart',
    'daysUntilEnd',
    'difficultyColor',
    'difficultyStars',
    'displayType',
  ] as const),
  InputType
) {}

@InputType()
export class LoyaltyChallengeCreateInput extends PartialType(
  OmitType(LoyaltyChallengeUpdateInput, ['id'] as const),
  InputType
) {}
