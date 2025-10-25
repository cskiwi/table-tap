import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyChallenge,
  LoyaltyPromotion,
  LoyaltyTier,
} from '@app/models';

// GraphQL Queries
const GET_LOYALTY_ACCOUNT = gql`
  query GetMyLoyaltyAccount($cafeId: String!) {
    myLoyaltyAccount(cafeId: $cafeId) {
      id
      loyaltyNumber
      currentPoints
      lifetimePoints
      pointsRedeemed
      totalSpent
      yearlySpent
      totalOrders
      yearlyOrders
      lastActivityAt
      lastOrderAt
      birthDate
      anniversaryDate
      lastBirthdayRewardAt
      lastAnniversaryRewardAt
      referralCount
      referralBonusEarned
      badges
      challengeProgress
      preferences
      isActive
      isVip
      notes
      availablePoints
      pointsToNextTier
      tierProgress
      isBirthdayMonth
      isAnniversaryMonth
      daysSinceLastActivity
      badgeCount
      activeChallenges
      currentTier {
        id
        name
        description
        minPoints
        color
        icon
        benefits
        isActive
      }
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const GET_AVAILABLE_REWARDS = gql`
  query GetAvailableRewards($accountId: String!, $cafeId: String!, $limit: Int = 20) {
    availableLoyaltyRewards(accountId: $accountId, cafeId: $cafeId) {
      id
      name
      description
      pointsCost
      cashValue
      type
      category
      image
      terms
      maxQuantity
      isActive
      isFeatured
      isLimitedTime
      validFrom
      validUntil
      displayValue
      totalRedemptions
      remainingQuantity
      isAvailable
    }
  }
`;

const GET_FEATURED_REWARDS = gql`
  query GetFeaturedRewards($cafeId: String!, $limit: Int = 6) {
    featuredLoyaltyRewards(cafeId: $cafeId, limit: $limit) {
      id
      name
      description
      pointsCost
      cashValue
      type
      category
      image
      terms
      isLimitedTime
      displayValue
      remainingQuantity
      isAvailable
    }
  }
`;

const GET_LOYALTY_TRANSACTIONS = gql`
  query GetLoyaltyTransactions($accountId: String!, $limit: Int = 50, $offset: Int = 0, $type: LoyaltyTransactionType) {
    loyaltyTransactionsByAccount(accountId: $accountId, limit: $limit, offset: $offset, type: $type) {
      id
      type
      status
      description
      points
      referenceId
      orderId
      rewardId
      promotionId
      expiresAt
      createdAt
      order {
        id
        orderNumber
        total
      }
      reward {
        id
        name
      }
      runningBalance
      canVoid
      canAdjust
    }
  }
`;

const GET_ACTIVE_CHALLENGES = gql`
  query GetActiveChallenges($cafeId: String!, $type: LoyaltyChallengeType) {
    activeLoyaltyChallenges(cafeId: $cafeId, type: $type) {
      id
      name
      description
      shortDescription
      type
      status
      difficulty
      icon
      color
      startDate
      endDate
      rules
      rewards
      participantCount
      completionCount
      isActive
      hasExpired
      daysRemaining
      completionRate
    }
  }
`;

const GET_MY_CHALLENGES = gql`
  query GetMyChallenges($cafeId: String!, $status: LoyaltyChallengeStatus) {
    myChallenges(cafeId: $cafeId, status: $status) {
      id
      name
      description
      type
      status
      difficulty
      icon
      color
      startDate
      endDate
      rules
      rewards
      daysRemaining
      isActive
    }
  }
`;

const GET_CHALLENGE_PROGRESS = gql`
  query GetChallengeProgress($challengeId: String!, $accountId: String!) {
    challengeProgress(challengeId: $challengeId, accountId: $accountId) {
      challenge {
        id
        name
        description
        type
        rules
        rewards
      }
      currentProgress
      targetValue
      progressPercentage
      isCompleted
      timeRemaining
      nextMilestone
    }
  }
`;

// GraphQL Mutations
const REDEEM_REWARD = gql`
  mutation RedeemReward($input: RedeemRewardInput!) {
    redeemLoyaltyReward(input: $input) {
      id
      status
      redeemedAt
      fulfilledAt
      notes
      loyaltyAccount {
        id
        currentPoints
      }
      reward {
        id
        name
        pointsCost
      }
    }
  }
`;

const JOIN_CHALLENGE = gql`
  mutation JoinChallenge($challengeId: String!, $accountId: String!) {
    joinChallenge(challengeId: $challengeId, accountId: $accountId)
  }
`;

const CLAIM_BIRTHDAY_REWARD = gql`
  mutation ClaimBirthdayReward($accountId: String!) {
    addLoyaltyPoints(accountId: $accountId, points: 500, description: "Birthday bonus points") {
      id
      currentPoints
      lifetimePoints
    }
  }
