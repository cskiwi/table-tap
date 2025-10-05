import { Component, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval, combineLatest } from 'rxjs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyChallenge, LoyaltyAccount, LoyaltyChallengeType } from '@app/models';

export interface ChallengeProgress {
  challengeId: string;
  current: number;
  target: number;
  percentage: number;
  isCompleted: boolean;
  lastUpdated: Date;
  recentActivity: any[];
}

export interface ProgressData {
  challengeId: string;
  current: number;
  target: number;
  percentage: number;
  isCompleted: boolean;
  lastUpdated: Date;
  nextMilestone?: any;
  recentActivity: any[];
}

@Component({
  selector: 'app-challenge-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-progress.component.html',
  animations: [],
})
export class ChallengeProgressComponent implements OnInit, OnDestroy {
  readonly loyaltyAccount = input<LoyaltyAccount>();
  readonly activeChallenges = input<LoyaltyChallenge[]>([]);

  progressData: { [challengeId: string]: ProgressData } = {};
  recentlyCompleted: LoyaltyChallenge[] = [];

  // Computed properties
  totalProgress: number = 0;
  nearCompletionCount: number = 0;
  bestProgressChallenge?: LoyaltyChallenge;
  mostUrgentChallenge?: LoyaltyChallenge;
  longestStreak: number = 0;
  weeklyActivity: number = 0;

  // Modal states
  showTipsModal: boolean = false;
  selectedChallengeForTips?: LoyaltyChallenge;

  private destroy$ = new Subject<void>();
  private refreshInterval = 30000; // 30 seconds

  constructor(private loyaltyService: LoyaltyService) {}

  ngOnInit(): void {
    this.loadProgressData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadProgressData(): Promise<void> {
    const activeChallenges = this.activeChallenges();
    if (!this.loyaltyAccount() || activeChallenges.length === 0) {
      return;
    }

    try {
      // Load progress for all active challenges
      const progressPromises = activeChallenges.map((challenge) =>
        this.loyaltyService.getChallengeProgress(this.loyaltyAccount()!.id, challenge.id),
      );

      const progressResults = await Promise.all(progressPromises);

      // Update progress data
      activeChallenges.forEach((challenge, index) => {
        const progress = progressResults[index];
        this.progressData[challenge.id] = {
          challengeId: challenge.id,
          current: progress.current || 0,
          target: progress.target || challenge.goals.targetValue || 1,
          percentage: progress.percentage || 0,
          isCompleted: progress.isCompleted || false,
          lastUpdated: new Date(progress.lastUpdated || Date.now()),
          nextMilestone: this.findNextMilestone(challenge, progress.percentage || 0),
          recentActivity: progress.recentActivity || [],
        }
      });

      // Load additional data
      await this.loadInsights();
      await this.loadRecentlyCompleted();

      this.calculateDerivedData();
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }

  private async loadInsights(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    if (!loyaltyAccount) return;

    try {
      const insights = await this.loyaltyService.getUserChallengeInsights(loyaltyAccount.id);
      this.longestStreak = insights.longestStreak || 0;
      this.weeklyActivity = insights.weeklyActivity || 0;
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }

  private async loadRecentlyCompleted(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    if (!loyaltyAccount) return;

    try {
      this.recentlyCompleted = await this.loyaltyService.getRecentlyCompletedChallenges(loyaltyAccount.id, 3);
    } catch (error) {
      console.error('Error loading recently completed challenges:', error);
    }
  }

  private calculateDerivedData(): void {
    const activeChallenges = this.activeChallenges();
    if (activeChallenges.length === 0) return;

    // Calculate average progress
    const totalProgress = Object.values(this.progressData).reduce((sum, data) => sum + data.percentage, 0);
    this.totalProgress = totalProgress / activeChallenges.length;

    // Count nearly complete challenges (>= 80%)
    this.nearCompletionCount = Object.values(this.progressData).filter((data) => data.percentage >= 80 && !data.isCompleted).length;

    // Find best progress challenge
    this.bestProgressChallenge = activeChallenges.reduce((best, current) => {
      const currentProgress = this.getProgressPercentage(current);
      const bestProgress = best ? this.getProgressPercentage(best) : 0;
      return currentProgress > bestProgress ? current : best;
    });

    // Find most urgent challenge
    this.mostUrgentChallenge = activeChallenges
      .filter((c) => c.daysUntilEnd !== null)
      .sort((a, b) => (a.daysUntilEnd || 999) - (b.daysUntilEnd || 999))[0];
  }

  private startAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadProgressData();
      });
  }

