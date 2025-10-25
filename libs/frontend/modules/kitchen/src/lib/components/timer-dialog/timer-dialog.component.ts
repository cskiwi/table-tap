import { Component, Inject, signal } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';

import { Order } from '@app/models';
import { TimerType, TimerPriority } from '@app/models/enums';

export interface TimerDialogData {
  order: Order;
  orderItemId?: string;
}

export interface TimerDialogResult {
  name: string;
  duration: number; // in seconds
  type: TimerType;
  priority: TimerPriority;
  sound: boolean;
  vibration: boolean;
}

@Component({
  selector: 'app-timer-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    SliderModule,
    CheckboxModule,
    DividerModule
],
  templateUrl: './timer-dialog.component.html',
})
export class TimerDialogComponent {
  readonly quickDurations = [
    { label: '2 min', seconds: 120 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15 min', seconds: 900 },
    { label: '20 min', seconds: 1200 },
    { label: '30 min', seconds: 1800
  }
  ];
  readonly timerForm: FormGroup;
  private readonly _selectedQuickDuration = signal(0);

  readonly selectedQuickDuration = this._selectedQuickDuration.asReadonly()

  constructor(
    private readonly fb: FormBuilder
  ) {
    // Get estimated prep time from order items
    const estimatedTime = this.getEstimatedPrepTime()
    const defaultMinutes = Math.floor(estimatedTime / 60);
    const defaultSeconds = estimatedTime % 60;

    this.timerForm = this.fb.group({
      name: [this.getDefaultTimerName(), Validators.required],
      minutes: [defaultMinutes, [Validators.min(0), Validators.max(60)]],
      seconds: [defaultSeconds, [Validators.min(0), Validators.max(59)]],
      type: [TimerType.COOKING],
      priority: [TimerPriority.MEDIUM],
      sound: [true],
      vibration: [false],
    });
  }

  private getEstimatedPrepTime(): number {
    if (this.data.orderItemId) {
      const item = this.data.order.items.find(item => item.id === this.data.orderItemId);
      return (item?.product?.preparationTime || 10) * 60; // Convert to seconds
    }

    // Use max prep time from all items
    const maxPrepTime = Math.max(
      ...this.data.order.items.map(item => item.product?.preparationTime || 0)
    );
    return (maxPrepTime || 10) * 60;
  }

  private getDefaultTimerName(): string {
    if (this.data.orderItemId) {
      const item = this.data.order.items.find(item => item.id === this.data.orderItemId);
      return `${item?.product?.name || 'Item'} Timer`;
    }

    return `Order #${this.data.order.orderNumber} Timer`;
  }

  getTotalSeconds(): number {
    const minutes = this.timerForm.get('minutes')?.value || 0;
    const seconds = this.timerForm.get('seconds')?.value || 0;
    return (minutes * 60) + seconds;
  }

  setQuickDuration(seconds: number): void {
    this._selectedQuickDuration.set(seconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    this.timerForm.patchValue({
      minutes,
      seconds: remainingSeconds
    });
  }

  updateDuration(): void {
    // Clear quick duration selection when manually changing values
    this._selectedQuickDuration.set(0);
  }

  onSliderChange(event: any): void {
    const totalSeconds = event.value;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    this.timerForm.patchValue({
      minutes,
      seconds
    });

    // Check if this matches a quick duration
    const quickDuration = this.quickDurations.find(d => d.seconds === totalSeconds);
    this._selectedQuickDuration.set(quickDuration?.seconds || 0);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  onCreate(): void {
    if (this.timerForm.valid && this.getTotalSeconds() > 0) {
      const result: TimerDialogResult = {
        name: this.timerForm.get('name')?.value,
        duration: this.getTotalSeconds(),
        type: this.timerForm.get('type')?.value,
        priority: this.timerForm.get('priority')?.value,
        sound: this.timerForm.get('sound')?.value,
        vibration: this.timerForm.get('vibration')?.value
      };

      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}