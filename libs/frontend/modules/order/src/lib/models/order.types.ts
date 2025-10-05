export interface CustomerInfo {
  firstName: string,
  lastName: string,
  email: string,
  phone: string
  tableNumber?: number
  specialRequests?: string
  deliveryAddress?: Address
  preferredContactMethod?: 'email' | 'sms' | 'phone';
}

export interface Address {
  street: string,
  city: string,
  state: string,
  zipCode: string
  apartment?: string
  instructions?: string
}

export interface PaymentMethod {
  id: string,
  type: PaymentType,
  name: string
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault?: boolean
  isValid?: boolean
  balance?: number
  validationMessage?: string
}

export enum PaymentType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  VENMO = 'VENMO',
  PAYPAL = 'PAYPAL',
  GIFT_CARD = 'GIFT_CARD',
  STORE_CREDIT = 'STORE_CREDIT',
}

export interface OrderItem {
  id: string,
  menuItemId: string,
  name: string,
  price: number,
  quantity: number
  customizations?: OrderItemCustomization[]
  specialInstructions?: string
}

export interface OrderItemCustomization {
  id: string,
  name: string,
  price: number,
  category: string
}

export interface OrderSummary {
  items: OrderItem[],
  subtotal: number,
  tax: number,
  tip: number,
  discount: number,
  total: number,
  estimatedTime: number
}

export interface Order {
  id: string,
  restaurantId: string,
  customerInfo: CustomerInfo,
  items: OrderItem[]
  summary: OrderSummary,
  paymentMethod: PaymentMethod,
  status: OrderStatus,
  timestamps: OrderTimestamps,
  trackingNumber: string
  notes?: string
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export interface OrderTimestamps {
  created: Date
  confirmed?: Date
  preparationStarted?: Date
  ready?: Date
  delivered?: Date
  cancelled?: Date
}

export interface OrderError {
  code: string,
  message: string
  field?: string
  retryable: boolean
}

export interface OrderSubmissionResponse {
  success: boolean
  orderId?: string
  trackingNumber?: string
  error?: OrderError
  estimatedTime?: number
}

export interface OrderStatusUpdate {
  orderId: string,
  status: OrderStatus,
  timestamp: Date
  message?: string
  estimatedTime?: number
}

export interface PaymentProcessingResult {
  success: boolean
  transactionId?: string
  error?: PaymentError
  requiresAdditionalAuth?: boolean
  authUrl?: string
  status: PaymentStatus
  amount?: number
  currency?: string
  processingTime?: number
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export interface PaymentError {
  code: string,
  message: string
  field?: string
  retryable: boolean
  details?: Record<string, any>;
}

export interface Receipt {
  id: string,
  orderId: string,
  number: string,
  date: Date,
  items: ReceiptItem[],
  subtotal: number,
  tax: number,
  tip: number,
  discount: number,
  total: number,
  paymentMethod: PaymentMethod,
  customerInfo: CustomerInfo,
  restaurantInfo: RestaurantInfo
  qrCode?: string
}

export interface ReceiptItem {
  name: string,
  quantity: number,
  unitPrice: number,
  totalPrice: number
  customizations?: string[]
}

export interface RestaurantInfo {
  name: string,
  address: Address,
  phone: string,
  email: string
  website?: string
  taxId?: string
}

export interface OrderValidation {
  isValid: boolean,
  errors: ValidationError[]
  warnings: ValidationWarning[]
  priceChanges?: PriceChange[]
}

export interface ValidationError {
  field: string,
  code: string,
  message: string,
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  code: string,
  message: string
  action?: string
}

export interface PriceChange {
  itemId: string,
  oldPrice: number,
  newPrice: number,
  reason: string
}

export interface OrderWorkflowState {
  currentStep: OrderWorkflowStep,
  completedSteps: OrderWorkflowStep[]
  canProceed: boolean,
  canGoBack: boolean,
  progress: number
}

export enum OrderWorkflowStep {
  CART_REVIEW = 'CART_REVIEW',
  CUSTOMER_INFO = 'CUSTOMER_INFO',
  PAYMENT_METHOD = 'PAYMENT_METHOD',
  ORDER_REVIEW = 'ORDER_REVIEW',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  CONFIRMATION = 'CONFIRMATION',
  TRACKING = 'TRACKING',
}

export interface OrderNotification {
  id: string,
  orderId: string,
  type: NotificationType,
  title: string,
  message: string,
  timestamp: Date,
  read: boolean
  actions?: NotificationAction[]
}

export enum NotificationType {
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface NotificationAction {
  label: string,
  action: string,
  style: 'primary' | 'secondary' | 'danger';
}