  private findNextMilestone(challenge: LoyaltyChallenge, currentPercentage: number): any {
    if (!challenge.milestones?.length) return null;

    return challenge.milestones.filter((m) => m.percentage > currentPercentage).sort((a, b) => a.percentage - b.percentage)[0];
  }

  // Progress Calculations
  getProgressPercentage(challenge: LoyaltyChallenge): number {
    return this.progressData[challenge.id]?.percentage || 0;
  }

  getCurrentValue(challenge: LoyaltyChallenge): number {
    return this.progressData[challenge.id]?.current || 0;
  }

  getTargetValue(challenge: LoyaltyChallenge): number {
    return this.progressData[challenge.id]?.target || challenge.goals.targetValue || 1;
  }

  getRemainingCount(challenge: LoyaltyChallenge): number {
    const current = this.getCurrentValue(challenge);
    const target = this.getTargetValue(challenge);
    return Math.max(0, target - current);
  }

  isNearlyComplete(challenge: LoyaltyChallenge): boolean {
    return this.getProgressPercentage(challenge) >= 80;
  }

  isCompleted(challenge: LoyaltyChallenge): boolean {
    return this.progressData[challenge.id]?.isCompleted || false;
  }

  hasRecentActivity(challenge: LoyaltyChallenge): boolean {
    const data = this.progressData[challenge.id];
    if (!data?.recentActivity?.length) return false;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return data.recentActivity.some((activity) => new Date(activity.createdAt) > oneHourAgo);
  }

  getLastActivityText(challenge: LoyaltyChallenge): string {
    const data = this.progressData[challenge.id];
    if (!data?.recentActivity?.length) return '';

    const lastActivity = data.recentActivity[0];
    const timeAgo = this.getTimeAgo(new Date(lastActivity.createdAt));
    return `+${lastActivity.progress} ${this.getChallengeUnit(challenge.type)} ${timeAgo}`;
  }

  getTimeRemaining(challenge: LoyaltyChallenge): { text: string; isEndingSoon: boolean } | null {
    if (!challenge.daysUntilEnd) return null;

    const days = challenge.daysUntilEnd;
    const isEndingSoon = days <= 3;

    let text: string;
    if (days < 1) {
      text = 'Less than 1 day';
    } else if (days === 1) {
      text = '1 day left';
    } else if (days <= 7) {
      text = `${days} days left`;
    } else {
      text = `${Math.ceil(days / 7)} weeks left`;
    }

    return { text, isEndingSoon }
  }

  getNextMilestone(challenge: LoyaltyChallenge): any {
    return this.progressData[challenge.id]?.nextMilestone;
  }

  isActiveMilestone(challenge: LoyaltyChallenge, milestone: any): boolean {
    const nextMilestone = this.getNextMilestone(challenge);
    return nextMilestone?.percentage === milestone.percentage;
  }

  // Utility Methods
  trackByChallenge(index: number, challenge: LoyaltyChallenge): string {
    return challenge.id;
  }

  getChallengeIcon(type: LoyaltyChallengeType): string {
    const icons = {
      order_count: 'fas fa-shopping-cart',
      spend_amount: 'fas fa-dollar-sign',
      points_earned: 'fas fa-coins',
      product_variety: 'fas fa-th-large',
      category_exploration: 'fas fa-compass',
      consecutive_days: 'fas fa-fire',
      weekly_visits: 'fas fa-calendar-week',
      monthly_goal: 'fas fa-calendar-alt',
      referral_count: 'fas fa-user-friends',
      review_count: 'fas fa-star',
      social_sharing: 'fas fa-share-alt',
      custom: 'fas fa-target',
    }
    return icons[type] || 'fas fa-trophy';
  }

  getChallengeUnit(type: LoyaltyChallengeType): string {
    const units = {
      order_count: 'orders',
      spend_amount: '$',
      points_earned: 'points',
      product_variety: 'items',
      category_exploration: 'categories',
      consecutive_days: 'days',
      weekly_visits: 'visits',
      monthly_goal: 'progress',
      referral_count: 'referrals',
      review_count: 'reviews',
      social_sharing: 'shares',
      custom: '',
    }
    return units[type] || '';
  }

