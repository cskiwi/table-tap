import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import {
  KitchenOrder,
  TimerState,
  OrderPriority,
  OrderStatus,
  SwipeGestureEvent,
  SwipeDirection
} from '../../types';
import { GestureService } from '../../services/gesture.service';

@Component({
  selector: 'app-kitchen-order-card',
  templateUrl: './kitchen-order-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ChipModule,
    BadgeModule,
    FloatLabelModule,
    InputTextModule,
    TooltipModule
  ]
})
export class KitchenOrderCardComponent implements OnInit, OnDestroy {
  readonly cardElement = viewChild.required<ElementRef<HTMLElement>>('cardElement');

  readonly order = input.required<KitchenOrder>();
  readonly timer = input<TimerState | null>();
  readonly compact = input(false);

  readonly orderComplete = output<string>();
  readonly orderReady = output<string>();
  readonly timerStart = output<string>();
  readonly timerStop = output<string>();
  readonly timerPause = output<string>();
  readonly timerResume = output<string>();
  readonly addNote = output<{
    orderId: string;
    note: string;
}>();
  readonly setPriority = output<{
    orderId: string;
    priority: OrderPriority;
}>();

  private destroy$ = new Subject<void>();

  // Swipe state
  swipeOffset = 0;
  swipeDirection: SwipeDirection | null = null;
  isSwipeActive = false;
  showActions = false;

  // Animation state
  isExpanded = false;
  showTimerControls = false;

  // Enums for template
  OrderPriority = OrderPriority;
  OrderStatus = OrderStatus;

  constructor(private gestureService: GestureService) {}

  ngOnInit(): void {
    this.setupGestures();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupGestures(): void {
    const element = this.cardElement().nativeElement;

    // Swipe gestures
    this.gestureService.onSwipe(element, {
      threshold: 50,
      velocity: 0.3,
      direction: [SwipeDirection.LEFT, SwipeDirection.RIGHT],
      preventDefault: true,
      stopPropagation: false,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => this.handleSwipe(event));

    // Pan gestures for visual feedback
    this.gestureService.onPan(element)
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.handlePan(event));

    // Tap gesture for expansion
    this.gestureService.onTap(element, { tapCount: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.toggleExpanded());

    // Long press for quick actions
    this.gestureService.onLongPress(element, { duration: 800 })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.showQuickActions());
  }

  private handleSwipe(event: SwipeGestureEvent): void {
    const threshold = 100; // Minimum swipe distance

    if (Math.abs(event.deltaX) < threshold) {
      this.resetSwipe()
      return;
    }

    switch (event.direction) {
      case SwipeDirection.RIGHT:
        this.handleSwipeRight()
        break;
      case SwipeDirection.LEFT:
        this.handleSwipeLeft()
        break;
    }

    this.resetSwipe()
  }

  private handlePan(event: any): void {
    if (event.isFinal) {
      this.resetSwipe()
      return;
    }

    const maxOffset = 120;
    this.swipeOffset = Math.max(-maxOffset, Math.min(maxOffset, event.deltaX));
    this.swipeDirection = event.deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
    this.isSwipeActive = Math.abs(this.swipeOffset) > 20;
  }

  private handleSwipeRight(): void {
    // Swipe right = Mark as ready / Complete
    const order = this.order();
    if (order.status === OrderStatus.PREPARING) {
      this.markReady();
    } else if (order.status === OrderStatus.READY) {
      this.markComplete();
    }
  }

  private handleSwipeLeft(): void {
    // Swipe left = Start/Stop timer
    if (this.timer()?.isRunning) {
      this.stopTimer()
    } else {
      this.startTimer()
    }
  }

  private resetSwipe(): void {
    this.swipeOffset = 0;
    this.swipeDirection = null;
    this.isSwipeActive = false;
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  private showQuickActions(): void {
    this.showActions = true;
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showActions = false;
    }, 3000);
  }

  // Order actions
  markReady(): void {
    this.orderReady.emit(this.order().id);
  }

  markComplete(): void {
    this.orderComplete.emit(this.order().id);
  }

  startTimer(): void {
    this.timerStart.emit(this.order().id);
  }

  stopTimer(): void {
    this.timerStop.emit(this.order().id);
  }

  pauseTimer(): void {
    this.timerPause.emit(this.order().id);
  }

  resumeTimer(): void {
    this.timerResume.emit(this.order().id);
  }

  toggleTimerControls(): void {
    this.showTimerControls = !this.showTimerControls;
  }

