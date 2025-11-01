export enum TransactionType {
  PURCHASE = 'purchase',
  REFUND = 'refund',
  CREDIT_ADD = 'credit_add',
  CREDIT_DEDUCT = 'credit_deduct',
  STOCK_PURCHASE = 'stock_purchase',
  ADJUSTMENT = 'adjustment',
  VOID = 'void',
  DISCOUNT = 'discount',
  SURCHARGE = 'surcharge'
}

export enum StockMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  WASTE = 'waste',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  RETURN = 'return'
}