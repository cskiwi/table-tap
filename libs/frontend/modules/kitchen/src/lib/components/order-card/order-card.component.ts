import { Component, Input, Output, EventEmitter, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
// Icon removed - use primeicons in template
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { CdkMenuModule } from '@angular/cdk/menu';

import { Order, OrderItem } from '@app/models';
import { PreparationStatus, OrderPriority, OrderStatus } from '@app/models/enums';
import { OrderItemComponent } from '../order-item/order-item.component';
// TODO: Re-implement dialog components with PrimeNG Dialog
// import { TimerDialogComponent } from '../timer-dialog/timer-dialog.component';
// import { StaffAssignmentDialogComponent } from '../staff-assignment-dialog/staff-assignment-dialog.component';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChipModule,
    MenuModule,
    BadgeModule,
    TooltipModule,
    ProgressBarModule,
    CdkMenuModule,
    OrderItemComponent
  ],
  templateUrl: './order-card.component.html',
})
export class OrderCardComponent {
  @Input() order!: Order;
  @Input() showTimers = true;
  @Input() showNotes = true;
  @Input() showAllergies = true;
  @Input() compactMode = false;

  @Output() statusChanged = new EventEmitter<{ orderId: string; status: OrderStatus }>()
  @Output() itemStatusChanged = new EventEmitter<{ itemId: string; status: PreparationStatus }>()
  @Output() timerCreated = new EventEmitter<{ orderId: string; itemId?: string; duration: number; name: string }>()
  @Output() staffAssigned = new EventEmitter<{ orderId: string; staffId: string }>()
  @Output() qualityCheck = new EventEmitter<{ orderId: string; itemId?: string }>()

  private readonly _isProcessing = signal(false);

  readonly isProcessing = this._isProcessing.asReadonly()

  readonly cardClasses = computed(() => {
    const classes = [`priority-${this.order.priority}`, `status-${this.order.status}`];
    if (this.compactMode) classes.push('compact');
    if (this.isOverdue()) classes.push('overdue');
    if (this.hasUrgentItems()) classes.push('urgent-items');

    return classes.join(' ');
  });

  // Computed properties
  isOverdue(): boolean {
    if (!this.order.estimatedPrepTime || !this.order.confirmedAt) return false;

    const elapsed = this.getElapsedMinutes()
    return elapsed > this.order.estimatedPrepTime;
  }

  hasUrgentItems(): boolean {
    return this.order.items.some(item =>
      item.preparationStatus === PreparationStatus.PENDING &&
      this.order.priority === OrderPriority.URGENT
    );
  }

