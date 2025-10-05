import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, Observable, throwError, timer, of } from 'rxjs';
import {
  map,
  catchError,
  retry,
  retryWhen,
  delay,
  mergeMap,
  tap,
  shareReplay,
  distinctUntilChanged,
} from 'rxjs/operators';

import {
  Order,
  OrderStatus,
  CustomerInfo,
  PaymentMethod,
  OrderSubmissionResponse,
  OrderStatusUpdate,
  PaymentProcessingResult,
  PaymentStatus,
  OrderError,
  OrderSummary,
} from '../models/order.types';

import {
  CREATE_ORDER,
  UPDATE_ORDER_STATUS,
  PROCESS_PAYMENT,
  GET_ORDER_BY_ID,
  GET_ORDER_STATUS,
  ORDER_STATUS_SUBSCRIPTION,
  VALIDATE_ORDER,
  GET_PAYMENT_METHODS,
  CANCEL_ORDER,
} from '../graphql/order.operations';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apollo = inject(Apollo);

  // Signals for reactive state management
  private readonly _currentOrder = signal<Order | null>(null);
  private readonly _orderStatus = signal<OrderStatus>(OrderStatus.DRAFT);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<OrderError | null>(null);
  private readonly _customerInfo = signal<CustomerInfo | null>(null);
  private readonly _selectedPaymentMethod = signal<PaymentMethod | null>(null);
  private readonly _orderSummary = signal<OrderSummary | null>(null);

  // Public readonly signals
  readonly currentOrder = this._currentOrder.asReadonly();
  readonly orderStatus = this._orderStatus.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly customerInfo = this._customerInfo.asReadonly();
  readonly selectedPaymentMethod = this._selectedPaymentMethod.asReadonly();
  readonly orderSummary = this._orderSummary.asReadonly();

  // Computed signals
  readonly canSubmitOrder = computed(() => {
    const customerInfo = this._customerInfo()
    const paymentMethod = this._selectedPaymentMethod()
    const summary = this._orderSummary()

    return !!(customerInfo && paymentMethod && summary && !this._isLoading());
  });

  readonly orderProgress = computed(() => {
    const status = this._orderStatus()
    const progressMap = {
      [OrderStatus.DRAFT]: 0,
      [OrderStatus.PENDING_PAYMENT]: 20,
      [OrderStatus.PAYMENT_PROCESSING]: 40,
      [OrderStatus.CONFIRMED]: 60,
      [OrderStatus.PREPARING]: 80,
      [OrderStatus.READY]: 90,
      [OrderStatus.DELIVERED]: 100,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.FAILED]: 0
    };
    return progressMap[status] || 0;
  });

  private statusUpdateSubscription: any;
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor() {
    // Effect to handle order status changes
    effect(() => {
      const order = this._currentOrder()
      if (order) {
        this.subscribeToOrderUpdates(order.id);
      }
    });
  }

  /**
   * Set customer information for the order
   */
  setCustomerInfo(customerInfo: CustomerInfo): void {
    this._customerInfo.set(customerInfo);
    this._error.set(null);
  }

  /**
   * Set the selected payment method
   */
  setPaymentMethod(paymentMethod: PaymentMethod): void {
    this._selectedPaymentMethod.set(paymentMethod);
    this._error.set(null);
  }

  /**
   * Set the order summary
   */
  setOrderSummary(summary: OrderSummary): void {
    this._orderSummary.set(summary);
  }

  /**
   * Validate the current order before submission
   */
  validateOrder(): Observable<boolean> {
    const customerInfo = this._customerInfo()
    const paymentMethod = this._selectedPaymentMethod()
    const summary = this._orderSummary()

    if (!customerInfo || !paymentMethod || !summary) {
      return throwError(() => new Error('Missing required order information'));
    }

    this._isLoading.set(true);
    this._error.set(null);

    return this.apollo.mutate({
      mutation: VALIDATE_ORDER,
      variables: {
        input: {
          customerInfo,
          paymentMethodId: paymentMethod.id,
          items: summary.items
        }
      }
    }).pipe(
      map((result: any) => {
        if (result.data?.validateOrder?.valid) {
          // Update pricing if changed
          const updatedPricing = result.data.validateOrder.updatedPricing;
          if (updatedPricing) {
            this._orderSummary.update(current =>
              current ? { ...current, ...updatedPricing } : null
            );
          }
          return true;
        } else {
          const errors = result.data?.validateOrder?.errors || [];
          throw new Error(errors[0]?.message || 'Order validation failed');
        }
      }),
      catchError(error => {
        this._error.set({
          code: 'VALIDATION_ERROR',
          message: error.message,
          retryable: true
        });
        return throwError(() => error);
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Submit the order for processing
   */
  submitOrder(): Observable<OrderSubmissionResponse> {
    const customerInfo = this._customerInfo()
    const paymentMethod = this._selectedPaymentMethod()
    const summary = this._orderSummary()

    if (!customerInfo || !paymentMethod || !summary) {
      return throwError(() => new Error('Missing required order information'));
    }

    this._isLoading.set(true);
    this._error.set(null);
    this._orderStatus.set(OrderStatus.PENDING_PAYMENT);

    return this.apollo.mutate({
      mutation: CREATE_ORDER,
      variables: {
        input: {
          customerInfo,
          paymentMethodId: paymentMethod.id,
          items: summary.items,
          summary
        }
      }
    }).pipe(
      map((result: any) => {
        const response = result.data?.createOrder;
        if (response?.id) {
          this._currentOrder.set({
            id: response.id,
            trackingNumber: response.trackingNumber,
            status: response.status,
            customerInfo,
            items: summary.items,
            summary,
            paymentMethod,
            timestamps: {
              created: new Date()
            }
          } as Order);
          this._orderStatus.set(response.status);

          return {
            success: true,
            orderId: response.id,
            trackingNumber: response.trackingNumber,
            estimatedTime: response.estimatedTime
          };
        } else {
          throw new Error(response?.error?.message || 'Order submission failed');
        }
      }),
      retryWhen(errors => this.createRetryStrategy(errors)),
      catchError(error => {
        this._error.set({
          code: 'SUBMISSION_ERROR',
          message: error.message,
          retryable: this.retryCount < this.maxRetries
        });
        this._orderStatus.set(OrderStatus.FAILED);
        return of({
          success: false,
          error: {
            code: 'SUBMISSION_ERROR',
            message: error.message,
            retryable: this.retryCount < this.maxRetries
          }
        });
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Process payment for the order
   */
  processPayment(orderId: string): Observable<PaymentProcessingResult> {
    const paymentMethod = this._selectedPaymentMethod()

    if (!paymentMethod) {
      return throwError(() => new Error('No payment method selected'));
    }

    this._isLoading.set(true);
    this._orderStatus.set(OrderStatus.PAYMENT_PROCESSING);

    return this.apollo.mutate({
      mutation: PROCESS_PAYMENT,
      variables: {
        input: {
          orderId,
          paymentMethodId: paymentMethod.id
        }
      }
    }).pipe(
      map((result: any) => {
        const response = result.data?.processPayment;
        if (response?.success) {
          this._orderStatus.set(OrderStatus.CONFIRMED);
          return {
            success: true,
            transactionId: response.transactionId,
            status: PaymentStatus.COMPLETED
          };
        } else {
          throw new Error(response?.error?.message || 'Payment processing failed');
        }
      }),
      retryWhen(errors => this.createRetryStrategy(errors)),
      catchError(error => {
        this._error.set({
          code: 'PAYMENT_ERROR',
          message: error.message,
          retryable: this.retryCount < this.maxRetries
        });
        this._orderStatus.set(OrderStatus.FAILED);
        return of({
          success: false,
          status: PaymentStatus.FAILED,
          error: {
            code: 'PAYMENT_ERROR',
            message: error.message,
            retryable: this.retryCount < this.maxRetries
          }
        });
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Observable<Order> {
    this._isLoading.set(true);

    return this.apollo.query({
      query: GET_ORDER_BY_ID,
      variables: { id: orderId },
      fetchPolicy: 'cache-first',
    }).pipe(
      map((result: any) => {
        const order = result.data?.order;
        if (order) {
          this._currentOrder.set(order);
          this._orderStatus.set(order.status);
          return order;
        }
        throw new Error('Order not found');
      }),
      catchError(error => {
        this._error.set({
          code: 'FETCH_ERROR',
          message: error.message,
          retryable: true,
        });
        return throwError(() => error);
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Subscribe to real-time order status updates
   */
  private subscribeToOrderUpdates(orderId: string): void {
    if (this.statusUpdateSubscription) {
      this.statusUpdateSubscription.unsubscribe();
    }

    this.statusUpdateSubscription = this.apollo.subscribe({
      query: ORDER_STATUS_SUBSCRIPTION,
      variables: { orderId }
    }).pipe(
      distinctUntilChanged((a: any, b: any) => a.data?.orderStatusUpdate?.status === b.data?.orderStatusUpdate?.status)
    ).subscribe({
      next: (result: any) => {
        const update = result.data?.orderStatusUpdate;
        if (update) {
          this._orderStatus.set(update.status);
          this._currentOrder.update(current =>
            current ? {
              ...current,
              status: update.status,
              timestamps: {
                ...current.timestamps,
                [this.getTimestampKey(update.status)]: new Date(update.timestamp)
              }
            } : current
          );
        }
      },
      error: (error) => {
        console.error('Order status subscription error:', error);
        // Attempt to reconnect after delay
        setTimeout(() => this.subscribeToOrderUpdates(orderId), 5000);
      }
    });
  }

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string, reason?: string): Observable<boolean> {
    this._isLoading.set(true);

    return this.apollo.mutate({
      mutation: CANCEL_ORDER,
      variables: { orderId, reason }
    }).pipe(
      map((result: any) => {
        const response = result.data?.cancelOrder;
        if (response?.status === OrderStatus.CANCELLED) {
          this._orderStatus.set(OrderStatus.CANCELLED);
          return true;
        }
        return false;
      }),
      catchError(error => {
        this._error.set({
          code: 'CANCELLATION_ERROR',
          message: error.message,
          retryable: false,
        });
        return of(false);
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Get available payment methods for customer
   */
  getPaymentMethods(customerId: string): Observable<PaymentMethod[]> {
    return this.apollo.query({
      query: GET_PAYMENT_METHODS,
      variables: { customerId },
      fetchPolicy: 'cache-first',
    }).pipe(
      map((result: any) => result.data?.paymentMethods || []),
      shareReplay(1)
    );
  }

  /**
   * Clear the current order state
   */
  clearOrder(): void {
    this._currentOrder.set(null);
    this._orderStatus.set(OrderStatus.DRAFT);
    this._customerInfo.set(null);
    this._selectedPaymentMethod.set(null);
    this._orderSummary.set(null);
    this._error.set(null);
    this.retryCount = 0;

    if (this.statusUpdateSubscription) {
      this.statusUpdateSubscription.unsubscribe();
      this.statusUpdateSubscription = null;
    }
  }

  /**
   * Retry the last failed operation
   */
  retryLastOperation(): Observable<any> {
    const error = this._error()
    if (!error?.retryable) {
      return throwError(() => new Error('Operation is not retryable'));
    }

    const currentOrder = this._currentOrder();
    if (currentOrder) {
      return this.submitOrder();
    }

    return throwError(() => new Error('No operation to retry'));
  }

  /**
   * Create retry strategy for failed operations
   */
  private createRetryStrategy(errors: Observable<any>): Observable<any> {
    return errors.pipe(
      mergeMap((error, index) => {
        this.retryCount = index + 1;

        if (this.retryCount <= this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, index), 10000); // Exponential backoff
          console.log(`Retrying operation in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
          return timer(delay);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Get timestamp key for order status
   */
  private getTimestampKey(status: OrderStatus): keyof Order['timestamps'] {
    const keyMap: Partial<Record<OrderStatus, keyof Order['timestamps']>> = {
      [OrderStatus.CONFIRMED]: 'confirmed',
      [OrderStatus.PREPARING]: 'preparationStarted',
      [OrderStatus.READY]: 'ready',
      [OrderStatus.DELIVERED]: 'delivered',
      [OrderStatus.CANCELLED]: 'cancelled'
    };

    return keyMap[status] || 'created';
  }
}