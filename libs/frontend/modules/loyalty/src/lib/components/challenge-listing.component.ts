import { Component, OnInit, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LoyaltyService } from '../services/loyalty.service';
import {
  LoyaltyChallenge,
  LoyaltyAccount
} from '@app/models';
import { LoyaltyChallengeType, LoyaltyChallengeStatus, LoyaltyChallengeDifficulty } from '@app/models/enums';

export interface ChallengeFilter {
  type?: LoyaltyChallengeType;
  difficulty?: LoyaltyChallengeDifficulty;
  status?: 'available' | 'active' | 'completed' | 'expired';
  featured?: boolean;
  searchQuery?: string;
}

@Component({
  selector: 'app-challenge-listing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './challenge-listing.component.html',
})
export class ChallengeListingComponent implements OnInit, OnDestroy {
  readonly loyaltyAccount = input<LoyaltyAccount>();
  readonly cafeId = input<string>();
  readonly challengeSelected = output<LoyaltyChallenge>();
  readonly challengeJoined = output<LoyaltyChallenge>();

  // Challenge data
  challenges: LoyaltyChallenge[] = []
  filteredChallenges: LoyaltyChallenge[] = []
  activeChallenges: LoyaltyChallenge[] = []
  completedChallenges: LoyaltyChallenge[] = []
  userChallengeProgress: { [challengeId: string]: any } = {};

  // Filter states
  activeTab = 'all';
  filters: ChallengeFilter = {};
  searchQuery = '';
  sortBy = 'newest';
  showAdvancedFilters = false;

  // Loading states
  isLoading = false;
  isLoadingMore = false;
  isJoining = false;
  hasMoreChallenges = false;
  error?: string;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalChallenges = 0;

  // Computed counts
  allChallengesCount = 0;
  availableChallengesCount = 0;
  activeChallengesCount = 0;
  completedChallengesCount = 0;
  featuredChallengesCount = 0;
  totalPointsEarned = 0;
  currentStreak = 0;

  private destroy$ = new Subject<void>()
  private searchSubject = new Subject<string>()

