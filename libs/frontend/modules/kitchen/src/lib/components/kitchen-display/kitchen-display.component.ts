import { Component, computed, effect, inject, signal } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { KitchenService } from '../../services/kitchen.service';
import { Order, OrderStatus } from '@app/models';
import { OrderPriority, PreparationStatus, TimerStatus, TimerType, TimerPriority } from '@app/models/enums';
import { OrderCardComponent } from '../order-card/order-card.component';
import { TimerPanelComponent } from '../timer-panel/timer-panel.component';
import { MetricsDashboardComponent } from '../metrics-dashboard/metrics-dashboard.component';
import { AlertsPanelComponent } from '../alerts-panel/alerts-panel.component';
import { SettingsPanelComponent } from '../settings-panel/settings-panel.component';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    ChipModule,
    MenuModule,
    BadgeModule,
    ToolbarModule,
    DividerModule,
    ProgressBarModule,
    DragDropModule,
    OrderCardComponent,
    TimerPanelComponent,
    MetricsDashboardComponent,
    AlertsPanelComponent,
    SettingsPanelComponent
],
  templateUrl: './kitchen-display.component.html',
})
export class KitchenDisplayComponent {
  private readonly kitchenService = inject(KitchenService);

  // Panel visibility state
  private readonly _showTimerPanel = signal(false);
  private readonly _showMetricsPanel = signal(false);
  private readonly _showAlertsPanel = signal(false);

  // Computed properties from service
  readonly pendingOrders = this.kitchenService.pendingOrders;
  readonly inProgressOrders = this.kitchenService.inProgressOrders;
  readonly readyOrders = computed(() =>
    this.kitchenService.completedOrders()
  );
  readonly displaySettings = this.kitchenService.displaySettings;
  readonly isLoading = this.kitchenService.isLoading;
  readonly criticalAlerts = this.kitchenService.criticalAlerts;
  readonly expiredTimers = this.kitchenService.expiredTimers;

  // Panel visibility computed properties
  readonly showTimerPanel = this._showTimerPanel.asReadonly()
  readonly showMetricsPanel = this._showMetricsPanel.asReadonly()
  readonly showAlertsPanel = this._showAlertsPanel.asReadonly()
  readonly showAnyPanel = computed(() =>
    this.showTimerPanel() || this.showMetricsPanel() || this.showAlertsPanel()
  );

  // Count computed properties
  readonly pendingCount = computed(() => this.pendingOrders().length);
  readonly inProgressCount = computed(() => this.inProgressOrders().length);
  readonly readyCount = computed(() => this.readyOrders().length);
  readonly criticalAlertsCount = computed(() => this.criticalAlerts().length);
  readonly expiredTimersCount = computed(() => this.expiredTimers().length);

  // Theme computed property
  readonly themeClass = computed(() => {
    const theme = this.displaySettings().theme;
    const fontSize = this.displaySettings().fontSize;
    return `theme-${theme} font-${fontSize}`;
  });

  constructor() {
    // Auto-close panels when no content
    effect(() => {
      if (this.criticalAlertsCount() === 0 && this.showAlertsPanel()) {
        this._showAlertsPanel.set(false);
      }
      if (this.expiredTimersCount() === 0 && this.showTimerPanel()) {
        this._showTimerPanel.set(false);
      }
    });
  }

  // Panel toggle methods
  toggleTimerPanel(): void {
    this._showTimerPanel.update(show => !show);
  }

  toggleMetricsPanel(): void {
    this._showMetricsPanel.update(show => !show);
  }

  toggleAlertsPanel(): void {
    this._showAlertsPanel.update(show => !show);
  }

  // Order management methods
  onOrderStatusChanged(event: { orderId: string; status: OrderStatus }): void {
    this.kitchenService.updateOrderStatus(event.orderId, event.status).subscribe({
      next: () => {
        if (event.status === OrderStatus.READY) {
          this.kitchenService.playNotificationSound('order-ready');
        }
      },
      error: (error) => console.error('Failed to update order status:', error)
    });
  }

  onItemStatusChanged(event: { itemId: string; status: PreparationStatus }): void {
    this.kitchenService.updateItemStatus(event.itemId, event.status).subscribe({
      error: (error) => console.error('Failed to update item status:', error)
    });
  }

  onTimerCreated(event: { orderId: string; itemId?: string; duration: number; name: string }): void {
    this.kitchenService.createTimer({
      orderId: event.orderId,
      orderItemId: event.itemId,
      name: event.name,
      duration: event.duration,
      remainingTime: event.duration,
      status: TimerStatus.IDLE,
      type: TimerType.COOKING,
      priority: TimerPriority.MEDIUM,
      sound: true,
      vibration: false,
    }).subscribe({
      error: (error) => console.error('Failed to create timer:', error)
    });
  }

  onStaffAssigned(event: { orderId: string; staffId: string }): void {
    this.kitchenService.assignOrderToStaff(event.orderId, event.staffId).subscribe({
      error: (error) => console.error('Failed to assign staff:', error)
    });
  }

  onQualityCheck(event: { orderId: string; itemId?: string }): void {
    this.kitchenService.createQualityCheck(event.orderId, event.itemId).subscribe({
      next: (qualityControl) => {
        // Open quality check dialog
        console.log('Quality check created:', qualityControl);
      },
      error: (error) => console.error('Failed to create quality check:', error)
    });
  }

  // Drag and drop
  onOrderDrop(event: CdkDragDrop<Order[]>, column: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Handle moving between columns (status change)
      const order = event.previousContainer.data[event.previousIndex]
      let newStatus: OrderStatus;

      switch (column) {
        case 'pending':
          newStatus = OrderStatus.CONFIRMED;
          break;
        case 'in-progress':
          newStatus = OrderStatus.PREPARING;
          break;
        case 'ready':
          newStatus = OrderStatus.READY;
          break;
        default:
          return;
      }

      this.onOrderStatusChanged({ orderId: order.id, status: newStatus });
    }
  }

  // Menu actions
  sortPendingByPriority(): void {
    // This would trigger a sort in the service
    console.log('Sort pending by priority');
  }

  sortPendingByTime(): void {
    // This would trigger a sort in the service
    console.log('Sort pending by time');
  }

  assignAllPending(): void {
    // Auto-assign logic
    console.log('Auto-assign all pending orders');
  }

  showProgressTimers(): void {
    this._showTimerPanel.set(true);
  }

  checkProgressStatus(): void {
    // Status check logic
    console.log('Check progress status');
  }

  markAllDelivered(): void {
    const readyOrders = this.readyOrders()
    readyOrders.forEach(order => {
      this.onOrderStatusChanged({ orderId: order.id, status: OrderStatus.DELIVERED });
    });
  }

  qualityCheckAll(): void {
    const readyOrders = this.readyOrders()
    readyOrders.forEach(order => {
      this.onQualityCheck({ orderId: order.id });
    });
  }

  // Settings and alerts
  onSettingsChanged(settings: any): void {
    this.kitchenService.updateDisplaySettings(settings);
  }

  onAlertResolved(alertId: string): void {
    this.kitchenService.resolveAlert(alertId).subscribe({
      error: (error) => console.error('Failed to resolve alert:', error)
    });
  }

  // Utility methods
  refreshData(): void {
    this.kitchenService.refreshData()
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }
}