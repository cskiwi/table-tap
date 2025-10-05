import { Component, OnInit, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LoyaltyService } from '../services/loyalty.service';
import {
  LoyaltyAccount,
  LoyaltyReward,
  LoyaltyRewardType,
  LoyaltyRewardCategory,
  LoyaltyRewardRedemption
} from '@app/models';

export interface RedemptionPreview {
  pointsCost: number;
  remainingPoints: number;
  discountValue?: number;
  freeItem?: string;
  restrictions: string[]
  expiryDate?: Date;
}

@Component({
  selector: 'app-reward-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reward-details-modal.component.html',
})
export class RewardDetailsModalComponent implements OnInit, OnDestroy {
  readonly reward = input<LoyaltyReward>();
  readonly loyaltyAccount = input<LoyaltyAccount>();
  readonly isVisible = input(false);
  readonly close = output<void>();
  readonly redeemed = output<LoyaltyRewardRedemption>();

  activeTab: 'details' | 'terms' | 'redemptions' = 'details';

  isLoading = false;
  isRedeeming = false;
  redemptionStep = 0;
  error?: string;

  loadingRedemptions = false;
  recentRedemptions: LoyaltyRewardRedemption[] = []

  redemptionPreview?: RedemptionPreview;

  private destroy$ = new Subject<void>()

  constructor(private loyaltyService: LoyaltyService) {}

