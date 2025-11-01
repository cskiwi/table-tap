import { Component, OnInit, OnDestroy, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LoyaltyGraphQLService } from '../services/loyalty-graphql.service';
import { LoyaltyAccount, LoyaltyTransaction, LoyaltyReward, LoyaltyChallenge } from '@app/models';

@Component({
  selector: 'app-loyalty-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loyalty-dashboard.component.html',
})
export class LoyaltyDashboardComponent implements OnInit, OnDestroy {
  readonly userId = input<string>();
  readonly cafeId = input<string>();

  // Inject services using modern Angular patterns
  private loyaltyGraphQLService = inject(LoyaltyGraphQLService);

  // Modern Angular signals for reactive state
  loyaltyAccount = signal<LoyaltyAccount | null>(null);
  featuredRewards = signal<LoyaltyReward[]>([]);
  activeChallengesList = signal<LoyaltyChallenge[]>([]);
  recentTransactions = signal<LoyaltyTransaction[]>([]);
  isLoading = signal(false);
  error = signal<string | undefined>(undefined);

  // Computed properties using signals
  activeChallenges = computed(() => this.loyaltyAccount()?.activeChallenges || 0);
  showBirthdayOffer = computed(() => this.loyaltyAccount()?.isBirthdayMonth || false);
  showAnniversaryOffer = computed(() => this.loyaltyAccount()?.isAnniversaryMonth || false);

  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.loadLoyaltyData()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  async loadLoyaltyData(): Promise<void> {
    const cafeId = this.cafeId();
    if (!cafeId) {
      this.error.set('Cafe ID is required');
      return;
    }

    this.isLoading.set(true);
    this.error.set(undefined);

    try {
      // Load loyalty account using GraphQL
      const account = await this.loyaltyGraphQLService.getLoyaltyAccount(cafeId);
      this.loyaltyAccount.set(account);

      if (account) {
        // Subscribe to real-time updates
        this.subscribeToRealTimeUpdates(account.id);

        // Load additional data in parallel
        await Promise.all([
          this.loadFeaturedRewards(),
          this.loadActiveChallenges(),
          this.loadRecentTransactions()
        ]);
      }
    } catch (error: any) {
      this.error.set(error.message || 'Failed to load loyalty data');
      console.error('Error loading loyalty data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadFeaturedRewards(): Promise<void> {
    const account = this.loyaltyAccount()
    const cafeId = this.cafeId();
    if (!account || !cafeId) return;

    try {
      const rewards = await this.loyaltyGraphQLService.getFeaturedRewards(cafeId, 6);
      this.featuredRewards.set(rewards);
    } catch (error) {
      console.error('Error loading featured rewards:', error);
    }
  }

  private async loadActiveChallenges(): Promise<void> {
    const cafeId = this.cafeId();
    if (!cafeId) return;

    try {
      const challenges = await this.loyaltyGraphQLService.getActiveChallenges(cafeId);
      this.activeChallengesList.set(challenges.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  }

  private async loadRecentTransactions(): Promise<void> {
    const account = this.loyaltyAccount()
    if (!account) return;

    try {
      const transactions = await this.loyaltyGraphQLService.getTransactionHistory(
        account.id,
        5
      );
      this.recentTransactions.set(transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  // Real-time subscription management
  private subscribeToRealTimeUpdates(accountId: string): void {
    // Subscribe to points earned events
    this.loyaltyGraphQLService.subscribeToPointsEarned(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pointsUpdate) => {
          console.log('Points earned:', pointsUpdate);
          // Update account with new points
          const currentAccount = this.loyaltyAccount()
          if (currentAccount) {
            this.loyaltyAccount.set({
              ...currentAccount,
              currentPoints: pointsUpdate.account.currentPoints,
              lifetimePoints: pointsUpdate.account.lifetimePoints,
            } as any);
          }
        },
        error: (error) => console.error('Points subscription error:', error)
      });

    // Subscribe to challenge progress updates
    this.loyaltyGraphQLService.subscribeToChallengeProgress(accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progressUpdate) => {
          console.log('Challenge progress:', progressUpdate);
          // Refresh challenges if needed
          if (progressUpdate.completed) {
            this.loadActiveChallenges()
          }
        },
        error: (error) => console.error('Challenge subscription error:', error)
      });
  }

  // UI Event Handlers
  showRewards(): void {
    // TODO: Navigate to rewards catalog
    console.log('Navigate to rewards');
  }

  showChallenges(): void {
    // TODO: Navigate to challenges page
    console.log('Navigate to challenges');
  }

  showReferral(): void {
    // TODO: Navigate to referral page
    console.log('Navigate to referral');
  }

  showHistory(): void {
    // TODO: Navigate to transaction history
    console.log('Navigate to history');
  }

  selectReward(reward: LoyaltyReward): void {
    // TODO: Navigate to reward details or show redemption modal
    console.log('Selected reward:', reward);
  }

  async claimBirthdayReward(): Promise<void> {
    const account = this.loyaltyAccount()
    if (!account) return;

    try {
      const updatedAccount = await this.loyaltyGraphQLService.claimBirthdayReward(account.id);
      this.loyaltyAccount.set(updatedAccount);
      // Show success message
      console.log('Birthday reward claimed successfully!');
    } catch (error: any) {
      console.error('Error claiming birthday reward:', error);
      this.error.set('Failed to claim birthday reward');
    }
  }

  async claimAnniversaryReward(): Promise<void> {
    const account = this.loyaltyAccount()
    if (!account) return;

    try {
      const updatedAccount = await this.loyaltyGraphQLService.claimAnniversaryReward(account.id);
      this.loyaltyAccount.set(updatedAccount);
      // Show success message
      console.log('Anniversary reward claimed successfully!');
    } catch (error: any) {
      console.error('Error claiming anniversary reward:', error);
      this.error.set('Failed to claim anniversary reward');
    }
  }

  // Join a challenge
  async joinChallenge(challenge: LoyaltyChallenge): Promise<void> {
    const account = this.loyaltyAccount()
    if (!account) return;

    try {
      const success = await this.loyaltyGraphQLService.joinChallenge(challenge.id, account.id);
      if (success) {
        console.log('Successfully joined challenge:', challenge.name);
        await this.loadActiveChallenges(); // Refresh challenges
      }
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      this.error.set('Failed to join challenge');
    }
  }

  // Helper Methods
  getDifficultyStars(count: number): number[] {
    return Array(count).fill(0);
  }

  getChallengeProgress(challenge: LoyaltyChallenge): number {
    const account = this.loyaltyAccount()
    const progressItem = account?.challengeProgresses?.find(cp => cp.challengeId === challenge.id);
    if (!progressItem) return 0;

    return (progressItem.progress / progressItem.target) * 100;
  }

  getChallengeCurrentValue(challenge: LoyaltyChallenge): number {
    const account = this.loyaltyAccount()
    const progressItem = account?.challengeProgresses?.find(cp => cp.challengeId === challenge.id);
    return progressItem?.progress || 0;
  }

  getChallengeUnit(challenge: LoyaltyChallenge): string {
    switch (challenge.type) {
      case 'order_count':
        return 'orders';
      case 'spend_amount':
        return '$';
      case 'points_earned':
        return 'points';
      case 'product_variety':
        return 'items';
      default:
        return '';
    }
  }
}