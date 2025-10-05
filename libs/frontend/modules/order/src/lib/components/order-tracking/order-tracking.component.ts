import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, timer, switchMap, tap, catchError, of } from 'rxjs';

import { OrderService } from '../../services/order.service';
import {
  Order,
  OrderStatus,
  OrderNotification,
  NotificationType,
  OrderTimestamps,
  Receipt,
} from '../../models/order.types';

interface StatusStep {
  status: OrderStatus,
  label: string,
  description: string,
  icon: string,
  completed: boolean,
  active: boolean
  estimatedTime?: number
  actualTime?: Date
}

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './order-tracking.component.html'
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly orderService = inject(OrderService);

  private readonly destroy$ = new Subject<void>()

  // Component state signals
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<any>(null);
  private readonly _liveUpdates = signal<OrderNotification[]>([]);
  private readonly _showCancelConfirmation = signal<boolean>(false);
  private readonly _isProcessingAction = signal<boolean>(false);
  private readonly _cancelReason = signal<string>('');

  // Public readonly signals
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()
  readonly liveUpdates = this._liveUpdates.asReadonly()
  readonly showCancelConfirmation = this._showCancelConfirmation.asReadonly()
  readonly isProcessingAction = this._isProcessingAction.asReadonly()

  // From OrderService
  readonly currentOrder = this.orderService.currentOrder;
  readonly orderStatus = this.orderService.orderStatus;

  // Cancel reason for two-way binding
  cancelReason = '';

  // Computed properties
  readonly progressPercentage = computed(() => {
    return this.orderService.orderProgress()
  });

  readonly estimatedReadyTime = computed(() => {
    const order = this.currentOrder()
    if (!order?.summary?.estimatedTime) return null;

    const createdTime = new Date(order.timestamps.created);
    const readyTime = new Date(createdTime.getTime() + (order.summary.estimatedTime * 60000));
    return readyTime;
  });

  readonly statusSteps = computed(() => {
    const order = this.currentOrder()
    if (!order) return []

    const currentStatus = order.status;
    const timestamps = order.timestamps;

    const steps: StatusStep[] = [
      {
        status: OrderStatus.CONFIRMED,
        label: 'Order Confirmed',
        description: 'Your order has been confirmed and sent to the kitchen',
        icon: 'icon-check-circle',
        completed: this.isStatusReached(currentStatus, OrderStatus.CONFIRMED),
        active: currentStatus === OrderStatus.CONFIRMED,
        actualTime: timestamps.confirmed
      },
      {
        status: OrderStatus.PREPARING,
        label: 'Preparing',
        description: 'Your order is being prepared by our kitchen staff',
        icon: 'icon-chef-hat',
        completed: this.isStatusReached(currentStatus, OrderStatus.PREPARING) && currentStatus !== OrderStatus.PREPARING,
        active: currentStatus === OrderStatus.PREPARING,
        estimatedTime: this.getEstimatedTimeForStatus(OrderStatus.PREPARING),
        actualTime: timestamps.preparationStarted
      },
      {
        status: OrderStatus.READY,
        label: 'Ready for Pickup',
        description: 'Your order is ready and waiting for pickup',
        icon: 'icon-shopping-bag',
        completed: this.isStatusReached(currentStatus, OrderStatus.READY) && currentStatus !== OrderStatus.READY,
        active: currentStatus === OrderStatus.READY,
        actualTime: timestamps.ready
      },
      {
        status: OrderStatus.DELIVERED,
        label: 'Order Complete',
        description: 'Your order has been completed',
        icon: 'icon-thumbs-up',
        completed: currentStatus === OrderStatus.DELIVERED,
        active: currentStatus === OrderStatus.DELIVERED,
        actualTime: timestamps.delivered
      }
    ];
    return steps;
  });

  readonly canCancelOrder = computed(() => {
    const status = this.orderStatus();
    const cancelableStatuses = [
      OrderStatus.CONFIRMED,
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PREPARING
    ];
    return cancelableStatuses.includes(status);
  });

  readonly canModifyOrder = computed(() => {
    const status = this.orderStatus()
    return status === OrderStatus.CONFIRMED;
  });

  constructor() {
    // Auto-load order when ID changes
    effect(() => {
      const orderId = this.route.snapshot.paramMap.get('id');
      if (orderId) {
        this.loadOrder(orderId);
      }
    });
  }

  ngOnInit(): void {
    // Start real-time updates
    this.startLiveUpdates()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadOrder(orderId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.orderService.getOrder(orderId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (order) => {
        this._isLoading.set(false);
        // Order is set in the service
        this.generateLiveUpdate({
          id: `update-${Date.now()}`,
          orderId: order.id,
          type: NotificationType.ORDER_CONFIRMED,
          title: 'Order Loaded',
          message: `Order #${order.trackingNumber} details loaded successfully`,
          timestamp: new Date(),
          read: true
        });
      },
      error: (error) => {
        this._isLoading.set(false);
        this._error.set(error);
      }
    });
  }

  private startLiveUpdates(): void {
    // Simulate periodic status checks (in real app, this would be WebSocket or Server-Sent Events)
    timer(0, 10000).pipe(
      switchMap(() => {
        const orderId = this.currentOrder()?.id;
        if (!orderId) return of(null);

        return this.orderService.getOrder(orderId).pipe(
          catchError(error => {
            console.warn('Live update failed:', error);
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(order => {
      if (order) {
        this.checkForStatusUpdates(order);
      }
    });
  }

  private checkForStatusUpdates(newOrder: Order): void {
    const currentOrder = this.currentOrder()
    if (!currentOrder || currentOrder.status === newOrder.status) {
      return;
    }

    // Generate notification for status change
    const notification = this.createStatusUpdateNotification(newOrder.status);
    if (notification) {
      this.generateLiveUpdate(notification);
    }
  }

  private createStatusUpdateNotification(newStatus: OrderStatus): OrderNotification | null {
    const orderId = this.currentOrder()?.id;
    if (!orderId) return null;

    const notificationMap: Record<OrderStatus, { type: NotificationType; title: string; message: string }> = {
      [OrderStatus.CONFIRMED]: {
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and sent to the kitchen'
      },
      [OrderStatus.PREPARING]: {
        type: NotificationType.PREPARING,
        title: 'Preparing Your Order',
        message: 'Our kitchen team has started preparing your order'
      },
      [OrderStatus.READY]: {
        type: NotificationType.READY_FOR_PICKUP,
        title: 'Order Ready!',
        message: 'Your order is ready for pickup'
      },
      [OrderStatus.DELIVERED]: {
        type: NotificationType.DELIVERED,
        title: 'Order Complete',
        message: 'Thank you! Your order has been completed'
      },
      [OrderStatus.CANCELLED]: {
        type: NotificationType.CANCELLED,
        title: 'Order Cancelled',
        message: 'Your order has been cancelled'
      },
      [OrderStatus.FAILED]: {
        type: NotificationType.PAYMENT_FAILED,
        title: 'Order Failed',
        message: 'There was an issue with your order'
      }
    } as any;

    const config = notificationMap[newStatus];
    if (!config) return null;

    return {
      id: `status-${newStatus}-${Date.now()}`,
      orderId,
      type: config.type,
      title: config.title,
      message: config.message,
      timestamp: new Date(),
      read: false
    };
  }

  private generateLiveUpdate(notification: OrderNotification): void {
    this._liveUpdates.update(updates => [notification, ...updates.slice(0, 9)]); // Keep last 10 updates
  }

  private isStatusReached(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const statusOrder = [
      OrderStatus.DRAFT,
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.DELIVERED
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const targetIndex = statusOrder.indexOf(targetStatus);

    return currentIndex >= targetIndex;
  }

  private getEstimatedTimeForStatus(status: OrderStatus): number | undefined {
    const order = this.currentOrder()
    if (!order?.summary?.estimatedTime) return undefined;

    // Rough time estimates based on total preparation time
    const timeMap = {
      [OrderStatus.PREPARING]: Math.ceil(order.summary.estimatedTime * 0.8),
      [OrderStatus.READY]: Math.ceil(order.summary.estimatedTime * 0.2)
    } as any;

    return timeMap[status];
  }

  getTotalItemCount(): number {
    return this.currentOrder()?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  showCancelDialog(): void {
    this._showCancelConfirmation.set(true);
  }

  hideCancelDialog(): void {
    this._showCancelConfirmation.set(false);
    this.cancelReason = '';
  }

  confirmCancelOrder(): void {
    const orderId = this.currentOrder()?.id;
    if (!orderId) return;

    this._isProcessingAction.set(true);

    this.orderService.cancelOrder(orderId, this.cancelReason || undefined).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (success) => {
        this._isProcessingAction.set(false);
        if (success) {
          this.hideCancelDialog();
          this.generateLiveUpdate({
            id: `cancel-${Date.now()}`,
            orderId,
            type: NotificationType.CANCELLED,
            title: 'Order Cancelled',
            message: 'Your order has been successfully cancelled',
            timestamp: new Date(),
            read: false
          });
        }
      },
      error: (error) => {
        this._isProcessingAction.set(false);
        console.error('Failed to cancel order:', error);
      }
    });
  }

  modifyOrder(): void {
    // Navigate back to checkout with current order data
    this.router.navigate(['/order/checkout'], {
      queryParams: { modify: this.currentOrder()?.id }
    });
  }

  viewReceipt(): void {
    const orderId = this.currentOrder()?.id;
    if (orderId) {
      this.router.navigate(['/order/receipt', orderId]);
    }
  }

  shareOrder(): void {
    const order = this.currentOrder()
    if (!order) return;

    const url = window.location.href;
    const text = `Track my order #${order.trackingNumber} at TableTap`;

    if (navigator.share) {
      navigator.share({ title: 'Order Tracking', text, url });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${text}\n${url}`);
      // Show toast notification
      console.log('Order link copied to clipboard');
    }
  }

  retryLoadOrder(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getStatusIcon(status: OrderStatus): string {
    const iconMap = {
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

  getStatusLabel(status: OrderStatus): string {
    const labelMap = {
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

  getNotificationIcon(type: NotificationType): string {
    const iconMap = {
      [NotificationType.ORDER_CONFIRMED]: 'icon-check-circle',
      [NotificationType.PREPARING]: 'icon-chef-hat',
      [NotificationType.READY_FOR_PICKUP]: 'icon-shopping-bag',
      [NotificationType.OUT_FOR_DELIVERY]: 'icon-truck',
      [NotificationType.DELIVERED]: 'icon-thumbs-up',
      [NotificationType.DELAYED]: 'icon-clock',
      [NotificationType.CANCELLED]: 'icon-x-circle',
      [NotificationType.PAYMENT_FAILED]: 'icon-credit-card'
    };
    return iconMap[type] || 'icon-bell';
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
      'VENMO': 'icon-venmo'
    };
    return iconMap[type] || 'icon-payment';
  }
}