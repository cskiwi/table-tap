import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyChallenge,
  LoyaltyPromotion,
  LoyaltyTier
} from '@app/models';

export interface LoyaltyRedemptionRequest {
  loyaltyAccountId: string;
  rewardId: string;
  orderId?: string;
  notes?: string;
}

export interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averageOrderValue: number;
  topTierMembers: number;
  redemptionRate: number;
  engagementRate: number;
}

export interface ChallengeProgress {
  challenge: LoyaltyChallenge;
  currentProgress: number;
  targetValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  timeRemaining?: number;
  nextMilestone?: any;
  current?: number;
  target?: number;
  percentage?: number;
  lastUpdated?: string | Date;
  recentActivity?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class LoyaltyService {
  private readonly baseUrl = '/api/loyalty';

  // State management
  private loyaltyAccountSubject = new BehaviorSubject<LoyaltyAccount | null>(null);
  public loyaltyAccount$ = this.loyaltyAccountSubject.asObservable()

  private rewardsSubject = new BehaviorSubject<LoyaltyReward[]>([]);
  public rewards$ = this.rewardsSubject.asObservable()

  private challengesSubject = new BehaviorSubject<LoyaltyChallenge[]>([]);
  public challenges$ = this.challengesSubject.asObservable()

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ==================== LOYALTY ACCOUNT ====================

  /**
   * Get loyalty account for a user
   */
  async getLoyaltyAccount(userId: string, cafeId: string): Promise<LoyaltyAccount | null> {
    try {
      const account = await firstValueFrom(
        this.http.get<LoyaltyAccount>(`${this.baseUrl}/accounts/${userId}?cafeId=${cafeId}`)
      );
      this.loyaltyAccountSubject.next(account);
      return account;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // Account doesn't exist yet
      }
      throw error;
    }
  }

  /**
   * Create a new loyalty account
   */
  async createLoyaltyAccount(userId: string, cafeId: string): Promise<LoyaltyAccount> {
    const account = await firstValueFrom(
      this.http.post<LoyaltyAccount>(`${this.baseUrl}/accounts`, {
        userId,
        cafeId
      })
    );
    this.loyaltyAccountSubject.next(account);
    return account;
  }

  /**
   * Update loyalty account preferences
   */
  async updateLoyaltyPreferences(
    accountId: string,
    preferences: any
  ): Promise<LoyaltyAccount> {
    const account = await firstValueFrom(
      this.http.patch<LoyaltyAccount>(`${this.baseUrl}/accounts/${accountId}/preferences`, {
        preferences
      })
    );
    this.loyaltyAccountSubject.next(account);
    return account;
  }

