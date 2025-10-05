import { Component, inject, signal, computed, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoyaltyGraphQLService } from '../services/loyalty-graphql.service';
import { LoyaltyReward, LoyaltyAccount, LoyaltyRewardRedemption } from '@app/models';

export interface RedemptionModalData {
  reward: LoyaltyReward;
  account: LoyaltyAccount;
  orderId?: string;
}

@Component({
  selector: 'app-reward-redemption-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reward-redemption-modal.component.html',
})
export class RewardRedemptionModalComponent {
  readonly isVisible = input(signal(false));
  readonly modalData = input(signal<RedemptionModalData | null>(null));
  readonly closed = output<void>();
  readonly redemptionCompleted = output<LoyaltyRewardRedemption>();

  private fb = inject(FormBuilder);
  private loyaltyService = inject(LoyaltyGraphQLService);

  // Form and state
  redemptionForm: FormGroup;
  showTerms = signal(false);
  isProcessing = signal(false);
  redemptionSuccess = signal(false);
  redemptionError = signal<string | null>(null);
  redemptionResult = signal<LoyaltyRewardRedemption | null>(null);

  // Computed properties
  hasEnoughPoints = computed(() => {
    const data = this.modalData()()
    if (!data) return false;
    return data.account.currentPoints >= data.reward.pointsCost;
  });

  remainingPoints = computed(() => {
    const data = this.modalData()()
    if (!data) return 0;
    return data.account.currentPoints - data.reward.pointsCost;
  });

  pointsNeeded = computed(() => {
    const data = this.modalData()()
    if (!data) return 0;
    return Math.max(0, data.reward.pointsCost - data.account.currentPoints);
  });

  estimatedValue = computed(() => {
    const data = this.modalData()()
    return data?.reward.cashValue || null;
  });

  canRedeem = computed(() => {
    if (!this.hasEnoughPoints() || this.isProcessing()) return false;

    const form = this.redemptionForm;
    if (!form) return true;

    // Check required fields based on reward type
    if (this.requiresDeliveryInfo()) {
      return form.get('deliveryName')?.valid &&
             form.get('deliveryAddress')?.valid &&
             form.get('deliveryPhone')?.valid;
    }

    if (this.requiresBooking()) {
      return form.get('preferredDate')?.valid &&
             form.get('preferredTime')?.valid;
    }

    return true;
  });

  constructor() {
    this.redemptionForm = this.fb.group({
      applyToOrder: [false],
      notes: [''],
      deliveryName: [''],
      deliveryAddress: [''],
      deliveryPhone: [''],
      preferredDate: [''],
      preferredTime: [''],
    });

    // Add validators based on reward type using effect
    effect(() => {
      const data = this.modalData()()
      if (data && this.requiresDeliveryInfo()) {
        this.redemptionForm.get('deliveryName')?.setValidators([Validators.required]);
        this.redemptionForm.get('deliveryAddress')?.setValidators([Validators.required]);
        this.redemptionForm.get('deliveryPhone')?.setValidators([Validators.required]);
      } else {
        this.redemptionForm.get('deliveryName')?.clearValidators()
        this.redemptionForm.get('deliveryAddress')?.clearValidators()
        this.redemptionForm.get('deliveryPhone')?.clearValidators()
      }

      if (data && this.requiresBooking()) {
        this.redemptionForm.get('preferredDate')?.setValidators([Validators.required]);
        this.redemptionForm.get('preferredTime')?.setValidators([Validators.required]);
      } else {
        this.redemptionForm.get('preferredDate')?.clearValidators()
        this.redemptionForm.get('preferredTime')?.clearValidators()
      }

      this.redemptionForm.updateValueAndValidity()
    });
  }

  // Helper methods
  getRewardTypeClass(): string {
    const type = this.modalData()()?.reward.type;
    switch (type) {
      case 'discount_percentage':
      case 'discount_fixed':
        return 'type-discount';
      case 'free_item': return 'type-free-item';
      case 'experience': return 'type-experience';
      case 'merchandise': return 'type-merchandise';
      default: return 'type-default';
    }
  }

  showOrderAssociation(): boolean {
    const data = this.modalData()()
    return data?.orderId != null ||
           data?.reward.type === 'discount_percentage' ||
           data?.reward.type === 'discount_fixed' ||
           data?.reward.type === 'free_item';
  }

  requiresDeliveryInfo(): boolean {
    return this.modalData()()?.reward.type === 'merchandise';
  }

  requiresBooking(): boolean {
    return this.modalData()()?.reward.type === 'experience';
  }

  minBookingDate(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]
  }

  // Event handlers
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal()
    }
  }

  closeModal(): void {
    this.isVisible().set(false);
    this.resetModalState()
    // TODO: The 'emit' function requires a mandatory void argument
    this.closed.emit()
  }

  async processRedemption(): Promise<void> {
    const data = this.modalData()()
    if (!data || !this.canRedeem()) return;

    this.isProcessing.set(true);
    this.redemptionError.set(null);

    try {
      const formValue = this.redemptionForm.value;

      // Prepare redemption request
      const notes = this.buildRedemptionNotes(formValue);
      const orderId = formValue.applyToOrder ? data.orderId : undefined;

      // Call GraphQL service
      const result = await this.loyaltyService.redeemReward(
        data.account.id,
        data.reward.id,
        orderId,
        notes
      );

      this.redemptionResult.set(result);
      this.redemptionSuccess.set(true);
      this.redemptionCompleted.emit(result);

    } catch (error: any) {
      console.error('Redemption failed:', error);
      this.redemptionError.set(error.message || 'Failed to process redemption. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  retryRedemption(): void {
    this.redemptionError.set(null);
    this.processRedemption()
  }

  copyRedemptionCode(): void {
    const code = this.redemptionResult()?.redemptionCode;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        // Show success feedback
        console.log('Redemption code copied to clipboard');
      });
    }
  }

  private buildRedemptionNotes(formValue: any): string {
    const notes: string[] = []

    if (formValue.notes) {
      notes.push(`Notes: ${formValue.notes}`);
    }

    if (this.requiresDeliveryInfo()) {
      notes.push(`Delivery: ${formValue.deliveryName}, ${formValue.deliveryAddress}, ${formValue.deliveryPhone}`);
    }

    if (this.requiresBooking()) {
      notes.push(`Preferred: ${formValue.preferredDate} ${formValue.preferredTime}`);
    }

    return notes.join(' | ');
  }

  private resetModalState(): void {
    this.showTerms.set(false);
    this.isProcessing.set(false);
    this.redemptionSuccess.set(false);
    this.redemptionError.set(null);
    this.redemptionResult.set(null);
    this.redemptionForm.reset()
  }
}