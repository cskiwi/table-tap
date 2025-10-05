import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, BehaviorSubject, Subject, merge, timer } from 'rxjs';
import { map, filter, tap, catchError, switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Apollo, gql } from 'apollo-angular';
import {
  KitchenOrder
  KitchenOrderItem
  KitchenTimer
  KitchenMetrics
  KitchenFilters
  KitchenDisplaySettings
  PreparationStatus
  StepStatus
  TimerStatus
  OrderPriority
  InventoryAlert
  QualityControl
  KitchenStation
  WorkflowTemplate
} from '../types/kitchen.types';
import { Order, OrderStatus } from '@app/models';

@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private readonly http = inject(HttpClient);
  private readonly apollo = inject(Apollo);

  // State signals
  private readonly _orders = signal<KitchenOrder[]>([]);
  private readonly _activeTimers = signal<KitchenTimer[]>([]);
  private readonly _metrics = signal<KitchenMetrics | null>(null);
  private readonly _alerts = signal<InventoryAlert[]>([]);
  private readonly _stations = signal<KitchenStation[]>([]);
  private readonly _displaySettings = signal<KitchenDisplaySettings>({
    showTimers: true,
    showNotes: true,
    showAllergies: true,
    autoRefresh: true,
    refreshInterval: 30,
    soundEnabled: true,
    vibrationEnabled: false,
    theme: 'light',
    fontSize: 'medium',
    compactMode: false,
  });

  private readonly _filters = signal<KitchenFilters>({});
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Stream subjects for real-time updates
  private readonly ordersSubject = new BehaviorSubject<KitchenOrder[]>([]);
  private readonly timersSubject = new BehaviorSubject<KitchenTimer[]>([]);
  private readonly destroy$ = new Subject<void>()

  // Public readonly signals
  readonly orders = this._orders.asReadonly()
  readonly activeTimers = this._activeTimers.asReadonly()
  readonly metrics = this._metrics.asReadonly()
  readonly alerts = this._alerts.asReadonly()
  readonly stations = this._stations.asReadonly()
  readonly displaySettings = this._displaySettings.asReadonly()
  readonly filters = this._filters.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  // Computed signals
  readonly pendingOrders = computed(() =>
    this.orders().filter(order => order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PENDING)
  );

  readonly inProgressOrders = computed(() =>
    this.orders().filter(order => order.status === OrderStatus.PREPARING)
  );

  readonly completedOrders = computed(() =>
    this.orders().filter(order => order.status === OrderStatus.READY)
  );

  readonly urgentOrders = computed(() =>
    this.orders().filter(order => order.priority === OrderPriority.URGENT || order.priority === OrderPriority.RUSH)
  );

  readonly expiredTimers = computed(() =>
    this.activeTimers().filter(timer => timer.status === TimerStatus.EXPIRED)
  );

  readonly criticalAlerts = computed(() =>
    this.alerts().filter(alert => alert.severity === 'critical' && !alert.resolved)
  );

  readonly filteredOrders = computed(() => {
    const orders = this.orders()
    const filters = this.filters()

    return orders.filter(order => {
      if (filters.status && filters.status.length > 0) {
        const hasMatchingItems = order.items.some(item =>
          filters.status!.includes(item.preparationStatus)
        );
        if (!hasMatchingItems) return false;
      }

      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(order.priority)) return false;
      }

      if (filters.assignedStaff && filters.assignedStaff.length > 0) {
        if (!order.assignedStaff || !filters.assignedStaff.includes(order.assignedStaff.id)) {
          return false;
        }
      }

      if (filters.dateRange) {
        const orderDate = new Date(order.createdAt);
        if (orderDate < filters.dateRange.start || orderDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  });

  constructor() {
    this.initializeRealTimeUpdates()
    this.initializeTimerUpdates()
    this.loadInitialData()

    // Auto-save display settings
    effect(() => {
      const settings = this.displaySettings()
      localStorage.setItem('kitchen-display-settings', JSON.stringify(settings));
    });
  }

  private initializeRealTimeUpdates(): void {
    // Subscribe to GraphQL subscriptions for real-time order updates
    this.apollo.subscribe({
      query: gql`;
        subscription OrderStatusUpdated($cafeId: String!) {
          orderStatusUpdated(cafeId: $cafeId) {
            id
            orderNumber
            status
            items {
              id
              productId
              product {
                name
                preparationTime
              }
              quantity
              preparationStatus
            }
            preparingAt
            readyAt
            estimatedPrepTime
            specialInstructions
            priority
          }
        }
      `
      variables: { cafeId: this.getCurrentCafeId() }
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: any) => {
        this.updateOrderInList(result.data.orderStatusUpdated);
      }
    });

    // Auto-refresh data based on settings
    interval(this.displaySettings().refreshInterval * 1000).pipe(
      filter(() => this.displaySettings().autoRefresh)
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.refreshData()
    });
  }

  private initializeTimerUpdates(): void {
    // Update timer countdown every second
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateTimerCountdowns()
    });
  }

  private loadInitialData(): void {
    this._isLoading.set(true);

    Promise.all([
      this.loadOrders().toPromise()
      this.loadMetrics().toPromise()
      this.loadAlerts().toPromise()
      this.loadStations().toPromise()
    ]).then(() => {
      this._isLoading.set(false);
    }).catch(error => {
      this._error.set(error.message);
      this._isLoading.set(false);
    });

    // Load saved display settings
    const savedSettings = localStorage.getItem('kitchen-display-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this._displaySettings.set({ ...this.displaySettings(), ...settings });
      } catch (e) {
        console.warn('Failed to load saved display settings:', e);
      }
    }
  }

  // Order Management
  loadOrders(): Observable<KitchenOrder[]> {
    return this.apollo.watchQuery<{orders: KitchenOrder[]}>({
      query: gql`;
        query GetKitchenOrders($cafeId: String!, $status: [OrderStatus!]) {
          orders(filters: { cafeId: $cafeId, status: $status }) {
            items {
              id
              orderNumber
              status
              customerName
              orderType
              tableNumber
              createdAt
              confirmedAt
              preparingAt
              readyAt
              estimatedPrepTime
              specialInstructions
              notes
              priority
              items {
                id
                productId
                product {
                  name
                  category
                  preparationTime
                  countersRequired
                  attributes
                }
                quantity
                unitPrice
                customizations
                specialInstructions
                allergiesNotes
                preparationStatus
                preparationStartTime
                preparationEndTime
              }
              assignedStaff {
                id
                firstName
                lastName
                position
              }
              workflowSteps {
                stepName
                status
                assignedCounterId
                startedAt
                completedAt
              }
            }
          }
        }
      `
      variables: {
        cafeId: this.getCurrentCafeId()
        status: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY],
      }
    }).valueChanges.pipe(
      map(result => result.data.orders.items as KitchenOrder[])
      tap(orders => this._orders.set(orders))
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<KitchenOrder> {
    return this.apollo.mutate<{updateOrderStatus: KitchenOrder}>({
      mutation: gql`;
        mutation UpdateOrderStatus($id: String!, $input: UpdateOrderStatusInput!) {
          updateOrderStatus(id: $id, input: $input) {
            id
            status
            preparingAt
            readyAt
            items {
              id
              preparationStatus
            }
          }
        }
      `
      variables: {
        id: orderId;
        input: { status }
      }
    }).pipe(
      map(result => result.data!.updateOrderStatus)
      tap(order => this.updateOrderInList(order))
    );
  }

  updateItemStatus(orderItemId: string, status: PreparationStatus): Observable<KitchenOrderItem> {
    return this.http.patch<KitchenOrderItem>(`/api/kitchen/order-items/${orderItemId}/status`, {
      status
      timestamp: new Date().toISOString()
    }).pipe(
      tap(item => this.updateOrderItemInList(item))
    );
  }

  assignOrderToStaff(orderId: string, staffId: string): Observable<KitchenOrder> {
    return this.http.patch<KitchenOrder>(`/api/kitchen/orders/${orderId}/assign`, {
      staffId
    }).pipe(
      tap(order => this.updateOrderInList(order))
    );
  }

  // Timer Management
  createTimer(timer: Omit<KitchenTimer, 'id' | 'createdAt'>): Observable<KitchenTimer> {
    const newTimer: KitchenTimer = {
      ...timer
      id: this.generateId()
      createdAt: new Date()
      status: TimerStatus.IDLE;
    }

    return this.http.post<KitchenTimer>('/api/kitchen/timers', newTimer).pipe(
      tap(timer => {
        const timers = [...this.activeTimers(), timer];
        this._activeTimers.set(timers);
      })
    );
  }

  startTimer(timerId: string): Observable<KitchenTimer> {
    return this.http.patch<KitchenTimer>(`/api/kitchen/timers/${timerId}/start`, {
      startedAt: new Date().toISOString()
    }).pipe(
      tap(timer => this.updateTimerInList(timer))
    );
  }

  pauseTimer(timerId: string): Observable<KitchenTimer> {
    return this.http.patch<KitchenTimer>(`/api/kitchen/timers/${timerId}/pause`, {
      pausedAt: new Date().toISOString()
    }).pipe(
      tap(timer => this.updateTimerInList(timer))
    );
  }

  stopTimer(timerId: string): Observable<KitchenTimer> {
    return this.http.patch<KitchenTimer>(`/api/kitchen/timers/${timerId}/stop`, {
      completedAt: new Date().toISOString()
    }).pipe(
      tap(timer => this.updateTimerInList(timer))
    );
  }

  deleteTimer(timerId: string): Observable<void> {
    return this.http.delete<void>(`/api/kitchen/timers/${timerId}`).pipe(
      tap(() => {
        const timers = this.activeTimers().filter(t => t.id !== timerId);
        this._activeTimers.set(timers);
      })
    );
  }

  // Metrics and Analytics
  loadMetrics(): Observable<KitchenMetrics> {
    return this.http.get<KitchenMetrics>(`/api/kitchen/metrics?cafeId=${this.getCurrentCafeId()}`).pipe(
      tap(metrics => this._metrics.set(metrics))
    );
  }

  // Inventory and Alerts
  loadAlerts(): Observable<InventoryAlert[]> {
    return this.http.get<InventoryAlert[]>(`/api/kitchen/alerts?cafeId=${this.getCurrentCafeId()}`).pipe(
      tap(alerts => this._alerts.set(alerts))
    );
  }

  resolveAlert(alertId: string): Observable<InventoryAlert> {
    return this.http.patch<InventoryAlert>(`/api/kitchen/alerts/${alertId}/resolve`, {
      resolvedAt: new Date().toISOString()
    }).pipe(
      tap(alert => this.updateAlertInList(alert))
    );
  }

  // Stations Management
  loadStations(): Observable<KitchenStation[]> {
    return this.http.get<KitchenStation[]>(`/api/kitchen/stations?cafeId=${this.getCurrentCafeId()}`).pipe(
      tap(stations => this._stations.set(stations))
    );
  }

  // Quality Control
  createQualityCheck(orderId: string, orderItemId?: string): Observable<QualityControl> {
    return this.http.post<QualityControl>('/api/kitchen/quality-control', {
      orderId
      orderItemId
      createdAt: new Date().toISOString()
    });
  }

  submitQualityCheck(qualityControlId: string, data: Partial<QualityControl>): Observable<QualityControl> {
    return this.http.patch<QualityControl>(`/api/kitchen/quality-control/${qualityControlId}`, data);
  }

  // Workflow Templates
  loadWorkflowTemplates(): Observable<WorkflowTemplate[]> {
    return this.http.get<WorkflowTemplate[]>(`/api/kitchen/workflow-templates?cafeId=${this.getCurrentCafeId()}`);
  }

  applyWorkflowTemplate(orderId: string, templateId: string): Observable<KitchenOrder> {
    return this.http.post<KitchenOrder>(`/api/kitchen/orders/${orderId}/apply-workflow`, {
      templateId
    }).pipe(
      tap(order => this.updateOrderInList(order))
    );
  }

  // Settings Management
  updateDisplaySettings(settings: Partial<KitchenDisplaySettings>): void {
    this._displaySettings.update(current => ({ ...current, ...settings }));
  }

  updateFilters(filters: Partial<KitchenFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  clearFilters(): void {
    this._filters.set({});
  }

  // Real-time Updates
  refreshData(): void {
    this.loadOrders().subscribe()
    this.loadMetrics().subscribe()
    this.loadAlerts().subscribe()
  }

  // Sound and Notifications
  playNotificationSound(type: 'new-order' | 'timer-expired' | 'order-ready' | 'alert'): void {
    if (!this.displaySettings().soundEnabled) return;

    const audio = new Audio()
    switch (type) {
      case 'new-order':
        audio.src = '/assets/sounds/new-order.wav';
        break;
      case 'timer-expired':
        audio.src = '/assets/sounds/timer-expired.wav';
        break;
      case 'order-ready':
        audio.src = '/assets/sounds/order-ready.wav';
        break;
      case 'alert':
        audio.src = '/assets/sounds/alert.wav';
        break;
    }
    audio.play().catch(e => console.warn('Failed to play notification sound:', e));
  }

  vibrateDevice(pattern: number | number[] = 200): void {
    if (!this.displaySettings().vibrationEnabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }

  // Helper Methods
  private updateOrderInList(updatedOrder: Partial<KitchenOrder>): void {
    this._orders.update(orders =>
      orders.map(order =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      )
    );
  }

  private updateOrderItemInList(updatedItem: KitchenOrderItem): void {
    this._orders.update(orders =>
      orders.map(order => ({
        ...order
        items: order.items.map(item =>;
          item.id === updatedItem.id ? updatedItem : item
        )
      }))
    );
  }

  private updateTimerInList(updatedTimer: KitchenTimer): void {
    this._activeTimers.update(timers =>
      timers.map(timer =>
        timer.id === updatedTimer.id ? updatedTimer : timer
      )
    );
  }

  private updateAlertInList(updatedAlert: InventoryAlert): void {
    this._alerts.update(alerts =>
      alerts.map(alert =>
        alert.id === updatedAlert.id ? updatedAlert : alert
      )
    );
  }

  private updateTimerCountdowns(): void {
    this._activeTimers.update(timers =>
      timers.map(timer => {
        if (timer.status === TimerStatus.RUNNING && timer.startedAt) {
          const elapsed = Math.floor((Date.now() - timer.startedAt.getTime()) / 1000);
          const remaining = Math.max(0, timer.duration - elapsed);

          if (remaining === 0 && timer.status !== TimerStatus.EXPIRED) {
            this.playNotificationSound('timer-expired');
            this.vibrateDevice([200, 100, 200]);
            return { ...timer, remainingTime: 0, status: TimerStatus.EXPIRED }
          }

          return { ...timer, remainingTime: remaining }
        }
        return timer;
      })
    );
  }

  private getCurrentCafeId(): string {
    // This should be obtained from the auth service or app state
    return localStorage.getItem('currentCafeId') || '';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}