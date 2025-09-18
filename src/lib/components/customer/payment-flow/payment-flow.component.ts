import { CommonModule } from '@angular/common';
import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { QRCodeModule } from 'angularx-qrcode';
import { Order, PaymentFlowConfig, PaymentMethod } from '../../../shared/interfaces';
import { RESTAURANT_TAILWIND_CLASSES } from '../../../shared/theme/restaurant-theme';

interface PaymentStep {
  label: string;
  command?: (event: any) => void;
}

@Component({
  selector: 'app-payment-flow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    ProgressSpinnerModule,
    StepsModule,
    ToastModule,
    QRCodeModule
  ],
  providers: [MessageService],
  template: `
    <div [class]="containerClasses">
      <!-- Progress Steps -->
      <div class="mb-8">
        <p-steps
          [model]="paymentSteps"
          [activeIndex]="currentStep()"
          [readonly]="true"
          styleClass="custom-steps"
        />
      </div>
      
      <!-- Step Content -->
      <div [class]="contentCardClasses">
        @switch (currentStep()) {
          <!-- Step 0: Order Review -->
          @case (0) {
            <div class="step-content">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ 'PAYMENT.REVIEW_ORDER' | translate }}</h2>
              
              <!-- Order Summary -->
              <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <div class="space-y-3">
                  @for (item of order().items; track item.id) {
                    <div class="flex justify-between items-center">
                      <div>
                        <span class="font-medium">{{ item.quantity }}x {{ item.product.name }}</span>
                        @if (item.customizations.length > 0) {
                          <div class="text-sm text-gray-600">
                            @for (customization of item.customizations; track customization.customizationId) {
                              <span class="mr-2">{{ customization.name }}</span>
                            }
                          </div>
                        }
                      </div>
                      <span class="font-semibold">{{ item.totalPrice | currency:'EUR':'symbol':'1.2-2' }}</span>
                    </div>
                  }
                  
                  <div class="border-t border-gray-300 pt-3 mt-3">
                    <div class="flex justify-between items-center text-lg font-bold">
                      <span>{{ 'PAYMENT.TOTAL' | translate }}</span>
                      <span class="text-primary-600">{{ order().total | currency:'EUR':'symbol':'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Customer Information Form -->
              @if (config().requireCustomerInfo) {
                <form [formGroup]="customerInfoForm" class="mb-6">
                  <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ 'PAYMENT.CUSTOMER_INFO' | translate }}</h3>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ 'PAYMENT.CUSTOMER_NAME' | translate }}
                      </label>
                      <input
                        pInputText
                        formControlName="customerName"
                        [placeholder]="'PAYMENT.ENTER_NAME' | translate"
                        class="w-full"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ 'PAYMENT.TABLE_NUMBER' | translate }}
                      </label>
                      <input
                        pInputText
                        formControlName="tableNumber"
                        [placeholder]="'PAYMENT.ENTER_TABLE' | translate"
                        class="w-full"
                      />
                    </div>
                  </div>
                </form>
              }
              
              <div class="flex justify-end">
                <button
                  pButton
                  type="button"
                  [label]="'PAYMENT.CONTINUE_TO_PAYMENT' | translate"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  [class]="RESTAURANT_TAILWIND_CLASSES.button.primary"
                  [disabled]="!isStepValid(0)"
                  (click)="nextStep()"
                />
              </div>
            </div>
          }
          
          <!-- Step 1: Payment Method Selection -->
          @case (1) {
            <div class="step-content">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ 'PAYMENT.SELECT_METHOD' | translate }}</h2>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                @for (method of availablePaymentMethods(); track method) {
                  <div
                    class="payment-method-card"
                    [class.selected]="selectedPaymentMethod() === method"
                    (click)="selectPaymentMethod(method)"
                  >
                    <div class="flex items-center space-x-3">
                      @switch (method) {
                        @case ('cash') {
                          <i class="pi pi-money-bill text-2xl text-green-600"></i>
                        }
                        @case ('card') {
                          <i class="pi pi-credit-card text-2xl text-blue-600"></i>
                        }
                        @case ('mobile_payment') {
                          <i class="pi pi-mobile text-2xl text-purple-600"></i>
                        }
                        @case ('qr_code') {
                          <i class="pi pi-qrcode text-2xl text-orange-600"></i>
                        }
                      }
                      <div>
                        <h3 class="font-semibold text-gray-800">{{ getPaymentMethodLabel(method) | translate }}</h3>
                        <p class="text-sm text-gray-600">{{ getPaymentMethodDescription(method) | translate }}</p>
                      </div>
                    </div>
                    
                    @if (selectedPaymentMethod() === method) {
                      <i class="pi pi-check-circle text-green-600"></i>
                    }
                  </div>
                }
              </div>
              
              <!-- Minimum Order Warning -->
              @if (config().minimumOrderAmount && order().total < config().minimumOrderAmount!) {
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div class="flex items-center">
                    <i class="pi pi-exclamation-triangle text-yellow-600 mr-2"></i>
                    <div>
                      <p class="font-medium text-yellow-800">{{ 'PAYMENT.MINIMUM_ORDER' | translate }}</p>
                      <p class="text-sm text-yellow-700">
                        {{ 'PAYMENT.MINIMUM_AMOUNT_REQUIRED' | translate }}: 
                        {{ config().minimumOrderAmount | currency:'EUR':'symbol':'1.2-2' }}
                      </p>
                    </div>
                  </div>
                </div>
              }
              
              <div class="flex justify-between">
                <button
                  pButton
                  type="button"
                  [label]="'COMMON.BACK' | translate"
                  icon="pi pi-arrow-left"
                  class="p-button-outlined"
                  (click)="previousStep()"
                />
                <button
                  pButton
                  type="button"
                  [label]="'PAYMENT.PROCEED_TO_PAYMENT' | translate"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  [class]="RESTAURANT_TAILWIND_CLASSES.button.primary"
                  [disabled]="!isStepValid(1)"
                  (click)="nextStep()"
                />
              </div>
            </div>
          }
          
          <!-- Step 2: Payment Processing -->
          @case (2) {
            <div class="step-content text-center">
              @if (paymentProcessing()) {
                <div>
                  <p-progressSpinner styleClass="w-16 h-16 mx-auto mb-4" />
                  <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ 'PAYMENT.PROCESSING' | translate }}</h2>
                  <p class="text-gray-600">{{ 'PAYMENT.PLEASE_WAIT' | translate }}</p>
                </div>
              } @else {
                @switch (selectedPaymentMethod()) {
                  @case ('qr_code') {
                    <div>
                      <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ 'PAYMENT.SCAN_QR_CODE' | translate }}</h2>
                      
                      @if (config().showQRCode) {
                        <div class="flex justify-center mb-6">
                          <qrcode
                            [qrdata]="qrCodeData()"
                            [width]="200"
                            [errorCorrectionLevel]="'M'"
                            [elementType]="'canvas'"
                            [margin]="4"
                          />
                        </div>
                      }
                      
                      <p class="text-gray-600 mb-6">{{ 'PAYMENT.QR_INSTRUCTIONS' | translate }}</p>
                      
                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center justify-center">
                          <i class="pi pi-info-circle text-blue-600 mr-2"></i>
                          <span class="text-blue-800">{{ 'PAYMENT.AMOUNT_TO_PAY' | translate }}: 
                            <strong>{{ order().total | currency:'EUR':'symbol':'1.2-2' }}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                  
                  @case ('cash') {
                    <div>
                      <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ 'PAYMENT.CASH_PAYMENT' | translate }}</h2>
                      <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                        <i class="pi pi-money-bill text-4xl text-green-600 mb-4"></i>
                        <p class="text-green-800 font-medium">{{ 'PAYMENT.PAY_AT_COUNTER' | translate }}</p>
                        <p class="text-green-700 mt-2">{{ 'PAYMENT.AMOUNT_TO_PAY' | translate }}: 
                          <strong>{{ order().total | currency:'EUR':'symbol':'1.2-2' }}</strong>
                        </p>
                      </div>
                    </div>
                  }
                  
                  @case ('card') {
                    <div>
                      <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ 'PAYMENT.CARD_PAYMENT' | translate }}</h2>
                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <i class="pi pi-credit-card text-4xl text-blue-600 mb-4"></i>
                        <p class="text-blue-800 font-medium">{{ 'PAYMENT.INSERT_CARD' | translate }}</p>
                        <p class="text-blue-700 mt-2">{{ 'PAYMENT.AMOUNT_TO_PAY' | translate }}: 
                          <strong>{{ order().total | currency:'EUR':'symbol':'1.2-2' }}</strong>
                        </p>
                      </div>
                    </div>
                  }
                }
                
                <div class="flex justify-center space-x-4">
                  <button
                    pButton
                    type="button"
                    [label]="'COMMON.CANCEL' | translate"
                    class="p-button-outlined"
                    (click)="cancelPayment()"
                  />
                  <button
                    pButton
                    type="button"
                    [label]="'PAYMENT.CONFIRM_PAYMENT' | translate"
                    icon="pi pi-check"
                    [class]="RESTAURANT_TAILWIND_CLASSES.button.success"
                    (click)="confirmPayment()"
                  />
                </div>
              }
            </div>
          }
          
          <!-- Step 3: Payment Confirmation -->
          @case (3) {
            <div class="step-content text-center">
              <div class="mb-6">
                <i class="pi pi-check-circle text-6xl text-green-600 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ 'PAYMENT.SUCCESS' | translate }}</h2>
                <p class="text-gray-600 mb-6">{{ 'PAYMENT.ORDER_CONFIRMED' | translate }}</p>
                
                <!-- Order Details -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ 'PAYMENT.ORDER_NUMBER' | translate }}:</span>
                      <span class="font-bold text-primary-600">{{ order().id }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ 'PAYMENT.ESTIMATED_TIME' | translate }}:</span>
                      <span class="font-bold">{{ order().estimatedPreparationTime }} {{ 'COMMON.MINUTES' | translate }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ 'PAYMENT.TOTAL_PAID' | translate }}:</span>
                      <span class="font-bold text-green-600">{{ order().total | currency:'EUR':'symbol':'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
                
                @if (config().autoGenerateReceipt) {
                  <button
                    pButton
                    type="button"
                    [label]="'PAYMENT.DOWNLOAD_RECEIPT' | translate"
                    icon="pi pi-download"
                    class="p-button-outlined mb-4"
                    (click)="downloadReceipt()"
                  />
                }
              </div>
              
              <div class="flex justify-center space-x-4">
                <button
                  pButton
                  type="button"
                  [label]="'PAYMENT.TRACK_ORDER' | translate"
                  icon="pi pi-eye"
                  [class]="RESTAURANT_TAILWIND_CLASSES.button.primary"
                  (click)="trackOrder()"
                />
                <button
                  pButton
                  type="button"
                  [label]="'PAYMENT.NEW_ORDER' | translate"
                  icon="pi pi-plus"
                  class="p-button-outlined"
                  (click)="startNewOrder()"
                />
              </div>
            </div>
          }
        }
      </div>
    </div>
    
    <!-- Toast Messages -->
    <p-toast />
  `,
  styles: [
    `
      .payment-method-card {
        @apply p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary-300 hover:shadow-md;
      }
      
      .payment-method-card.selected {
        @apply border-primary-500 bg-primary-50;
      }
      
      .payment-method-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .step-content {
        min-height: 400px;
      }
      
      :host ::ng-deep .custom-steps .p-steps-item.p-steps-current .p-steps-number {
        background-color: var(--primary-color);
        color: white;
      }
      
      :host ::ng-deep .custom-steps .p-steps-item.p-highlight .p-steps-number {
        background-color: var(--primary-color);
        color: white;
      }
      
      @media (max-width: 640px) {
        .payment-method-card {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
        }
        
        .step-content {
          min-height: 300px;
        }
      }
    `
  ]
})
export class PaymentFlowComponent implements OnInit {
  // Inputs
  order = input.required<Order>();
  config = input<PaymentFlowConfig>({
    acceptedMethods: ['cash', 'card', 'qr_code'],
    requireCustomerInfo: true,
    showQRCode: true,
    autoGenerateReceipt: true
  });
  
