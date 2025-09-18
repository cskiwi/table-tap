import { registerEnumType } from '@nestjs/graphql';

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
  CURBSIDE = 'CURBSIDE',
}

registerEnumType(OrderType, {
  name: 'OrderType',
  description: 'The service type for the order',
});