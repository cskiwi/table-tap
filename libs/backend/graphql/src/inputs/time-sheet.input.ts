import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { TimeSheet } from '@app/models';

@InputType()
export class TimeSheetUpdateInput extends PartialType(
  OmitType(TimeSheet, [
    
    'createdAt',
    'updatedAt',
    'cafe',
    'employee',
    'entries',
    'isComplete',
    'isActive',
    'isOvertime',
    'overtimeHours',
    'workingHours',
    'hasTimeEntries',
    'lastEntry',
    'isClockedIn',
    'isOnBreak',
  ] as const),
  InputType
) {}

@InputType()
export class TimeSheetCreateInput extends PartialType(
  OmitType(TimeSheetUpdateInput, ['id'] as const),
  InputType
) {}
