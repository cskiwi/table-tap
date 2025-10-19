import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { TimeEntry } from '@app/models';

@InputType()
export class TimeEntryUpdateInput extends PartialType(
  OmitType(TimeEntry, [
    
    'createdAt',
    'timeSheet',
  ] as const),
  InputType
) {}

@InputType()
export class TimeEntryCreateInput extends PartialType(
  OmitType(TimeEntryUpdateInput, ['id'] as const),
  InputType
) {}
