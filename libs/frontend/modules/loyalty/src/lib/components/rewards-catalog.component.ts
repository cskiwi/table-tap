import { Component, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyAccount, LoyaltyReward, LoyaltyRewardCategory, LoyaltyRewardType } from '@app/models';

@Component({
  selector: 'app-rewards-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rewards-catalog.component.html',
})
export class RewardsCatalogComponent implements OnInit, OnDestroy {
  readonly loyaltyAccount = input<LoyaltyAccount>();

  rewards: LoyaltyReward[] = []
  filteredRewards: LoyaltyReward[] = []

  // Filter states
  selectedCategory = '';
  selectedPointsRange = '';
  selectedAvailability = '';
  selectedSort = 'points-asc';

  // Loading states
  isLoading = false;
  isLoadingMore = false;
  hasMoreRewards = false;
  error?: string;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalRewards = 0;

  private destroy$ = new Subject<void>()

  constructor(private loyaltyService: LoyaltyService) {}

  ngOnInit(): void {
    this.loadRewards()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  async loadRewards(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    if (!loyaltyAccount) {
      this.error = 'Loyalty account required';
      return;
    }

    this.isLoading = true;
    this.error = undefined;
    this.currentPage = 0;

    try {
      const result = await this.loyaltyService.getAvailableRewards(
        loyaltyAccount.id,
        this.pageSize,
        0,
        this.getFilterParams()
      );

      this.rewards = result.rewards;
      this.totalRewards = result.total;
      this.hasMoreRewards = result.rewards.length === this.pageSize && result.total > this.pageSize;

      this.applyClientSideFilters()
    } catch (error: any) {
      this.error = error.message || 'Failed to load rewards';
      console.error('Error loading rewards:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreRewards(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    if (!loyaltyAccount || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.currentPage++;

    try {
      const result = await this.loyaltyService.getAvailableRewards(
        loyaltyAccount.id,
        this.pageSize,
        this.currentPage * this.pageSize,
        this.getFilterParams()
      );

      this.rewards = [...this.rewards, ...result.rewards]
      this.hasMoreRewards = this.rewards.length < result.total;

      this.applyClientSideFilters()
    } catch (error: any) {
      console.error('Error loading more rewards:', error);
      this.currentPage--; // Reset page on error
    } finally {
      this.isLoadingMore = false;
    }
  }

  applyFilters(): void {
    this.loadRewards(); // Reload with new filters
  }

  private applyClientSideFilters(): void {
    let filtered = [...this.rewards]

    // Apply sorting
    filtered = this.sortRewards(filtered);

    this.filteredRewards = filtered;
  }

  private sortRewards(rewards: LoyaltyReward[]): LoyaltyReward[] {
    switch (this.selectedSort) {
      case 'points-asc':
        return rewards.sort((a, b) => a.pointsCost - b.pointsCost);
      case 'points-desc':
        return rewards.sort((a, b) => b.pointsCost - a.pointsCost);
      case 'name':
        return rewards.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return rewards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popularity':
        return rewards.sort((a, b) => b.redemptionCount - a.redemptionCount);
      default:
        return rewards;
    }
  }

  private getFilterParams(): any {
    const filters: any = {};

    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }

    if (this.selectedPointsRange) {
      const [min, max] = this.selectedPointsRange.split('-');
      if (min) filters.minPoints = parseInt(min);
      if (max && max !== '') filters.maxPoints = parseInt(max);
    }

    return filters;
  }

  // Filter Management
  clearFilter(filterType: string): void {
    switch (filterType) {
      case 'category':
        this.selectedCategory = '';
        break;
      case 'pointsRange':
        this.selectedPointsRange = '';
        break;
      case 'availability':
        this.selectedAvailability = '';
        break;
    }
    this.applyFilters()
  }

  clearAllFilters(): void {
    this.selectedCategory = '';
    this.selectedPointsRange = '';
    this.selectedAvailability = '';
    this.selectedSort = 'points-asc';
    this.applyFilters()
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.selectedPointsRange || this.selectedAvailability);
  }

  // Reward Actions
  selectReward(reward: LoyaltyReward): void {
    this.loyaltyService.selectReward(reward);
  }

  async redeemReward(reward: LoyaltyReward, event: Event): Promise<void> {
    event.stopPropagation()

    const loyaltyAccount = this.loyaltyAccount();
    if (!this.canRedeem(reward) || !loyaltyAccount) return;

    try {
      const redemption = await this.loyaltyService.redeemReward({
        loyaltyAccountId: loyaltyAccount.id,
        rewardId: reward.id,
      });

      // Show success message
      console.log('Reward redeemed successfully:', redemption);

      // Refresh rewards and account data
      await this.loadRewards()

    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      // Show error message
    }
  }

  viewRewardDetails(reward: LoyaltyReward, event: Event): void {
    event.stopPropagation()
    // Navigate to reward details page or show modal
    this.selectReward(reward);
  }

  // Utility Methods
  isAffordable(reward: LoyaltyReward): boolean {
    return (this.loyaltyAccount()?.currentPoints || 0) >= reward.pointsCost;
  }

  canRedeem(reward: LoyaltyReward): boolean {
    return this.isAffordable(reward) && reward.isAvailable;
  }

  hasRedemptionLimits(reward: LoyaltyReward): boolean {
    return reward.maxRedemptionsPerUser > 0 ||
           reward.maxRedemptionsPerDay > 0 ||
           (reward.totalQuantity > 0 && reward.remainingQuantity >= 0);
  }

  getRedemptionLimitText(reward: LoyaltyReward): string {
    const limits = []

    if (reward.maxRedemptionsPerUser > 0) {
      limits.push(`${reward.maxRedemptionsPerUser} per customer`);
    }

    if (reward.maxRedemptionsPerDay > 0) {
      limits.push(`${reward.maxRedemptionsPerDay} per day`);
    }

    if (reward.totalQuantity > 0) {
      limits.push(`${reward.remainingQuantity} remaining`);
    }

    return limits.join(', ');
  }

  getTierRequirementText(reward: LoyaltyReward): string {
    const levels = reward.requiredTierLevels;
    if (levels.length === 1) {
      return `Tier ${levels[0]}+`;
    }
    return `Tiers ${levels.join(', ')}`;
  }

  // Display Name Helpers
  getCategoryDisplayName(category: string): string {
    const names: { [key: string]: string } = {
      food: 'Food',
      beverage: 'Beverage',
      discount: 'Discounts',
      delivery: 'Delivery',
      experience: 'Experiences',
      merchandise: 'Merchandise',
    }
    return names[category] || category;
  }

  getAvailabilityDisplayName(availability: string): string {
    const names: { [key: string]: string } = {
      available: 'Available Now',
      affordable: 'I Can Afford',
      featured: 'Featured',
      limited: 'Limited Time',
    }
    return names[availability] || availability;
  }

  getTypeDisplayName(type: LoyaltyRewardType): string {
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
    return names[type] || type;
  }

  getCategoryIcon(category: LoyaltyRewardCategory): string {
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
    return icons[category] || 'fas fa-gift';
  }

  getDefaultImage(category: LoyaltyRewardCategory): string {
    const images: { [key: string]: string } = {
      food: '/assets/rewards/default-food.jpg',
      beverage: '/assets/rewards/default-beverage.jpg',
      discount: '/assets/rewards/default-discount.jpg',
      delivery: '/assets/rewards/default-delivery.jpg',
      experience: '/assets/rewards/default-experience.jpg',
      merchandise: '/assets/rewards/default-merchandise.jpg',
    }
    return images[category] || '/assets/rewards/default-reward.jpg';
  }
}