  constructor(private loyaltyService: LoyaltyService) {
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.applyFilters()
    });
  }

  ngOnInit(): void {
    this.loadChallenges()
    this.loadUserStats()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  async loadChallenges(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    const cafeId = this.cafeId();
    if (!loyaltyAccount || !cafeId) {
      this.error = 'Loyalty account and cafe ID are required';
      return;
    }

    this.isLoading = true;
    this.error = undefined;
    this.currentPage = 0;

    try {
      // Load all challenges in parallel
      const [allChallenges, activeChallenges, completedChallenges, userProgress] = await Promise.all([
        this.loyaltyService.getAllChallenges(cafeId, this.getFilterParams()),
        this.loyaltyService.getActiveChallenges(loyaltyAccount.id),
        this.loyaltyService.getCompletedChallenges(loyaltyAccount.id),
        this.loyaltyService.getUserChallengeProgress(loyaltyAccount.id)
      ]);

      this.challenges = allChallenges;
      this.activeChallenges = activeChallenges;
      this.completedChallenges = completedChallenges;
      this.userChallengeProgress = userProgress;

      this.updateCounts()
      this.applyClientSideFilters()
    } catch (error: any) {
      this.error = error.message || 'Failed to load challenges';
      console.error('Error loading challenges:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUserStats(): Promise<void> {
    const loyaltyAccount = this.loyaltyAccount();
    if (!loyaltyAccount) return;

    try {
      const stats = await this.loyaltyService.getUserChallengeStats(loyaltyAccount.id);
      this.totalPointsEarned = stats.totalPointsEarned || 0;
      this.currentStreak = stats.currentStreak || 0;
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  private updateCounts(): void {
    this.allChallengesCount = this.challenges.length;
    this.activeChallengesCount = this.activeChallenges.length;
    this.completedChallengesCount = this.completedChallenges.length;
    this.featuredChallengesCount = this.challenges.filter(c => c.isFeatured).length;
    this.availableChallengesCount = this.challenges.filter(c =>
      !this.isActiveChallengeForUser(c) && !this.isCompletedByUser(c) && !c.isExpired
    ).length;
  }

  // Filter and Search Methods
  onSearchChange(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters()
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters()
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyFilters(): void {
    this.applyClientSideFilters()
  }

  private applyClientSideFilters(): void {
    let filtered = [...this.challenges]

    // Apply tab filter
    switch (this.activeTab) {
      case 'available':
        filtered = filtered.filter(c =>
          !this.isActiveChallengeForUser(c) &&
          !this.isCompletedByUser(c) &&
          !c.isExpired
        );
        break;
      case 'active':
        filtered = filtered.filter(c => this.isActiveChallengeForUser(c));
        break;
      case 'completed':
        filtered = filtered.filter(c => this.isCompletedByUser(c));
        break;
      case 'featured':
        filtered = filtered.filter(c => c.isFeatured);
        break;
      // 'all' case - no additional filtering
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.shortDescription?.toLowerCase().includes(query) ||
        c.displayType.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    if (this.filters.type) {
      filtered = filtered.filter(c => c.type === this.filters.type);
    }

    if (this.filters.difficulty) {
      filtered = filtered.filter(c => c.difficulty === this.filters.difficulty);
    }

    // Apply sorting
    filtered = this.sortChallenges(filtered);

    this.filteredChallenges = filtered;
  }

  private sortChallenges(challenges: LoyaltyChallenge[]): LoyaltyChallenge[] {
    switch (this.sortBy) {
      case 'newest':
        return challenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popular':
        return challenges.sort((a, b) => b.participantCount - a.participantCount);
      case 'difficulty_asc':
        return challenges.sort((a, b) => a.difficultyStars - b.difficultyStars);
      case 'difficulty_desc':
        return challenges.sort((a, b) => b.difficultyStars - a.difficultyStars);
      case 'ending_soon':
        return challenges.sort((a, b) => {
          if (!a.daysUntilEnd && !b.daysUntilEnd) return 0;
          if (!a.daysUntilEnd) return 1;
          if (!b.daysUntilEnd) return -1;
          return a.daysUntilEnd - b.daysUntilEnd;
        });
      case 'points_asc':
        return challenges.sort((a, b) => (a.rewards.completionPoints || 0) - (b.rewards.completionPoints || 0));
      case 'points_desc':
        return challenges.sort((a, b) => (b.rewards.completionPoints || 0) - (a.rewards.completionPoints || 0));
      case 'alphabetical':
        return challenges.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return challenges;
    }
  }

  applySorting(): void {
    this.applyClientSideFilters()
  }

  clearFilter(filterType: string): void {
    switch (filterType) {
      case 'type':
        this.filters.type = undefined;
        break;
      case 'difficulty':
        this.filters.difficulty = undefined;
        break;
    }
    this.applyFilters()
  }

  clearAllFilters(): void {
    this.filters = {};
    this.searchQuery = '';
    this.sortBy = 'newest';
    this.activeTab = 'all';
    this.applyFilters()
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.type || this.filters.difficulty || this.searchQuery);
  }

  private getFilterParams(): any {
    const params: any = {};

    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.difficulty) params.difficulty = this.filters.difficulty;

    return params;
  }

  // Challenge Actions
  selectChallenge(challenge: LoyaltyChallenge): void {
    this.challengeSelected.emit(challenge);
  }

  async joinChallenge(challenge: LoyaltyChallenge, event: Event): Promise<void> {
    event.stopPropagation()

    const loyaltyAccount = this.loyaltyAccount();
    if (!loyaltyAccount || this.isJoining) return;

    this.isJoining = true;

    try {
      await this.loyaltyService.joinChallenge(loyaltyAccount.id, challenge.id);

      // Update local state
      this.activeChallenges.push(challenge);
      this.updateCounts()
      this.applyClientSideFilters()

      this.challengeJoined.emit(challenge);

      // Show success notification
      console.log(`Successfully joined challenge: ${challenge.name}`);
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      // Show error notification
    } finally {
      this.isJoining = false;
    }
  }

  viewChallengeDetail(challenge: LoyaltyChallenge, event: Event): void {
    event.stopPropagation()
    this.selectChallenge(challenge);
  }

  shareChallenge(challenge: LoyaltyChallenge, event: Event): void {
    event.stopPropagation()

    if (navigator.share) {
      navigator.share({
        title: challenge.name,
        text: `Check out this challenge: ${challenge.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      // Show copied notification
    }
  }

  viewLeaderboard(challenge: LoyaltyChallenge, event: Event): void {
    event.stopPropagation()
    // Navigate to leaderboard or emit event
    console.log('View leaderboard for challenge:', challenge.id);
  }

  // Utility Methods
  trackByChallenge(index: number, challenge: LoyaltyChallenge): string {
    return challenge.id;
  }

  isActiveChallengeForUser(challenge: LoyaltyChallenge): boolean {
    return this.activeChallenges.some(c => c.id === challenge.id);
  }

  isCompletedByUser(challenge: LoyaltyChallenge): boolean {
    return this.completedChallenges.some(c => c.id === challenge.id);
  }

  isEndingSoon(challenge: LoyaltyChallenge): boolean {
    return challenge.daysUntilEnd !== null && challenge.daysUntilEnd <= 3;
  }

  getChallengeProgress(challenge: LoyaltyChallenge): any {
    const progress = this.userChallengeProgress[challenge.id]
    if (!progress) return null;

    return {
      current: progress.current || 0,
      target: progress.target || challenge.goals.targetValue || 1,
      percentage: progress.percentage || 0,
    }
  }

  getChallengeStatusText(challenge: LoyaltyChallenge): string {
    if (challenge.isExpired) return 'Expired';
    if (this.isCompletedByUser(challenge)) return 'Completed';
    if (this.isActiveChallengeForUser(challenge)) return 'Active';
    if (challenge.isFeatured) return 'Featured';
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

  getChallengeGoalText(challenge: LoyaltyChallenge): string {
    const goal = challenge.goals;
    const type = challenge.type;

    switch (type) {
      case LoyaltyChallengeType.ORDER_COUNT:
        return `Complete ${goal.targetValue} orders`;
      case LoyaltyChallengeType.SPEND_AMOUNT:
        return `Spend $${goal.targetValue}`;
      case LoyaltyChallengeType.POINTS_EARNED:
        return `Earn ${goal.targetValue} points`;
      case LoyaltyChallengeType.PRODUCT_VARIETY:
        return `Try ${goal.targetValue} different products`;
      case LoyaltyChallengeType.CATEGORY_EXPLORATION:
        return `Order from ${goal.targetValue} different categories`;
      case LoyaltyChallengeType.CONSECUTIVE_DAYS:
        return `Order for ${goal.targetValue} consecutive days`;
      case LoyaltyChallengeType.WEEKLY_VISITS:
        return `Visit ${goal.targetValue} times this week`;
      case LoyaltyChallengeType.MONTHLY_GOAL:
        return `Reach monthly target of ${goal.targetValue}`;
      case LoyaltyChallengeType.REFERRAL_COUNT:
        return `Refer ${goal.targetValue} friends`;
      case LoyaltyChallengeType.SOCIAL_SHARING:
        return `Share ${goal.targetValue} times on social media`;
      default:
        return challenge.description || 'Complete challenge goal';
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

  getTimeRemainingText(days: number): string {
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    if (days <= 7) return `${days} days left`;
    if (days <= 14) return `${Math.ceil(days/7)} weeks left`;
    if (days <= 30) return `${Math.ceil(days/7)} weeks left`;
    return `${Math.ceil(days/30)} months left`;
  }

  getDifficultyStars(count: number): number[] {
    return Array(count).fill(0);
  }

  getTypeDisplayName(type: LoyaltyChallengeType): string {
    const names = {
      order_count: 'Order Challenge',
      spend_amount: 'Spending Challenge',
      points_earned: 'Points Challenge',
      product_variety: 'Variety Challenge',
      category_exploration: 'Explorer Challenge',
      consecutive_days: 'Streak Challenge',
      weekly_visits: 'Weekly Challenge',
      monthly_goal: 'Monthly Challenge',
      referral_count: 'Referral Challenge',
      review_count: 'Review Challenge',
      social_sharing: 'Social Challenge',
      custom: 'Custom Challenge',
    }
    return names[type] || 'Challenge';
  }

  getDifficultyDisplayName(difficulty: LoyaltyChallengeDifficulty): string {
    const names = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
    }
    return names[difficulty] || 'Unknown';
  }
}