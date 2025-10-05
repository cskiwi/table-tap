import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { ListboxModule } from 'primeng/listbox';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';

import { KitchenService } from '../../services/kitchen.service';
import { InventoryAlert, AlertSeverity, AlertType } from '../../types/kitchen.types';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ListboxModule,
    DividerModule,
    ChipModule,
    BadgeModule,
  ],
  templateUrl: './alerts-panel.component.html',
})
export class AlertsPanelComponent {
  @Input() embedded = false;
  @Output() close = new EventEmitter<void>()
  @Output() alertResolved = new EventEmitter<string>()

  private readonly kitchenService = inject(KitchenService);

  readonly alerts = this.kitchenService.alerts;

  // Computed alert groups
  unreadAlerts = () => this.alerts().filter(alert => !alert.resolved);
  resolvedAlerts = () => this.alerts().filter(alert => alert.resolved);
  criticalCount = () => this.alerts().filter(alert => alert.severity === AlertSeverity.CRITICAL && !alert.resolved).length;
  warningCount = () => this.alerts().filter(alert => alert.severity === AlertSeverity.WARNING && !alert.resolved).length;
  infoCount = () => this.alerts().filter(alert => alert.severity === AlertSeverity.INFO && !alert.resolved).length;

  sortedAlerts = () => {
    const alerts = [...this.alerts()];
    return alerts.sort((a, b) => {
      // Sort by resolved status (unresolved first)
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1;
      }

      // Sort by severity
      const severityOrder = {
        [AlertSeverity.CRITICAL]: 0
        [AlertSeverity.ERROR]: 1
        [AlertSeverity.WARNING]: 2
        [AlertSeverity.INFO]: 3
      }

      const severityA = severityOrder[a.severity] ?? 999;
      const severityB = severityOrder[b.severity] ?? 999;

      if (severityA !== severityB) {
        return severityA - severityB;
      }

      // Sort by creation time (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    });
  }

  getAlertClass(alert: InventoryAlert): string {
    const classes = [`severity-${alert.severity}`, `type-${alert.type}`];
    if (alert.resolved) {
      classes.push('resolved');
    }

    return classes.join(' ');
  }

  getAlertIcon(alert: InventoryAlert): string {
    switch (alert.type) {
      case AlertType.LOW_STOCK:
        return 'inventory_2';
      case AlertType.OUT_OF_STOCK:
        return 'remove_shopping_cart';
      case AlertType.EXPIRED:
        return 'schedule';
      case AlertType.TEMPERATURE:
        return 'thermostat';
      case AlertType.EQUIPMENT:
        return 'build';
      case AlertType.QUALITY:
        return 'verified';
      default:
        return this.getSeverityIcon(alert.severity);
    }
  }

  getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'error';
      case AlertSeverity.ERROR:
        return 'error_outline';
      case AlertSeverity.WARNING:
        return 'warning';
      case AlertSeverity.INFO:
        return 'info';
      default:
        return 'notifications';
    }
  }

  getAlertTitle(alert: InventoryAlert): string {
    switch (alert.type) {
      case AlertType.LOW_STOCK:
        return 'Low Stock Warning';
      case AlertType.OUT_OF_STOCK:
        return 'Out of Stock';
      case AlertType.EXPIRED:
        return 'Expired Item';
      case AlertType.TEMPERATURE:
        return 'Temperature Alert';
      case AlertType.EQUIPMENT:
        return 'Equipment Issue';
      case AlertType.QUALITY:
        return 'Quality Control';
      default:
        return 'Kitchen Alert';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  resolveAlert(alertId: string): void {
    this.kitchenService.resolveAlert(alertId).subscribe({
      next: () => {
        this.alertResolved.emit(alertId);
      }
      error: (error) => console.error('Failed to resolve alert:', error)
    });
  }

  viewDetails(alert: InventoryAlert): void {
    // Open alert details dialog
    console.log('View alert details:', alert);
  }

  snoozeAlert(alertId: string): void {
    // Implement snooze functionality
    console.log('Snooze alert:', alertId);
  }

  markAllRead(): void {
    // Mark all alerts as read
    const unreadIds = this.unreadAlerts().map(alert => alert.id);
    unreadIds.forEach(id => this.resolveAlert(id));
  }

  clearResolved(): void {
    // Clear resolved alerts from the list
    console.log('Clear resolved alerts');
  }

  refreshAlerts(): void {
    this.kitchenService.loadAlerts().subscribe()
  }

  trackByAlertId(index: number, alert: InventoryAlert): string {
    return alert.id;
  }
}