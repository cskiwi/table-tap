import { registerEnumType } from '@nestjs/graphql';

export enum CafeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  CLOSED = 'CLOSED',
}

registerEnumType(CafeStatus, {
  name: 'CafeStatus',
  description: 'The operational status of a cafe',
});