import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';

import { Router } from '@angular/router';
import { Subject, takeUntil, timer, switchMap } from 'rxjs';

import { OrderService } from '../../services/order.service';

import {
  Order,
  OrderStatus,
  PaymentMethod,
  OrderWorkflowStep,
  OrderValidation,
  PriceChange,
} from '../../models/order.types';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [],
  templateUrl: './order-confirmation.component.html',
  })
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly orderService = inject(OrderService);

  // Make enum accessible to template
  readonly OrderWorkflowStep = OrderWorkflowStep;

  private readonly destroy$ = new Subject<void>()

  // Component state signals
  private readonly _currentStep = signal<OrderWorkflowStep>(OrderWorkflowStep.ORDER_REVIEW);
  private readonly _priceChanges = signal<PriceChange[]>([]);
  private readonly _validationErrors = signal<any[]>([]);
  private readonly _isValidating = signal<boolean>(false);

  // Public readonly signals
  readonly currentStep = this._currentStep.asReadonly()
  readonly priceChanges = this._priceChanges.asReadonly()
  readonly validationErrors = this._validationErrors.asReadonly()
  readonly isValidating = this._isValidating.asReadonly()

  // From OrderService
  readonly customerInfo = this.orderService.customerInfo;
  readonly selectedPaymentMethod = this.orderService.selectedPaymentMethod;
  readonly orderSummary = this.orderService.orderSummary;

  // Computed properties
  readonly canPlaceOrder = computed(() => {
    const hasCustomerInfo = !!this.customerInfo()
    const hasPaymentMethod = !!this.selectedPaymentMethod()
    const hasOrderSummary = !!this.orderSummary()
    const noValidationErrors = this.validationErrors().length === 0;

    return hasCustomerInfo && hasPaymentMethod && hasOrderSummary &&
           noValidationErrors && !this.orderService.isLoading() && !this.isValidating()
  });

  constructor() {
    // Auto-validate order when component loads
    effect(() => {
      const summary = this.orderSummary()
      const customerInfo = this.customerInfo()
      const paymentMethod = this.selectedPaymentMethod()

      if (summary && customerInfo && paymentMethod) {
        this.validateOrderOnLoad()
      }
    });
  }

  ngOnInit(): void {
    // Redirect if missing required data
    if (!this.orderSummary() || !this.customerInfo() || !this.selectedPaymentMethod()) {
      this.router.navigate(['/order/checkout']);
      return;
    }

    // Start periodic validation (every 30 seconds)
    this.startPeriodicValidation()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private validateOrderOnLoad(): void {
    this._isValidating.set(true);

    this.orderService.validateOrder().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (isValid) => {
        this._isValidating.set(false);
        if (isValid) {
          this._validationErrors.set([]);
        }
      },
      error: (error) => {
        this._isValidating.set(false);
        console.error('Order validation failed:', error);
      }
    });
  }

  private startPeriodicValidation(): void {
    timer(30000, 30000).pipe(
      switchMap(() => this.orderService.validateOrder()),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Validation successful, prices are current
      },
      error: (error) => {
        console.warn('Periodic validation failed:', error);
      }
    });
  }

  getTotalItemCount(): number {
    return this.orderSummary()?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  getItemName(itemId: string): string {
    const item = this.orderSummary()?.items.find(i => i.id === itemId);
    return item?.name || 'Unknown Item';
  }

  isStepCompleted(step: OrderWorkflowStep): boolean {
    const completedSteps = [OrderWorkflowStep.CUSTOMER_INFO, OrderWorkflowStep.PAYMENT_METHOD];
    return completedSteps.includes(step);
  }

  editCustomerInfo(): void {
    this.router.navigate(['/order/checkout'], {
      queryParams: { section: 'customer-info' }
    });
  }

  editItems(): void {
    this.router.navigate(['/cart']);
  }

  editPaymentMethod(): void {
    this.router.navigate(['/order/checkout'], {
      queryParams: { section: 'payment-method' }
    });
  }

  placeOrder(): void {
    if (!this.canPlaceOrder()) {
      return;
    }

    this._currentStep.set(OrderWorkflowStep.PAYMENT_PROCESSING);

    // Submit order first
    this.orderService.submitOrder().pipe(
      switchMap((response) => {
        if (response.success && response.orderId) {
          // Then process payment if needed
          const paymentMethod = this.selectedPaymentMethod()
          if (paymentMethod?.type !== 'CASH') {
            return this.orderService.processPayment(response.orderId);
          } else {
            // Cash orders skip payment processing
            return Promise.resolve({ success: true, status: 'COMPLETED' as any });
          }
        } else {
          throw new Error(response.error?.message || 'Order submission failed');
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (paymentResult) => {
        if (paymentResult.success) {
          // Navigate to success page
          const orderId = this.orderService.currentOrder()?.id;
          this.router.navigate(['/order/tracking', orderId]);
        }
      },
      error: (error) => {
        console.error('Order placement failed:', error);
        this._currentStep.set(OrderWorkflowStep.ORDER_REVIEW);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/order/checkout']);
  }

  retryOperation(): void {
    this.orderService.retryLastOperation().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Success handled by service
      },
      error: (error) => {
        console.error('Retry failed:', error);
      }
    });
  }

  getPaymentIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'CREDIT_CARD': 'icon-credit-card',
      'DEBIT_CARD': 'icon-debit-card',
      'CASH': 'icon-cash',
      'DIGITAL_WALLET': 'icon-wallet',
      'APPLE_PAY': 'icon-apple-pay',
      'GOOGLE_PAY': 'icon-google-pay',
      'PAYPAL': 'icon-paypal',
      'VENMO': 'icon-venmo',
      'GIFT_CARD': 'icon-gift-card',
      'STORE_CREDIT': 'icon-store-credit'
    };
    return iconMap[type] || 'icon-payment';
  }
}