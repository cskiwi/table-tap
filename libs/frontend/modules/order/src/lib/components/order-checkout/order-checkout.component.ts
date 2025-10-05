import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { OrderService } from '../../services/order.service';
import { CustomerInfo, PaymentMethod } from '../../models/order.types';

@Component({
  selector: 'app-order-checkout',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './order-checkout.component.html'
})
export class OrderCheckoutComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly orderService = inject(OrderService);

  private readonly destroy$ = new Subject<void>()

  // Form for customer information
  customerForm!: FormGroup
  // Signals for component state
  private readonly _paymentMethods = signal<PaymentMethod[]>([]);
  private readonly _selectedPaymentMethod = signal<PaymentMethod | null>(null);

  // Public readonly signals
  readonly paymentMethods = this._paymentMethods.asReadonly()
  readonly selectedPaymentMethod = this._selectedPaymentMethod.asReadonly()
  readonly orderSummary = this.orderService.orderSummary;

  // Computed properties
  readonly canProceed = computed(() => {
    const formValid = this.customerForm?.valid;
    const paymentSelected = !!this._selectedPaymentMethod()
    const hasOrderSummary = !!this.orderService.orderSummary()

    return formValid && paymentSelected && hasOrderSummary && !this.orderService.isLoading()
  });

  constructor() {
    this.initializeForm()
    this.setupFormEffects()
  }

  ngOnInit(): void {
    this.loadPaymentMethods()
    this.loadExistingCustomerInfo()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeForm(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      tableNumber: [null],
      specialRequests: ['']
    });
  }

  private setupFormEffects(): void {
    // Auto-save customer info as user types
    this.customerForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.customerForm.valid) {
        this.updateCustomerInfo()
      }
    });
  }

  private loadPaymentMethods(): void {
    // In a real app, get customer ID from authentication service
    const customerId = 'current-customer-id';

    this.orderService.getPaymentMethods(customerId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (methods) => {
        this._paymentMethods.set(methods);

        // Auto-select default payment method
        const defaultMethod = methods.find(m => m.isDefault);
        if (defaultMethod) {
          this.selectPaymentMethod(defaultMethod);
        }
      },
      error: (error) => {
        console.error('Failed to load payment methods:', error);
      }
    });
  }

  private loadExistingCustomerInfo(): void {
    const existingInfo = this.orderService.customerInfo()
    if (existingInfo) {
      this.customerForm.patchValue(existingInfo);
    }
  }

  private updateCustomerInfo(): void {
    if (this.customerForm.valid) {
      const customerInfo: CustomerInfo = this.customerForm.value;
      this.orderService.setCustomerInfo(customerInfo);
    }
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this._selectedPaymentMethod.set(method);
    this.orderService.setPaymentMethod(method);
  }

  addPaymentMethod(): void {
    // Navigate to add payment method component
    this.router.navigate(['/payment/add'], {
      queryParams: { returnUrl: '/order/checkout' }
    });
  }

  proceedToConfirmation(): void {
    if (!this.canProceed()) {
      return;
    }

    // Mark form as touched to show validation errors
    this.customerForm.markAllAsTouched()

    if (this.customerForm.valid) {
      this.updateCustomerInfo()

      // Validate order before proceeding
      this.orderService.validateOrder().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.router.navigate(['/order/confirmation']);
        },
        error: (error) => {
          console.error('Order validation failed:', error);
          // Error is handled by the service and displayed in the template
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/cart']);
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
      'DIGITAL_WALLET': 'icon-wallet'
    };
    return iconMap[type] || 'icon-payment';
  }
}