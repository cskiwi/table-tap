import { Component, OnInit, OnDestroy, input, output, inject, signal, computed } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';

import { PaymentMethod, PaymentType, PaymentError } from '../../models/order.types';

interface PaymentFormData {
  cardNumber: string,
  expiryMonth: string,
  expiryYear: string,
  cvv: string,
  nameOnCard: string,
  billingZip: string,
  saveCard: boolean
}

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './payment-method-selector.component.html',
})
export class PaymentMethodSelectorComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly paymentMethods = input<PaymentMethod[]>([]);
  readonly selectedMethod = input<PaymentMethod | null>(null);
  readonly orderTotal = input<number>(0);
  readonly disabled = input<boolean>(false);

  // Outputs
  readonly methodSelected = output<PaymentMethod>();
  readonly methodAdded = output<PaymentMethod>();
  readonly errorOutput = output<PaymentError>();

  private readonly destroy$ = new Subject<void>();

  // Component state signals
  private readonly _showNewPaymentForm = signal<boolean>(false);
  private readonly _selectedPaymentType = signal<PaymentType | null>(null);
  private readonly _isProcessing = signal<boolean>(false);
  private readonly _error = signal<PaymentError | null>(null);
  private readonly _detectedCardType = signal<string | null>(null);

  // Public readonly signals
  readonly showNewPaymentForm = this._showNewPaymentForm.asReadonly();
  readonly selectedPaymentType = this._selectedPaymentType.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly errorState = this._error.asReadonly();
  readonly detectedCardType = this._detectedCardType.asReadonly();

  // Form
  cardForm!: FormGroup;
  // Computed properties
  readonly availablePaymentTypes = computed(() => [
    { value: PaymentType.CREDIT_CARD, label: 'Credit Card', popular: true, disabled: false },
    { value: PaymentType.DEBIT_CARD, label: 'Debit Card', popular: true, disabled: false },
    { value: PaymentType.DIGITAL_WALLET, label: 'Digital Wallet', popular: true, disabled: false },
    { value: PaymentType.CASH, label: 'Cash', popular: false, disabled: false },
    { value: PaymentType.APPLE_PAY, label: 'Apple Pay', popular: false, disabled: !this.isApplePayAvailable() },
    { value: PaymentType.GOOGLE_PAY, label: 'Google Pay', popular: false, disabled: !this.isGooglePayAvailable() },
    { value: PaymentType.PAYPAL, label: 'PayPal', popular: false, disabled: false },
    { value: PaymentType.VENMO, label: 'Venmo', popular: false, disabled: false }
  ]);

  readonly digitalWalletOptions = computed(() => [
    { type: PaymentType.APPLE_PAY, name: 'Apple Pay', available: this.isApplePayAvailable() },
    { type: PaymentType.GOOGLE_PAY, name: 'Google Pay', available: this.isGooglePayAvailable() },
    { type: PaymentType.PAYPAL, name: 'PayPal', available: true },
    { type: PaymentType.VENMO, name: 'Venmo', available: true }
  ]);

  readonly months = computed(() => [
    { value: '01', label: '01 - January' },
    { value: '02', label: '02 - February' },
    { value: '03', label: '03 - March' },
    { value: '04', label: '04 - April' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - June' },
    { value: '07', label: '07 - July' },
    { value: '08', label: '08 - August' },
    { value: '09', label: '09 - September' },
    { value: '10', label: '10 - October' },
    { value: '11', label: '11 - November' },
    { value: '12', label: '12 - December' }
  ]);

  readonly years = computed(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = 0; i < 20; i++) {
      years.push(currentYear + i);
    }
    return years;
  });

  ngOnInit(): void {
    this.initializeCardForm();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCardForm(): void {
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, this.cardNumberValidator]],
      expiryMonth: ['', Validators.required],
      expiryYear: ['', Validators.required],
      cvv: ['', [Validators.required, Validators.minLength(3)]],
      nameOnCard: ['', [Validators.required, Validators.minLength(2)]],
      billingZip: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      saveCard: [false]
    });
  }

  private setupFormValidation(): void {
    // Detect card type as user types
    this.cardForm.get('cardNumber')?.valueChanges.pipe(
      debounceTime(200),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      const cardType = this.detectCardType(value);
      this._detectedCardType.set(cardType);
    });
  }

  selectMethod(method: PaymentMethod): void {
    if (!method.isValid || this.disabled()) {
      return;
    }
    this.methodSelected.emit(method);
    this._error.set(null);
  }

  showPaymentForm(type: PaymentType): void {
    this._selectedPaymentType.set(type);
    this._showNewPaymentForm.set(true);
    this._error.set(null);

    // Reset form if switching to card payment
    if (type === PaymentType.CREDIT_CARD || type === PaymentType.DEBIT_CARD) {
      this.cardForm.reset();
      this.cardForm.patchValue({ saveCard: false });
    }
  }

  hideNewPaymentForm(): void {
    this._showNewPaymentForm.set(false);
    this._selectedPaymentType.set(null);
    this._error.set(null);
    this.cardForm?.reset();
  }

  selectCashPayment(): void {
    const cashPayment: PaymentMethod = {
      id: 'cash-payment',
      type: PaymentType.CASH,
      name: 'Cash Payment',
      isDefault: false,
      isValid: true
    };

    this.methodSelected.emit(cashPayment);
    this.hideNewPaymentForm();
  }

  selectDigitalWallet(walletType: PaymentType): void {
    this._isProcessing.set(true);

    // Simulate digital wallet authorization flow
    setTimeout(() => {
      const walletPayment: PaymentMethod = {
        id: `${walletType.toLowerCase()}-${Date.now()}`,
        type: walletType,
        name: this.getWalletName(walletType),
        isDefault: false,
        isValid: true
      }

      this._isProcessing.set(false);
      this.methodSelected.emit(walletPayment);
      this.hideNewPaymentForm();
    }, 2000);
  }

  addPaymentMethod(): void {
    if (!this.cardForm.valid) {
      this.cardForm.markAllAsTouched();
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);

    const formData: PaymentFormData = this.cardForm.value;

    // Simulate payment method validation
    setTimeout(() => {
      try {
        const newPaymentMethod: PaymentMethod = {
          id: `card-${Date.now()}`,
          type: this._selectedPaymentType() || PaymentType.CREDIT_CARD,
          name: this.getCardBrandName(formData.cardNumber),
          last4: formData.cardNumber.slice(-4),
          expiryMonth: parseInt(formData.expiryMonth),
          expiryYear: parseInt(formData.expiryYear),
          isDefault: this.paymentMethods().length === 0,
          isValid: true
        }

        this._isProcessing.set(false);
        this.methodAdded.emit(newPaymentMethod);
        this.methodSelected.emit(newPaymentMethod);
        this.hideNewPaymentForm();
      } catch (error) {
        this._isProcessing.set(false);
        const paymentError: PaymentError = {
          code: 'CARD_VALIDATION_FAILED',
          message: 'Unable to validate payment method. Please check your information.',
          retryable: true
        };
        this._error.set(paymentError);
        this.errorOutput.emit(paymentError);
      }
    }, 2000);
  }

  formatCardNumber(event: any): void {
    const value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    event.target.value = formattedValue;
    this.cardForm.get('cardNumber')?.setValue(formattedValue);
  }

  formatCvv(event: any): void {
    const value = event.target.value.replace(/[^0-9]/gi, '');
    event.target.value = value;
    this.cardForm.get('cvv')?.setValue(value);
  }

  retryLastAction(): void {
    this._error.set(null);
    if (this.selectedPaymentType()) {
      this.addPaymentMethod();
    }
  }

  private cardNumberValidator(control: any) {
    const value = control.value?.replace(/\s/g, '');
    if (!value) return null;

    // Basic Luhn algorithm check
    let sum = 0;
    let shouldDouble = false;

    for (let i = value.length - 1; i >= 0; i--) {
      let digit = parseInt(value.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0 ? null : { invalidCard: true };
  }

  private detectCardType(cardNumber: string): string | null {
    const number = cardNumber.replace(/\s/g, '');

    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6/.test(number)) return 'Discover';

    return null;
  }

  private getCardBrandName(cardNumber: string): string {
    const type = this.detectCardType(cardNumber);
    return type || 'Credit Card';
  }

  private getWalletName(type: PaymentType): string {
    const names: Record<string, string> = {
      [PaymentType.APPLE_PAY]: 'Apple Pay',
      [PaymentType.GOOGLE_PAY]: 'Google Pay',
      [PaymentType.PAYPAL]: 'PayPal',
      [PaymentType.VENMO]: 'Venmo',
      [PaymentType.CREDIT_CARD]: 'Credit Card',
      [PaymentType.DEBIT_CARD]: 'Debit Card',
      [PaymentType.CASH]: 'Cash'
    }
    return names[type] || 'Digital Wallet';
  }

  private isApplePayAvailable(): boolean {
    // Check if Apple Pay is available on this device
    return !!(window as any).ApplePaySession && (window as any).ApplePaySession.canMakePayments();
  }

  private isGooglePayAvailable(): boolean {
    // Check if Google Pay is available on this device
    return !!(window as any).google && !!(window as any).google.payments;
  }

  getPaymentIcon(type: PaymentType | string): string {
    const iconMap: Record<string, string> = {
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
}