  getElapsedTime(): string {
    const minutes = this.getElapsedMinutes()
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getElapsedMinutes(): number {
    const startTime = this.order.confirmedAt || this.order.createdAt;
    return Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
  }

  getOrderTypeIcon(): string {
    switch (this.order.orderType?.toLowerCase()) {
      case 'dine_in': return 'restaurant';
      case 'takeaway': return 'takeout_dining';
      case 'delivery': return 'delivery_dining';
      default: return 'restaurant_menu';
    }
  }

  getPriorityIcon(): string {
    switch (this.order.priority) {
      case OrderPriority.URGENT: return 'priority_high';
      case OrderPriority.RUSH: return 'flash_on';
      case OrderPriority.HIGH: return 'keyboard_arrow_up';
      default: return 'remove';
    }
  }

  getStatusLabel(): string {
    switch (this.order.status) {
      case OrderStatus.PENDING: return 'New';
      case OrderStatus.CONFIRMED: return 'Confirmed';
      case OrderStatus.PREPARING: return 'Preparing';
      case OrderStatus.READY: return 'Ready';
      case OrderStatus.DELIVERED: return 'Delivered';
      case OrderStatus.CANCELLED: return 'Cancelled';
      default: return this.order.status;
    }
  }

  getPrimaryActionLabel(): string {
    switch (this.order.status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED:
        return 'Start Preparing';
      case OrderStatus.PREPARING:
        return 'Mark Ready';
      case OrderStatus.READY:
        return 'Mark Delivered';
      default:
        return 'Update Status';
    }
  }

  getPrimaryActionIcon(): string {
    switch (this.order.status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED:
        return 'play_arrow';
      case OrderStatus.PREPARING:
        return 'check_circle';
      case OrderStatus.READY:
        return 'local_shipping';
      default:
        return 'update';
    }
  }

  getPrimaryActionColor(): ButtonSeverity {
    switch (this.order.status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED:
        return 'primary';
      case OrderStatus.PREPARING:
        return 'contrast';
      case OrderStatus.READY:
        return 'warn';
      default:
        return 'secondary';
    }
  }

  canCreateTimer(): boolean {
    return this.order.status === OrderStatus.PREPARING;
  }

  showProgressIndicator(): boolean {
    return this.order.status === OrderStatus.PREPARING && this.order.items.length > 1;
  }

  getProgressPercentage(): number {
    const completed = this.getCompletedItemsCount()
    return (completed / this.order.items.length) * 100;
  }

  getCompletedItemsCount(): number {
    return this.order.items.filter(item =>
      item.preparationStatus === PreparationStatus.COMPLETED
    ).length;
  }

  hasAllergyNotes(): boolean {
    return this.order.items.some(item => item.allergiesNotes);
  }

  getAllergyNotes(): string[] {
    return this.order.items
      .filter(item => item.allergiesNotes)
      .map(item => item.allergiesNotes!)
      .filter((note, index, array) => array.indexOf(note) === index);
  }

  // Event handlers
  onPrimaryAction(): void {
    this._isProcessing.set(true);

    let newStatus: OrderStatus;
    switch (this.order.status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED:
        newStatus = OrderStatus.PREPARING;
        break;
      case OrderStatus.PREPARING:
        newStatus = OrderStatus.READY;
        break;
      case OrderStatus.READY:
        newStatus = OrderStatus.DELIVERED;
        break;
      default:
        this._isProcessing.set(false);
        return;
    }

    this.statusChanged.emit({ orderId: this.order.id, status: newStatus });

    // Reset processing state after a delay
    setTimeout(() => this._isProcessing.set(false), 1000);
  }

  onItemStatusChanged(event: { itemId: string; status: PreparationStatus }): void {
    this.itemStatusChanged.emit(event);
  }

  onItemTimerRequested(event: { itemId: string; duration: number; name: string }): void {
    this.timerCreated.emit({
      orderId: this.order.id,
      itemId: event.itemId,
      duration: event.duration,
      name: event.name,
    });
  }

  onQualityCheck(): void {
    this.qualityCheck.emit({ orderId: this.order.id });
  }

  // Dialog methods
  openTimerDialog(): void {
    // TODO: Replace with PrimeNG Dialog implementation
    console.log('Timer dialog not implemented yet');
    /* const dialogRef = this.dialog.open(TimerDialogComponent, {
      width: '400px',
      data: { order: this.order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.timerCreated.emit({
          orderId: this.order.id;
          duration: result.duration;
          name: result.name;
        });
      }
    }); */
  }

  openStaffAssignment(): void {
    // TODO: Replace with PrimeNG Dialog implementation
    console.log('Staff assignment dialog not implemented yet');
    /* const dialogRef = this.dialog.open(StaffAssignmentDialogComponent, {
      width: '500px',
      data: { order: this.order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.staffAssigned.emit({
          orderId: this.order.id;
          staffId: result.staffId;
        });
      }
    }); */
  }

  // Menu actions
  viewOrderDetails(): void {
    // Implement order details dialog
    console.log('View order details:', this.order.id);
  }

  duplicateOrder(): void {
    // Implement order duplication
    console.log('Duplicate order:', this.order.id);
  }

  changeStaff(): void {
    this.openStaffAssignment()
  }

  setPriority(priority: OrderPriority): void {
    // Update order priority
    console.log('Set priority:', priority, this.order.id);
  }

  addNote(): void {
    // Open note dialog
    console.log('Add note to order:', this.order.id);
  }

  reportIssue(): void {
    // Open issue report dialog
    console.log('Report issue for order:', this.order.id);
  }

  cancelOrder(): void {
    // Confirm and cancel order
    console.log('Cancel order:', this.order.id);
  }

  printOrder(): void {
    // Print order ticket
    window.print()
  }

  showItemNotes(item: OrderItem): void {
    // Show item notes in a tooltip or dialog
    console.log('Show notes for item:', item.id);
  }

  // Utility methods
  trackByItemId(index: number, item: OrderItem): string {
    return item.id;
  }
}