  addNoteToOrder(note: string): void {
    if (note.trim()) {
      this.addNote.emit({ orderId: this.order().id, note: note.trim() });
    }
  }

  updatePriority(priority: OrderPriority): void {
    this.setPriority.emit({ orderId: this.order().id, priority });
  }

  // Template helpers
  getOrderAge(): string {
    const now = Date.now()
    const orderTime = new Date(this.order().createdAt).getTime()
    const ageMinutes = Math.floor((now - orderTime) / (1000 * 60));

    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes < 60) return `${ageMinutes}m ago`;

    const ageHours = Math.floor(ageMinutes / 60);
    return `${ageHours}h ${ageMinutes % 60}m ago`;
  }

  getTimerProgress(): number {
    const timer = this.timer();
    if (!timer) return 0;
    const elapsed = timer.duration - timer.remainingTime;
    return Math.min(100, (elapsed / timer.duration) * 100);
  }

  getTimerColor(): string {
    if (!this.timer()) return 'primary';

    const progress = this.getTimerProgress()
    if (progress >= 90) return 'warn';
    if (progress >= 75) return 'accent';
    return 'primary';
  }

  formatTime(timeMs: number): string {
    if (timeMs <= 0) return '00:00';

    const totalSeconds = Math.ceil(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getPriorityIcon(): string {
    const iconMap = {
      [OrderPriority.LOW]: 'pi-arrow-down',
      [OrderPriority.NORMAL]: 'pi-minus',
      [OrderPriority.HIGH]: 'pi-arrow-up',
      [OrderPriority.URGENT]: 'pi-exclamation-circle'
    };
    return iconMap[this.order().priority] || 'pi-minus';
  }

  getPriorityColor(): string {
    const colorMap = {
      [OrderPriority.LOW]: '#4CAF50',
      [OrderPriority.NORMAL]: '#2196F3',
      [OrderPriority.HIGH]: '#FF9800',
      [OrderPriority.URGENT]: '#F44336'
    };
    return colorMap[this.order().priority] || '#2196F3';
  }

  getStationIcon(): string {
    const iconMap = {
      'grill': 'pi-fire',
      'fryer': 'pi-bolt',
      'salad': 'pi-globe',
      'dessert': 'pi-star',
      'drinks': 'pi-shopping-cart',
      'expedite': 'pi-send'
    };
    return iconMap[this.order().station] || 'pi-home';
  }

  getStatusColor(): string {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#9E9E9E',
      [OrderStatus.CONFIRMED]: '#64B5F6',
      [OrderStatus.PREPARING]: '#2196F3',
      [OrderStatus.READY]: '#FF9800',
      [OrderStatus.DELIVERED]: '#4CAF50',
      [OrderStatus.CANCELLED]: '#F44336',
      [OrderStatus.REFUNDED]: '#9C27B0',
      [OrderStatus.FAILED]: '#D32F2F'
    };
    return colorMap[this.order().status] || '#9E9E9E';
  }

  getSwipeActionIcon(): string {
    if (!this.isSwipeActive) return '';

    if (this.swipeDirection === SwipeDirection.RIGHT) {
      return this.order().status === OrderStatus.READY ? 'check_circle' : 'done';
    } else {
      return this.timer()?.isRunning ? 'stop' : 'play_arrow';
    }
  }

  getSwipeActionText(): string {
    if (!this.isSwipeActive) return '';

    if (this.swipeDirection === SwipeDirection.RIGHT) {
      return this.order().status === OrderStatus.READY ? 'Complete' : 'Ready';
    } else {
      return this.timer()?.isRunning ? 'Stop Timer' : 'Start Timer';
    }
  }

  hasAllergens(): boolean {
    const order = this.order();
    return !!(order.allergens && order.allergens.length > 0);
  }

  getEstimatedReadyTime(): string {
    const timer = this.timer();
    if (!timer || !timer.isRunning) {
      return 'Not started';
    }

    const readyTime = new Date(Date.now() + timer.remainingTime);
    return readyTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  shouldShowUrgentIndicator(): boolean {
    const timer = this.timer();
    return this.order().priority === OrderPriority.URGENT ||
           !!(timer && timer.remainingTime <= 60000 && timer.isRunning);
  }

  getItemsDisplay(): string {
    const order = this.order();
    if (!order.items || order.items.length === 0) {
      return 'No items';
    }

    if (this.compact() && order.items.length > 2) {
      return `${order.items.slice(0, 2).map(item => item.name).join(', ')} +${order.items.length - 2} more`;
    }

    return order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
  }
}