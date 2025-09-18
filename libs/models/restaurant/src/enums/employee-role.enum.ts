import { registerEnumType } from '@nestjs/graphql';

export enum EmployeeRole {
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  CASHIER = 'CASHIER',
  BARISTA = 'BARISTA',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  SERVER = 'SERVER',
  CLEANER = 'CLEANER',
}

registerEnumType(EmployeeRole, {
  name: 'EmployeeRole',
  description: 'The role of an employee in the cafe',
});