  ngOnInit(): void {
    if (this.isVisible() && this.reward()) {
      this.loadRewardDetails()
      this.calculateRedemptionPreview()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnChanges(): void {
    if (this.isVisible() && this.reward()) {
      this.loadRewardDetails()
      this.calculateRedemptionPreview()
    }
  }

  async loadRewardDetails(): Promise<void> {
    const reward = this.reward();
    if (!reward?.id) return;

    this.isLoading = true;
    this.error = undefined;

    try {
      // Load detailed reward information
      const detailedReward = await this.loyaltyService.getRewardDetails(reward.id);
      // Update reward properties safely
      if (detailedReward) {
        Object.assign(reward, detailedReward);
      }

      // Load recent redemptions for this reward
      if (this.activeTab === 'redemptions') {
        await this.loadRecentRedemptions()
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to load reward details';
      console.error('Error loading reward details:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadRecentRedemptions(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    if (!this.reward()?.id || !loyaltyAccount?.id) return;

    this.loadingRedemptions = true;

    try {
      const result = await this.loyaltyService.getRedemptionHistory(loyaltyAccount.id, 10);
      this.recentRedemptions = result.redemptions.filter(r => r.rewardId === this.reward()!.id);
    } catch (error: any) {
      console.error('Error loading recent redemptions:', error);
    } finally {
      this.loadingRedemptions = false;
    }
  }

  private calculateRedemptionPreview(): void {
    const reward = this.reward();
    const loyaltyAccount = this.loyaltyAccount();
    if (!reward || !loyaltyAccount) return;

    const pointsCost = reward.pointsCost;
    const currentPoints = loyaltyAccount.currentPoints;
    const remainingPoints = Math.max(0, currentPoints - pointsCost);

    let discountValue: number | undefined;
    if (reward.type === 'discount_percentage' && reward.discountPercentage) {
      // Estimate based on average order value (placeholder)
      const avgOrderValue = 25; // This would come from historical data
      discountValue = avgOrderValue * reward.discountPercentage;
    } else if (reward.type === 'discount_fixed' && reward.discountAmount) {
      discountValue = reward.discountAmount;
    } else if (reward.cashValue) {
      discountValue = reward.cashValue;
    }

    const restrictions: string[] = []
    if (reward.minimumSpend > 0) {
      restrictions.push(`Minimum spend: $${reward.minimumSpend}`);
    }
    if (!reward.canCombineWithOtherOffers) {
      restrictions.push('Cannot be combined with other offers');
    }
    if (reward.requiredTierLevels && reward.requiredTierLevels.length > 0) {
      restrictions.push(`Requires ${this.getTierRequirementText(reward)}`);
    }

    let expiryDate: Date | undefined;
    if (reward.validUntil) {
      expiryDate = new Date(reward.validUntil);
    }

    this.redemptionPreview = {
      pointsCost,
      remainingPoints,
      discountValue,
      freeItem: reward.specialProperties?.freeProductName,
      restrictions,
      expiryDate
    }
  }

  async startRedemption(): Promise<void> {
    const reward = this.reward();
    const loyaltyAccount = this.loyaltyAccount();
    if (!this.canRedeem || !loyaltyAccount || !reward) return;

    this.isRedeeming = true;
    this.redemptionStep = 0;

    try {
      // Step 1: Validate points
      this.redemptionStep = 1;
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation

      // Step 2: Process redemption
      this.redemptionStep = 2;
      const redemption = await this.loyaltyService.redeemReward({
        loyaltyAccountId: loyaltyAccount.id,
        rewardId: reward.id,
      });

      // Step 3: Update balance
      this.redemptionStep = 3;
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate balance update

      // Emit success
      this.redeemed.emit(redemption);

      // Auto-close after short delay
      setTimeout(() => {
        // TODO: The 'emit' function requires a mandatory void argument
        this.close.emit()
      }, 1000);

    } catch (error: any) {
      this.error = error.message || 'Failed to redeem reward';
      console.error('Error redeeming reward:', error);
    } finally {
      this.isRedeeming = false;
      this.redemptionStep = 0;
    }
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget && !this.isRedeeming) {
      // TODO: The 'emit' function requires a mandatory void argument
      this.close.emit()
    }
  }

  // Computed Properties
  get isAffordable(): boolean {
    return (this.loyaltyAccount()?.currentPoints || 0) >= (this.reward()?.pointsCost || 0);
  }

  get pointsNeeded(): number {
    const current = this.loyaltyAccount()?.currentPoints || 0;
    const required = this.reward()?.pointsCost || 0;
    return Math.max(0, required - current);
  }

  get canRedeem(): boolean {
    return this.isAffordable &&
           (this.reward()?.isAvailable ?? false) &&
           this.meetsTierRequirement &&
           !this.isRedeeming;
  }

  get meetsTierRequirement(): boolean {
    const reward = this.reward();
    if (!reward?.requiredTierLevels?.length) return true;
    const currentTierLevel = this.loyaltyAccount()?.currentTier?.level || 0;
    return reward.requiredTierLevels.some(level => currentTierLevel >= level);
  }

  get hasQuantityLimit(): boolean {
    const reward = this.reward();
    return reward?.totalQuantity !== undefined && reward.totalQuantity > 0;
  }

  get hasRedemptionLimits(): boolean {
    return (this.reward()?.maxRedemptionsPerUser || 0) > 0 ||
           (this.reward()?.maxRedemptionsPerDay || 0) > 0;
  }

  get remainingPointsAfterRedemption(): number {
    const current = this.loyaltyAccount()?.currentPoints || 0;
    const cost = this.reward()?.pointsCost || 0;
    return Math.max(0, current - cost);
  }

  // Utility Methods
  getRedemptionButtonText(): string {
    if (!this.isAffordable) {
      return `Need ${this.pointsNeeded} more points`;
    }
    if (!this.reward()?.isAvailable) {
      return 'Unavailable';
    }
    if (!this.meetsTierRequirement) {
      return 'Tier upgrade required';
    }
    return 'Redeem Now';
  }

  hasSpecialProperties(): boolean {
    const props = this.reward()?.specialProperties;
    return !!(props && (
      props.freeProductName ||
      props.experienceType ||
      props.experienceLocation ||
      props.bonusPointsAmount ||
      props.itemSku
    ));
  }

  formatValidityPeriod(validFrom?: Date, validUntil?: Date): string {
    const formatDate = (date: Date) => new Date(date).toLocaleDateString()

    if (validFrom && validUntil) {
      return `${formatDate(validFrom)} - ${formatDate(validUntil)}`;
    } else if (validFrom) {
      return `From ${formatDate(validFrom)}`;
    } else if (validUntil) {
      return `Until ${formatDate(validUntil)}`;
    }
    return 'Always available';
  }

  getTierRequirementText(reward: LoyaltyReward): string {
    const levels = reward.requiredTierLevels;
    if (levels.length === 1) {
      return `Tier ${levels[0]}+`;
    }
    return `Tiers ${levels.join(', ')}`;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      pending: 'status-pending',
      approved: 'status-approved',
      redeemed: 'status-redeemed',
      cancelled: 'status-cancelled',
      expired: 'status-expired',
    }
    return statusClasses[status] || 'status-unknown';
  }

  // Display helpers from parent component
  getCategoryDisplayName(category?: string): string {
    const names: { [key: string]: string } = {
      food: 'Food',
      beverage: 'Beverage',
      discount: 'Discounts',
      delivery: 'Delivery',
      experience: 'Experiences',
      merchandise: 'Merchandise',
      points: 'Points',
      vip: 'VIP',
    }
    return names[category || ''] || category || '';
  }

  getTypeDisplayName(type?: string): string {
    const names: { [key: string]: string } = {
      discount_percentage: 'Percentage Discount',
      discount_fixed: 'Fixed Discount',
      free_item: 'Free Item',
      free_delivery: 'Free Delivery',
      bonus_points: 'Bonus Points',
      tier_upgrade: 'Tier Upgrade',
      experience: 'Experience',
      merchandise: 'Merchandise',
      cash_credit: 'Cash Credit',
    }
    return names[type || ''] || type || '';
  }

  getCategoryIcon(category?: string): string {
    const icons: { [key: string]: string } = {
      food: 'fas fa-utensils',
      beverage: 'fas fa-coffee',
      discount: 'fas fa-percentage',
      delivery: 'fas fa-truck',
      experience: 'fas fa-star',
      merchandise: 'fas fa-tshirt',
      points: 'fas fa-coins',
      vip: 'fas fa-crown',
    }
    return icons[category || ''] || 'fas fa-gift';
  }

  getCategoryClass(category?: string): string {
    return `category-${category || 'default'}`;
  }

  getDefaultImage(category?: string): string {
    const images: { [key: string]: string } = {
      food: '/assets/rewards/default-food.jpg',
      beverage: '/assets/rewards/default-beverage.jpg',
      discount: '/assets/rewards/default-discount.jpg',
      delivery: '/assets/rewards/default-delivery.jpg',
      experience: '/assets/rewards/default-experience.jpg',
      merchandise: '/assets/rewards/default-merchandise.jpg',
    }
    return images[category || ''] || '/assets/rewards/default-reward.jpg';
  }
}