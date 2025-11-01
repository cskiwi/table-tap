import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DataViewModule } from 'primeng/dataview';
import { DividerModule } from 'primeng/divider';
import { KnobModule } from 'primeng/knob';

import { AdminService } from '../../services/admin.service';
import { AdminDashboardMetrics, InventoryAlert, EmployeePerformance, AdminDateRange } from '../../types/admin.types';

@Component({
  selector: 'tt-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ProgressBarModule,
    TableModule,
    TagModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    SkeletonModule,
    TooltipModule,
    DataViewModule,
    DividerModule,
    KnobModule,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);

  // Service data
  metrics = this.adminService.dashboardMetrics;
  revenueMetrics = this.adminService.revenueMetrics;
  orderMetrics = this.adminService.orderMetrics;
  inventoryAlerts = this.adminService.inventoryAlerts;
  employeePerformance = this.adminService.employeePerformance;
  loading = this.adminService.loading;

  // Local state
  selectedDateRange: Date[] = [];
  selectedPeriod = 'week';

  // Chart periods
  chartPeriods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
  ];
  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '$' + value;
          },
        },
      },
    },
  };

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Notifications from AdminService
  notifications = this.adminService.notifications;

  // Real recent activities from GraphQL subscriptions/queries
  recentActivities = computed(() => {
    const notifs = this.notifications();
    const recentNotifs = notifs.slice(0, 5);
    return recentNotifs.map((notif: any) => ({
      type: notif.type.toLowerCase(),
      icon: this.getIconForType(notif.type),
      title: notif.title,
      description: notif.message,
      timestamp: notif.createdAt || notif.timestamp || new Date(),
    }));
  });

  private getIconForType(type: string): string {
    const iconMap: Record<string, string> = {
      'ORDER_ALERT': 'pi pi-shopping-cart',
      'INVENTORY_ALERT': 'pi pi-exclamation-triangle',
      'LOW_STOCK': 'pi pi-exclamation-triangle',
      'EMPLOYEE_ALERT': 'pi pi-clock',
      'SYSTEM_ALERT': 'pi pi-info-circle',
      'REVENUE_MILESTONE': 'pi pi-chart-line',
      'PAYMENT_ISSUE': 'pi pi-dollar',
      'QUALITY_ALERT': 'pi pi-star',
    };
    return iconMap[type] || 'pi pi-bell';
  }
  // Computed values
  criticalAlerts = computed(() => this.inventoryAlerts().filter((alert) => alert.severity === 'CRITICAL' || alert.severity === 'HIGH'));

  topEmployees = computed(() =>
    this.employeePerformance()
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5),
  );

  revenueGrowth = computed(() => {
    const revenue = this.revenueMetrics();
    return revenue ? revenue.growth.daily : 0;
  });

  revenueChartData = computed(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 3000, 2500, 2200, 3200, 2450],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }));

  orderStatusChartData = computed(() => {
    const orders = this.orderMetrics();
    if (!orders) return { labels: [], datasets: [] };

    return {
      labels: ['Pending', 'Preparing', 'Ready', 'Completed'],
      datasets: [
        {
          data: [orders.pending, orders.preparing, orders.ready, orders.completed],
          backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'],
          hoverBackgroundColor: ['#D97706', '#2563EB', '#059669', '#4B5563'],
        },
      ],
    };
  });

  ngOnInit(): void {
    // Set default date range to last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    this.selectedDateRange = [startDate, endDate];
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  onDateRangeChange(): void {
    if (this.selectedDateRange && this.selectedDateRange.length === 2) {
      const dateRange: AdminDateRange = {
        startDate: this.selectedDateRange[0],
        endDate: this.selectedDateRange[1],
      };

      // Load data for selected date range
      this.adminService.loadRevenueMetrics(this.adminService.selectedCafeId(), dateRange);
    }
  }

  updateCharts(): void {
    // Update charts based on selected period
    console.log('Updating charts for period:', this.selectedPeriod);
  }

  refreshData(): void {
    this.adminService.refreshData();
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'LOW_STOCK':
        return 'pi pi-exclamation-triangle';
      case 'OUT_OF_STOCK':
        return 'pi pi-times-circle';
      case 'EXPIRING':
        return 'pi pi-clock';
      default:
        return 'pi pi-info-circle';
    }
  }

  getEmployeeStatusSeverity(status: string): 'info' | 'success' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    switch (status) {
      case 'CLOCKED_IN':
        return 'success';
      case 'ON_BREAK':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  dismissAlert(alertId: string): void {
    this.adminService.dismissAlert(alertId);
  }
}
