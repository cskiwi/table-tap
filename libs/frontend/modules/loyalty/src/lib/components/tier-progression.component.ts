import { Component, computed, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyGraphQLService } from '../services/loyalty-graphql.service';
import { LoyaltyAccount, LoyaltyTier } from '@app/models';

@Component({
  selector: 'app-tier-progression',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tier-progression.component.html',
})
export class TierProgressionComponent {
  readonly account = input(signal<LoyaltyAccount | null>(null));
  readonly showAllTiers = input(signal(true));
  readonly showHistory = input(signal(false));

  private loyaltyService = inject(LoyaltyGraphQLService);

  // Component state
  allTiers = signal<LoyaltyTier[]>([]);
  showPerks = signal(false);
  tiersExpanded = signal(false);
  tierHistory = signal<any[]>([]);

  // Computed properties
  currentTier = computed(() => this.account()()?.currentTier || null);

  nextTier = computed(() => {
    const tiers = this.allTiers()
    const current = this.currentTier()
    if (!current || tiers.length === 0) return null;

    const currentIndex = tiers.findIndex(t => t.id === current.id);
    return currentIndex >= 0 && currentIndex < tiers.length - 1
      ? tiers[currentIndex + 1]
      : null;
  });

  currentTierIndex = computed(() => {
    const tiers = this.allTiers()
    const current = this.currentTier()
    return current ? tiers.findIndex(t => t.id === current.id) : -1;
  });

  isTopTier = computed(() => {
    const tiers = this.allTiers()
    const current = this.currentTier()
    if (!current || tiers.length === 0) return false;

    return tiers[tiers.length - 1].id === current.id;
  });

  // Progress calculations
  pointsRequired = computed(() => this.nextTier()?.minPoints || 0);
  spendingRequired = computed(() => this.nextTier()?.minAnnualSpending || 0);
  ordersRequired = computed(() => this.nextTier()?.ordersRequired || 0);

  pointsProgress = computed(() => {
    const account = this.account()()
    const required = this.pointsRequired()
    if (!account || required === 0) return 0;
    return Math.min((account.lifetimePoints / required) * 100, 100);
  });

  spendingProgress = computed(() => {
    const account = this.account()()
    const required = this.spendingRequired()
    if (!account || required === 0) return 0;
    return Math.min((account.yearlySpent / required) * 100, 100);
  });

  ordersProgress = computed(() => {
    const account = this.account()()
    const required = this.ordersRequired()
    if (!account || required === 0) return 0;
    return Math.min((account.yearlyOrders / required) * 100, 100);
  });

  tierProgress = computed(() => {
    const progresses = [
      this.pointsProgress(),
      this.spendingProgress(),
      this.ordersProgress()
    ].filter(p => p > 0);

    return progresses.length > 0
      ? Math.round(progresses.reduce((sum, p) => sum + p, 0) / progresses.length)
      : 0;
  });

  pointsRemaining = computed(() => {
    const account = this.account()()
    const required = this.pointsRequired()
    return Math.max(0, required - (account?.lifetimePoints || 0));
  });

  spendingRemaining = computed(() => {
    const account = this.account()()
    const required = this.spendingRequired()
    return Math.max(0, required - (account?.yearlySpent || 0));
  });

  ordersRemaining = computed(() => {
    const account = this.account()()
    const required = this.ordersRequired()
    return Math.max(0, required - (account?.yearlyOrders || 0));
  });

  maintenanceProgress = computed(() => {
    const account = this.account()()
    const current = this.currentTier()
    if (!account || !current?.minAnnualSpending) return 100;

    return Math.min((account.yearlySpent / current.minAnnualSpending) * 100, 100);
  });

  showTips = computed(() => {
    const remaining = [
      this.pointsRemaining(),
      this.spendingRemaining(),
      this.ordersRemaining()];
    return remaining.some(r => r > 0);
  });

  // Helper methods
  parseBenefits(benefits: any): string[] {
    if (!benefits) return [];
    if (Array.isArray(benefits)) return benefits;
    if (typeof benefits === 'string') {
      try {
        return JSON.parse(benefits);
      } catch {
        return benefits.split(',').map(b => b.trim());
      }
    }
    // Handle object format: convert object keys to readable strings
    if (typeof benefits === 'object') {
      return Object.entries(benefits)
        .filter(([_, value]) => value) // Only include truthy values
        .map(([key, value]) => {
          // Convert camelCase to readable text
          const readable = key.replace(/([A-Z])/g, ' $1').trim();
          return typeof value === 'boolean' ? readable : `${readable}: ${value}`;
        });
    }
    return [];
  }

  getTierTips(): string[] {
    const tips: string[] = []

    if (this.pointsRemaining() > 0) {
      tips.push(`Earn ${this.pointsRemaining()} more lifetime points by making purchases`);
    }

    if (this.spendingRemaining() > 0) {
      tips.push(`Spend $${this.spendingRemaining().toFixed(2)} more this year`);
    }

    if (this.ordersRemaining() > 0) {
      tips.push(`Place ${this.ordersRemaining()} more orders this year`);
    }

    // Add general tips
    tips.push('Complete loyalty challenges for bonus points');
    tips.push('Refer friends to earn referral bonuses');
    tips.push('Try new menu items for variety bonuses');

    return tips;
  }

  // Load tier data
  async loadTierData(): Promise<void> {
    const account = this.account()()
    if (!account) return;

    try {
      // This would typically come from the GraphQL service
      // For now, we'll use mock data
      const mockTiers: LoyaltyTier[] = [
        {
          id: '1',
          name: 'Bronze',
          description: 'Welcome to our loyalty program',
          minPoints: 0,
          color: '#cd7f32',
          icon: 'fas fa-medal',
          benefits: ['1 point per $1 spent', 'Birthday reward', 'Member-only offers'] as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any,
        {
          id: '2',
          name: 'Silver',
          description: 'Enjoy enhanced benefits',
          minPoints: 1000,
          minAnnualSpending: 500,
          color: '#c0c0c0',
          icon: 'fas fa-award',
          benefits: ['1.25 points per $1 spent', 'Free drink on birthday', 'Priority support'] as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any,
        {
          id: '3',
          name: 'Gold',
          description: 'Premium member benefits',
          minPoints: 2500,
          minAnnualSpending: 1200,
          ordersRequired: 24,
          color: '#ffd700',
          icon: 'fas fa-crown',
          benefits: ['1.5 points per $1 spent', 'Free food & drink on birthday', 'Exclusive events'] as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any,
        {
          id: '4',
          name: 'Platinum',
          description: 'VIP treatment and exclusive perks',
          minPoints: 5000,
          minAnnualSpending: 2500,
          ordersRequired: 50,
          color: '#e5e4e2',
          icon: 'fas fa-gem',
          benefits: ['2 points per $1 spent', 'Monthly free item', 'Personal concierge'] as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      ];
      this.allTiers.set(mockTiers);

      // Mock tier history
      if (this.showHistory()()) {
        this.tierHistory.set([
          {
            date: new Date(2023, 0, 15),
            tier: mockTiers[0],
            description: 'Welcome to our loyalty program!',
          },
          {
            date: new Date(2023, 5, 22),
            tier: mockTiers[1],
            description: 'Upgraded to Silver tier',
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading tier data:', error);
    }
  }

  ngOnInit(): void {
    this.loadTierData()
  }

  ngOnChanges(): void {
    if (this.account()()) {
      this.loadTierData()
    }
  }
}