import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Order, OrderItem, OrderSummaryConfig } from '../../../shared/interfaces';
import { RESTAURANT_TAILWIND_CLASSES } from '../../../shared/theme/restaurant-theme';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DividerModule,
    InputNumberModule,
    TagModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div [class]="containerClasses">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 [class]="titleClasses">{{ 'ORDER.YOUR_ORDER' | translate }}</h2>
        @if (items().length > 0) {
          <button
            pButton
            type="button"
            icon="pi pi-trash"
            [label]="'ORDER.CLEAR_ALL' | translate"
            class="p-button-text p-button-danger"
            (click)="onClearAll()"
          />
        }
      </div>
      
      <!-- Empty State -->
      @if (items().length === 0) {
        <div class="text-center py-12">
          <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-600 mb-2">{{ 'ORDER.EMPTY_CART' | translate }}</h3>
          <p class="text-gray-500 mb-6">{{ 'ORDER.ADD_ITEMS_TO_START' | translate }}</p>
          <button
            pButton
            type="button"
            [label]="'ORDER.BROWSE_MENU' | translate"
            icon="pi pi-arrow-left"
            class="p-button-outlined"
            (click)="browseMenu.emit()"
          />
        </div>
      }
      
      <!-- Order Items -->
      @if (items().length > 0) {
        <div class="space-y-4 mb-6">
          @for (item of items(); track item.id; let i = $index) {
            <div [class]="itemCardClasses">
              <div class="flex gap-4">
                <!-- Product Image -->
                @if (config().showImages && item.product.image) {
                  <div class="flex-shrink-0">
                    <img
                      [src]="item.product.image"
                      [alt]="item.product.name"
                      class="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                }
                
                <!-- Item Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-gray-800 truncate">{{ item.product.name }}</h3>
                    <button
                      pButton
                      type="button"
                      icon="pi pi-times"
                      class="p-button-rounded p-button-text p-button-sm ml-2"
                      (click)="onRemoveItem(item, i)"
                    />
                  </div>
                  
                  <!-- Customizations -->
                  @if (config().showCustomizations && item.customizations.length > 0) {
                    <div class="mb-2">
                      @for (customization of item.customizations; track customization.customizationId) {
                        <p-tag
                          [value]="customization.name"
                          severity="info"
                          class="mr-1 mb-1 text-xs"
                        />
                      }
                    </div>
                  }
                  
                  <!-- Special Instructions -->
                  @if (item.specialInstructions) {
                    <div class="text-sm text-gray-600 mb-2 italic">
                      <i class="pi pi-info-circle mr-1"></i>
                      {{ item.specialInstructions }}
                    </div>
                  }
                  
                  <!-- Preparation Time -->
                  @if (config().showPreparationTime) {
                    <div class="flex items-center text-sm text-gray-500 mb-2">
                      <i class="pi pi-clock mr-1"></i>
                      <span>{{ item.product.preparationTimeMinutes }} {{ 'COMMON.MINUTES' | translate }}</span>
                    </div>
                  }
                  
                  <!-- Quantity and Price -->
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                      @if (config().allowQuantityEdit) {
                        <button
                          pButton
                          type="button"
                          icon="pi pi-minus"
                          class="p-button-rounded p-button-outlined p-button-sm"
                          [disabled]="item.quantity <= 1"
                          (click)="onQuantityChange(item, item.quantity - 1)"
                        />
                        <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                        <button
                          pButton
                          type="button"
                          icon="pi pi-plus"
                          class="p-button-rounded p-button-outlined p-button-sm"
                          [disabled]="item.quantity >= 10"
                          (click)="onQuantityChange(item, item.quantity + 1)"
                        />
                      } @else {
                        <span class="text-sm text-gray-600">{{ 'ORDER.QUANTITY' | translate }}: {{ item.quantity }}</span>
                      }
                    </div>
                    
                    <div class="text-right">
                      <div class="font-semibold text-lg text-gray-800">
                        {{ item.totalPrice | currency:'EUR':'symbol':'1.2-2' }}
                      </div>
                      @if (item.quantity > 1) {
                        <div class="text-sm text-gray-500">
                          {{ item.unitPrice | currency:'EUR':'symbol':'1.2-2' }} {{ 'ORDER.EACH' | translate }}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        
        <!-- Order Summary -->
        <div [class]="summaryCardClasses">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ 'ORDER.ORDER_SUMMARY' | translate }}</h3>
          
          <!-- Pricing Breakdown -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">{{ 'ORDER.SUBTOTAL' | translate }}</span>
              <span class="font-medium">{{ orderTotals().subtotal | currency:'EUR':'symbol':'1.2-2' }}</span>
            </div>
            
            @if (orderTotals().tax > 0) {
              <div class="flex justify-between items-center">
                <span class="text-gray-600">{{ 'ORDER.TAX' | translate }} ({{ taxRate() }}%)</span>
                <span class="font-medium">{{ orderTotals().tax | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
            }
            
            @if (orderTotals().serviceCharge > 0) {
              <div class="flex justify-between items-center">
                <span class="text-gray-600">{{ 'ORDER.SERVICE_CHARGE' | translate }} ({{ serviceChargeRate() }}%)</span>
                <span class="font-medium">{{ orderTotals().serviceCharge | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
            }
            
            <div class="border-t border-gray-200 pt-2 mt-2">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold text-gray-800">{{ 'ORDER.TOTAL' | translate }}</span>
                <span class="text-xl font-bold text-primary-600">{{ orderTotals().total | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Estimated Preparation Time -->
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center">
              <i class="pi pi-clock text-blue-600 mr-2"></i>
              <div>
                <div class="font-medium text-blue-800">{{ 'ORDER.ESTIMATED_TIME' | translate }}</div>
                <div class="text-sm text-blue-600">{{ estimatedPreparationTime() }} {{ 'COMMON.MINUTES' | translate }}</div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="mt-6 space-y-3">
            <button
              pButton
              type="button"
              [label]="'ORDER.PROCEED_TO_PAYMENT' | translate"
              icon="pi pi-credit-card"
              [class]="RESTAURANT_TAILWIND_CLASSES.button.primary + ' w-full'"
              [disabled]="items().length === 0"
              (click)="onProceedToPayment()"
            />
            
            <button
              pButton
              type="button"
              [label]="'ORDER.CONTINUE_SHOPPING' | translate"
              icon="pi pi-arrow-left"
              class="p-button-outlined w-full"
              (click)="browseMenu.emit()"
            />
          </div>
        </div>
      }
    </div>
    
    <!-- Confirmation Dialog -->
    <p-confirmDialog />
    
    <!-- Toast Messages -->
    <p-toast />
  `,
  styles: [
    `
      .order-item-card {
        transition: all 0.2s ease;
      }
      
      .order-item-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .quantity-button {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      @media (max-width: 640px) {
        .order-item-card {
          padding: 1rem;
        }
        
        .item-details {
          gap: 0.5rem;
        }
      }
    `
  ]
})
export class OrderSummaryComponent {
  // Inputs
  items = input.required<OrderItem[]>();
  config = input<OrderSummaryConfig>({
    showImages: true,
    allowQuantityEdit: true,
    showCustomizations: true,
    showPreparationTime: true,
    autoCalculateTotals: true
  });
  taxRate = input<number>(21); // Default 21% VAT
  serviceChargeRate = input<number>(0); // Default no service charge
  
  // Outputs
  itemRemoved = output<{ item: OrderItem; index: number }>();
  quantityChanged = output<{ item: OrderItem; newQuantity: number }>();
  proceedToPayment = output<Order>();
  browseMenu = output<void>();
  clearAll = output<void>();
  
  // Style classes
  protected readonly RESTAURANT_TAILWIND_CLASSES = RESTAURANT_TAILWIND_CLASSES;
  
  containerClasses = RESTAURANT_TAILWIND_CLASSES.container + ' py-6';
  titleClasses = RESTAURANT_TAILWIND_CLASSES.heading.h2 + ' text-gray-800';
  itemCardClasses = RESTAURANT_TAILWIND_CLASSES.card + ' order-item-card p-4';
  summaryCardClasses = RESTAURANT_TAILWIND_CLASSES.card + ' p-6 bg-gray-50';
  
  // Computed properties
  orderTotals = computed(() => {
    const subtotal = this.items().reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = this.config().autoCalculateTotals ? subtotal * (this.taxRate() / 100) : 0;
    const serviceCharge = this.config().autoCalculateTotals ? subtotal * (this.serviceChargeRate() / 100) : 0;
    const total = subtotal + tax + serviceCharge;
    
    return {
      subtotal,
      tax,
      serviceCharge,
      total
    };
  });
  
  estimatedPreparationTime = computed(() => {
    if (this.items().length === 0) return 0;
    
    // Calculate based on the longest preparation time
    // In a real scenario, this would consider kitchen capacity and queue
    return Math.max(...this.items().map(item => item.product.preparationTimeMinutes));
  });
  
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}
  
  onRemoveItem(item: OrderItem, index: number) {
    this.confirmationService.confirm({
      message: `Remove ${item.product.name} from your order?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.itemRemoved.emit({ item, index });
        this.messageService.add({
          severity: 'success',
          summary: 'Item Removed',
          detail: `${item.product.name} has been removed from your order`
        });
      }
    });
  }
  
  onQuantityChange(item: OrderItem, newQuantity: number) {
    if (newQuantity < 1 || newQuantity > 10) return;
    
    this.quantityChanged.emit({ item, newQuantity });
    this.messageService.add({
      severity: 'info',
      summary: 'Quantity Updated',
      detail: `${item.product.name} quantity changed to ${newQuantity}`
    });
  }
  
  onClearAll() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to clear all items from your order?',
      header: 'Clear Order',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clearAll.emit();
        this.messageService.add({
          severity: 'info',
          summary: 'Order Cleared',
          detail: 'All items have been removed from your order'
        });
      }
    });
  }
  
  onProceedToPayment() {
    const totals = this.orderTotals();
    
    const order: Order = {
      id: '', // Will be generated by the service
      items: this.items(),
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceCharge: totals.serviceCharge,
      total: totals.total,
      status: 'pending_payment',
      paymentStatus: 'pending',
      estimatedPreparationTime: this.estimatedPreparationTime(),
      qrCode: '', // Will be generated by the service
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [{
        id: '',
        type: 'created',
        description: 'Order created',
        timestamp: new Date()
      }]
    };
    
    this.proceedToPayment.emit(order);
  }
}
