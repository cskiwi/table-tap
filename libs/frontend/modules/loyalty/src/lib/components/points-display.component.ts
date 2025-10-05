import { Component, computed, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyGraphQLService } from '../services/loyalty-graphql.service';
import { LoyaltyAccount } from '@app/models';

@Component({
  selector: 'app-points-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-display.component.html',
})
export class PointsDisplayComponent {
  readonly account = input(signal<LoyaltyAccount | null>(null));
  readonly showBreakdown = input(signal(true));
  readonly showActions = input(signal(true));
  readonly showVelocity = input(signal(true));
  readonly showGamification = input(signal(false));

  private loyaltyService = inject(LoyaltyGraphQLService);

  // Reactive state
  pendingPoints = signal(0);
  monthlyEarned = signal(0);
  monthlySpent = signal(0);
  expiringPoints = signal<{ amount: number; expiryDate: Date }[]>([]);
  recentTransactions = signal<any[]>([]);
  currentStreak = signal(0);
  nextAchievement = signal<any>(null);
  animatePointsChange = signal(false);

  // Computed properties
  netGain = computed(() => this.monthlyEarned() - this.monthlySpent());

  earnVsSpendRatio = computed(() => {
    const total = this.monthlyEarned() + this.monthlySpent()
    return total > 0 ? (this.monthlyEarned() / total) * 100 : 50;
  });

  totalExpiringPoints = computed(() =>
    this.expiringPoints().reduce((sum, item) => sum + item.amount, 0)
  );

  achievementProgress = computed(() => {
    const achievement = this.nextAchievement()
    if (!achievement) return 0;

    const account = this.account()()
    if (!account) return 0;

    // Example: calculate progress based on achievement type
    switch (achievement.type) {
      case 'points_earned':
        return Math.min((account.lifetimePoints / achievement.target) * 100, 100);
      case 'orders_placed':
        return Math.min((account.totalOrders / achievement.target) * 100, 100);
      default:
        return 0;
    }
  });

  achievementProgressText = computed(() => {
    const achievement = this.nextAchievement()
    if (!achievement) return '';

    const account = this.account()()
    if (!account) return '';

    const remaining = achievement.target - achievement.current;
    return `${remaining} more to unlock`;
  });

  // Event handlers
  showEarnPointsGuide(): void {
    // TODO: Show modal with ways to earn points
    console.log('Show earn points guide');
  }

  showRewardsStore(): void {
    // TODO: Navigate to rewards catalog
    console.log('Navigate to rewards store');
  }

  showExpiringDetails(): void {
    // TODO: Show detailed view of expiring points
    console.log('Show expiring points details');
  }

  showFullHistory(): void {
    // TODO: Navigate to full transaction history
    console.log('Navigate to full history');
  }

  // Animation trigger
  triggerPointsAnimation(): void {
    this.animatePointsChange.set(true);
    setTimeout(() => this.animatePointsChange.set(false), 1000);
  }

  // Load additional data
  async loadAdditionalData(): Promise<void> {
    const account = this.account()()
    if (!account) return;

    try {
      // Load recent transactions
      const transactions = await this.loyaltyService.getTransactionHistory(account.id, 5);
      this.recentTransactions.set(transactions);

      // TODO: Load additional metrics from backend
      // This would typically come from the GraphQL service
      this.monthlyEarned.set(450); // Placeholder
      this.monthlySpent.set(200); // Placeholder
      this.currentStreak.set(7); // Placeholder

      // Mock expiring points
      this.expiringPoints.set([
        { amount: 150, expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
        { amount: 75, expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) }
      ]);

      // Mock next achievement
      this.nextAchievement.set({
        name: 'Coffee Enthusiast',
        description: 'Order 50 coffee drinks',
        icon: 'fas fa-coffee',
        type: 'orders_placed',
        current: account.totalOrders,
        target: 50,
      });

    } catch (error) {
      console.error('Error loading additional points data:', error);
    }
  }

  ngOnInit(): void {
    this.loadAdditionalData()
  }

  ngOnChanges(): void {
    if (this.account()()) {
      this.loadAdditionalData()
    }
  }
}