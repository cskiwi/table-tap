import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { Order, OrderStatus, OrderType } from '../../../../shared/interfaces/common.interfaces';
import { BaseComponent } from '../../../../shared/components/base/base.component';

/**
 * OrderCard Component - Displays order details with status and actions
 * Used in customer interface, kitchen display, and admin panels
 */
@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChipModule,
    BadgeModule,
    TagModule,
    ProgressBarModule
  ],
  template: `
    <p-card
      [ngClass]="getCardClasses()"
      [attr.aria-label]="'Order ' + order.orderNumber"
      role="article">

      <!-- Card Header -->
      <ng-template pTemplate="header">
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <h3 class="text-lg font-semibold text-gray-900">
              Order #{{ order.orderNumber }}
            </h3>
            <p-tag
              [value]="getStatusLabel(order.status)"
              [severity]="getStatusSeverity(order.status)"
              [ngClass]="getStatusClasses()">
            </p-tag>
          </div>

          <div class="flex items-center space-x-2">
            <p-chip
              [label]="getOrderTypeLabel(order.orderType)"
              [ngClass]="getOrderTypeClasses()"
              icon="pi pi-{{ getOrderTypeIcon(order.orderType) }}">
            </p-chip>

            <p-badge
              *ngIf="order.items.length > 0"
              [value]="order.items.length.toString()"
              severity="info">
            </p-badge>
          </div>
        </div>
      </ng-template>

      <!-- Card Content -->
      <div class="p-4">
        <!-- Customer Information -->
        <div class="mb-4" *ngIf="order.customerName || order.customerPhone">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <i class="pi pi-user"></i>
            <span *ngIf="order.customerName">{{ order.customerName }}</span>
            <span *ngIf="order.customerPhone" class="text-gray-500">
              • {{ order.customerPhone }}
            </span>
          </div>
        </div>

        <!-- Table Number for Dine-in -->
        <div class="mb-4" *ngIf="order.orderType === 'dine_in' && order.tableNumber">
          <div class="flex items-center space-x-2">
            <i class="pi pi-map-marker text-blue-500"></i>
            <span class="font-medium text-blue-700">Table {{ order.tableNumber }}</span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="mb-4">
          <h4 class="font-medium text-gray-900 mb-2">Items ({{ order.items.length }})</h4>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              *ngFor="let item of order.items; trackBy: trackByItemId"
              class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ item.productName }}</div>
                <div class="text-sm text-gray-500" *ngIf="item.customizations?.length">
                  <span *ngFor="let customization of item.customizations; let last = last">
                    {{ customization.name }}: {{ customization.value }}
                    <span *ngIf="!last">, </span>
                  </span>
                </div>
                <div class="text-xs text-gray-400" *ngIf="item.notes">
                  Note: {{ item.notes }}
                </div>
              </div>
              <div class="text-right ml-4">
                <div class="font-medium">${{ item.totalPrice.toFixed(2) }}</div>
                <div class="text-sm text-gray-500">Qty: {{ item.quantity }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Notes -->
        <div class="mb-4" *ngIf="order.notes">
          <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-start space-x-2">
              <i class="pi pi-info-circle text-yellow-600 mt-0.5"></i>
              <div>
                <div class="font-medium text-yellow-800">Special Instructions</div>
                <div class="text-yellow-700 text-sm mt-1">{{ order.notes }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar for Active Orders -->
        <div *ngIf="isActiveOrder(order.status)" class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{{ getProgressLabel(order.status) }}</span>
          </div>
          <p-progressBar
            [value]="getProgressValue(order.status)"
            [showValue]="false"
            styleClass="h-2">
          </p-progressBar>
        </div>

        <!-- Timing Information -->
        <div class="mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-gray-500">Ordered</div>
              <div class="font-medium">{{ order.createdAt | date:'short' }}</div>
            </div>

            <div *ngIf="order.estimatedReadyTime">
              <div class="text-gray-500">Est. Ready</div>
              <div class="font-medium text-green-600">
                {{ order.estimatedReadyTime | date:'shortTime' }}
              </div>
            </div>

            <div *ngIf="order.completedAt">
              <div class="text-gray-500">Completed</div>
              <div class="font-medium">{{ order.completedAt | date:'short' }}</div>
            </div>
          </div>
        </div>

        <!-- Total Amount -->
        <div class="border-t border-gray-200 pt-4">
          <div class="flex justify-between items-center">
            <div>
              <div class="text-sm text-gray-500 space-x-4">
                <span>Subtotal: ${{ (order.totalAmount - order.tax).toFixed(2) }}</span>
                <span *ngIf="order.discount > 0">Discount: -${{ order.discount.toFixed(2) }}</span>
                <span>Tax: ${{ order.tax.toFixed(2) }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">
                ${{ order.totalAmount.toFixed(2) }}
              </div>
              <div class="text-sm text-gray-500">
                {{ getPaymentMethodLabel(order.paymentMethod) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Footer with Actions -->
      <ng-template pTemplate="footer">
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="flex flex-wrap gap-2 justify-end">
            <!-- View Details Button -->
            <p-button
              label="View Details"
              icon="pi pi-eye"
              severity="secondary"
              size="small"
              [outlined]="true"
              (onClick)="onViewDetails()">
            </p-button>

            <!-- Status-specific Action Buttons -->
            <p-button
              *ngIf="order.status === 'pending' && showActions"
              label="Confirm"
              icon="pi pi-check"
              severity="success"
              size="small"
              (onClick)="onConfirmOrder()">
            </p-button>

            <p-button
              *ngIf="order.status === 'confirmed' && showActions"
              label="Start Preparing"
              icon="pi pi-play"
              severity="info"
              size="small"
              (onClick)="onStartPreparing()">
            </p-button>

            <p-button
              *ngIf="order.status === 'preparing' && showActions"
              label="Mark Ready"
              icon="pi pi-flag"
              severity="warning"
              size="small"
              (onClick)="onMarkReady()">
            </p-button>

            <p-button
              *ngIf="order.status === 'ready' && showActions"
              label="Complete"
              icon="pi pi-check-circle"
              severity="success"
              size="small"
              (onClick)="onCompleteOrder()">
            </p-button>

            <!-- Cancel Button -->
            <p-button
              *ngIf="canCancelOrder(order.status) && showActions"
              label="Cancel"
              icon="pi pi-times"
              severity="danger"
              size="small"
              [outlined]="true"
              (onClick)="onCancelOrder()">
            </p-button>

            <!-- Reorder Button -->
            <p-button
              *ngIf="order.status === 'completed' && showReorderButton"
              label="Reorder"
              icon="pi pi-refresh"
              severity="info"
              size="small"
              [outlined]="true"
              (onClick)="onReorder()">
            </p-button>
          </div>
        </div>
      </ng-template>
    </p-card>
  `,
  styleUrls: ['./order-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderCardComponent extends BaseComponent {
  @Input() order!: Order;
  @Input() showActions = true;
  @Input() showReorderButton = false;
  @Input() compact = false;

  @Output() viewDetails = new EventEmitter<Order>();
  @Output() statusChange = new EventEmitter<{ order: Order; newStatus: OrderStatus }>();
  @Output() cancelOrder = new EventEmitter<Order>();
  @Output() reorder = new EventEmitter<Order>();

  trackByItemId(index: number, item: any): string {
    return item.id;
  }

  getCardClasses(): string {
    const baseClasses = 'order-card transition-all duration-200 hover:shadow-lg';
    const statusClasses = this.getCardStatusClasses();
    const sizeClasses = this.compact ? 'compact' : '';

    return `${baseClasses} ${statusClasses} ${sizeClasses}`.trim();
  }

  private getCardStatusClasses(): string {
    switch (this.order.status) {
      case OrderStatus.PENDING:
        return 'border-l-4 border-l-yellow-400';
      case OrderStatus.CONFIRMED:
        return 'border-l-4 border-l-blue-400';
      case OrderStatus.PREPARING:
        return 'border-l-4 border-l-orange-400';
      case OrderStatus.READY:
        return 'border-l-4 border-l-green-400';
      case OrderStatus.COMPLETED:
        return 'border-l-4 border-l-gray-400 opacity-75';
      case OrderStatus.CANCELLED:
        return 'border-l-4 border-l-red-400 opacity-60';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  }

  getStatusLabel(status: OrderStatus): string {
    const labels = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.PREPARING]: 'Preparing',
      [OrderStatus.READY]: 'Ready',
      [OrderStatus.COMPLETED]: 'Completed',
      [OrderStatus.CANCELLED]: 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: OrderStatus): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.CONFIRMED:
        return 'info';
      case OrderStatus.PREPARING:
        return 'secondary';
      case OrderStatus.READY:
        return 'success';
      case OrderStatus.COMPLETED:
        return 'contrast';
      case OrderStatus.CANCELLED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusClasses(): string {
    return 'font-medium text-xs uppercase tracking-wide';
  }

  getOrderTypeLabel(type: OrderType): string {
    const labels = {
      [OrderType.DINE_IN]: 'Dine In',
      [OrderType.TAKEAWAY]: 'Takeaway',
      [OrderType.DELIVERY]: 'Delivery'
    };
    return labels[type] || type;
  }

  getOrderTypeIcon(type: OrderType): string {
    const icons = {
      [OrderType.DINE_IN]: 'home',
      [OrderType.TAKEAWAY]: 'shopping-bag',
      [OrderType.DELIVERY]: 'send'
    };
    return icons[type] || 'circle';
  }

  getOrderTypeClasses(): string {
    switch (this.order.orderType) {
      case OrderType.DINE_IN:
        return 'bg-blue-100 text-blue-800';
      case OrderType.TAKEAWAY:
        return 'bg-green-100 text-green-800';
      case OrderType.DELIVERY:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  isActiveOrder(status: OrderStatus): boolean {
    return [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY
    ].includes(status);
  }

  getProgressValue(status: OrderStatus): number {
    switch (status) {
      case OrderStatus.PENDING:
        return 25;
      case OrderStatus.CONFIRMED:
        return 50;
      case OrderStatus.PREPARING:
        return 75;
      case OrderStatus.READY:
        return 100;
      default:
        return 0;
    }
  }

  getProgressLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Order Received';
      case OrderStatus.CONFIRMED:
        return 'Confirmed';
      case OrderStatus.PREPARING:
        return 'In Kitchen';
      case OrderStatus.READY:
        return 'Ready for Pickup';
      default:
        return '';
    }
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      cash: 'Cash',
      card: 'Card',
      mobile: 'Mobile Pay',
      qr_code: 'QR Code',
      wallet: 'Digital Wallet'
    };
    return labels[method] || method;
  }

  canCancelOrder(status: OrderStatus): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(status);
  }

  // Event Handlers
  onViewDetails(): void {
    this.viewDetails.emit(this.order);
  }

  onConfirmOrder(): void {
    this.statusChange.emit({
      order: this.order,
      newStatus: OrderStatus.CONFIRMED
    });
  }

  onStartPreparing(): void {
    this.statusChange.emit({
      order: this.order,
      newStatus: OrderStatus.PREPARING
    });
  }

  onMarkReady(): void {
    this.statusChange.emit({
      order: this.order,
      newStatus: OrderStatus.READY
    });
  }

  onCompleteOrder(): void {
    this.statusChange.emit({
      order: this.order,
      newStatus: OrderStatus.COMPLETED
    });
  }

  onCancelOrder(): void {
    this.cancelOrder.emit(this.order);
  }

  onReorder(): void {
    this.reorder.emit(this.order);
  }

  protected override getAriaLabel(): string {
    return `Order ${this.order.orderNumber}, Status: ${this.getStatusLabel(this.order.status)}, Total: $${this.order.totalAmount.toFixed(2)}`;
  }
}