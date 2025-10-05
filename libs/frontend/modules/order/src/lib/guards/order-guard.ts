import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { map, of } from 'rxjs';

import { OrderService } from '../services/order.service';

/**
 * Guard to ensure user has required order data before accessing order routes
 */
export const OrderGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  // Check if user has a current order or order summary
  const hasOrderData = orderService.currentOrder() || orderService.orderSummary()

  if (!hasOrderData) {
    // Redirect to cart if no order data
    router.navigate(['/cart'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
}

/**
 * Guard to ensure order is complete before accessing certain routes
 */
export const OrderCompletionGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const customerInfo = orderService.customerInfo()
  const paymentMethod = orderService.selectedPaymentMethod()
  const orderSummary = orderService.orderSummary()

  // For checkout route, all data should be present
  if (state.url.includes('/order/checkout')) {
    if (!orderSummary) {
      router.navigate(['/cart']);
      return false;
    }
    return true;
  }

  // For confirmation route, require customer info and payment method
  if (state.url.includes('/order/confirmation')) {
    if (!customerInfo || !paymentMethod || !orderSummary) {
      router.navigate(['/order/checkout']);
      return false;
    }
    return true;
  }

  return true;
}

/**
 * Guard to check if user can access order tracking
 */
export const OrderTrackingGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const orderId = route.paramMap.get('id');

  if (!orderId) {
    router.navigate(['/orders']);
    return false;
  }

  // Try to load the order if it's not already loaded
  const currentOrder = orderService.currentOrder()
  if (!currentOrder || currentOrder.id !== orderId) {
    // The component will handle loading the order
    return true;
  }

  return true;
}

/**
 * Guard to check if user can access payment routes
 */
export const PaymentGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const orderSummary = orderService.orderSummary()
  const customerInfo = orderService.customerInfo()

  if (!orderSummary || !customerInfo) {
    router.navigate(['/order/checkout'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
}

/**
 * Guard to check if user can modify an order
 */
export const OrderModificationGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const currentOrder = orderService.currentOrder()

  if (!currentOrder) {
    router.navigate(['/orders']);
    return false;
  }

  // Check if order can be modified based on status
  const modifiableStatuses = ['CONFIRMED', 'PENDING_PAYMENT'];
  if (!modifiableStatuses.includes(currentOrder.status)) {
    // Redirect to tracking if order can't be modified
    router.navigate(['/order/tracking', currentOrder.id]);
    return false;
  }

  return true;
}

/**
 * Guard to check if user has proper authentication for order operations
 */
export const OrderAuthGuard: CanActivateFn = (route, state) => {
  // In a real application, this would check authentication status
  // For now, we'll allow all access
  return true;

  // Example implementation:
  // const authService = inject(AuthService);
  // const router = inject(Router);
  //
  // return authService.isAuthenticated().pipe(
  //   map(isAuthenticated => {
  //     if (!isAuthenticated) {
  //       router.navigate(['/login'], {
  //         queryParams: { returnUrl: state.url }
  //       });
  //       return false;
  //     }
  //     return true;
  //   })
  // );
}

/**
 * Guard to prevent access to order routes when cart is empty
 */
export const CartNotEmptyGuard: CanActivateFn = (route, state) => {
  // This would integrate with the cart service to check if cart has items
  // For now, we'll check if order summary exists
  const orderService = inject(OrderService);
  const router = inject(Router);

  const orderSummary = orderService.orderSummary()

  if (!orderSummary || !orderSummary.items || orderSummary.items.length === 0) {
    router.navigate(['/menu'], {
      queryParams: { message: 'Please add items to your cart before proceeding' }
    });
    return false;
  }

  return true;
}

/**
 * Guard to check if payment processing is complete
 */
export const PaymentCompletionGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const currentOrder = orderService.currentOrder()
  const orderStatus = orderService.orderStatus()

  // Only allow access to tracking if payment is complete or order is confirmed
  const allowedStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
  if (!currentOrder || !allowedStatuses.includes(orderStatus)) {
    // If payment is still processing, redirect to confirmation
    if (orderStatus === 'PAYMENT_PROCESSING') {
      router.navigate(['/order/confirmation']);
      return false;
    }

    // If no order or invalid status, redirect to orders list
    router.navigate(['/orders']);
    return false;
  }

  return true;
}

/**
 * Guard to prevent duplicate order submissions
 */
export const DuplicateOrderGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const currentOrder = orderService.currentOrder()
  const orderStatus = orderService.orderStatus()

  // If order is already submitted and being processed, redirect to tracking
  if (currentOrder && ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].includes(orderStatus)) {
    router.navigate(['/order/tracking', currentOrder.id]);
    return false;
  }

  return true;
}

/**
 * Guard to validate order business hours
 */
export const BusinessHoursGuard: CanActivateFn = (route, state) => {
  // Check if restaurant is open for orders
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Example business hours: Mon-Sun 8 AM - 10 PM
  const isOpen = hour >= 8 && hour < 22;

  if (!isOpen) {
    const router = inject(Router);
    router.navigate(['/menu'], {
      queryParams: {
        message: 'We are currently closed. Please check our business hours and try again.',
      }
    });
    return false;
  }

  return true;
}

/**
 * Guard to check order value limits
 */
export const OrderLimitsGuard: CanActivateFn = (route, state) => {
  const orderService = inject(OrderService);
  const router = inject(Router);

  const orderSummary = orderService.orderSummary()

  if (!orderSummary) {
    return true; // Let other guards handle missing order summary
  }

  // Check minimum order value
  const minimumOrder = 10.00;
  if (orderSummary.total < minimumOrder) {
    router.navigate(['/cart'], {
      queryParams: {
        message: `Minimum order value is $${minimumOrder.toFixed(2)}. Please add more items.`,
      }
    });
    return false;
  }

  // Check maximum order value (if applicable)
  const maximumOrder = 500.00;
  if (orderSummary.total > maximumOrder) {
    router.navigate(['/cart'], {
      queryParams: {
        message: `Maximum order value is $${maximumOrder.toFixed(2)}. Please reduce your order or contact us for large orders.`,
      }
    });
    return false;
  }

  return true;
}