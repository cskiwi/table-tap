import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Configuration } from '@app/models';

@InputType()
export class ConfigurationUpdateInput extends PartialType(
  OmitType(Configuration, [
    'createdAt',
    'updatedAt',
    'cafe',
    'lastModifiedBy',
    'isDefault',
    'hasChanged',
    'canEdit',
    'displayValue',
  ] as const),
  InputType
) {}

@InputType()
export class ConfigurationCreateInput extends PartialType(
  OmitType(ConfigurationUpdateInput, ['id'] as const),
  InputType
) {}