  // ==================== POINTS & TRANSACTIONS ====================

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    accountId: string,
    limit = 20,
    offset = 0
  ): Promise<LoyaltyTransaction[]> {
    return firstValueFrom(
      this.http.get<LoyaltyTransaction[]>(
        `${this.baseUrl}/accounts/${accountId}/transactions?limit=${limit}&offset=${offset}`
      )
    );
  }

  /**
   * Get points balance and breakdown
   */
  async getPointsBalance(accountId: string): Promise<{
    currentPoints: number;
    lifetimePoints: number;
    pointsRedeemed: number;
    pendingPoints: number;
    expiringPoints: { amount: number; expiryDate: Date }[]
  }> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/points-balance`)
    );
  }

  // ==================== REWARDS ====================

  /**
   * Get available rewards for an account
   */
  async getAvailableRewards(
    accountId: string,
    limit = 20,
    offset = 0,
    filters?: {
      category?: string;
      maxPoints?: number;
      minPoints?: number;
      type?: string;
    }
  ): Promise<{ rewards: LoyaltyReward[]; total: number }> {
    let url = `${this.baseUrl}/accounts/${accountId}/rewards?limit=${limit}&offset=${offset}`;

    if (filters) {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      url += `&${params.toString()}`;
    }

    const result = await firstValueFrom(
      this.http.get<{ rewards: LoyaltyReward[]; total: number }>(url)
    );

    this.rewardsSubject.next(result.rewards);
    return result;
  }

  /**
   * Get reward details
   */
  async getRewardDetails(rewardId: string): Promise<LoyaltyReward> {
    return firstValueFrom(
      this.http.get<LoyaltyReward>(`${this.baseUrl}/rewards/${rewardId}`)
    );
  }

  /**
   * Redeem a reward
   */
  async redeemReward(request: LoyaltyRedemptionRequest): Promise<LoyaltyRewardRedemption> {
    return firstValueFrom(
      this.http.post<LoyaltyRewardRedemption>(`${this.baseUrl}/rewards/redeem`, request)
    );
  }

  /**
   * Get user's redemption history
   */
  async getRedemptionHistory(
    accountId: string,
    limit = 20,
    offset = 0
  ): Promise<{ redemptions: LoyaltyRewardRedemption[]; total: number }> {
    return firstValueFrom(
      this.http.get<{ redemptions: LoyaltyRewardRedemption[]; total: number }>(
        `${this.baseUrl}/accounts/${accountId}/redemptions?limit=${limit}&offset=${offset}`
      )
    );
  }

  /**
   * Cancel a pending redemption
   */
  async cancelRedemption(redemptionId: string): Promise<LoyaltyRewardRedemption> {
    return firstValueFrom(
      this.http.delete<LoyaltyRewardRedemption>(`${this.baseUrl}/redemptions/${redemptionId}`)
    );
  }

  // ==================== CHALLENGES ====================

  /**
   * Get active challenges for an account
   */
  async getActiveChallenges(
    accountId: string,
    limit = 10
  ): Promise<LoyaltyChallenge[]> {
    const challenges = await firstValueFrom(
      this.http.get<LoyaltyChallenge[]>(
        `${this.baseUrl}/accounts/${accountId}/challenges/active?limit=${limit}`
      )
    );
    this.challengesSubject.next(challenges);
    return challenges;
  }

  /**
   * Get all available challenges
   */
  async getAllChallenges(
    cafeId: string,
    filters?: {
      difficulty?: string;
      type?: string;
      status?: string;
    }
  ): Promise<LoyaltyChallenge[]> {
    let url = `${this.baseUrl}/challenges?cafeId=${cafeId}`;

    if (filters) {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      url += `&${params.toString()}`;
    }

    return firstValueFrom(
      this.http.get<LoyaltyChallenge[]>(url)
    );
  }

  /**
   * Get challenge progress for an account
   */
  async getChallengeProgress(
    accountId: string,
    challengeId: string
  ): Promise<ChallengeProgress> {
    return firstValueFrom(
      this.http.get<ChallengeProgress>(
        `${this.baseUrl}/accounts/${accountId}/challenges/${challengeId}/progress`
      )
    );
  }

  /**
   * Join a challenge
   */
  async joinChallenge(
    accountId: string,
    challengeId: string
  ): Promise<{ success: boolean; message: string }> {
    return firstValueFrom(
      this.http.post<{ success: boolean; message: string }>(
        `${this.baseUrl}/accounts/${accountId}/challenges/${challengeId}/join`,
        {}
      )
    );
  }

  // ==================== TIERS ====================

  /**
   * Get all loyalty tiers for a cafe
   */
  async getLoyaltyTiers(cafeId: string): Promise<LoyaltyTier[]> {
    return firstValueFrom(
      this.http.get<LoyaltyTier[]>(`${this.baseUrl}/tiers?cafeId=${cafeId}`)
    );
  }

  /**
   * Get tier benefits and requirements
   */
  async getTierDetails(tierId: string): Promise<LoyaltyTier> {
    return firstValueFrom(
      this.http.get<LoyaltyTier>(`${this.baseUrl}/tiers/${tierId}`)
    );
  }

  /**
   * Calculate points needed for next tier
   */
  async getNextTierRequirements(accountId: string): Promise<{
    currentTier: LoyaltyTier | null;
    nextTier: LoyaltyTier | null;
    pointsNeeded: number;
    spendNeeded: number;
    ordersNeeded: number;
    progress: number;
  }> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/next-tier`)
    );
  }

  // ==================== PROMOTIONS ====================

  /**
   * Get active promotions for a user
   */
  async getActivePromotions(
    accountId: string
  ): Promise<LoyaltyPromotion[]> {
    return firstValueFrom(
      this.http.get<LoyaltyPromotion[]>(
        `${this.baseUrl}/accounts/${accountId}/promotions/active`
      )
    );
  }

  /**
   * Check if user is eligible for a promotion
   */
  async checkPromotionEligibility(
    accountId: string,
    promotionId: string
  ): Promise<{ isEligible: boolean; reason?: string }> {
    return firstValueFrom(
      this.http.get<{ isEligible: boolean; reason?: string }>(
        `${this.baseUrl}/accounts/${accountId}/promotions/${promotionId}/eligibility`
      )
    );
  }

  // ==================== REFERRALS ====================

  /**
   * Get referral code for user
   */
  async getReferralCode(accountId: string): Promise<{ referralCode: string; referralUrl: string }> {
    return firstValueFrom(
      this.http.get<{ referralCode: string; referralUrl: string }>(
        `${this.baseUrl}/accounts/${accountId}/referral-code`
      )
    );
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(accountId: string): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    bonusEarned: number;
    pendingReferrals: number;
  }> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/referral-stats`)
    );
  }

  /**
   * Process a referral
   */
  async processReferral(
    referralCode: string,
    newUserId: string,
    cafeId: string
  ): Promise<{ success: boolean; message: string; bonus?: number }> {
    return firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/referrals/process`, {
        referralCode,
        newUserId,
        cafeId
      })
    );
  }

  // ==================== SPECIAL REWARDS ====================

  /**
   * Claim birthday reward
   */
  async claimBirthdayReward(accountId: string): Promise<LoyaltyTransaction> {
    return firstValueFrom(
      this.http.post<LoyaltyTransaction>(
        `${this.baseUrl}/accounts/${accountId}/birthday-reward`,
        {}
      )
    );
  }

  /**
   * Claim anniversary reward
   */
  async claimAnniversaryReward(accountId: string): Promise<LoyaltyTransaction> {
    return firstValueFrom(
      this.http.post<LoyaltyTransaction>(
        `${this.baseUrl}/accounts/${accountId}/anniversary-reward`,
        {}
      )
    );
  }

  /**
   * Check for available special rewards
   */
  async getAvailableSpecialRewards(accountId: string): Promise<{
    birthdayReward?: { available: boolean; points: number }
    anniversaryReward?: { available: boolean; points: number }
    otherRewards: any[]
  }> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/special-rewards`)
    );
  }

  // ==================== ANALYTICS ====================

  /**
   * Get loyalty program statistics for a cafe
   */
  async getLoyaltyStats(cafeId: string): Promise<LoyaltyStats> {
    return firstValueFrom(
      this.http.get<LoyaltyStats>(`${this.baseUrl}/stats?cafeId=${cafeId}`)
    );
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(accountId: string): Promise<{
    loginStreak: number;
    orderFrequency: number;
    averageOrderValue: number;
    favoriteCategories: string[]
    pointsEarnedThisMonth: number;
    challengesCompleted: number;
  }> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/engagement`)
    );
  }

  // ==================== INTEGRATION WITH ORDER SYSTEM ====================

  /**
   * Calculate points for a potential order
   */
  async calculatePointsForOrder(
    accountId: string,
    orderAmount: number,
    productIds?: string[]
  ): Promise<{
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    multiplier: number;
    appliedPromotions: LoyaltyPromotion[]
  }> {
    return firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/accounts/${accountId}/calculate-points`, {
        orderAmount,
        productIds
      })
    );
  }

  /**
   * Apply loyalty discount to order
   */
  async applyLoyaltyDiscount(
    accountId: string,
    orderId: string,
    redemptionId: string
  ): Promise<{ discountApplied: number; newOrderTotal: number }> {
    return firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/orders/${orderId}/apply-discount`, {
        accountId,
        redemptionId
      })
    );
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Get loyalty notifications for user
   */
  async getLoyaltyNotifications(
    accountId: string,
    limit = 10
  ): Promise<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    metadata?: any;
  }[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.baseUrl}/accounts/${accountId}/notifications?limit=${limit}`)
    );
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${this.baseUrl}/notifications/${notificationId}/read`, {})
    );
  }

  // ==================== NAVIGATION HELPERS ====================

  navigateToRewards(): void {
    this.router.navigate(['/loyalty/rewards']);
  }

  navigateToChallenges(): void {
    this.router.navigate(['/loyalty/challenges']);
  }

  navigateToReferral(): void {
    this.router.navigate(['/loyalty/referral']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/loyalty/history']);
  }

  selectReward(reward: LoyaltyReward): void {
    this.router.navigate(['/loyalty/rewards', reward.id]);
  }

  /**
   * Get completed challenges for an account
   */
  async getCompletedChallenges(
    accountId: string,
    limit = 10
  ): Promise<LoyaltyChallenge[]> {
    return firstValueFrom(
      this.http.get<LoyaltyChallenge[]>(
        `${this.baseUrl}/accounts/${accountId}/challenges/completed?limit=${limit}`
      )
    );
  }

  /**
   * Get user challenge progress across all challenges
   */
  async getUserChallengeProgress(accountId: string): Promise<{ [challengeId: string]: any }> {
    return firstValueFrom(
      this.http.get<{ [challengeId: string]: any }>(
        `${this.baseUrl}/accounts/${accountId}/challenges/progress`
      )
    );
  }

  /**
   * Get user challenge statistics
   */
  async getUserChallengeStats(accountId: string): Promise<{
    totalPointsEarned: number;
    currentStreak: number;
    challengesCompleted: number;
    activeChallenges: number;
  }> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/challenges/stats`)
    );
  }

  /**
   * Get user challenge insights
   */
  async getUserChallengeInsights(accountId: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/accounts/${accountId}/challenges/insights`)
    );
  }

  /**
   * Get recently completed challenges
   */
  async getRecentlyCompletedChallenges(accountId: string, limit = 5): Promise<LoyaltyChallenge[]> {
    return firstValueFrom(
      this.http.get<LoyaltyChallenge[]>(
        `${this.baseUrl}/accounts/${accountId}/challenges/recent-completed?limit=${limit}`
      )
    );
  }

  /**
   * Get user challenge status
   */
  async getUserChallengeStatus(accountId: string, challengeId: string): Promise<{ isActive: boolean; isCompleted: boolean }> {
    return firstValueFrom(
      this.http.get<{ isActive: boolean; isCompleted: boolean }>(
        `${this.baseUrl}/accounts/${accountId}/challenges/${challengeId}/status`
      )
    );
  }

  /**
   * Leave a challenge
   */
  async leaveChallenge(accountId: string, challengeId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.baseUrl}/accounts/${accountId}/challenges/${challengeId}/leave`,
        {}
      )
    );
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string, limit = 10): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(
        `${this.baseUrl}/challenges/${challengeId}/leaderboard?limit=${limit}`
      )
    );
  }

  /**
   * Get challenge activity
   */
  async getChallengeActivity(accountId: string, challengeId: string): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(
        `${this.baseUrl}/accounts/${accountId}/challenges/${challengeId}/activity`
      )
    );
  }

  // ==================== STATE MANAGEMENT ====================

  getCurrentAccount(): LoyaltyAccount | null {
    return this.loyaltyAccountSubject.value;
  }

  async refreshLoyaltyData(userId: string, cafeId: string): Promise<void> {
    await this.getLoyaltyAccount(userId, cafeId);
  }

  clearLoyaltyData(): void {
    this.loyaltyAccountSubject.next(null);
    this.rewardsSubject.next([]);
    this.challengesSubject.next([]);
  }
}