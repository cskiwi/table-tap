import { Component, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { ListboxModule } from 'primeng/listbox';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

import { KitchenService } from '../../services/kitchen.service';
import { KitchenMetrics, StaffPerformance, CounterUtilization } from '../../types/kitchen.types';

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TabsModule,
    ProgressBarModule,
    ListboxModule,
    DividerModule,
    ChipModule,
  ],
  templateUrl: './metrics-dashboard.component.html',
})
export class MetricsDashboardComponent {
  @Output() close = new EventEmitter<void>()

  private readonly kitchenService = inject(KitchenService);

  readonly metrics = this.kitchenService.metrics;

  // Helper methods
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  }

  getPrepTimeTrend(): string {
    // This would compare to previous period
    const trend = Math.random() > 0.5 ? 'positive' : 'negative';
    return trend;
  }

  getPrepTimeTrendIcon(): string {
    return this.getPrepTimeTrend() === 'positive' ? 'trending_down' : 'trending_up';
  }

  getPrepTimeTrendText(): string {
    const change = Math.floor(Math.random() * 10) + 1;
    const direction = this.getPrepTimeTrend() === 'positive' ? '-' : '+';
    return `${direction}${change}% vs yesterday`;
  }

  getEfficiencyColor(): string {
    const efficiency = this.metrics()?.efficiency || 0;
    if (efficiency >= 80) return 'primary';
    if (efficiency >= 60) return 'accent';
    return 'warn';
  }

  getQualityClass(): string {
    const score = this.metrics()?.qualityScore || 0;
    if (score >= 4.5) return 'excellent';
    if (score >= 4.0) return 'good';
    if (score >= 3.5) return 'average';
    return 'poor';
  }

  getQualityStars(): boolean[] {
    const score = this.metrics()?.qualityScore || 0;
    const stars: boolean[] = []
    for (let i = 1; i <= 5; i++) {
      stars.push(score >= i);
    }
    return stars;
  }

  getActiveStaffCount(): number {
    return this.metrics()?.staffPerformance.filter(staff =>
      staff.status === 'available' || staff.status === 'busy'
    ).length || 0;
  }

  getTotalHoursWorked(): number {
    return this.metrics()?.staffPerformance.reduce((total, staff) =>
      total + staff.hoursWorked, 0
    ) || 0;
  }

  getStaffStatusIcon(status: string): string {
    switch (status) {
      case 'available': return 'check_circle';
      case 'busy': return 'schedule';
      case 'break': return 'free_breakfast';
      case 'offline': return 'offline_bolt';
      default: return 'help';
    }
  }

  getPerformanceColor(efficiency: number): string {
    if (efficiency >= 85) return 'primary';
    if (efficiency >= 70) return 'accent';
    return 'warn';
  }

  getUtilizationColor(utilization: number): string {
    if (utilization >= 90) return 'warn';
    if (utilization >= 70) return 'accent';
    return 'primary';
  }

  getHourBarHeight(orders: number): number {
    const maxOrders = Math.max(...(this.metrics()?.hourlyStats.map(h => h.orders) || [1]));
    return (orders / maxOrders) * 100;
  }

  getPeakHours(): string {
    const hourlyStats = this.metrics()?.hourlyStats || []
    const maxOrders = Math.max(...hourlyStats.map(h => h.orders));
    const peakHours = hourlyStats
      .filter(h => h.orders === maxOrders)
      .map(h => this.formatHour(h.hour));

    return peakHours.join(', ') || 'N/A';
  }

  getSlowestPeriod(): string {
    const hourlyStats = this.metrics()?.hourlyStats || []
    const minOrders = Math.min(...hourlyStats.map(h => h.orders));
    const slowHours = hourlyStats
      .filter(h => h.orders === minOrders)
      .map(h => this.formatHour(h.hour));

    return slowHours.join(', ') || 'N/A';
  }

  getBestPerformanceHour(): string {
    const hourlyStats = this.metrics()?.hourlyStats || []
    const bestHour = hourlyStats.reduce((best, current) =>
      current.efficiency > best.efficiency ? current : best
    );

    return this.formatHour(bestHour?.hour || 0);
  }

  getBestEfficiency(): number {
    const hourlyStats = this.metrics()?.hourlyStats || []
    return Math.max(...hourlyStats.map(h => h.efficiency), 0);
  }

  refreshMetrics(): void {
    this.kitchenService.loadMetrics().subscribe()
  }

  exportReport(): void {
    // Implement report export functionality
    console.log('Exporting metrics report...');
  }

  // Track by functions for *ngFor
  trackByStaffId(index: number, staff: StaffPerformance): string {
    return staff.employeeId;
  }

  trackByCounterId(index: number, counter: CounterUtilization): string {
    return counter.counterId;
  }

  trackByHour(index: number, hour: any): number {
    return hour.hour;
  }
}