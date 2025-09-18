export enum PersonalOrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONSUMED = 'consumed',
  CANCELLED = 'cancelled',
  WAITING_APPROVAL = 'waiting_approval',
  PARTIALLY_USED = 'partially_used'
}

export enum AllowanceType {
  FOOD = 'food',
  BEVERAGE = 'beverage',
  GENERAL = 'general',
  MEAL_VOUCHER = 'meal_voucher',
  SPECIAL_OCCASION = 'special_occasion',
  TRAINING_ALLOWANCE = 'training_allowance',
  OVERTIME_BONUS = 'overtime_bonus'
}

export enum AllowancePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ONE_TIME = 'one_time'
}

export enum RolloverPolicy {
  NONE = 'none',
  FULL = 'full',
  PARTIAL = 'partial',
  EXPIRE_END_OF_PERIOD = 'expire_end_of_period',
  EXPIRE_END_OF_MONTH = 'expire_end_of_month',
  EXPIRE_END_OF_YEAR = 'expire_end_of_year'
}