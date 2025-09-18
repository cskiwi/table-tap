export enum PaymentMethod {
  QR = 'qr',
  PAYCONIC = 'payconic',
  CASH = 'cash',
  CREDIT = 'credit',
  CARD = 'card',
  MOBILE = 'mobile',
  VOUCHER = 'voucher'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}