  getMilestoneRewardText(reward: any): string {
    if (reward.points) return `${reward.points} pts`;
    if (reward.badgeId) return 'Badge';
    if (reward.message) return reward.message;
    return 'Reward';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  getCompletionTimeAgo(challenge: LoyaltyChallenge): string {
    // This would come from the challenge completion data
    return '2 hours ago';
  }

  getRandomDelay(): string {
    return `${Math.random() * 2}s`;
  }

  // Motivational Messages
  getMotivationalMessage(): any {
    const messages = [
      {
        title: "You're on fire! 🔥",
        text: 'Keep up the momentum with your active challenges.',
        actionText: 'View All',
        action: () => this.browseChallenges(),
      },
      {
        title: 'Almost there! 🎯',
        text: `${this.nearCompletionCount} challenge${this.nearCompletionCount === 1 ? '' : 's'} nearly complete.`,
        actionText: 'Push Forward',
        action: () => this.viewNearlyComplete(),
      },
      {
        title: 'New week, new goals! 📈',
        text: 'Start fresh with weekly challenges.',
        actionText: 'Browse Challenges',
        action: () => this.browseChallenges(),
      },
    ];
    if (this.nearCompletionCount > 0) return messages[1];
    if (this.activeChallenges().length > 0) return messages[0];
    return messages[2];
  }

  // Actions
  selectChallenge(challenge: LoyaltyChallenge): void {
    // Navigate to challenge detail
    console.log('Select challenge:', challenge.id);
  }

  viewDetails(challenge: LoyaltyChallenge, event: Event): void {
    event.stopPropagation();
    this.selectChallenge(challenge);
  }

  shareProgress(challenge: LoyaltyChallenge, event: Event): void {
    event.stopPropagation();

    const progress = this.getProgressPercentage(challenge);
    const shareText = `I'm ${progress.toFixed(0)}% complete on the "${challenge.name}" challenge!`;

    if (navigator.share) {
      navigator.share({
        title: 'Challenge Progress',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  }

  showTips(challenge: LoyaltyChallenge, event: Event): void {
    event.stopPropagation();
    this.selectedChallengeForTips = challenge;
    this.showTipsModal = true;
  }

  closeTipsModal(): void {
    this.showTipsModal = false;
    this.selectedChallengeForTips = undefined;
  }

  getProgressTips(): any[] {
    if (!this.selectedChallengeForTips) return [];

    const tips = [];
    const challenge = this.selectedChallengeForTips;
    const type = challenge.type;

    switch (type) {
      case LoyaltyChallengeType.ORDER_COUNT:
        tips.push({
          title: 'Order Regularly',
          description: 'Place smaller, more frequent orders rather than waiting for large orders.',
        });
        tips.push({
          title: 'Set Reminders',
          description: 'Use your phone to remind you to order daily or weekly.',
        });
        break;

      case LoyaltyChallengeType.SPEND_AMOUNT:
        tips.push({
          title: 'Bundle Items',
          description: 'Add sides or drinks to reach higher order totals more quickly.',
        });
        tips.push({
          title: 'Try Premium Items',
          description: 'Explore premium menu options that contribute more to your spending goal.',
        });
        break;

      case LoyaltyChallengeType.CONSECUTIVE_DAYS:
        tips.push({
          title: 'Start Small',
          description: 'Even a small coffee order counts towards your daily streak.',
        });
        tips.push({
          title: 'Plan Ahead',
          description: 'Schedule your orders or set daily alarms to maintain consistency.',
        });
        break;
    }

    if (tips.length === 0) {
      tips.push({
        title: 'Stay Consistent',
        description: 'Regular engagement is key to completing challenges successfully.',
      });
      tips.push({
        title: 'Track Your Progress',
        description: 'Check back frequently to see how close you are to completion.',
      });
    }

    return tips;
  }

  viewCompletedChallenge(challenge: LoyaltyChallenge): void {
    // Navigate to completed challenge view
    console.log('View completed challenge:', challenge.id);
  }

  browseChallenges(): void {
    // Navigate to challenge listing
    console.log('Browse challenges');
  }

  viewNearlyComplete(): void {
    // Filter to show only nearly complete challenges
    console.log('View nearly complete challenges');
  }
}
