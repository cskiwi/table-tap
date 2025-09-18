import { registerEnumType } from '@nestjs/graphql';

export enum CounterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  CLOSED = 'CLOSED',
}

registerEnumType(CounterStatus, {
  name: 'CounterStatus',
  description: 'The operational status of a service counter',
});