  // Outputs
  paymentCompleted = output<Order>();
  paymentCancelled = output<void>();
  trackOrderRequested = output<string>();
  newOrderRequested = output<void>();
  
  // Signals
  currentStep = signal(0);
  selectedPaymentMethod = signal<PaymentMethod | null>(null);
  paymentProcessing = signal(false);
  
  // Forms
  customerInfoForm: FormGroup;
  
  // Style classes
  protected readonly RESTAURANT_TAILWIND_CLASSES = RESTAURANT_TAILWIND_CLASSES;
  
  containerClasses = RESTAURANT_TAILWIND_CLASSES.container + ' py-6';
  contentCardClasses = RESTAURANT_TAILWIND_CLASSES.card + ' p-6';
  
  // Steps configuration
  paymentSteps: PaymentStep[] = [
    { label: 'Review Order' },
    { label: 'Payment Method' },
    { label: 'Payment' },
    { label: 'Confirmation' }
  ];
  
  // Computed properties
  availablePaymentMethods = computed(() => this.config().acceptedMethods);
  
  qrCodeData = computed(() => {
    const orderData = {
      orderId: this.order().id,
      amount: this.order().total,
      currency: 'EUR',
      restaurant: 'TableTap'
    };
    return JSON.stringify(orderData);
  });
  
  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.customerInfoForm = this.fb.group({
      customerName: ['', this.config().requireCustomerInfo ? Validators.required : null],
      tableNumber: ['', Validators.pattern(/^[0-9]+$/)]
    });
  }
  
  ngOnInit() {
    // Initialize form validation based on config
    if (this.config().requireCustomerInfo) {
      this.customerInfoForm.get('customerName')?.setValidators([Validators.required]);
      this.customerInfoForm.get('customerName')?.updateValueAndValidity();
    }
  }
  
  nextStep() {
    if (this.currentStep() < this.paymentSteps.length - 1) {
      this.currentStep.update(step => step + 1);
    }
  }
  
  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }
  
  selectPaymentMethod(method: PaymentMethod) {
    this.selectedPaymentMethod.set(method);
  }
  
  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return !this.config().requireCustomerInfo || this.customerInfoForm.valid;
      case 1:
        return this.selectedPaymentMethod() !== null &&
               (!this.config().minimumOrderAmount || this.order().total >= this.config().minimumOrderAmount!);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  }
  
  confirmPayment() {
    this.paymentProcessing.set(true);
    
    // Simulate payment processing
    setTimeout(() => {
      this.paymentProcessing.set(false);
      
      // Update order with payment information
      const updatedOrder: Order = {
        ...this.order(),
        status: 'paid',
        paymentStatus: 'completed',
        paymentMethod: this.selectedPaymentMethod()!,
        customerName: this.customerInfoForm.get('customerName')?.value,
        tableNumber: this.customerInfoForm.get('tableNumber')?.value,
        timeline: [
          ...this.order().timeline,
          {
            id: '',
            type: 'payment_received',
            description: `Payment received via ${this.selectedPaymentMethod()}`,
            timestamp: new Date()
          }
        ]
      };
      
      this.messageService.add({
        severity: 'success',
        summary: 'Payment Successful',
        detail: 'Your payment has been processed successfully'
      });
      
      this.nextStep();
      this.paymentCompleted.emit(updatedOrder);
    }, 2000);
  }
  
  cancelPayment() {
    this.paymentCancelled.emit();
    this.messageService.add({
      severity: 'info',
      summary: 'Payment Cancelled',
      detail: 'Payment process has been cancelled'
    });
  }
  
  downloadReceipt() {
    // Implementation would generate and download PDF receipt
    this.messageService.add({
      severity: 'info',
      summary: 'Receipt Downloaded',
      detail: 'Receipt has been downloaded successfully'
    });
  }
  
  trackOrder() {
    this.trackOrderRequested.emit(this.order().id);
  }
  
  startNewOrder() {
    this.newOrderRequested.emit();
  }
  
  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels = {
      cash: 'PAYMENT.CASH',
      card: 'PAYMENT.CARD',
      mobile_payment: 'PAYMENT.MOBILE',
      qr_code: 'PAYMENT.QR_CODE',
      employee_meal: 'PAYMENT.EMPLOYEE_MEAL'
    };
    return labels[method];
  }
  
  getPaymentMethodDescription(method: PaymentMethod): string {
    const descriptions = {
      cash: 'PAYMENT.CASH_DESC',
      card: 'PAYMENT.CARD_DESC',
      mobile_payment: 'PAYMENT.MOBILE_DESC',
      qr_code: 'PAYMENT.QR_CODE_DESC',
      employee_meal: 'PAYMENT.EMPLOYEE_MEAL_DESC'
    };
    return descriptions[method];
  }
}
