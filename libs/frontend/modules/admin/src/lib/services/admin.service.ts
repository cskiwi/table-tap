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

    // Load dashboard metrics
    this.loadDashboardMetrics(cafeId);
    this.loadRevenueMetrics(cafeId);
    this.loadOrderMetrics(cafeId);
    this.loadInventoryAlerts(cafeId);
    this.loadEmployeePerformance(cafeId);
    this.loadNotifications(cafeId);
  }

  // Dashboard metrics
  private loadDashboardMetrics(cafeId: string): void {
    // Mock implementation - replace with GraphQL query
    setTimeout(() => {
      const metrics: AdminDashboardMetrics = {
        todayRevenue: 2450.75,
        todayOrders: 87,
        activeEmployees: 12,
        lowStockItems: 5,
        pendingOrders: 8,
        averageOrderValue: 28.16,
        customerCount: 156,
        inventoryValue: 15420.50,
      }
      this._dashboardMetrics.set(metrics);
      this._loading.set(false);
    }, 1000);
  }

  // Revenue metrics
  loadRevenueMetrics(cafeId: string, dateRange?: AdminDateRange): Observable<RevenueMetrics> {
    // Mock implementation - replace with GraphQL query
    return new Observable(observer => {
      setTimeout(() => {
        const metrics: RevenueMetrics = {
          today: 2450.75,
          yesterday: 2156.32,
          thisWeek: 16789.45,
          lastWeek: 15234.67,
          thisMonth: 67543.21,
          lastMonth: 58976.54,
          growth: {
            daily: 13.6,
            weekly: 10.2,
            monthly: 14.5,
          }
        }
        this._revenueMetrics.set(metrics);
        observer.next(metrics);
        observer.complete()
      }, 500);
    });
  }

  // Order metrics
  private loadOrderMetrics(cafeId: string): void {
    // Mock implementation - replace with GraphQL query
    setTimeout(() => {
      const metrics: OrderMetrics = {
        total: 87,
        pending: 8,
        preparing: 15,
        ready: 4,
        completed: 58,
        cancelled: 2,
        averageTime: 12.5,
        peakHours: [
          { hour: 8, count: 12 },
          { hour: 12, count: 25 },
          { hour: 18, count: 18 }
        ]
      };
      this._orderMetrics.set(metrics);
    }, 700);
  }

  // Inventory alerts
  private loadInventoryAlerts(cafeId: string): void {
    // Mock implementation - replace with GraphQL query
    setTimeout(() => {
      const alerts: InventoryAlert[] = [
        {
          id: '1',
          type: 'LOW_STOCK',
          itemName: 'Colombian Coffee Beans',
          sku: 'COF-001',
          currentStock: 2,
          minimumStock: 10,
          severity: 'HIGH',
          message: 'Stock running low - only 2 units remaining',
          createdAt: new Date()
        },
  {
          id: '2',
          type: 'OUT_OF_STOCK',
          itemName: 'Oat Milk',
          sku: 'MLK-003',
          currentStock: 0,
          minimumStock: 5,
          severity: 'CRITICAL',
          message: 'Out of stock - immediate restocking required',
          createdAt: new Date()
  }
  ];
      this._inventoryAlerts.set(alerts);
    }, 600);
  }

  // Employee performance
  private loadEmployeePerformance(cafeId: string): void {
    // Mock implementation - replace with GraphQL query
    setTimeout(() => {
      const performance: EmployeePerformance[] = [
        {
          employeeId: '1',
          employeeName: 'Sarah Johnson',
          position: 'Barista',
          ordersProcessed: 23,
          averageOrderTime: 3.2,
          customerRating: 4.8,
          hoursWorked: 6.5,
          efficiency: 92,
          currentStatus: 'CLOCKED_IN',
        },
  {
          employeeId: '2',
          employeeName: 'Mike Chen',
          position: 'Cashier',
          ordersProcessed: 31,
          averageOrderTime: 2.1,
          customerRating: 4.6,
          hoursWorked: 7.0,
          efficiency: 88,
          currentStatus: 'CLOCKED_IN',
  }
  ];
      this._employeePerformance.set(performance);
    }, 800);
  }

  // Notifications
  private loadNotifications(cafeId: string): void {
    // Mock implementation - replace with GraphQL query
    setTimeout(() => {
      const notifications: AdminNotification[] = [
        {
          id: '1',
          type: 'WARNING',
          title: 'Low Stock Alert',
          message: 'Colombian Coffee Beans running low',
          timestamp: new Date(),
          read: false,
          actionUrl: '/admin/inventory'
        },
        {
          id: '2',
          type: 'INFO',
          title: 'Daily Report Ready',
          message: 'Yesterday\'s sales report is available',
          timestamp: new Date(Date.now() - 3600000),
          read: true,
          actionUrl: '/admin/analytics'
        }
      ];
      this._notifications.set(notifications);
    }, 400);
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
  loadSettings(cafeId: string): Observable<AdminSettings> {
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