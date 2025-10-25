import { Injectable, computed, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, BehaviorSubject, combineLatest, interval, map, switchMap, shareReplay } from 'rxjs';
import {
  AdminDashboardMetrics,
  RevenueMetrics,
  OrderMetrics,
  InventoryAlert,
  EmployeePerformance,
  SalesAnalytics,
  AdminSettings,
  AdminNotification,
  AdminDateRange,
} from '../types/admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  // Reactive state using signals
  private readonly _selectedCafeId = signal<string>('');
  private readonly _dashboardMetrics = signal<AdminDashboardMetrics | null>(null);
  private readonly _revenueMetrics = signal<RevenueMetrics | null>(null);
  private readonly _orderMetrics = signal<OrderMetrics | null>(null);
  private readonly _inventoryAlerts = signal<InventoryAlert[]>([]);
  private readonly _employeePerformance = signal<EmployeePerformance[]>([]);
  private readonly _salesAnalytics = signal<SalesAnalytics | null>(null);
  private readonly _notifications = signal<AdminNotification[]>([]);
  private readonly _settings = signal<AdminSettings | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly selectedCafeId = this._selectedCafeId.asReadonly()
  readonly dashboardMetrics = this._dashboardMetrics.asReadonly()
  readonly revenueMetrics = this._revenueMetrics.asReadonly()
  readonly orderMetrics = this._orderMetrics.asReadonly()
  readonly inventoryAlerts = this._inventoryAlerts.asReadonly()
  readonly employeePerformance = this._employeePerformance.asReadonly()
  readonly salesAnalytics = this._salesAnalytics.asReadonly()
  readonly notifications = this._notifications.asReadonly()
  readonly settings = this._settings.asReadonly()
  readonly loading = this._loading.asReadonly()
  readonly error = this._error.asReadonly()

  // Computed values
  readonly unreadNotifications = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  readonly criticalAlerts = computed(() =>
    this.inventoryAlerts().filter(alert => alert.severity === 'CRITICAL').length
  );

  readonly activeEmployees = computed(() =>
    this.employeePerformance().filter(emp => emp.currentStatus === 'CLOCKED_IN').length
  );

  // Observables for real-time updates
  private readonly refreshInterval$ = interval(30000); // 30 seconds

  constructor(private apollo: Apollo) {
    this.setupRealTimeUpdates()
  }

  // Initialize admin dashboard for specific cafe
  initializeDashboard(cafeId: string): void {
    this._selectedCafeId.set(cafeId);
    this.loadDashboardData()
  }

  // Load all dashboard data
  private loadDashboardData(): void {
    const cafeId = this._selectedCafeId()
    if (!cafeId) return;

    this._loading.set(true);
    this._error.set(null);

    // Load all dashboard data using GraphQL queries
    this.loadDashboardMetrics(cafeId);
    this.loadRevenueMetrics(cafeId);
    this.loadOrderMetrics(cafeId);
    this.loadInventoryAlerts(cafeId);
    this.loadEmployeePerformance(cafeId);
    this.loadNotifications(cafeId);
  }

  loadRevenueMetrics(cafeId: string, dateRange?: AdminDateRange): void {
    import('../graphql/admin.operations').then(({ GET_REVENUE_METRICS }) => {
      this.apollo.watchQuery<{ revenueMetrics: RevenueMetrics }>({
        query: GET_REVENUE_METRICS,
        variables: { cafeId, dateRange },
      }).valueChanges.subscribe({
        next: (result) => {
          this._revenueMetrics.set(result.data.revenueMetrics);
        },
        error: (error) => {
          this._error.set(error.message);
        }
      });
    });
  }

  loadOrderMetrics(cafeId: string): void {
    import('../graphql/admin.operations').then(({ GET_ORDER_METRICS }) => {
      this.apollo.watchQuery<{ orderMetrics: OrderMetrics }>({
        query: GET_ORDER_METRICS,
        variables: { cafeId },
      }).valueChanges.subscribe({
        next: (result) => {
          this._orderMetrics.set(result.data.orderMetrics);
        },
        error: (error) => {
          this._error.set(error.message);
        }
      });
    });
  }

  private loadInventoryAlerts(cafeId: string): void {
    // TODO: Implement inventory alerts query once inventory system is complete
    this._inventoryAlerts.set([]);
  }

  private loadEmployeePerformance(cafeId: string): void {
    import('../graphql/admin.operations').then(({ GET_EMPLOYEE_PERFORMANCE }) => {
      this.apollo.watchQuery<{ employeePerformance: EmployeePerformance[] }>({
        query: GET_EMPLOYEE_PERFORMANCE,
        variables: { cafeId, limit: 10 },
      }).valueChanges.subscribe({
        next: (result) => {
          this._employeePerformance.set(result.data.employeePerformance);
        },
        error: (error) => {
          this._error.set(error.message);
        }
      });
    });
  }

  private loadNotifications(cafeId: string): void {
    import('../graphql/admin.operations').then(({ GET_ADMIN_NOTIFICATIONS }) => {
      this.apollo.watchQuery<{ adminNotifications: AdminNotification[] }>({
        query: GET_ADMIN_NOTIFICATIONS,
        variables: { cafeId, limit: 20 },
      }).valueChanges.subscribe({
        next: (result) => {
          this._notifications.set(result.data.adminNotifications);
        },
        error: (error) => {
          this._error.set(error.message);
        }
      });
    });
  }

  // Dashboard metrics
  private loadDashboardMetrics(cafeId: string): void {
    import('../graphql/admin.operations').then(({ GET_ADMIN_DASHBOARD }) => {
      this.apollo.watchQuery<{ adminDashboard: AdminDashboardMetrics }>({
        query: GET_ADMIN_DASHBOARD,
        variables: { cafeId },
      }).valueChanges.subscribe({
        next: (result) => {
          this._dashboardMetrics.set(result.data.adminDashboard);
          this._loading.set(false);
        },
        error: (error) => {
          this._error.set(error.message);
          this._loading.set(false);
        }
      });
    });
  }

 

  // Sales analytics
  loadSalesAnalytics(cafeId: string, dateRange: AdminDateRange): Observable<SalesAnalytics> {
    return new Observable(observer => {
      setTimeout(() => {
        const analytics: SalesAnalytics = {
          totalRevenue: 16789.45,
          orderCount: 542,
          averageOrderValue: 30.98,
          topProducts: [
            {
              productId: '1',
              productName: 'Cappuccino',
              quantity: 89,
              revenue: 445.00
            },
            {
              productId: '2',
              productName: 'Americano',
              quantity: 76,
              revenue: 304.00
            }
          ],
          revenueByHour: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            revenue: Math.random() * 500
          })),
          revenueByDay: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            revenue: Math.random() * 3000 + 1000
          })),
          paymentMethods: [
            { method: 'Card', amount: 12567.34, percentage: 74.9 },
            { method: 'Cash', amount: 3456.78, percentage: 20.6 },
            { method: 'Digital', amount: 765.33, percentage: 4.5 }
          ]
        };
        this._salesAnalytics.set(analytics);
        observer.next(analytics);
        observer.complete();
      }, 1000);
    });
  }

  // Settings management
  private loadSettings(cafeId: string): Observable<AdminSettings> {
    return new Observable(observer => {
      setTimeout(() => {
        const settings: AdminSettings = {
          general: {
            cafeName: 'TableTap Café',
            timezone: 'America/New_York',
            currency: 'USD',
            taxRate: 8.25,
            serviceCharge: 0,
          },
          operations: {
            orderTimeout: 30,
            autoAssignOrders: true,
            requirePaymentConfirmation: false,
            allowCancellations: true,
            maxOrdersPerCustomer: 5
          },
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            lowStockThreshold: 10,
            orderDelayThreshold: 15,
          },
          integrations: {
            paymentGateway: 'stripe',
            posSystem: 'square',
            accountingSystem: 'quickbooks',
            inventorySystem: 'internal',
          }
        }
        this._settings.set(settings);
        observer.next(settings);
        observer.complete()
      }, 500);
    });
  }

  updateSettings(cafeId: string, settings: Partial<AdminSettings>): Observable<AdminSettings> {
    return new Observable(observer => {
      setTimeout(() => {
        const currentSettings = this._settings()
        if (currentSettings) {
          const updatedSettings = { ...currentSettings, ...settings }
          this._settings.set(updatedSettings);
          observer.next(updatedSettings);
        }
        observer.complete()
      }, 500);
    });
  }

  // Real-time updates
  private setupRealTimeUpdates(): void {
    this.refreshInterval$.subscribe(() => {
      const cafeId = this._selectedCafeId()
      if (cafeId) {
        this.loadDashboardMetrics(cafeId);
        this.loadOrderMetrics(cafeId);
        this.loadInventoryAlerts(cafeId);
        this.loadEmployeePerformance(cafeId);
      }
    });
  }

  // Utility methods
  markNotificationAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  markAllNotificationsAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  dismissAlert(alertId: string): void {
    this._inventoryAlerts.update(alerts =>
      alerts.filter(alert => alert.id !== alertId)
    );
  }

  refreshData(): void {
    const cafeId = this._selectedCafeId()
    if (cafeId) {
      this.loadDashboardData()
    }
  }

  // Export functionality
  exportData(type: 'orders' | 'inventory' | 'employees' | 'analytics', format: 'CSV' | 'PDF' | 'EXCEL'): Observable<Blob> {
    return new Observable(observer => {
      // Mock implementation
      setTimeout(() => {
        const mockData = new Blob(['mock,export,data'], { type: 'text/csv' });
        observer.next(mockData);
        observer.complete()
      }, 1000);
    });
  }
}