import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

import { OrderItem } from '@app/models';
import { PreparationStatus } from '@app/models/enums';

@Component({
  selector: 'app-order-item',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ChipModule,
    MenuModule,
    TooltipModule,
    ProgressBarModule,
  ],
  templateUrl: './order-item.component.html',
})
export class OrderItemComponent {
  @Input() item!: OrderItem;
  @Input() showTimer = true;
  @Input() showNotes = true;
  @Input() showAllergies = true;
  @Input() compactMode = false;

  @Output() statusChanged = new EventEmitter<{ itemId: string; status: PreparationStatus }>()
  @Output() timerRequested = new EventEmitter<{ itemId: string; duration: number; name: string }>()
  @Output() notesClicked = new EventEmitter<OrderItem>()

  readonly itemClasses = computed(() => {
    const classes = [
      `status-${this.item.preparationStatus}`,
      `category-${this.item.product.category?.toLowerCase().replace(/\s+/g, '-')}`];
    if (this.compactMode) classes.push('compact');
    if (this.item.allergiesNotes) classes.push('has-allergies');
    if (this.item.specialInstructions) classes.push('has-instructions');
    if (this.isOverdue()) classes.push('overdue');

    return classes.join(' ');
  });

  // Status management
  getStatusLabel(): string {
    switch (this.item.preparationStatus) {
      case PreparationStatus.PENDING: return 'Pending';
      case PreparationStatus.IN_PROGRESS: return 'In Progress';
      case PreparationStatus.COMPLETED: return 'Completed';
      case PreparationStatus.ON_HOLD: return 'On Hold';
      case PreparationStatus.CANCELLED: return 'Cancelled';
      default: return this.item.preparationStatus;
    }
  }

  getStatusIcon(): string {
    switch (this.item.preparationStatus) {
      case PreparationStatus.PENDING: return 'schedule';
      case PreparationStatus.IN_PROGRESS: return 'cooking';
      case PreparationStatus.COMPLETED: return 'check_circle';
      case PreparationStatus.ON_HOLD: return 'pause_circle';
      case PreparationStatus.CANCELLED: return 'cancel';
      default: return 'help';
    }
  }

  cycleStatus(): void {
    let newStatus: PreparationStatus;

    switch (this.item.preparationStatus) {
      case PreparationStatus.PENDING:
        newStatus = PreparationStatus.IN_PROGRESS;
        break;
      case PreparationStatus.IN_PROGRESS:
        newStatus = PreparationStatus.COMPLETED;
        break;
      case PreparationStatus.ON_HOLD:
        newStatus = PreparationStatus.IN_PROGRESS;
        break;
      default:
        return; // No cycling for completed or cancelled items
    }

    this.statusChanged.emit({ itemId: this.item.id, status: newStatus });
  }

  // Timing methods
  showTiming(): boolean {
    return !this.compactMode && (this.item.product.preparationTime > 0 || this.item.preparationStartTime != null);
  }

  getElapsedTime(): string {
    if (!this.item.preparationStartTime) return '';

    const elapsed = Math.floor((Date.now() - new Date(this.item.preparationStartTime).getTime()) / 60000);
    return `${elapsed}m`;
  }

  isOverdue(): boolean {
    if (!this.item.preparationStartTime || !this.item.product.preparationTime) return false;

    const elapsed = Math.floor((Date.now() - new Date(this.item.preparationStartTime).getTime()) / 60000);
    return elapsed > this.item.product.preparationTime;
  }

  // Progress methods
  showProgress(): boolean {
    return this.item.preparationStatus === PreparationStatus.IN_PROGRESS && this.item.product.preparationTime > 0;
  }

  getProgressValue(): number {
    if (!this.item.preparationStartTime || !this.item.product.preparationTime) return 0;

    const elapsed = Math.floor((Date.now() - new Date(this.item.preparationStartTime).getTime()) / 60000);
    const progress = (elapsed / this.item.product.preparationTime) * 100;
    return Math.min(progress, 100);
  }

  getProgressColor(): string {
    const progress = this.getProgressValue()
    if (progress >= 100) return 'warn';
    if (progress >= 80) return 'accent';
    return 'primary';
  }

  getProgressText(): string {
    if (!this.item.preparationStartTime || !this.item.product.preparationTime) return '';

    const elapsed = Math.floor((Date.now() - new Date(this.item.preparationStartTime).getTime()) / 60000);
    const remaining = Math.max(0, this.item.product.preparationTime - elapsed);

    if (remaining === 0) return 'Overdue';
    return `${remaining}m remaining`;
  }

  // Timer methods
  canShowTimer(): boolean {
    return this.item.preparationStatus === PreparationStatus.IN_PROGRESS;
  }

  requestTimer(): void {
    const duration = this.item.product.preparationTime || 10; // Default 10 minutes
    const name = `${this.item.product.name} Timer`;

    this.timerRequested.emit({
      itemId: this.item.id,
      duration: duration * 60, // Convert to seconds
      name
    });
  }

  // Menu action availability
  canStart(): boolean {
    return this.item.preparationStatus === PreparationStatus.PENDING ||
           this.item.preparationStatus === PreparationStatus.ON_HOLD;
  }

  canComplete(): boolean {
    return this.item.preparationStatus === PreparationStatus.IN_PROGRESS;
  }

  canPause(): boolean {
    return this.item.preparationStatus === PreparationStatus.IN_PROGRESS;
  }

  canReset(): boolean {
    return this.item.preparationStatus !== PreparationStatus.PENDING &&
           this.item.preparationStatus !== PreparationStatus.CANCELLED;
  }

  // Customization methods
  getCustomizationsList(): string[] {
    if (!this.item.customizations) return [];

    const customizations: string[] = [];
    const custom = this.item.customizations;

    if (custom.size) customizations.push(`Size: ${custom.size}`);
    if (custom.temperature) customizations.push(`Temp: ${custom.temperature}`);
    if (custom.milkType) customizations.push(`Milk: ${custom.milkType}`);
    if (custom.sweetness) customizations.push(`Sweetness: ${custom.sweetness}`);
    if (custom.extras?.length) customizations.push(...custom.extras.map(e => `+ ${e}`));
    if (custom.removals?.length) customizations.push(...custom.removals.map(r => `- ${r}`));

    return customizations;
  }

  // Menu actions
  startPreparation(): void {
    this.statusChanged.emit({
      itemId: this.item.id,
      status: PreparationStatus.IN_PROGRESS,
    });
  }

  completeItem(): void {
    this.statusChanged.emit({
      itemId: this.item.id,
      status: PreparationStatus.COMPLETED,
    });
  }

  pauseItem(): void {
    this.statusChanged.emit({
      itemId: this.item.id,
      status: PreparationStatus.ON_HOLD,
    });
  }

  resetItem(): void {
    this.statusChanged.emit({
      itemId: this.item.id,
      status: PreparationStatus.PENDING,
    });
  }

  viewRecipe(): void {
    // Open recipe dialog
    console.log('View recipe for:', this.item.product.name);
  }

  addNote(): void {
    this.notesClicked.emit(this.item);
  }

  reportIssue(): void {
    // Open issue report dialog
    console.log('Report issue for item:', this.item.id);
  }

  removeItem(): void {
    // Confirm and remove item
    console.log('Remove item:', this.item.id);
  }
}