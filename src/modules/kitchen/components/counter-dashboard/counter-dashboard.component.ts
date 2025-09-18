import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SplitterModule } from 'primeng/splitter';
import { TabViewModule } from 'primeng/tabview';
import { TimelineModule } from 'primeng/timeline';
import { Order, OrderStatus, OrderType, SelectOption } from '../../../../shared/interfaces/common.interfaces';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { interval, Subject, takeUntil } from 'rxjs';

export interface CounterDashboardConfig {
  showOrderQueue: boolean;
  showOrderHistory: boolean;
  showOrderTimeline: boolean;
  showAnalytics: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  soundNotifications: boolean;
  showEstimatedTimes: boolean;
  maxQueueSize: number;
  groupByOrderType: boolean;
}

export interface OrderQueueItem extends Order {
  queuePosition: number;
  waitTime: number;
  estimatedCompletionTime: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedToday: number;
  averageWaitTime: number;
  averagePreparationTime: number;
  busyLevel: 'low' | 'medium' | 'high' | 'very-high';
}

@Component({
  selector: 'app-counter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    ButtonModule,
    TagModule,
    ChipModule,
    CardModule,
    ProgressBarModule,
    BadgeModule,
    DropdownModule,
    InputSwitchModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    SplitterModule,
    TabViewModule,
    TimelineModule
  ],
  template: `
    <div class="counter-dashboard" [ngClass]="getDashboardClasses()">

      <!-- Dashboard Header -->
      <div class="dashboard-header bg-white shadow-sm border-b border-gray-200 p-4 mb-6">
        <div class="flex justify-between items-center">

          <!-- Title and Stats -->
          <div class="header-info">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Kitchen Dashboard</h1>
            <div class="flex items-center space-x-6 text-sm text-gray-600">
              <div class="stat-item">
                <span class="font-medium text-blue-600">{{ stats.pendingOrders }}</span>
                <span>Pending</span>
              </div>
              <div class="stat-item">
                <span class="font-medium text-orange-600">{{ stats.preparingOrders }}</span>
                <span>Preparing</span>
              </div>
              <div class="stat-item">
                <span class="font-medium text-green-600">{{ stats.readyOrders }}</span>
                <span>Ready</span>
              </div>
              <div class="stat-item">
                <span class="font-medium text-gray-600">{{ stats.averageWaitTime }}min</span>
                <span>Avg Wait</span>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="header-controls flex items-center space-x-4">

            <!-- Auto Refresh Toggle -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Auto Refresh</label>
              <p-inputSwitch
                [(ngModel)]="config.autoRefresh"
                (onChange)="onAutoRefreshChange()">
              </p-inputSwitch>
            </div>

            <!-- Sound Notifications -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Sound</label>
              <p-inputSwitch
                [(ngModel)]="config.soundNotifications"
                (onChange)="onSoundToggle()">
              </p-inputSwitch>
            </div>

            <!-- Filter Dropdown -->
            <p-dropdown
              [options]="statusFilterOptions"
              [(ngModel)]="selectedStatusFilter"
              (onChange)="onStatusFilterChange()"
              optionLabel="label"
              optionValue="value"
              placeholder="All Orders"
              styleClass="w-40">
            </p-dropdown>

            <!-- Refresh Button -->
            <p-button
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              pTooltip="Refresh Dashboard"
              (onClick)="refreshDashboard()"
              [loading]="isRefreshing">
            </p-button>

          </div>
        </div>

        <!-- Busy Level Indicator -->
        <div class="busy-indicator mt-3" *ngIf="stats.busyLevel">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Kitchen Status:</span>
            <p-chip
              [label]="getBusyLevelLabel(stats.busyLevel)"
              [ngClass]="getBusyLevelClasses(stats.busyLevel)"
              [icon]="getBusyLevelIcon(stats.busyLevel)">
            </p-chip>
            <div class="flex-1 ml-4">
              <p-progressBar
                [value]="getBusyLevelValue(stats.busyLevel)"
                [showValue]="false"
                styleClass="h-2"
                [ngClass]="getBusyProgressClasses(stats.busyLevel)">
              </p-progressBar>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content -->
      <p-splitter [style]="{ height: 'calc(100vh - 200px)' }" [panelSizes]="[70, 30]">

        <!-- Left Panel - Order Queue -->
        <ng-template pTemplate>
          <div class="order-queue-panel p-4">

            <p-tabView>

              <!-- Active Orders Tab -->
              <p-tabPanel header="Active Orders" leftIcon="pi pi-clock">
                <div class="active-orders">

                  <!-- Queue Controls -->
                  <div class="queue-controls mb-4 flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                      <h3 class="text-lg font-semibold">Order Queue ({{ filteredOrders.length }})</h3>

                      <!-- Group by Order Type Toggle -->
                      <div class="flex items-center space-x-2">
                        <label class="text-sm text-gray-600">Group by Type</label>
                        <p-inputSwitch
                          [(ngModel)]="config.groupByOrderType"
                          size="small"
                          (onChange)="onGroupingChange()">
                        </p-inputSwitch>
                      </div>
                    </div>

                    <!-- Queue Actions -->
                    <div class="flex space-x-2">
                      <p-button
                        label="Clear Completed"
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                        [outlined]="true"
                        (onClick)="clearCompletedOrders()"
                        [disabled]="!hasCompletedOrders()">
                      </p-button>

                      <p-button
                        label="Print Queue"
                        icon="pi pi-print"
                        severity="secondary"
                        size="small"
                        [outlined]="true"
                        (onClick)="printQueue()">
                      </p-button>
                    </div>
                  </div>

                  <!-- Order Queue List -->
                  <div class="order-queue-list" [ngClass]="getQueueListClasses()">

                    <!-- Grouped by Order Type -->
                    <div *ngIf="config.groupByOrderType; else ungroupedOrders">
                      <div *ngFor="let group of groupedOrders" class="order-type-group mb-6">
                        <div class="group-header flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <h4 class="text-md font-semibold text-gray-800 flex items-center">
                            <i class="pi pi-{{ getOrderTypeIcon(group.type) }} mr-2"></i>
                            {{ getOrderTypeLabel(group.type) }} Orders
                          </h4>
                          <p-badge
                            [value]="group.orders.length.toString()"
                            severity="info">
                          </p-badge>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          <div *ngFor="let order of group.orders; trackBy: trackByOrderId" class="order-card-container">
                            <app-order-queue-card
                              [order]="order"
                              [showActions]="true"
                              [compact]="false"
                              (statusChange)="onOrderStatusChange($event)"
                              (viewDetails)="onViewOrderDetails($event)"
                              (assignTo)="onAssignOrder($event)"
                              (addNote)="onAddOrderNote($event)">
                            </app-order-queue-card>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Ungrouped Orders -->
                    <ng-template #ungroupedOrders>
                      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div *ngFor="let order of filteredOrders; trackBy: trackByOrderId" class="order-card-container">
                          <app-order-queue-card
                            [order]="order"
                            [showActions]="true"
                            [compact]="false"
                            (statusChange)="onOrderStatusChange($event)"
                            (viewDetails)="onViewOrderDetails($event)"
                            (assignTo)="onAssignOrder($event)"
                            (addNote)="onAddOrderNote($event)">
                          </app-order-queue-card>
                        </div>
                      </div>
                    </ng-template>

                    <!-- Empty State -->
                    <div class="empty-queue text-center py-12" *ngIf="filteredOrders.length === 0">
                      <i class="pi pi-check-circle text-4xl text-green-500 mb-4"></i>
                      <h3 class="text-lg font-semibold text-gray-600 mb-2">All caught up!</h3>
                      <p class="text-gray-500">No pending orders in the queue</p>
                    </div>

                  </div>
                </div>
              </p-tabPanel>

              <!-- Order Timeline Tab -->
              <p-tabPanel
                *ngIf="config.showOrderTimeline"
                header="Timeline"
                leftIcon="pi pi-history">
                <div class="order-timeline py-4">
                  <p-timeline
                    [value]="timelineEvents"
                    align="alternate"
                    styleClass="customized-timeline">

                    <ng-template pTemplate="marker" let-event>
                      <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-lg"
                            [ngClass]="getTimelineMarkerClass(event.status)">
                        <i [class]="'pi pi-' + getTimelineIcon(event.status)"></i>
                      </span>
                    </ng-template>

                    <ng-template pTemplate="content" let-event>
                      <p-card>
                        <div class="timeline-event-content">
                          <div class="flex justify-between items-start mb-2">
                            <h4 class="text-lg font-semibold">Order #{{ event.orderNumber }}</h4>
                            <small class="text-gray-500">{{ event.timestamp | date:'short' }}</small>
                          </div>

                          <p class="text-gray-600 mb-2">{{ event.description }}</p>

                          <div class="flex items-center space-x-2">
                            <p-tag
                              [value]="getStatusLabel(event.status)"
                              [severity]="getStatusSeverity(event.status)">
                            </p-tag>

                            <span class="text-sm text-gray-500" *ngIf="event.assignedTo">
                              Assigned to {{ event.assignedTo }}
                            </span>
                          </div>
                        </div>
                      </p-card>
                    </ng-template>

                  </p-timeline>
                </div>
              </p-tabPanel>

            </p-tabView>

          </div>
        </ng-template>

        <!-- Right Panel - Analytics & Controls -->
        <ng-template pTemplate>
          <div class="analytics-panel p-4 bg-gray-50">

            <p-tabView orientation="top">

              <!-- Statistics Tab -->
              <p-tabPanel header="Stats" leftIcon="pi pi-chart-bar">
                <div class="dashboard-stats">

                  <!-- Key Metrics Cards -->
                  <div class="grid grid-cols-1 gap-4 mb-6">

                    <!-- Total Orders Today -->
                    <p-card styleClass="text-center">
                      <div class="metric-card">
                        <div class="text-3xl font-bold text-blue-600 mb-1">{{ stats.totalOrders }}</div>
                        <div class="text-sm text-gray-600">Total Orders Today</div>
                        <div class="text-xs text-gray-500 mt-1">
                          +{{ stats.completedToday }} completed
                        </div>
                      </div>
                    </p-card>

                    <!-- Average Wait Time -->
                    <p-card styleClass="text-center">
                      <div class="metric-card">
                        <div class="text-3xl font-bold text-orange-600 mb-1">{{ stats.averageWaitTime }}min</div>
                        <div class="text-sm text-gray-600">Avg Wait Time</div>
                        <div class="text-xs text-gray-500 mt-1">
                          Target: &lt; 15min
                        </div>
                      </div>
                    </p-card>

                    <!-- Preparation Time -->
                    <p-card styleClass="text-center">
                      <div class="metric-card">
                        <div class="text-3xl font-bold text-green-600 mb-1">{{ stats.averagePreparationTime }}min</div>
                        <div class="text-sm text-gray-600">Avg Prep Time</div>
                        <div class="text-xs text-gray-500 mt-1">
                          Last 24 hours
                        </div>
                      </div>
                    </p-card>

                    <!-- Kitchen Efficiency -->
                    <p-card styleClass="text-center">
                      <div class="metric-card">
                        <div class="text-3xl font-bold text-purple-600 mb-1">{{ getKitchenEfficiency() }}%</div>
                        <div class="text-sm text-gray-600">Efficiency</div>
                        <div class="text-xs text-gray-500 mt-1">
                          On-time delivery
                        </div>
                      </div>
                    </p-card>

                  </div>

                  <!-- Order Status Distribution -->
                  <div class="order-distribution mb-6">
                    <h4 class="text-md font-semibold mb-3">Order Status Distribution</h4>
                    <div class="space-y-3">

                      <div class="status-bar">
                        <div class="flex justify-between text-sm mb-1">
                          <span>Pending</span>
                          <span>{{ stats.pendingOrders }} orders</span>
                        </div>
                        <p-progressBar
                          [value]="(stats.pendingOrders / stats.totalOrders) * 100"
                          [showValue]="false"
                          styleClass="h-2 bg-yellow-200">
                        </p-progressBar>
                      </div>

                      <div class="status-bar">
                        <div class="flex justify-between text-sm mb-1">
                          <span>Preparing</span>
                          <span>{{ stats.preparingOrders }} orders</span>
                        </div>
                        <p-progressBar
                          [value]="(stats.preparingOrders / stats.totalOrders) * 100"
                          [showValue]="false"
                          styleClass="h-2 bg-orange-200">
                        </p-progressBar>
                      </div>

                      <div class="status-bar">
                        <div class="flex justify-between text-sm mb-1">
                          <span>Ready</span>
                          <span>{{ stats.readyOrders }} orders</span>
                        </div>
                        <p-progressBar
                          [value]="(stats.readyOrders / stats.totalOrders) * 100"
                          [showValue]="false"
                          styleClass="h-2 bg-green-200">
                        </p-progressBar>
                      </div>

                    </div>
                  </div>

                  <!-- Performance Indicators -->
                  <div class="performance-indicators">
                    <h4 class="text-md font-semibold mb-3">Performance Alerts</h4>
                    <div class="space-y-2">

                      <div class="alert-item flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                           *ngIf="stats.averageWaitTime > 15">
                        <i class="pi pi-exclamation-triangle text-yellow-600 mr-2"></i>
                        <span class="text-sm text-yellow-800">
                          Average wait time exceeds target (15min)
                        </span>
                      </div>

                      <div class="alert-item flex items-center p-2 bg-red-50 border border-red-200 rounded-lg"
                           *ngIf="stats.pendingOrders > config.maxQueueSize">
                        <i class="pi pi-exclamation-circle text-red-600 mr-2"></i>
                        <span class="text-sm text-red-800">
                          Queue size exceeds capacity ({{ config.maxQueueSize }})
                        </span>
                      </div>

                      <div class="alert-item flex items-center p-2 bg-green-50 border border-green-200 rounded-lg"
                           *ngIf="getKitchenEfficiency() >= 95">
                        <i class="pi pi-check-circle text-green-600 mr-2"></i>
                        <span class="text-sm text-green-800">
                          Excellent performance! Keep it up!
                        </span>
                      </div>

                    </div>
                  </div>

                </div>
              </p-tabPanel>

              <!-- Settings Tab -->
              <p-tabPanel header="Settings" leftIcon="pi pi-cog">
                <div class="dashboard-settings space-y-4">

                  <div class="setting-group">
                    <h4 class="text-md font-semibold mb-3">Display Options</h4>
                    <div class="space-y-3">

                      <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Show Estimated Times</label>
                        <p-inputSwitch
                          [(ngModel)]="config.showEstimatedTimes"
                          size="small">
                        </p-inputSwitch>
                      </div>

                      <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Group by Order Type</label>
                        <p-inputSwitch
                          [(ngModel)]="config.groupByOrderType"
                          size="small"
                          (onChange)="onGroupingChange()">
                        </p-inputSwitch>
                      </div>

                    </div>
                  </div>

                  <div class="setting-group">
                    <h4 class="text-md font-semibold mb-3">Notifications</h4>
                    <div class="space-y-3">

                      <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Sound Notifications</label>
                        <p-inputSwitch
                          [(ngModel)]="config.soundNotifications"
                          size="small">
                        </p-inputSwitch>
                      </div>

                      <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Auto Refresh</label>
                        <p-inputSwitch
                          [(ngModel)]="config.autoRefresh"
                          size="small"
                          (onChange)="onAutoRefreshChange()">
                        </p-inputSwitch>
                      </div>

                    </div>
                  </div>

                  <div class="setting-group">
                    <h4 class="text-md font-semibold mb-3">Queue Settings</h4>
                    <div class="space-y-3">

                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Max Queue Size: {{ config.maxQueueSize }}
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="50"
                          [(ngModel)]="config.maxQueueSize"
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Refresh Interval: {{ config.refreshInterval }}s
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="60"
                          step="5"
                          [(ngModel)]="config.refreshInterval"
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          (change)="onRefreshIntervalChange()">
                      </div>

                    </div>
                  </div>

                </div>
              </p-tabPanel>

            </p-tabView>

          </div>
        </ng-template>

      </p-splitter>

      <!-- Toast for Notifications -->
      <p-toast position="top-right"></p-toast>

    </div>
  `,
  styleUrls: ['./counter-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterDashboardComponent extends BaseComponent implements OnInit, OnDestroy {
  @Input() orders: OrderQueueItem[] = [];
  @Input() config: CounterDashboardConfig = this.getDefaultConfig();
  @Input() initialStats?: DashboardStats;

  @Output() orderStatusChange = new EventEmitter<{ order: OrderQueueItem; newStatus: OrderStatus }>();
  @Output() orderAssign = new EventEmitter<{ order: OrderQueueItem; assignedTo: string }>();
  @Output() orderNote = new EventEmitter<{ order: OrderQueueItem; note: string }>();
  @Output() refreshRequest = new EventEmitter<void>();
  @Output() configChange = new EventEmitter<CounterDashboardConfig>();

  // State
  stats: DashboardStats = this.getDefaultStats();
  filteredOrders: OrderQueueItem[] = [];
  groupedOrders: Array<{ type: OrderType; orders: OrderQueueItem[] }> = [];
  timelineEvents: any[] = [];
  isRefreshing = false;
  selectedStatusFilter = 'all';

  // Auto refresh
  private refreshTimer$ = new Subject<void>();

  // Options
  statusFilterOptions: SelectOption[] = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready', value: 'ready' }
  ];

  ngOnInit(): void {
    super.ngOnInit();
    this.initializeStats();
    this.setupAutoRefresh();
    this.applyFilters();
    this.updateTimelineEvents();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.refreshTimer$.next();
    this.refreshTimer$.complete();
  }

  private getDefaultConfig(): CounterDashboardConfig {
    return {
      showOrderQueue: true,
      showOrderHistory: true,
      showOrderTimeline: true,
      showAnalytics: true,
      autoRefresh: true,
      refreshInterval: 30,
      soundNotifications: true,
      showEstimatedTimes: true,
      maxQueueSize: 25,
      groupByOrderType: false
    };
  }

  private getDefaultStats(): DashboardStats {
    return {
      totalOrders: 0,
      pendingOrders: 0,
      preparingOrders: 0,
      readyOrders: 0,
      completedToday: 0,
      averageWaitTime: 0,
      averagePreparationTime: 0,
      busyLevel: 'low'
    };
  }

  private initializeStats(): void {
    if (this.initialStats) {
      this.stats = { ...this.initialStats };
    } else {
      this.calculateStats();
    }
  }

  private calculateStats(): void {
    const activeOrders = this.orders.filter(o =>
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status)
    );

    this.stats = {
      totalOrders: this.orders.length,
      pendingOrders: this.orders.filter(o => o.status === OrderStatus.PENDING).length,
      preparingOrders: this.orders.filter(o => o.status === OrderStatus.PREPARING).length,
      readyOrders: this.orders.filter(o => o.status === OrderStatus.READY).length,
      completedToday: this.orders.filter(o => o.status === OrderStatus.COMPLETED).length,
      averageWaitTime: this.calculateAverageWaitTime(),
      averagePreparationTime: this.calculateAveragePreparationTime(),
      busyLevel: this.calculateBusyLevel(activeOrders.length)
    };
  }

  private calculateAverageWaitTime(): number {
    const waitingOrders = this.orders.filter(o => o.waitTime > 0);
    if (waitingOrders.length === 0) return 0;

    const totalWaitTime = waitingOrders.reduce((sum, order) => sum + order.waitTime, 0);
    return Math.round(totalWaitTime / waitingOrders.length);
  }

  private calculateAveragePreparationTime(): number {
    const completedOrders = this.orders.filter(o =>
      o.status === OrderStatus.COMPLETED && o.completedAt && o.createdAt
    );

    if (completedOrders.length === 0) return 0;

    const totalPrepTime = completedOrders.reduce((sum, order) => {
      const prepTime = new Date(order.completedAt!).getTime() - new Date(order.createdAt).getTime();
      return sum + (prepTime / 60000); // Convert to minutes
    }, 0);

    return Math.round(totalPrepTime / completedOrders.length);
  }

  private calculateBusyLevel(activeOrdersCount: number): 'low' | 'medium' | 'high' | 'very-high' {
    if (activeOrdersCount >= this.config.maxQueueSize * 0.9) return 'very-high';
    if (activeOrdersCount >= this.config.maxQueueSize * 0.7) return 'high';
    if (activeOrdersCount >= this.config.maxQueueSize * 0.4) return 'medium';
    return 'low';
  }

  private setupAutoRefresh(): void {
    if (this.config.autoRefresh) {
      interval(this.config.refreshInterval * 1000)
        .pipe(takeUntil(this.refreshTimer$))
        .subscribe(() => {
          this.refreshDashboard();
        });
    }
  }

  private applyFilters(): void {
    let filtered = [...this.orders];

    // Status filter
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatusFilter);
    }

    this.filteredOrders = filtered;

    // Group by order type if enabled
    if (this.config.groupByOrderType) {
      this.groupOrdersByType();
    }
  }

  private groupOrdersByType(): void {
    const groups = new Map<OrderType, OrderQueueItem[]>();

    this.filteredOrders.forEach(order => {
      if (!groups.has(order.orderType)) {
        groups.set(order.orderType, []);
      }
      groups.get(order.orderType)!.push(order);
    });

    this.groupedOrders = Array.from(groups.entries()).map(([type, orders]) => ({
      type,
      orders: orders.sort((a, b) => a.queuePosition - b.queuePosition)
    }));
  }

  private updateTimelineEvents(): void {
    this.timelineEvents = this.orders
      .filter(order => order.status !== OrderStatus.PENDING)
      .map(order => ({
        orderNumber: order.orderNumber,
        status: order.status,
        timestamp: order.updatedAt,
        description: this.getTimelineDescription(order),
        assignedTo: order.assignedTo
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // Limit to last 20 events
  }

  private getTimelineDescription(order: OrderQueueItem): string {
    switch (order.status) {
      case OrderStatus.CONFIRMED:
        return `Order confirmed - ${order.items.length} items`;
      case OrderStatus.PREPARING:
        return `Started preparation - Est. ${order.preparationTime}min`;
      case OrderStatus.READY:
        return `Order ready for ${order.orderType === OrderType.DINE_IN ? 'pickup' : order.orderType}`;
      case OrderStatus.COMPLETED:
        return `Order completed and delivered`;
      default:
        return `Status updated to ${order.status}`;
    }
  }

  // Event Handlers
  onOrderStatusChange(event: { order: OrderQueueItem; newStatus: OrderStatus }): void {
    this.orderStatusChange.emit(event);
    this.calculateStats();
    this.updateTimelineEvents();

    if (this.config.soundNotifications) {
      this.playNotificationSound();
    }
  }

  onViewOrderDetails(order: OrderQueueItem): void {
    // Implementation for viewing order details
    console.log('View order details:', order);
  }

  onAssignOrder(event: { order: OrderQueueItem; assignedTo: string }): void {
    this.orderAssign.emit(event);
  }

  onAddOrderNote(event: { order: OrderQueueItem; note: string }): void {
    this.orderNote.emit(event);
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onAutoRefreshChange(): void {
    if (this.config.autoRefresh) {
      this.setupAutoRefresh();
    } else {
      this.refreshTimer$.next();
    }
    this.configChange.emit(this.config);
  }

  onSoundToggle(): void {
    this.configChange.emit(this.config);
  }

  onGroupingChange(): void {
    this.applyFilters();
    this.configChange.emit(this.config);
  }

  onRefreshIntervalChange(): void {
    this.refreshTimer$.next();
    if (this.config.autoRefresh) {
      this.setupAutoRefresh();
    }
    this.configChange.emit(this.config);
  }

  refreshDashboard(): void {
    this.isRefreshing = true;
    this.refreshRequest.emit();

    // Simulate refresh delay
    setTimeout(() => {
      this.isRefreshing = false;
      this.calculateStats();
      this.applyFilters();
      this.updateTimelineEvents();
    }, 1000);
  }

  clearCompletedOrders(): void {
    // Emit event to parent to handle clearing completed orders
    console.log('Clear completed orders');
  }

  printQueue(): void {
    window.print();
  }

  hasCompletedOrders(): boolean {
    return this.orders.some(order => order.status === OrderStatus.COMPLETED);
  }

  // UI Helpers
  getDashboardClasses(): string {
    return this.getResponsiveClasses('min-h-screen bg-gray-100');
  }

  getQueueListClasses(): string {
    return this.config.groupByOrderType ? 'grouped-queue' : 'simple-queue';
  }

  getBusyLevelLabel(level: string): string {
    const labels = {
      low: 'Calm',
      medium: 'Busy',
      high: 'Very Busy',
      'very-high': 'Overwhelmed'
    };
    return labels[level as keyof typeof labels] || level;
  }

  getBusyLevelClasses(level: string): string {
    const classes = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      'very-high': 'bg-red-100 text-red-800'
    };
    return classes[level as keyof typeof classes] || '';
  }

  getBusyLevelIcon(level: string): string {
    const icons = {
      low: 'check-circle',
      medium: 'clock',
      high: 'exclamation-triangle',
      'very-high': 'exclamation-circle'
    };
    return icons[level as keyof typeof icons] || 'circle';
  }

  getBusyLevelValue(level: string): number {
    const values = {
      low: 25,
      medium: 50,
      high: 75,
      'very-high': 100
    };
    return values[level as keyof typeof values] || 0;
  }

  getBusyProgressClasses(level: string): string {
    const classes = {
      low: 'progress-green',
      medium: 'progress-yellow',
      high: 'progress-orange',
      'very-high': 'progress-red'
    };
    return classes[level as keyof typeof classes] || '';
  }

  getKitchenEfficiency(): number {
    if (this.stats.totalOrders === 0) return 100;

    const onTimeOrders = this.orders.filter(order =>
      order.status === OrderStatus.COMPLETED && order.waitTime <= 15
    ).length;

    return Math.round((onTimeOrders / this.stats.completedToday) * 100) || 100;
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

  getTimelineMarkerClass(status: OrderStatus): string {
    const classes = {
      [OrderStatus.CONFIRMED]: 'bg-blue-500',
      [OrderStatus.PREPARING]: 'bg-orange-500',
      [OrderStatus.READY]: 'bg-green-500',
      [OrderStatus.COMPLETED]: 'bg-gray-500',
      [OrderStatus.CANCELLED]: 'bg-red-500'
    };
    return classes[status] || 'bg-gray-400';
  }

  getTimelineIcon(status: OrderStatus): string {
    const icons = {
      [OrderStatus.CONFIRMED]: 'check',
      [OrderStatus.PREPARING]: 'clock',
      [OrderStatus.READY]: 'flag',
      [OrderStatus.COMPLETED]: 'check-circle',
      [OrderStatus.CANCELLED]: 'times'
    };
    return icons[status] || 'circle';
  }

  private playNotificationSound(): void {
    // Implementation for playing notification sound
    if ('Audio' in window) {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.play().catch(() => {
        // Handle audio play failure silently
      });
    }
  }

  // TrackBy Functions
  trackByOrderId(index: number, order: OrderQueueItem): string {
    return order.id;
  }

  protected override getAriaLabel(): string {
    return `Kitchen dashboard showing ${this.filteredOrders.length} orders in queue, ${this.stats.busyLevel} activity level`;
  }
}