export enum PaymentMethod {
  QR = 'qr',
  PAYCONIC = 'payconic',
  CASH = 'cash',
  CREDIT = 'credit',
  CARD = 'card',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  MOBILE = 'mobile',
  MOBILE_PAYMENT = 'mobile_payment',
  VOUCHER = 'voucher',
  GIFT_CARD = 'gift_card',
  STORE_CREDIT = 'store_credit',
  SPLIT_PAYMENT = 'split_payment'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}