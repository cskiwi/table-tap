import { Component, OnInit, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { LoyaltyService } from '../services/loyalty.service';
import {
  LoyaltyChallenge,
  LoyaltyAccount,
  LoyaltyChallengeMilestone
} from '@app/models';
import { LoyaltyChallengeType } from '@app/models/enums';

@Component({
  selector: 'app-challenge-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-detail.component.html',
})
export class ChallengeDetailComponent implements OnInit, OnDestroy {
  readonly challenge = input<LoyaltyChallenge>();
  readonly loyaltyAccount = input<LoyaltyAccount>();
  readonly back = output<void>();
  readonly challengeJoined = output<LoyaltyChallenge>();
  readonly challengeLeft = output<LoyaltyChallenge>();

  challengeProgress: any = null;
  leaderboard: any[] = [];
  recentActivity: any[] = [];
  timeRemaining = '';
  currentUserRank = 0;
  userAvatar = '';
  userTierName = '';

  isActive = false;
  isCompleted = false;
  isEndingSoon = false;
  isJoining = false;
  isLeaving = false;
  showCelebration = false;

  private destroy$ = new Subject<void>()

  constructor(private loyaltyService: LoyaltyService) {}

  ngOnInit(): void {
    if (this.challenge() && this.loyaltyAccount()) {
      this.loadChallengeData()
      this.startTimeUpdates()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private async loadChallengeData(): Promise<void> {
    const challenge = this.challenge();
    const loyaltyAccount = this.loyaltyAccount();
    if (!challenge || !loyaltyAccount) return;

    try {
      // Load all challenge data in parallel
      const [progress, leaderboard, activity, userStatus] = await Promise.all([
        this.loyaltyService.getChallengeProgress(loyaltyAccount.id, challenge.id),
        this.loyaltyService.getChallengeLeaderboard(challenge.id, 10),
        this.loyaltyService.getChallengeActivity(loyaltyAccount.id, challenge.id),
        this.loyaltyService.getUserChallengeStatus(loyaltyAccount.id, challenge.id)
      ]);

      this.challengeProgress = progress;
      this.leaderboard = leaderboard;
      this.recentActivity = activity;

      this.isActive = userStatus.isActive;
      this.isCompleted = userStatus.isCompleted;
      this.currentUserRank = (userStatus as any).rank || 0;

      this.updateTimeRemaining()
    } catch (error) {
      console.error('Error loading challenge data:', error);
    }
  }

  private startTimeUpdates(): void {
    // Update time remaining every minute
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTimeRemaining()
      });
  }

  private updateTimeRemaining(): void {
    const challenge = this.challenge();
    if (!challenge) return;

    const now = new Date()

    if (challenge.endDate) {
      const endDate = new Date(challenge.endDate);
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        this.timeRemaining = 'Expired';
        return;
      }

      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      this.isEndingSoon = days <= 3;

      if (days === 1) {
        this.timeRemaining = '1 day remaining';
      } else if (days <= 7) {
        this.timeRemaining = `${days} days remaining`;
      } else if (days <= 30) {
        this.timeRemaining = `${Math.ceil(days / 7)} weeks remaining`;
      } else {
        this.timeRemaining = `${Math.ceil(days / 30)} months remaining`;
      }
    } else {
      this.timeRemaining = 'No end date';
    }
  }

  // Navigation
  onBack(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.back.emit()
  }

  // Challenge Actions
  async joinChallenge(): Promise<void> {
    const challenge = this.challenge();
    const loyaltyAccount = this.loyaltyAccount();
    if (!challenge || !loyaltyAccount || this.isJoining) return;

    this.isJoining = true;

    try {
      await this.loyaltyService.joinChallenge(loyaltyAccount.id, challenge.id);

      this.isActive = true;
      this.challengeJoined.emit(challenge);

      // Reload challenge data
      await this.loadChallengeData()

      console.log('Successfully joined challenge');
    } catch (error: any) {
      console.error('Error joining challenge:', error);
    } finally {
      this.isJoining = false;
    }
  }

  async leaveChallenge(): Promise<void> {
    const challenge = this.challenge();
    const loyaltyAccount = this.loyaltyAccount();
    if (!challenge || !loyaltyAccount || this.isLeaving) return;

    this.isLeaving = true;

    try {
      await this.loyaltyService.leaveChallenge(loyaltyAccount.id, challenge.id);

      this.isActive = false;
      this.challengeLeft.emit(challenge);

      // Clear progress data
      this.challengeProgress = null;

      console.log('Successfully left challenge');
    } catch (error: any) {
      console.error('Error leaving challenge:', error);
    } finally {
      this.isLeaving = false;
    }
  }

  shareChallenge(): void {
    const challenge = this.challenge();
    if (!challenge) return;

    const shareData = {
      title: challenge.name,
      text: `Check out this challenge: ${challenge.name}`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }

  viewFullLeaderboard(): void {
    // Navigate to full leaderboard view
    console.log('View full leaderboard for challenge:', this.challenge()?.id);
  }

  viewSimilarChallenges(): void {
    // Navigate to similar challenges
    console.log('View similar challenges');
  }

  // Progress and Milestones
  isCurrentMilestone(milestone: any): boolean {
    if (!this.challengeProgress) return false;

    const progress = this.challengeProgress.percentage;
    const nextMilestone = this.challenge()?.milestones?.find(m => m.percentage > progress);

    return nextMilestone?.percentage === milestone.percentage;
  }

  showMilestoneDetails(milestone: any): void {
    // Show milestone details modal
    console.log('Show milestone details:', milestone);
  }

  getMilestoneRewardText(milestone: LoyaltyChallengeMilestone): string {
    if (milestone.rewardPoints) return `${milestone.rewardPoints} points`;
    if (milestone.rewardBadgeId) return 'Special badge';
    if (milestone.rewardMessage) return milestone.rewardMessage;
    return 'Special reward';
  }

  // Challenge Information
  getStatusText(): string {
    if (this.challenge()?.isExpired) return 'Expired';
    if (this.isCompleted) return 'Completed';
    if (this.isActive) return 'Active';
    return 'Available';
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

  getChallengeGoalText(): string {
    const challenge = this.challenge();
    if (!challenge) return '';

    const goal = challenge.goals;
    const type = challenge.type;

    switch (type) {
      case LoyaltyChallengeType.ORDER_COUNT:
        return `Complete ${goal.targetValue} orders to win this challenge`;
      case LoyaltyChallengeType.SPEND_AMOUNT:
        return `Spend $${goal.targetValue} total to complete this challenge`;
      case LoyaltyChallengeType.POINTS_EARNED:
        return `Earn ${goal.targetValue} loyalty points through purchases`;
      case LoyaltyChallengeType.PRODUCT_VARIETY:
        return `Try ${goal.targetValue} different menu items`;
      case LoyaltyChallengeType.CATEGORY_EXPLORATION:
        return `Order from ${goal.targetValue} different menu categories`;
      case LoyaltyChallengeType.CONSECUTIVE_DAYS:
        return `Place orders on ${goal.targetValue} consecutive days`;
      case LoyaltyChallengeType.WEEKLY_VISITS:
        return `Visit and order ${goal.targetValue} times this week`;
      case LoyaltyChallengeType.MONTHLY_GOAL:
        return `Reach your monthly target of ${goal.targetValue}`;
      case LoyaltyChallengeType.REFERRAL_COUNT:
        return `Refer ${goal.targetValue} friends to join our loyalty program`;
      case LoyaltyChallengeType.SOCIAL_SHARING:
        return `Share your experience ${goal.targetValue} times on social media`;
      default:
        return challenge.description || 'Complete the challenge requirements';
    }
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

  getChallengeCompletionTips(): string[] {
    const challenge = this.challenge();
    if (!challenge) return []

    const tips: string[] = []
    const type = challenge.type;

    switch (type) {
      case LoyaltyChallengeType.ORDER_COUNT:
        tips.push('Order regularly throughout the challenge period');
        tips.push('Try ordering smaller items more frequently');
        break;
      case LoyaltyChallengeType.SPEND_AMOUNT:
        tips.push('Bundle items together to reach higher amounts');
        tips.push('Consider trying premium menu items');
        break;
      case LoyaltyChallengeType.CONSECUTIVE_DAYS:
        tips.push('Set daily reminders to maintain your streak');
        tips.push('Even small orders count towards consecutive days');
        break;
      case LoyaltyChallengeType.PRODUCT_VARIETY:
        tips.push('Explore different sections of the menu');
        tips.push('Ask staff for recommendations on new items');
        break;
    }

    if (tips.length === 0) {
      tips.push('Check your progress regularly');
      tips.push('Share the challenge with friends for motivation');
    }

    return tips;
  }

  // Requirements and Rules
  hasDetailedRequirements(): boolean {
    const challenge = this.challenge();
    if (!challenge) return false;

    const goals = challenge.goals;
    return !!(
      goals.minimumOrderValue ||
      goals.requiredProductIds?.length ||
      goals.requiredCategoryIds?.length ||
      goals.consecutiveDays
    );
  }

  hasTrackingRules(): boolean {
    const challenge = this.challenge();
    if (!challenge) return false;

    const rules = challenge.trackingRules;
    return !!(
      rules.countOnlyCompletedOrders ||
      rules.countOnlyPaidOrders ||
      rules.minimumOrderValue ||
      rules.excludeRefunds ||
      rules.resetOnFailedDay
    );
  }

  // Display Helpers
  getDifficultyText(difficulty: string): string {
    const texts = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
    }
    return texts[difficulty as keyof typeof texts] || difficulty;
  }

  getDifficultyStars(count: number): number[] {
    return Array(count).fill(0);
  }

  getRankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-normal';
  }

  getTrophyClass(index: number): string {
    if (index === 0) return 'trophy-gold';
    if (index === 1) return 'trophy-silver';
    if (index === 2) return 'trophy-bronze';
    return '';
  }

  // Celebration
  showCompletionCelebration(): void {
    this.showCelebration = true;

    // Auto-close after 5 seconds
    setTimeout(() => {
      this.closeCelebration()
    }, 5000);
  }

  closeCelebration(): void {
    this.showCelebration = false;
  }
}