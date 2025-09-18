import { registerEnumType } from '@nestjs/graphql';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  SUSPENDED = 'SUSPENDED',
}

registerEnumType(EmployeeStatus, {
  name: 'EmployeeStatus',
  description: 'The current status of an employee',
});