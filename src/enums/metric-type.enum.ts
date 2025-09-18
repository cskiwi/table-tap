export enum MetricType {
  // Efficiency Metrics
  ORDER_PROCESSING_TIME = 'order_processing_time',
  CUSTOMER_WAIT_TIME = 'customer_wait_time',
  KITCHEN_FULFILLMENT_TIME = 'kitchen_fulfillment_time',
  CHECKOUT_TIME = 'checkout_time',
  MULTITASKING_EFFICIENCY = 'multitasking_efficiency',

  // Productivity Metrics
  ORDERS_PER_HOUR = 'orders_per_hour',
  SALES_PER_HOUR = 'sales_per_hour',
  ITEMS_PER_HOUR = 'items_per_hour',
  REVENUE_PER_SHIFT = 'revenue_per_shift',
  CUSTOMER_THROUGHPUT = 'customer_throughput',

  // Quality Metrics
  ORDER_ACCURACY = 'order_accuracy',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  COMPLAINT_RATE = 'complaint_rate',
  RETURN_CUSTOMER_RATE = 'return_customer_rate',
  QUALITY_SCORE = 'quality_score',

  // Sales Metrics
  UPSELL_SUCCESS_RATE = 'upsell_success_rate',
  CROSS_SELL_SUCCESS_RATE = 'cross_sell_success_rate',
  AVERAGE_ORDER_VALUE = 'average_order_value',
  CONVERSION_RATE = 'conversion_rate',
  RECOMMENDATION_SUCCESS = 'recommendation_success',

  // Attendance Metrics
  PUNCTUALITY_SCORE = 'punctuality_score',
  ATTENDANCE_RATE = 'attendance_rate',
  BREAK_COMPLIANCE = 'break_compliance',
  OVERTIME_HOURS = 'overtime_hours',
  SCHEDULE_ADHERENCE = 'schedule_adherence',

  // Development Metrics
  TRAINING_COMPLETION = 'training_completion',
  SKILL_ASSESSMENT_SCORE = 'skill_assessment_score',
  GOAL_ACHIEVEMENT = 'goal_achievement',
  IMPROVEMENT_RATE = 'improvement_rate',
  CERTIFICATION_STATUS = 'certification_status',

  // Team Metrics
  COLLABORATION_SCORE = 'collaboration_score',
  LEADERSHIP_RATING = 'leadership_rating',
  MENTORING_ACTIVITIES = 'mentoring_activities',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  TEAM_CONTRIBUTION = 'team_contribution',

  // Financial Metrics
  COST_PER_ORDER = 'cost_per_order',
  WASTE_REDUCTION = 'waste_reduction',
  INVENTORY_ACCURACY = 'inventory_accuracy',
  CASH_HANDLING_ACCURACY = 'cash_handling_accuracy',
  PROFIT_CONTRIBUTION = 'profit_contribution'
}

export enum MetricCategory {
  EFFICIENCY = 'efficiency',
  PRODUCTIVITY = 'productivity',
  QUALITY = 'quality',
  SALES = 'sales',
  ATTENDANCE = 'attendance',
  DEVELOPMENT = 'development',
  TEAM = 'team',
  FINANCIAL = 'financial',
  CUSTOMER_SERVICE = 'customer_service',
  COMPLIANCE = 'compliance'
}

export enum MetricPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum MetricAggregation {
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  MEDIAN = 'median',
  PERCENTILE_95 = 'percentile_95'
}