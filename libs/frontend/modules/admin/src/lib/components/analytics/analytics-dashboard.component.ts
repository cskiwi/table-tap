import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';

import { AdminService } from '../../services/admin.service';
import { SalesAnalytics, AdminDateRange } from '../../types/admin.types';

@Component({
  selector: 'tt-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    TabsModule,
    TableModule,
    ChipModule,
    ProgressBarModule,
    DividerModule,
    FloatLabelModule,
    InputTextModule,
    ChartModule,
    TabsModule
  ],
  templateUrl: './analytics-dashboard.component.html',
})
export class AnalyticsDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  // State
  selectedDateRange: Date[] = []
  selectedPeriod = 'week';

  // Period options
  periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' }
  ];
  // Chart options
  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  }

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  }

  radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  }

  // Mock analytics data
  salesMetrics = computed(() => ({
    totalRevenue: 16789.45,
    orderCount: 542,
    averageOrderValue: 30.98,
  }));

  topProducts = computed(() => [
    { productId: '1', productName: 'Cappuccino', quantity: 89, revenue: 445.00 },
  { productId: '2', productName: 'Americano', quantity: 76, revenue: 304.00 },
  { productId: '3', productName: 'Latte', quantity: 65, revenue: 325.00 },
  { productId: '4', productName: 'Espresso', quantity: 54, revenue: 162.00 },
  { productId: '5', productName: 'Croissant', quantity: 43, revenue: 150.50 }
  ]);

  inventoryMetrics = computed(() => ({
    totalValue: 15420.50,
    turnoverRate: 4.2,
    wastePercentage: 2.3,
    stockAccuracy: 97.8,
  }));

  customerMetrics = computed(() => ({
    totalCustomers: 1247,
    returningCustomers: 68,
    lifetimeValue: 185.50,
    visitFrequency: 2.3,
  }));

  revenueChartData = computed(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue',
      data: [1200, 1900, 3000, 2500, 2200, 3200, 2450],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
  }
  ],
  }));

  hourlyChartData = computed(() => ({
    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
    datasets: [{
      label: 'Sales',
      data: [150, 450, 800, 400, 650, 300],
      backgroundColor: '#10B981',
  }
  ],
  }));

  orderTimeDistribution = computed(() => ({
    labels: ['0-5 min', '5-10 min', '10-15 min', '15+ min'],
    datasets: [{
      data: [25, 45, 20, 10],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
  }
  ],
  }));

  employeePerformanceChart = computed(() => ({
    labels: ['Speed', 'Accuracy', 'Customer Service', 'Teamwork', 'Initiative'],
    datasets: [{
      label: 'Average Performance',
      data: [85, 92, 88, 90, 87],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3B82F6',
  }
  ],
  }));

  categoryStockChart = computed(() => ({
    labels: ['Coffee', 'Dairy', 'Pastries', 'Supplies', 'Snacks'],
    datasets: [{
      label: 'Stock Level %',
      data: [85, 60, 90, 75, 95],
      backgroundColor: '#8B5CF6',
  }
  ],
  }));

  inventoryMovementChart = computed(() => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Stock In',
      data: [1000, 800, 1200, 900],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    }, {
      label: 'Stock Out',
      data: [850, 950, 1100, 800],
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
  }
  ],
  }));

  ngOnInit(): void {
    // Set default date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7);
    this.selectedDateRange = [startDate, endDate]

    this.loadAnalytics()
  }

  loadAnalytics(): void {
    const cafeId = this.adminService.selectedCafeId()
    if (cafeId) {
      const dateRange: AdminDateRange = {
        startDate: this.selectedDateRange[0],
        endDate: this.selectedDateRange[1]
      }

      this.adminService.loadSalesAnalytics(cafeId, dateRange).subscribe()
    }
  }

  onDateRangeChange(): void {
    if (this.selectedDateRange && this.selectedDateRange.length === 2) {
      this.loadAnalytics()
    }
  }

  onPeriodChange(): void {
    // Update date range based on selected period
    const endDate = new Date()
    const startDate = new Date()

    switch (this.selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    this.selectedDateRange = [startDate, endDate]
    this.loadAnalytics()
  }

  exportReports(): void {
    // Export analytics reports
  }

  getProductPerformance(product: any, index: number): number {
    // Calculate performance based on rank and sales
    return Math.max(100 - (index * 15), 20);
  }
}