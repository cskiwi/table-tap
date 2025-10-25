import {
  Order,
  OrderStatus,
  OrderWorkflowStep,
  PaymentType,
  OrderError,
  ValidationError,
  OrderNotification,
  NotificationType,
} from '../models/order.types';

/**
 * Utility functions for order management and processing
 */
export class OrderUtils {
  /**
   * Get the display label for an order status
   */
  static getStatusLabel(status: OrderStatus): string {
    const labelMap: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'Draft',
      [OrderStatus.PENDING_PAYMENT]: 'Pending Payment',
      [OrderStatus.PAYMENT_PROCESSING]: 'Processing Payment',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.PREPARING]: 'Preparing',
      [OrderStatus.READY]: 'Ready for Pickup',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.FAILED]: 'Failed'
    }
    return labelMap[status] || status;
  }

  /**
   * Get the appropriate icon for an order status
   */
  static getStatusIcon(status: OrderStatus): string {
    const iconMap: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'icon-edit',
      [OrderStatus.PENDING_PAYMENT]: 'icon-credit-card',
      [OrderStatus.PAYMENT_PROCESSING]: 'icon-loader',
      [OrderStatus.CONFIRMED]: 'icon-check-circle',
      [OrderStatus.PREPARING]: 'icon-chef-hat',
      [OrderStatus.READY]: 'icon-shopping-bag',
      [OrderStatus.DELIVERED]: 'icon-thumbs-up',
      [OrderStatus.CANCELLED]: 'icon-x-circle',
      [OrderStatus.FAILED]: 'icon-alert-circle'
    }
    return iconMap[status] || 'icon-help-circle';
  }

  /**
   * Get the CSS class for an order status
   */
  static getStatusClass(status: OrderStatus): string {
    const classMap: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'status-draft',
      [OrderStatus.PENDING_PAYMENT]: 'status-pending',
      [OrderStatus.PAYMENT_PROCESSING]: 'status-processing',
      [OrderStatus.CONFIRMED]: 'status-confirmed',
      [OrderStatus.PREPARING]: 'status-preparing',
      [OrderStatus.READY]: 'status-ready',
      [OrderStatus.DELIVERED]: 'status-delivered',
      [OrderStatus.CANCELLED]: 'status-cancelled',
      [OrderStatus.FAILED]: 'status-failed'
    }
    return classMap[status] || 'status-unknown';
  }

  /**
   * Calculate the progress percentage for an order status
   */
  static getStatusProgress(status: OrderStatus): number {
    const progressMap: Record<OrderStatus, number> = {
      [OrderStatus.DRAFT]: 0,
      [OrderStatus.PENDING_PAYMENT]: 20,
      [OrderStatus.PAYMENT_PROCESSING]: 40,
      [OrderStatus.CONFIRMED]: 60,
      [OrderStatus.PREPARING]: 80,
      [OrderStatus.READY]: 90,
      [OrderStatus.DELIVERED]: 100,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.FAILED]: 0
    }
    return progressMap[status] || 0;
  }

  /**
   * Check if an order status is considered active (in progress)
   */
  static isActiveStatus(status: OrderStatus): boolean {
    const activeStatuses = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAYMENT_PROCESSING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY];
    return activeStatuses.includes(status);
  }

  /**
   * Check if an order status is considered final (completed/cancelled/failed)
   */
  static isFinalStatus(status: OrderStatus): boolean {
    const finalStatuses = [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.FAILED
    ];
    return finalStatuses.includes(status);
  }

  /**
   * Check if an order can be cancelled
   */
  static canCancelOrder(status: OrderStatus): boolean {
    const cancellableStatuses = [
      OrderStatus.CONFIRMED,
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PREPARING];
    return cancellableStatuses.includes(status);
  }

  /**
   * Check if an order can be modified
   */
  static canModifyOrder(status: OrderStatus): boolean {
    return status === OrderStatus.CONFIRMED;
  }

  /**
   * Generate a tracking number for an order
   */
  static generateTrackingNumber(): string {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TT${timestamp.slice(-6)}${random}`;
  }

  /**
   * Calculate estimated ready time based on order complexity
   */
  static calculateEstimatedTime(itemCount: number, complexity: 'low' | 'medium' | 'high' = 'medium'): number {
    const baseTime = 15; // Base preparation time in minutes
    const itemMultiplier = Math.max(1, Math.ceil(itemCount / 3)); // Extra time per 3 items

    const complexityMultiplier = {
      low: 1,
      medium: 1.2,
      high: 1.5,
    }

    return Math.ceil(baseTime * complexityMultiplier[complexity] * itemMultiplier);
  }

  /**
   * Format currency value for display
   */
  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format date for order display
   */
  static formatOrderDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }

  /**
   * Get payment method icon
   */
  static getPaymentIcon(type: PaymentType): string {
    const iconMap: Record<PaymentType, string> = {
      [PaymentType.CREDIT_CARD]: 'icon-credit-card',
      [PaymentType.DEBIT_CARD]: 'icon-debit-card',
      [PaymentType.CASH]: 'icon-cash',
      [PaymentType.DIGITAL_WALLET]: 'icon-wallet',
      [PaymentType.APPLE_PAY]: 'icon-apple-pay',
      [PaymentType.GOOGLE_PAY]: 'icon-google-pay',
      [PaymentType.PAYPAL]: 'icon-paypal',
      [PaymentType.VENMO]: 'icon-venmo',
      [PaymentType.GIFT_CARD]: 'icon-gift-card',
      [PaymentType.STORE_CREDIT]: 'icon-store-credit'
    }
    return iconMap[type] || 'icon-payment';
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodName(type: PaymentType): string {
    const nameMap: Record<PaymentType, string> = {
      [PaymentType.CREDIT_CARD]: 'Credit Card',
      [PaymentType.DEBIT_CARD]: 'Debit Card',
      [PaymentType.CASH]: 'Cash',
      [PaymentType.DIGITAL_WALLET]: 'Digital Wallet',
      [PaymentType.APPLE_PAY]: 'Apple Pay',
      [PaymentType.GOOGLE_PAY]: 'Google Pay',
      [PaymentType.PAYPAL]: 'PayPal',
      [PaymentType.VENMO]: 'Venmo',
      [PaymentType.GIFT_CARD]: 'Gift Card',
      [PaymentType.STORE_CREDIT]: 'Store Credit'
    }
    return nameMap[type] || type;
  }

  /**
   * Validate order data before submission
   */
  static validateOrder(order: Partial<Order>): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate customer info
    if (!order.customerInfo?.firstName?.trim()) {
      errors.push({
        field: 'customerInfo.firstName',
        code: 'REQUIRED',
        message: 'First name is required',
        severity: 'error',
      });
    }

    if (!order.customerInfo?.lastName?.trim()) {
      errors.push({
        field: 'customerInfo.lastName',
        code: 'REQUIRED',
        message: 'Last name is required',
        severity: 'error',
      });
    }

    if (!order.customerInfo?.email?.trim()) {
      errors.push({
        field: 'customerInfo.email',
        code: 'REQUIRED',
        message: 'Email address is required',
        severity: 'error',
      });
    } else if (!this.isValidEmail(order.customerInfo.email)) {
      errors.push({
        field: 'customerInfo.email',
        code: 'INVALID',
        message: 'Please enter a valid email address',
        severity: 'error',
      });
    }

    if (!order.customerInfo?.phone?.trim()) {
      errors.push({
        field: 'customerInfo.phone',
        code: 'REQUIRED',
        message: 'Phone number is required',
        severity: 'error',
      });
    } else if (!this.isValidPhone(order.customerInfo.phone)) {
      errors.push({
        field: 'customerInfo.phone',
        code: 'INVALID',
        message: 'Please enter a valid phone number',
        severity: 'error',
      });
    }

    // Validate payment method
    if (!order.paymentMethod) {
      errors.push({
        field: 'paymentMethod',
        code: 'REQUIRED',
        message: 'Payment method is required',
        severity: 'error',
      });
    }

    // Validate items
    if (!order.items || order.items.length === 0) {
      errors.push({
        field: 'items',
        code: 'REQUIRED',
        message: 'At least one item is required',
        severity: 'error',
      });
    }

    // Validate totals
    if (!order.summary?.total || order.summary.total <= 0) {
      errors.push({
        field: 'summary.total',
        code: 'INVALID',
        message: 'Order total must be greater than zero',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Create an error from a failed operation
   */
  static createOrderError(
    code: string,
    message: string,
    field?: string,
    retryable = false
  ): OrderError {
    return {
      code,
      message,
      field,
      retryable,
    }
  }

  /**
   * Create a notification for order status updates
   */
  static createStatusNotification(
    orderId: string,
    status: OrderStatus,
    customMessage?: string
  ): OrderNotification {
    const notificationConfig = this.getNotificationConfig(status);

    return {
      id: `${status.toLowerCase()}-${orderId}-${Date.now()}`,
      orderId,
      type: notificationConfig.type,
      title: notificationConfig.title,
      message: customMessage || notificationConfig.message,
      timestamp: new Date(),
      read: false,
    }
  }

  /**
   * Get notification configuration for a status
   */
  private static getNotificationConfig(status: OrderStatus): {
    type: NotificationType,
    title: string,
    message: string
  } {
    const configMap: Record<OrderStatus, { type: NotificationType; title: string; message: string }> = {
      [OrderStatus.CONFIRMED]: {
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and sent to the kitchen',
      },
      [OrderStatus.PREPARING]: {
        type: NotificationType.PREPARING,
        title: 'Preparing Your Order',
        message: 'Our kitchen team has started preparing your order',
      },
      [OrderStatus.READY]: {
        type: NotificationType.READY_FOR_PICKUP,
        title: 'Order Ready!',
        message: 'Your order is ready for pickup',
      },
      [OrderStatus.DELIVERED]: {
        type: NotificationType.DELIVERED,
        title: 'Order Complete',
        message: 'Thank you! Your order has been completed',
      },
      [OrderStatus.CANCELLED]: {
        type: NotificationType.CANCELLED,
        title: 'Order Cancelled',
        message: 'Your order has been cancelled',
      },
      [OrderStatus.FAILED]: {
        type: NotificationType.PAYMENT_FAILED,
        title: 'Order Failed',
        message: 'There was an issue with your order',
      }
    } as any;

    return configMap[status] || {
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Order Update',
      message: 'Your order status has been updated',
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10;
  }

  /**
   * Calculate order complexity based on items and customizations
   */
  static calculateOrderComplexity(items: any[]): 'low' | 'medium' | 'high' {
    const totalCustomizations = items.reduce((sum, item) => {
      return sum + (item.customizations?.length || 0);
    }, 0);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems <= 3 && totalCustomizations <= 2) return 'low';
    if (totalItems <= 8 && totalCustomizations <= 6) return 'medium';
    return 'high';
  }

  /**
   * Generate order summary text for sharing
   */
  static generateOrderSummaryText(order: Order): string {
    const itemsList = order.items
      .map(item => `${item.quantity}x ${item.name}`)
      .join(', ');

    return `Order #${order.trackingNumber} from TableTap\n` +
           `Items: ${itemsList}\n` +
           `Total: ${this.formatCurrency(order.summary.total)}\n` +
           `Status: ${this.getStatusLabel(order.status)}`;
  }

  /**
   * Check if two orders are equal (for comparison)
   */
  static areOrdersEqual(order1: Order | null, order2: Order | null): boolean {
    if (!order1 && !order2) return true;
    if (!order1 || !order2) return false;

    return order1.id === order2.id &&
           order1.status === order2.status &&
           order1.summary.total === order2.summary.total;
  }

  /**
   * Sanitize order data for logging (remove sensitive information)
   */
  static sanitizeOrderForLogging(order: Order): Partial<Order> {
    return {
      id: order.id,
      trackingNumber: order.trackingNumber,
      status: order.status,
      restaurantId: order.restaurantId,
      summary: order.summary,
      timestamps: order.timestamps,
      items: order.items.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))
    }
  }

  /**
   * Get the next valid workflow step
   */
  static getNextWorkflowStep(currentStep: OrderWorkflowStep): OrderWorkflowStep | null {
    const stepOrder = [
      OrderWorkflowStep.CART_REVIEW,
      OrderWorkflowStep.CUSTOMER_INFO,
      OrderWorkflowStep.PAYMENT_METHOD,
      OrderWorkflowStep.ORDER_REVIEW,
      OrderWorkflowStep.PAYMENT_PROCESSING,
      OrderWorkflowStep.CONFIRMATION,
      OrderWorkflowStep.TRACKING
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
      return null;
    }

    return stepOrder[currentIndex + 1]
  }

  /**
   * Get the previous valid workflow step
   */
  static getPreviousWorkflowStep(currentStep: OrderWorkflowStep): OrderWorkflowStep | null {
    const stepOrder = [
      OrderWorkflowStep.CART_REVIEW,
      OrderWorkflowStep.CUSTOMER_INFO,
      OrderWorkflowStep.PAYMENT_METHOD,
      OrderWorkflowStep.ORDER_REVIEW,
      OrderWorkflowStep.PAYMENT_PROCESSING,
      OrderWorkflowStep.CONFIRMATION,
      OrderWorkflowStep.TRACKING
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex <= 0) {
      return null;
    }

    return stepOrder[currentIndex - 1]
  }
}