import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Employee } from '@app/models';

@InputType()
export class EmployeeUpdateInput extends PartialType(
  OmitType(Employee, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'user',
    'timeSheets',
    'employeeId',
    'role',
    'fullName',
    'isActive',
    'displayName',
    'canWorkToday',
    'currentShiftDuration',
  ] as const),
  InputType
) {}

@InputType()
export class EmployeeCreateInput extends PartialType(
  OmitType(EmployeeUpdateInput, ['id'] as const),
  InputType
) {}
