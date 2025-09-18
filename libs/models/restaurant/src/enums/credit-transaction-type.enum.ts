import { registerEnumType } from '@nestjs/graphql';

export enum CreditTransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRED = 'EXPIRED',
  BONUS = 'BONUS',
}

registerEnumType(CreditTransactionType, {
  name: 'CreditTransactionType',
  description: 'The type of credit transaction',
});