`;

const CLAIM_ANNIVERSARY_REWARD = gql`
  mutation ClaimAnniversaryReward($accountId: String!) {
    addLoyaltyPoints(accountId: $accountId, points: 1000, description: "Anniversary bonus points") {
      id
      currentPoints
      lifetimePoints
    }
  }
`;

// GraphQL Subscriptions
const POINTS_EARNED_SUBSCRIPTION = gql`
  subscription PointsEarned($accountId: String) {
    loyaltyPointsEarned(accountId: $accountId) {
      account {
        id
        currentPoints
        lifetimePoints
      }
      transaction {
        id
        points
        description
      }
      pointsAdded
    }
  }
`;

const CHALLENGE_PROGRESS_SUBSCRIPTION = gql`
  subscription ChallengeProgress($accountId: String) {
    challengeProgressUpdated(accountId: $accountId) {
      challengeId
      accountId
      progress
      completed
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class LoyaltyGraphQLService {
  // State management
  private loyaltyAccountSubject = new BehaviorSubject<LoyaltyAccount | null>(null);
  public loyaltyAccount$ = this.loyaltyAccountSubject.asObservable();

  private rewardsSubject = new BehaviorSubject<LoyaltyReward[]>([]);
  public rewards$ = this.rewardsSubject.asObservable();

  private challengesSubject = new BehaviorSubject<LoyaltyChallenge[]>([]);
  public challenges$ = this.challengesSubject.asObservable();

  constructor(private apollo: Apollo) {}

  // ==================== LOYALTY ACCOUNT ====================

  /**
   * Get loyalty account for current user
   */
  async getLoyaltyAccount(cafeId: string): Promise<LoyaltyAccount | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ myLoyaltyAccount: LoyaltyAccount }>({
          query: GET_LOYALTY_ACCOUNT,
          variables: { cafeId },
          fetchPolicy: 'cache-first',
        }),
      );

      const account = result.data.myLoyaltyAccount;
      this.loyaltyAccountSubject.next(account);
      return account;
    } catch (error: any) {
      console.error('Error loading loyalty account:', error);
      if (error.message?.includes('not found')) {
        return null; // Account doesn't exist yet
      }
      throw error;
    }
  }

  /**
   * Refresh loyalty account data
   */
  async refreshLoyaltyAccount(cafeId: string): Promise<LoyaltyAccount | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ myLoyaltyAccount: LoyaltyAccount }>({
          query: GET_LOYALTY_ACCOUNT,
          variables: { cafeId },
          fetchPolicy: 'network-only',
        }),
      );

      const account = result.data.myLoyaltyAccount;
      this.loyaltyAccountSubject.next(account);
      return account;
    } catch (error) {
      console.error('Error refreshing loyalty account:', error);
      throw error;
    }
  }

  // ==================== REWARDS ====================

  /**
   * Get available rewards for current account
   */
  async getAvailableRewards(accountId: string, cafeId: string, limit = 20): Promise<LoyaltyReward[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ availableLoyaltyRewards: LoyaltyReward[] }>({
          query: GET_AVAILABLE_REWARDS,
          variables: { accountId, cafeId, limit },
        }),
      );

      const rewards = result.data.availableLoyaltyRewards;
      this.rewardsSubject.next(rewards);
      return rewards;
    } catch (error) {
      console.error('Error loading available rewards:', error);
      throw error;
    }
  }

  /**
   * Get featured rewards
   */
  async getFeaturedRewards(cafeId: string, limit = 6): Promise<LoyaltyReward[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ featuredLoyaltyRewards: LoyaltyReward[] }>({
          query: GET_FEATURED_REWARDS,
          variables: { cafeId, limit },
        }),
      );

      return result.data.featuredLoyaltyRewards;
    } catch (error) {
      console.error('Error loading featured rewards:', error);
      throw error;
    }
  }

  /**
   * Redeem a reward
   */
  async redeemReward(loyaltyAccountId: string, rewardId: string, orderId?: string, notes?: string): Promise<LoyaltyRewardRedemption> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ redeemLoyaltyReward: LoyaltyRewardRedemption }>({
          mutation: REDEEM_REWARD,
          variables: {
            input: {
              loyaltyAccountId,
              rewardId,
              orderId,
              notes,
            },
          },
        }),
      );

      if (!result.data) {
        throw new Error('No data returned from redemption');
      }

      // Refresh account to get updated points
      const currentAccount = await this.getCurrentAccount();
      if (currentAccount?.cafeId) {
        this.refreshLoyaltyAccount(currentAccount.cafeId);
      }

      return result.data.redeemLoyaltyReward;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Get transaction history
   */
  async getTransactionHistory(accountId: string, limit = 50, offset = 0, type?: string): Promise<LoyaltyTransaction[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ loyaltyTransactionsByAccount: LoyaltyTransaction[] }>({
          query: GET_LOYALTY_TRANSACTIONS,
          variables: { accountId, limit, offset, type },
        }),
      );

      return result.data.loyaltyTransactionsByAccount;
    } catch (error) {
      console.error('Error loading transaction history:', error);
      throw error;
    }
  }

  // ==================== CHALLENGES ====================

  /**
   * Get active challenges for cafe
   */
  async getActiveChallenges(cafeId: string, type?: string): Promise<LoyaltyChallenge[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ activeLoyaltyChallenges: LoyaltyChallenge[] }>({
          query: GET_ACTIVE_CHALLENGES,
          variables: { cafeId, type },
        }),
      );

      const challenges = result.data.activeLoyaltyChallenges;
      this.challengesSubject.next(challenges);
      return challenges;
    } catch (error) {
      console.error('Error loading active challenges:', error);
      throw error;
    }
  }

  /**
   * Get user's challenges
   */
  async getMyChallenges(cafeId: string, status?: string): Promise<LoyaltyChallenge[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ myChallenges: LoyaltyChallenge[] }>({
          query: GET_MY_CHALLENGES,
          variables: { cafeId, status },
        }),
      );

      return result.data.myChallenges;
    } catch (error) {
      console.error('Error loading user challenges:', error);
      throw error;
    }
  }

  /**
   * Get challenge progress
   */
  async getChallengeProgress(challengeId: string, accountId: string): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ challengeProgress: any }>({
          query: GET_CHALLENGE_PROGRESS,
          variables: { challengeId, accountId },
        }),
      );

      return result.data.challengeProgress;
    } catch (error) {
      console.error('Error loading challenge progress:', error);
      throw error;
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(challengeId: string, accountId: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ joinChallenge: boolean }>({
          mutation: JOIN_CHALLENGE,
          variables: { challengeId, accountId },
        }),
      );

      return result.data?.joinChallenge || false;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  // ==================== SPECIAL REWARDS ====================

  /**
   * Claim birthday reward
   */
  async claimBirthdayReward(accountId: string): Promise<LoyaltyAccount> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ addLoyaltyPoints: LoyaltyAccount }>({
          mutation: CLAIM_BIRTHDAY_REWARD,
          variables: { accountId },
        }),
      );

      if (!result.data) {
        throw new Error('No data returned from birthday reward claim');
      }

      const account = result.data.addLoyaltyPoints;
      this.loyaltyAccountSubject.next(account);
      return account;
    } catch (error) {
      console.error('Error claiming birthday reward:', error);
      throw error;
    }
  }

  /**
   * Claim anniversary reward
   */
  async claimAnniversaryReward(accountId: string): Promise<LoyaltyAccount> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ addLoyaltyPoints: LoyaltyAccount }>({
          mutation: CLAIM_ANNIVERSARY_REWARD,
          variables: { accountId },
        }),
      );

      if (!result.data) {
        throw new Error('No data returned from anniversary reward claim');
      }

      const account = result.data.addLoyaltyPoints;
      this.loyaltyAccountSubject.next(account);
      return account;
    } catch (error) {
      console.error('Error claiming anniversary reward:', error);
      throw error;
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to points earned events
   */
  subscribeToPointsEarned(accountId?: string): Observable<any> {
    return this.apollo
      .subscribe({
        query: POINTS_EARNED_SUBSCRIPTION,
        variables: { accountId },
      })
      .pipe(map((result: any) => result.data.loyaltyPointsEarned));
  }

  /**
   * Subscribe to challenge progress updates
   */
  subscribeToChallengeProgress(accountId?: string): Observable<any> {
    return this.apollo
      .subscribe({
        query: CHALLENGE_PROGRESS_SUBSCRIPTION,
        variables: { accountId },
      })
      .pipe(map((result: any) => result.data.challengeProgressUpdated));
  }

  // ==================== STATE MANAGEMENT ====================

  getCurrentAccount(): LoyaltyAccount | null {
    return this.loyaltyAccountSubject.value;
  }

  clearLoyaltyData(): void {
    this.loyaltyAccountSubject.next(null);
    this.rewardsSubject.next([]);
    this.challengesSubject.next([]);
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Clear Apollo cache for loyalty data
   */
  clearCache(): void {
    this.apollo.client.cache.evict({ fieldName: 'myLoyaltyAccount' });
    this.apollo.client.cache.evict({ fieldName: 'availableLoyaltyRewards' });
    this.apollo.client.cache.evict({ fieldName: 'activeLoyaltyChallenges' });
    this.apollo.client.cache.gc();
  }

  /**
   * Refresh all loyalty data
   */
  async refreshAllData(cafeId: string): Promise<void> {
    this.clearCache();
    const account = await this.getLoyaltyAccount(cafeId);

    if (account) {
      await Promise.all([this.getAvailableRewards(account.id, cafeId), this.getActiveChallenges(cafeId), this.getMyChallenges(cafeId)]);
    }
  }
}
