import { registerEnumType } from '@nestjs/graphql';

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  GIFT_CARD = 'GIFT_CARD',
  STORE_CREDIT = 'STORE_CREDIT',
  SPLIT_PAYMENT = 'SPLIT_PAYMENT',
}

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'The method used for payment',
});