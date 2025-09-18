import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessagesModule } from 'primeng/messages';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { QRCodeModule } from 'angularx-qrcode';
import { Order, PaymentMethod, PaymentStatus, SelectOption } from '../../../../shared/interfaces/common.interfaces';
import { BaseComponent } from '../../../../shared/components/base/base.component';

export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  tip?: number;
  cardDetails?: CardDetails;
  mobileDetails?: MobilePaymentDetails;
  qrCodeData?: string;
  notes?: string;
}

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  saveCard: boolean;
}

export interface MobilePaymentDetails {
  phoneNumber: string;
  provider: string;
}

export interface PaymentConfig {
  enabledMethods: PaymentMethod[];
  requireTip: boolean;
  suggestedTips: number[];
  allowCustomTip: boolean;
  showOrderSummary: boolean;
  qrCodeTimeout: number;
  supportedCardTypes: string[];
  mobileProviders: string[];
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    DropdownModule,
    RadioButtonModule,
    CheckboxModule,
    DividerModule,
    ProgressSpinnerModule,
    MessagesModule,
    CardModule,
    TabViewModule,
    QRCodeModule
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="!isProcessing"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '600px' }"
      header="Complete Payment"
      styleClass="payment-dialog"
      (onHide)="onDialogHide()">

      <div class="payment-content">

        <!-- Order Summary -->
        <div class="order-summary mb-6" *ngIf="paymentConfig.showOrderSummary && order">
          <h3 class="text-lg font-semibold mb-3">Order Summary</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span>Order #{{ order.orderNumber }}</span>
              <span class="font-medium">${{ order.totalAmount.toFixed(2) }}</span>
            </div>
            <div class="text-sm text-gray-600">
              {{ order.items.length }} item(s) • {{ getOrderTypeLabel(order.orderType) }}
            </div>
          </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="payment-methods mb-6">
          <h3 class="text-lg font-semibold mb-3">Payment Method</h3>

          <p-tabView [(activeIndex)]="activeTabIndex" (onChange)="onPaymentMethodChange($event)">

            <!-- Cash Payment -->
            <p-tabPanel
              *ngIf="isMethodEnabled('cash')"
              header="Cash"
              leftIcon="pi pi-money-bill">
              <div class="cash-payment py-4">
                <div class="text-center">
                  <i class="pi pi-money-bill text-4xl text-green-600 mb-4"></i>
                  <h4 class="text-lg font-semibold mb-2">Cash Payment</h4>
                  <p class="text-gray-600 mb-4">
                    Please pay ${{ getTotalWithTip().toFixed(2) }} at the counter
                  </p>
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p class="text-yellow-800 text-sm">
                      Your order will be confirmed after payment is received
                    </p>
                  </div>
                </div>
              </div>
            </p-tabPanel>

            <!-- Card Payment -->
            <p-tabPanel
              *ngIf="isMethodEnabled('card')"
              header="Card"
              leftIcon="pi pi-credit-card">
              <form [formGroup]="cardForm" class="card-payment py-4">
                <div class="grid grid-cols-1 gap-4">

                  <!-- Card Number -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <p-inputMask
                      formControlName="cardNumber"
                      mask="9999-9999-9999-9999"
                      placeholder="1234-5678-9012-3456"
                      styleClass="w-full"
                      [class.p-invalid]="isFieldInvalid('cardNumber')"
                      [attr.aria-label]="'Card number'">
                    </p-inputMask>
                    <small class="p-error" *ngIf="isFieldInvalid('cardNumber')">
                      Please enter a valid card number
                    </small>
                  </div>

                  <!-- Expiry Date and CVV -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <p-inputMask
                        formControlName="expiryDate"
                        mask="99/99"
                        placeholder="MM/YY"
                        styleClass="w-full"
                        [class.p-invalid]="isFieldInvalid('expiryDate')"
                        [attr.aria-label]="'Expiry date'">
                      </p-inputMask>
                      <small class="p-error" *ngIf="isFieldInvalid('expiryDate')">
                        Please enter expiry date
                      </small>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <p-inputMask
                        formControlName="cvv"
                        mask="999"
                        placeholder="123"
                        styleClass="w-full"
                        [class.p-invalid]="isFieldInvalid('cvv')"
                        [attr.aria-label]="'CVV code'">
                      </p-inputMask>
                      <small class="p-error" *ngIf="isFieldInvalid('cvv')">
                        Please enter CVV
                      </small>
                    </div>
                  </div>

                  <!-- Cardholder Name -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      pInputText
                      formControlName="cardholderName"
                      placeholder="John Doe"
                      class="w-full"
                      [class.p-invalid]="isFieldInvalid('cardholderName')"
                      [attr.aria-label]="'Cardholder name'">
                    <small class="p-error" *ngIf="isFieldInvalid('cardholderName')">
                      Please enter cardholder name
                    </small>
                  </div>

                  <!-- Save Card -->
                  <div class="flex items-center">
                    <p-checkbox
                      formControlName="saveCard"
                      binary="true"
                      inputId="saveCard"
                      [attr.aria-label]="'Save card for future payments'">
                    </p-checkbox>
                    <label for="saveCard" class="ml-2 text-sm">
                      Save card for future payments
                    </label>
                  </div>

                </div>
              </form>
            </p-tabPanel>

            <!-- Mobile Payment -->
            <p-tabPanel
              *ngIf="isMethodEnabled('mobile')"
              header="Mobile Pay"
              leftIcon="pi pi-mobile">
              <form [formGroup]="mobileForm" class="mobile-payment py-4">
                <div class="grid grid-cols-1 gap-4">

                  <!-- Mobile Provider -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Payment Provider *
                    </label>
                    <p-dropdown
                      formControlName="provider"
                      [options]="mobileProviderOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select provider"
                      styleClass="w-full"
                      [class.p-invalid]="isMobileFieldInvalid('provider')"
                      [attr.aria-label]="'Mobile payment provider'">
                    </p-dropdown>
                    <small class="p-error" *ngIf="isMobileFieldInvalid('provider')">
                      Please select a provider
                    </small>
                  </div>

                  <!-- Phone Number -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <p-inputMask
                      formControlName="phoneNumber"
                      mask="(999) 999-9999"
                      placeholder="(555) 123-4567"
                      styleClass="w-full"
                      [class.p-invalid]="isMobileFieldInvalid('phoneNumber')"
                      [attr.aria-label]="'Phone number'">
                    </p-inputMask>
                    <small class="p-error" *ngIf="isMobileFieldInvalid('phoneNumber')">
                      Please enter phone number
                    </small>
                  </div>

                </div>
              </form>
            </p-tabPanel>

            <!-- QR Code Payment -->
            <p-tabPanel
              *ngIf="isMethodEnabled('qr_code')"
              header="QR Code"
              leftIcon="pi pi-qrcode">
              <div class="qr-payment py-4">
                <div class="text-center">
                  <div *ngIf="!qrCodeGenerated" class="mb-4">
                    <i class="pi pi-qrcode text-4xl text-blue-600 mb-4"></i>
                    <h4 class="text-lg font-semibold mb-2">QR Code Payment</h4>
                    <p class="text-gray-600 mb-4">
                      Generate a QR code for mobile payment
                    </p>
                    <p-button
                      label="Generate QR Code"
                      icon="pi pi-qrcode"
                      (onClick)="generateQRCode()"
                      [loading]="isGeneratingQR">
                    </p-button>
                  </div>

                  <div *ngIf="qrCodeGenerated" class="qr-code-container">
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 inline-block mb-4">
                      <qrcode
                        [qrdata]="qrCodeData"
                        [width]="200"
                        [errorCorrectionLevel]="'M'">
                      </qrcode>
                    </div>
                    <h4 class="text-lg font-semibold mb-2">Scan to Pay</h4>
                    <p class="text-gray-600 mb-2">
                      Amount: ${{ getTotalWithTip().toFixed(2) }}
                    </p>
                    <div class="countdown-timer" *ngIf="qrCodeCountdown > 0">
                      <p class="text-sm text-orange-600">
                        Code expires in {{ qrCodeCountdown }}s
                      </p>
                      <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          class="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                          [style.width.%]="(qrCodeCountdown / paymentConfig.qrCodeTimeout) * 100">
                        </div>
                      </div>
                    </div>
                    <p-button
                      label="Regenerate"
                      icon="pi pi-refresh"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      (onClick)="generateQRCode()"
                      class="mt-4">
                    </p-button>
                  </div>
                </div>
              </div>
            </p-tabPanel>

            <!-- Digital Wallet -->
            <p-tabPanel
              *ngIf="isMethodEnabled('wallet')"
              header="Digital Wallet"
              leftIcon="pi pi-wallet">
              <div class="wallet-payment py-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  <!-- Apple Pay -->
                  <p-button
                    label="Apple Pay"
                    icon="pi pi-apple"
                    styleClass="p-button-lg w-full bg-black text-white"
                    (onClick)="processWalletPayment('apple')"
                    [disabled]="isProcessing">
                  </p-button>

                  <!-- Google Pay -->
                  <p-button
                    label="Google Pay"
                    icon="pi pi-google"
                    styleClass="p-button-lg w-full bg-blue-600 text-white"
                    (onClick)="processWalletPayment('google')"
                    [disabled]="isProcessing">
                  </p-button>

                  <!-- PayPal -->
                  <p-button
                    label="PayPal"
                    icon="pi pi-paypal"
                    styleClass="p-button-lg w-full bg-blue-500 text-white"
                    (onClick)="processWalletPayment('paypal')"
                    [disabled]="isProcessing">
                  </p-button>

                </div>
              </div>
            </p-tabPanel>

          </p-tabView>
        </div>

        <!-- Tip Section -->
        <div class="tip-section mb-6" *ngIf="shouldShowTipSection()">
          <h3 class="text-lg font-semibold mb-3">Add Tip</h3>

          <!-- Suggested Tips -->
          <div class="suggested-tips mb-4">
            <div class="grid grid-cols-4 gap-2">
              <p-button
                *ngFor="let tip of paymentConfig.suggestedTips"
                [label]="tip + '%'"
                severity="secondary"
                [outlined]="selectedTipPercent !== tip"
                size="small"
                (onClick)="selectTip(tip)">
              </p-button>
            </div>
          </div>

          <!-- Custom Tip -->
          <div class="custom-tip" *ngIf="paymentConfig.allowCustomTip">
            <div class="flex items-center space-x-2">
              <p-radioButton
                name="tipType"
                value="custom"
                [(ngModel)]="tipType"
                inputId="customTip">
              </p-radioButton>
              <label for="customTip" class="text-sm font-medium">Custom Amount:</label>
              <div class="flex items-center space-x-1">
                <span>$</span>
                <input
                  type="number"
                  pInputText
                  [(ngModel)]="customTipAmount"
                  [disabled]="tipType !== 'custom'"
                  min="0"
                  step="0.50"
                  class="w-20 text-center"
                  [attr.aria-label]="'Custom tip amount'">
              </div>
            </div>
          </div>

          <!-- Tip Summary -->
          <div class="tip-summary mt-4 p-3 bg-gray-50 rounded-lg" *ngIf="getTipAmount() > 0">
            <div class="flex justify-between items-center text-sm">
              <span>Tip Amount:</span>
              <span class="font-medium">${{ getTipAmount().toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="payment-summary mb-6">
          <div class="bg-gray-100 p-4 rounded-lg">
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span>Subtotal:</span>
                <span>${{ getSubtotal().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center" *ngIf="order?.tax">
                <span>Tax:</span>
                <span>${{ order.tax.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center" *ngIf="getTipAmount() > 0">
                <span>Tip:</span>
                <span>${{ getTipAmount().toFixed(2) }}</span>
              </div>
              <p-divider></p-divider>
              <div class="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>${{ getTotalWithTip().toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Messages -->
        <p-messages
          *ngIf="errorMessage"
          severity="error"
          [value]="[{severity: 'error', summary: 'Payment Error', detail: errorMessage}]"
          class="mb-4">
        </p-messages>

        <!-- Processing State -->
        <div class="processing-state text-center py-8" *ngIf="isProcessing">
          <p-progressSpinner styleClass="w-12 h-12"></p-progressSpinner>
          <p class="mt-4 text-gray-600">Processing your payment...</p>
        </div>

      </div>

      <!-- Dialog Footer -->
      <ng-template pTemplate="footer">
        <div class="flex justify-between items-center w-full">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            (onClick)="onCancel()"
            [disabled]="isProcessing">
          </p-button>

          <p-button
            [label]="getPayButtonLabel()"
            icon="pi pi-credit-card"
            severity="success"
            (onClick)="processPayment()"
            [disabled]="!canProcessPayment() || isProcessing"
            [loading]="isProcessing">
          </p-button>
        </div>
      </ng-template>

    </p-dialog>
  `,
  styleUrls: ['./payment-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentDialogComponent extends BaseComponent implements OnInit {
  @Input() visible = false;
  @Input() order?: Order;
  @Input() paymentConfig: PaymentConfig = this.getDefaultConfig();

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() paymentComplete = new EventEmitter<PaymentData>();
  @Output() paymentCancel = new EventEmitter<void>();
  @Output() paymentError = new EventEmitter<string>();

  activeTabIndex = 0;
  selectedPaymentMethod: PaymentMethod = PaymentMethod.CASH;

  // Forms
  cardForm: FormGroup;
  mobileForm: FormGroup;

  // Tip handling
  selectedTipPercent?: number;
  customTipAmount = 0;
  tipType: 'percentage' | 'custom' = 'percentage';

  // QR Code
  qrCodeGenerated = false;
  qrCodeData = '';
  qrCodeCountdown = 0;
  isGeneratingQR = false;

  // State
  isProcessing = false;
  errorMessage = '';

  // Options
  mobileProviderOptions: SelectOption[] = [
    { label: 'Apple Pay', value: 'apple' },
    { label: 'Google Pay', value: 'google' },
    { label: 'Samsung Pay', value: 'samsung' },
    { label: 'PayPal', value: 'paypal' }
  ];

  constructor(private fb: FormBuilder) {
    super();
    this.initializeForms();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.setupPaymentMethodTabs();
  }

  private getDefaultConfig(): PaymentConfig {
    return {
      enabledMethods: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.QR_CODE],
      requireTip: false,
      suggestedTips: [10, 15, 18, 20],
      allowCustomTip: true,
      showOrderSummary: true,
      qrCodeTimeout: 300,
      supportedCardTypes: ['visa', 'mastercard', 'amex'],
      mobileProviders: ['apple', 'google', 'samsung', 'paypal']
    };
  }

  private initializeForms(): void {
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{4}-\d{4}-\d{4}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardholderName: ['', Validators.required],
      saveCard: [false]
    });

    this.mobileForm = this.fb.group({
      provider: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]]
    });
  }

  private setupPaymentMethodTabs(): void {
    // Set default tab based on enabled methods
    const enabledMethods = this.paymentConfig.enabledMethods;
    if (enabledMethods.includes(PaymentMethod.CARD)) {
      this.activeTabIndex = this.getTabIndex(PaymentMethod.CARD);
      this.selectedPaymentMethod = PaymentMethod.CARD;
    } else if (enabledMethods.includes(PaymentMethod.CASH)) {
      this.activeTabIndex = this.getTabIndex(PaymentMethod.CASH);
      this.selectedPaymentMethod = PaymentMethod.CASH;
    }
  }

  private getTabIndex(method: PaymentMethod): number {
    const methodOrder = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.MOBILE, PaymentMethod.QR_CODE, PaymentMethod.WALLET];
    let index = 0;

    for (const m of methodOrder) {
      if (this.paymentConfig.enabledMethods.includes(m)) {
        if (m === method) return index;
        index++;
      }
    }

    return 0;
  }

  // Method checks
  isMethodEnabled(method: string): boolean {
    return this.paymentConfig.enabledMethods.includes(method as PaymentMethod);
  }

  shouldShowTipSection(): boolean {
    return this.paymentConfig.suggestedTips.length > 0 || this.paymentConfig.allowCustomTip;
  }

  // Form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.cardForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isMobileFieldInvalid(fieldName: string): boolean {
    const field = this.mobileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  canProcessPayment(): boolean {
    if (this.isProcessing) return false;

    switch (this.selectedPaymentMethod) {
      case PaymentMethod.CASH:
        return true;
      case PaymentMethod.CARD:
        return this.cardForm.valid;
      case PaymentMethod.MOBILE:
        return this.mobileForm.valid;
      case PaymentMethod.QR_CODE:
        return this.qrCodeGenerated;
      case PaymentMethod.WALLET:
        return true;
      default:
        return false;
    }
  }

  // Tip handling
  selectTip(percentage: number): void {
    this.selectedTipPercent = percentage;
    this.tipType = 'percentage';
    this.customTipAmount = 0;
  }

  getTipAmount(): number {
    if (this.tipType === 'custom') {
      return this.customTipAmount || 0;
    } else if (this.selectedTipPercent) {
      return this.getSubtotal() * (this.selectedTipPercent / 100);
    }
    return 0;
  }

  getSubtotal(): number {
    return this.order ? this.order.totalAmount - (this.order.tax || 0) : 0;
  }

  getTotalWithTip(): number {
    return (this.order?.totalAmount || 0) + this.getTipAmount();
  }

  // QR Code
  async generateQRCode(): Promise<void> {
    this.isGeneratingQR = true;

    try {
      // Simulate QR code generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const paymentData = {
        orderId: this.order?.id,
        amount: this.getTotalWithTip(),
        currency: 'USD',
        merchant: 'Restaurant Name',
        timestamp: new Date().toISOString()
      };

      this.qrCodeData = JSON.stringify(paymentData);
      this.qrCodeGenerated = true;
      this.startQRCountdown();
    } catch (error) {
      this.setError('Failed to generate QR code');
    } finally {
      this.isGeneratingQR = false;
    }
  }

  private startQRCountdown(): void {
    this.qrCodeCountdown = this.paymentConfig.qrCodeTimeout;

    const interval = setInterval(() => {
      this.qrCodeCountdown--;

      if (this.qrCodeCountdown <= 0) {
        clearInterval(interval);
        this.qrCodeGenerated = false;
        this.qrCodeData = '';
      }
    }, 1000);
  }

  // Payment processing
  async processPayment(): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const paymentData: PaymentData = {
        method: this.selectedPaymentMethod,
        amount: this.getTotalWithTip(),
        tip: this.getTipAmount() > 0 ? this.getTipAmount() : undefined
      };

      switch (this.selectedPaymentMethod) {
        case PaymentMethod.CARD:
          paymentData.cardDetails = this.cardForm.value;
          break;
        case PaymentMethod.MOBILE:
          paymentData.mobileDetails = this.mobileForm.value;
          break;
        case PaymentMethod.QR_CODE:
          paymentData.qrCodeData = this.qrCodeData;
          break;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.paymentComplete.emit(paymentData);
      this.visible = false;
      this.visibleChange.emit(false);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment processing failed';
      this.setError(errorMsg);
      this.paymentError.emit(errorMsg);
    } finally {
      this.setLoading(false);
    }
  }

  async processWalletPayment(provider: string): Promise<void> {
    this.selectedPaymentMethod = PaymentMethod.WALLET;
    await this.processPayment();
  }

  // Event handlers
  onPaymentMethodChange(event: any): void {
    const methods = this.paymentConfig.enabledMethods;
    this.selectedPaymentMethod = methods[event.index];
  }

  onCancel(): void {
    this.paymentCancel.emit();
    this.onDialogHide();
  }

  onDialogHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetDialog();
  }

  private resetDialog(): void {
    this.cardForm.reset();
    this.mobileForm.reset();
    this.selectedTipPercent = undefined;
    this.customTipAmount = 0;
    this.tipType = 'percentage';
    this.qrCodeGenerated = false;
    this.qrCodeData = '';
    this.qrCodeCountdown = 0;
    this.isProcessing = false;
    this.clearError();
  }

  // UI helpers
  getOrderTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      dine_in: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery'
    };
    return labels[type] || type;
  }

  getPayButtonLabel(): string {
    const total = this.getTotalWithTip();
    return `Pay $${total.toFixed(2)}`;
  }

  protected override setLoading(loading: boolean): void {
    this.isProcessing = loading;
  }

  protected override setError(error: string): void {
    this.errorMessage = error;
  }

  protected override clearError(): void {
    this.errorMessage = '';
  }

  protected override getAriaLabel(): string {
    return `Payment dialog for order ${this.order?.orderNumber}, total $${this.getTotalWithTip().toFixed(2)}`;
  }
}