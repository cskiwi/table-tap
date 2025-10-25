import { Component, Output, EventEmitter, inject, computed } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { ListboxModule } from 'primeng/listbox';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

import { KitchenService } from '../../services/kitchen.service';
import { TimerStatus, TimerType } from '@app/models/enums';

@Component({
  selector: 'app-timer-panel',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    ListboxModule,
    DividerModule,
    BadgeModule,
    TooltipModule,
    ProgressBarModule
],
  templateUrl: './timer-panel.component.html',
})
export class TimerPanelComponent {
  @Output() close = new EventEmitter<void>()

  private readonly kitchenService = inject(KitchenService);

  // Service data
  readonly activeTimers = this.kitchenService.activeTimers;
  readonly orders = this.kitchenService.orders;

  // Computed timer groups
  readonly runningTimers = computed(() =>
    this.activeTimers().filter(timer => timer.status === TimerStatus.RUNNING)
  );

  readonly expiredTimers = computed(() =>
    this.activeTimers().filter(timer => timer.status === TimerStatus.EXPIRED)
  );

  readonly pausedTimers = computed(() =>
    this.activeTimers().filter(timer => timer.status === TimerStatus.PAUSED)
  );

  readonly sortedTimers = computed(() => {
    const timers = [...this.activeTimers()];
    return timers.sort((a, b) => {
      // Priority order: expired, running, paused, others
      const statusPriority = {
        [TimerStatus.EXPIRED]: 0,
        [TimerStatus.RUNNING]: 1,
        [TimerStatus.PAUSED]: 2,
        [TimerStatus.IDLE]: 3,
        [TimerStatus.COMPLETED]: 4,
        [TimerStatus.CANCELLED]: 5
      }

      const priorityA = statusPriority[a.status as TimerStatus] ?? 999;
      const priorityB = statusPriority[b.status as TimerStatus] ?? 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same status, sort by remaining time (ascending for running/expired)
      if (a.status === TimerStatus.RUNNING || a.status === TimerStatus.EXPIRED) {
        return a.remainingTime - b.remainingTime;
      }

      // For others, sort by creation time (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    });
  });

  // State
  private _isMuted = false;

  isMuted(): boolean {
    return this._isMuted;
  }

  // Timer management methods
  startTimer(timerId: string): void {
    this.kitchenService.startTimer(timerId).subscribe({
      error: (error) => console.error('Failed to start timer:', error)
    });
  }

  pauseTimer(timerId: string): void {
    this.kitchenService.pauseTimer(timerId).subscribe({
      error: (error) => console.error('Failed to pause timer:', error)
    });
  }

  stopTimer(timerId: string): void {
    this.kitchenService.stopTimer(timerId).subscribe({
      error: (error) => console.error('Failed to stop timer:', error)
    });
  }

  resetTimer(timerId: string): void {
    // For now, we'll recreate the timer with the same settings
    const timer = this.activeTimers().find(t => t.id === timerId);
    if (timer) {
      this.deleteTimer(timerId);
      this.kitchenService.createTimer({
        orderId: timer.orderId,
        orderItemId: timer.orderItemId,
        name: timer.name,
        duration: timer.duration,
        remainingTime: timer.duration,
        status: TimerStatus.IDLE,
        type: timer.type,
        priority: timer.priority,
        sound: timer.sound,
        vibration: timer.vibration
      }).subscribe({
        error: (error) => console.error('Failed to reset timer:', error)
      });
    }
  }

  deleteTimer(timerId: string): void {
    this.kitchenService.deleteTimer(timerId).subscribe({
      error: (error) => console.error('Failed to delete timer:', error)
    });
  }

  // Bulk actions
  pauseAllTimers(): void {
    this.runningTimers().forEach(timer => {
      this.pauseTimer(timer.id);
    });
  }

  stopAllExpired(): void {
    this.expiredTimers().forEach(timer => {
      this.deleteTimer(timer.id);
    });
  }

  muteAllSounds(): void {
    this._isMuted = !this._isMuted;
    // Update service settings
    this.kitchenService.updateDisplaySettings({ soundEnabled: !this._isMuted });
  }

  // Helper methods
  getTimerClass(timer: any): string {
    const classes = [`timer-${timer.status}`, `priority-${timer.priority}`];
    if (timer.status === TimerStatus.EXPIRED) {
      classes.push('expired');
    }

    if (timer.remainingTime <= 60 && timer.status === TimerStatus.RUNNING) {
      classes.push('critical');
    }

    return classes.join(' ');
  }

  getTimeClass(timer: any): string {
    if (timer.status === TimerStatus.EXPIRED) return 'expired';
    if (timer.remainingTime <= 60 && timer.status === TimerStatus.RUNNING) return 'critical';
    if (timer.remainingTime <= 300 && timer.status === TimerStatus.RUNNING) return 'warning';
    return 'normal';
  }

  getProgressPercentage(timer: any): number {
    if (timer.duration === 0) return 0;
    const elapsed = timer.duration - timer.remainingTime;
    return Math.min((elapsed / timer.duration) * 100, 100);
  }

  getProgressColor(timer: any): string {
    if (timer.status === TimerStatus.EXPIRED) return 'warn';
    if (timer.remainingTime <= 60) return 'warn';
    if (timer.remainingTime <= 300) return 'accent';
    return 'primary';
  }

  formatTime(seconds: number): string {
    if (seconds < 0) seconds = 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getOrderNumber(orderId: string): string {
    const order = this.orders().find(o => o.id === orderId);
    return order?.orderNumber || orderId.substring(0, 8);
  }

  getTypeIcon(type: TimerType): string {
    switch (type) {
      case TimerType.COOKING: return 'local_fire_department';
      case TimerType.PREPARATION: return 'cut';
      case TimerType.REST: return 'pause';
      case TimerType.COOLING: return 'ac_unit';
      case TimerType.SERVING: return 'room_service';
      default: return 'timer';
    }
  }

  getTypeTooltip(type: TimerType): string {
    switch (type) {
      case TimerType.COOKING: return 'Cooking Timer';
      case TimerType.PREPARATION: return 'Preparation Timer';
      case TimerType.REST: return 'Rest Timer';
      case TimerType.COOLING: return 'Cooling Timer';
      case TimerType.SERVING: return 'Serving Timer';
      default: return 'Custom Timer';
    }
  }

  getStatusIcon(status: TimerStatus): string {
    switch (status) {
      case TimerStatus.IDLE: return 'schedule';
      case TimerStatus.RUNNING: return 'play_circle';
      case TimerStatus.PAUSED: return 'pause_circle';
      case TimerStatus.COMPLETED: return 'check_circle';
      case TimerStatus.EXPIRED: return 'error';
      case TimerStatus.CANCELLED: return 'cancel';
      default: return 'help';
    }
  }

  getStatusLabel(status: TimerStatus): string {
    switch (status) {
      case TimerStatus.IDLE: return 'Ready';
      case TimerStatus.RUNNING: return 'Running';
      case TimerStatus.PAUSED: return 'Paused';
      case TimerStatus.COMPLETED: return 'Completed';
      case TimerStatus.EXPIRED: return 'Expired';
      case TimerStatus.CANCELLED: return 'Cancelled';
      default: return status;
    }
  }

  trackByTimerId(index: number, timer: any): string {
    return timer.id;
  }
}