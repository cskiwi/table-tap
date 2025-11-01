import {
  Cafe,
  LoyaltyAccount,
  LoyaltyChallenge,
  LoyaltyPromotion,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyTier,
  LoyaltyTransaction,
  Order,
  User,
} from '@app/models';
import {
  LoyaltyChallengeStatus,
  LoyaltyChallengeType,
  LoyaltyPromotionStatus,
  LoyaltyPromotionType,
  LoyaltyRedemptionStatus,
  LoyaltyTransactionStatus,
  LoyaltyTransactionType,
} from '@app/models/enums';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThan, MoreThan, Repository } from 'typeorm';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTier)
    private readonly loyaltyTierRepo: Repository<LoyaltyTier>,
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(LoyaltyReward)
    private readonly loyaltyRewardRepo: Repository<LoyaltyReward>,
    @InjectRepository(LoyaltyRewardRedemption)
    private readonly loyaltyRedemptionRepo: Repository<LoyaltyRewardRedemption>,
    @InjectRepository(LoyaltyPromotion)
    private readonly loyaltyPromotionRepo: Repository<LoyaltyPromotion>,
    @InjectRepository(LoyaltyChallenge)
    private readonly loyaltyChallengeRepo: Repository<LoyaltyChallenge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Cafe)
    private readonly cafeRepo: Repository<Cafe>,
  ) {}

  // ==================== LOYALTY ACCOUNT MANAGEMENT ====================

  /**
   * Create a new loyalty account for a user
   */
  async createLoyaltyAccount(userId: string, cafeId: string, entityManager?: EntityManager): Promise<LoyaltyAccount> {
    const manager = entityManager || this.loyaltyAccountRepo.manager;

    // Check if account already exists
    const existingAccount = await manager.findOne(LoyaltyAccount, {
      where: { userId, cafeId },
    });

    if (existingAccount) {
      throw new BadRequestException('Loyalty account already exists for this user');
    }

    // Get the base tier (level 1)
    const baseTier = await manager.findOne(LoyaltyTier, {
      where: { cafeId, level: 1, isActive: true } as any,
    });

    // Generate unique loyalty number
    const loyaltyNumber = await this.generateLoyaltyNumber(cafeId, manager);

    const fullBaseTier = baseTier as unknown as LoyaltyTier;
    const loyaltyAccount = manager.create(LoyaltyAccount, {
      userId,
      cafeId,
      loyaltyNumber,
      currentTierId: fullBaseTier?.id,
      currentPoints: 0,
      lifetimePoints: 0,
      pointsRedeemed: 0,
      totalSpent: 0,
      yearlySpent: 0,
      totalOrders: 0,
      yearlyOrders: 0,
      anniversaryDate: new Date(),
      isActive: true,
      isVip: false,
      badges: [],
      challengeProgress: {},
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: true,
        birthdayReminders: true,
        pointsExpiry: true,
        newRewards: true,
      },
    });

    const savedAccount = (await manager.save(LoyaltyAccount, loyaltyAccount)) as unknown as LoyaltyAccount;

    // Award welcome bonus
    await this.processWelcomeBonus(savedAccount.id, cafeId, manager);

    this.logger.log(`Created loyalty account ${loyaltyNumber} for user ${userId}`);
    return savedAccount;
  }

  /**
   * Get loyalty account for a user
   */
  async getLoyaltyAccount(userId: string, cafeId: string): Promise<LoyaltyAccount | null> {
    return this.loyaltyAccountRepo.findOne({
      where: { userId, cafeId },
      relations: ['currentTier', 'user', 'cafe'],
    });
  }

  /**
   * Get or create loyalty account
   */
  async getOrCreateLoyaltyAccount(userId: string, cafeId: string, entityManager?: EntityManager): Promise<LoyaltyAccount> {
    const existing = await this.getLoyaltyAccount(userId, cafeId);
    if (existing) return existing;

    return this.createLoyaltyAccount(userId, cafeId, entityManager);
  }

  // ==================== POINTS MANAGEMENT ====================

  /**
   * Calculate points for an order
   */
  async calculatePointsForOrder(
    order: Order,
    loyaltyAccount: LoyaltyAccount,
  ): Promise<{ basePoints: number; bonusPoints: number; totalPoints: number; multiplier: number; promotionalBonus: number; tierBonus: number }> {
    const cafe = await this.cafeRepo.findOne({ where: { id: order.cafeId } });
    if (!cafe) throw new NotFoundException('Cafe not found');

    // Base points calculation (typically 1 point per $1 spent)
    const basePointsRate = 1; // This could be configurable per cafe
    const basePoints = Math.floor(order.totalAmount * basePointsRate);

    // Tier multiplier
    const tierMultiplier = loyaltyAccount.currentTier?.pointsMultiplier || 1;

    // Check for active promotions
    const promotionBonus = await this.calculatePromotionalBonus(order, loyaltyAccount);

    // Calculate total
    const tierBonus = Math.floor(basePoints * (tierMultiplier - 1));
    const totalPoints = Math.floor(basePoints * tierMultiplier) + promotionBonus.bonusPoints;

    return {
      basePoints,
      bonusPoints: promotionBonus.bonusPoints,
      totalPoints,
      multiplier: tierMultiplier,
      promotionalBonus: promotionBonus.bonusPoints,
      tierBonus,
    };
  }

  /**
   * Award points for an order
   */
  async awardPointsForOrder(orderId: string, entityManager?: EntityManager): Promise<LoyaltyTransaction> {
    const manager = entityManager || this.loyaltyTransactionRepo.manager;

    const order = (await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['customer'],
    })) as unknown as Order;

    if (!order || !(order as any).customer) {
      throw new NotFoundException('Order or customer not found');
    }

    // Get or create loyalty account
    const loyaltyAccount = await this.getOrCreateLoyaltyAccount((order as any).customer.id, order.cafeId, manager);

    // Check if points already awarded for this order
    const existingTransaction = await manager.findOne(LoyaltyTransaction, {
      where: { orderId, type: LoyaltyTransactionType.EARNED },
    });

    if (existingTransaction) {
      this.logger.warn(`Points already awarded for order ${orderId}`);
      return existingTransaction;
    }

    // Calculate points
    const pointsCalc = await this.calculatePointsForOrder(order, loyaltyAccount);

    // Create transaction
    const transaction = await this.createPointsTransaction(
      {
        loyaltyAccountId: loyaltyAccount.id,
        cafeId: order.cafeId,
        type: LoyaltyTransactionType.EARNED,
        points: pointsCalc.totalPoints,
        orderId,
        orderAmount: order.totalAmount,
        earnRate: pointsCalc.totalPoints / order.totalAmount,
        description: `Points earned for order ${order.orderNumber || order.id}`,
        metadata: {
          basePoints: pointsCalc.basePoints,
          tierBonus: pointsCalc.tierBonus,
          promotionalBonus: pointsCalc.promotionalBonus,
          multiplier: pointsCalc.multiplier,
        },
      },
      manager,
    );

    // Update challenge progress
    await this.updateChallengeProgress(loyaltyAccount.id, order, manager);

    // Check for tier upgrades
    await this.checkTierUpgrade(loyaltyAccount.id, manager);

    const fullOrder = order as unknown as Order;
    this.logger.log(`Awarded ${pointsCalc.totalPoints} points for order ${fullOrder.orderNumber || fullOrder.id}`);
    return transaction;
  }

  /**
   * Create a points transaction
   */
  async createPointsTransaction(
    data: {
      loyaltyAccountId: string;
      cafeId: string;
      type: LoyaltyTransactionType;
      points: number;
      orderId?: string;
      orderAmount?: number;
      earnRate?: number;
      description: string;
      metadata?: any;
      expiresAt?: Date;
      processedByUserId?: string;
    },
    entityManager?: EntityManager,
  ): Promise<LoyaltyTransaction> {
    const manager = entityManager || this.loyaltyTransactionRepo.manager;

    // Get current account balance
    const loyaltyAccount = (await manager.findOne(LoyaltyAccount, {
      where: { id: data.loyaltyAccountId },
    })) as LoyaltyAccount;

    if (!loyaltyAccount) {
      throw new NotFoundException('Loyalty account not found');
    }

    // Calculate new balance
    const newBalance = loyaltyAccount.currentPoints + data.points;

    // Set expiry for earned points (typically 1 year)
    let expiresAt = data.expiresAt;
    if (!expiresAt && data.type === LoyaltyTransactionType.EARNED) {
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Create transaction
    const transaction = manager.create(LoyaltyTransaction, {
      ...data,
      pointsBalance: newBalance,
      expiresAt,
      status: LoyaltyTransactionStatus.COMPLETED,
    });

    const savedTransaction = (await manager.save(LoyaltyTransaction, transaction)) as unknown as LoyaltyTransaction;

    // Update loyalty account
    await manager.update(LoyaltyAccount, data.loyaltyAccountId, {
      currentPoints: newBalance,
      lifetimePoints: data.points > 0 ? loyaltyAccount.lifetimePoints + data.points : loyaltyAccount.lifetimePoints,
      pointsRedeemed: data.points < 0 ? loyaltyAccount.pointsRedeemed + Math.abs(data.points) : loyaltyAccount.pointsRedeemed,
      lastActivityAt: new Date(),
    });

    return savedTransaction;
  }

  // ==================== REWARDS & REDEMPTIONS ====================

  /**
   * Get available rewards for a loyalty account
   */
  async getAvailableRewards(loyaltyAccountId: string, limit = 20, offset = 0): Promise<{ rewards: LoyaltyReward[]; total: number }> {
    const loyaltyAccount = await this.loyaltyAccountRepo.findOne({
      where: { id: loyaltyAccountId },
      relations: ['currentTier'],
    });

    if (!loyaltyAccount) {
      throw new NotFoundException('Loyalty account not found');
    }

    const queryBuilder = this.loyaltyRewardRepo
      .createQueryBuilder('reward')
      .where('reward.cafeId = :cafeId', { cafeId: loyaltyAccount.cafeId })
      .andWhere('reward.isActive = :isActive', { isActive: true })
      .andWhere('reward.isVisible = :isVisible', { isVisible: true })
      .andWhere('reward.pointsCost <= :availablePoints', { availablePoints: loyaltyAccount.currentPoints })
      .andWhere('(reward.validFrom IS NULL OR reward.validFrom <= :now)', { now: new Date() })
      .andWhere('(reward.validUntil IS NULL OR reward.validUntil >= :now)', { now: new Date() });

    // Filter by tier requirements
    if (loyaltyAccount.currentTier) {
      queryBuilder.andWhere('(reward.requiredTierLevels = :emptyArray OR :tierLevel = ANY(reward.requiredTierLevels))', {
        emptyArray: JSON.stringify([]),
        tierLevel: loyaltyAccount.currentTier.level,
      });
    }

    // Check quantity availability
    queryBuilder.andWhere('(reward.totalQuantity = -1 OR reward.redeemedQuantity < reward.totalQuantity)');

    const [rewards, total] = await queryBuilder
      .orderBy('reward.priority', 'DESC')
      .addOrderBy('reward.pointsCost', 'ASC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return { rewards, total };
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    loyaltyAccountId: string,
    rewardId: string,
    orderId?: string,
    notes?: string,
    entityManager?: EntityManager,
  ): Promise<LoyaltyRewardRedemption> {
    const manager = entityManager || this.loyaltyRedemptionRepo.manager;

    const loyaltyAccount = (await manager.findOne(LoyaltyAccount, {
      where: { id: loyaltyAccountId },
      relations: ['currentTier'],
    })) as LoyaltyAccount;

    if (!loyaltyAccount) {
      throw new NotFoundException('Loyalty account not found');
    }

    const reward = (await manager.findOne(LoyaltyReward, {
      where: { id: rewardId },
    })) as unknown as LoyaltyReward;

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    // Validate redemption
    await this.validateRewardRedemption(loyaltyAccount, reward, manager);

    // Generate redemption code
    const redemptionCode = await this.generateRedemptionCode();

    // Create redemption record
    const redemption = manager.create(LoyaltyRewardRedemption, {
      loyaltyAccountId: loyaltyAccountId,
      cafeId: loyaltyAccount.cafeId,
      rewardId: rewardId,
      orderId: orderId,
      pointsUsed: reward.pointsCost,
      discountAmount: reward.discountAmount,
      cashValue: reward.cashValue,
      redemptionCode,
      status: reward.requiresApproval ? LoyaltyRedemptionStatus.PENDING : LoyaltyRedemptionStatus.APPROVED,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notes: notes,
      metadata: {
        rewardName: reward.name,
        rewardDescription: reward.description,
        rewardType: reward.type,
      },
    });

    const savedRedemption = (await manager.save(LoyaltyRewardRedemption, redemption)) as unknown as LoyaltyRewardRedemption;

    // Deduct points
    await this.createPointsTransaction(
      {
        loyaltyAccountId: loyaltyAccountId,
        cafeId: loyaltyAccount.cafeId,
        type: LoyaltyTransactionType.REDEEMED,
        points: -reward.pointsCost,
        description: `Points redeemed for ${reward.name}`,
        metadata: {
          rewardId: reward.id,
          redemptionId: savedRedemption.id,
          redemptionCode,
        },
      },
      manager,
    );

    // Update reward statistics
    await manager.increment(LoyaltyReward, { id: reward.id }, 'redemptionCount', 1);
    await manager.update(LoyaltyReward, { id: reward.id }, { lastRedeemedAt: new Date() });

    this.logger.log(`Reward ${reward.name} redeemed by account ${loyaltyAccount.loyaltyNumber}`);
    return savedRedemption;
  }

  // ==================== TIER MANAGEMENT ====================

  /**
   * Check and upgrade tier if qualified
   */
  async checkTierUpgrade(loyaltyAccountId: string, entityManager?: EntityManager): Promise<LoyaltyTier | null> {
    const manager = entityManager || this.loyaltyAccountRepo.manager;

    const loyaltyAccount = (await manager.findOne(LoyaltyAccount, {
      where: { id: loyaltyAccountId },
      relations: ['currentTier'],
    })) as LoyaltyAccount;

    if (!loyaltyAccount) return null;

    // Get all tiers for this cafe, ordered by level
    const tiers = await manager.find(LoyaltyTier, {
      where: { cafeId: loyaltyAccount.cafeId, isActive: true },
    });

    // Sort tiers by level manually since TypeORM type inference is limited
    const sortedTiers = tiers.map((t) => t as unknown as LoyaltyTier).sort((a, b) => (a.level || 0) - (b.level || 0));

    // Find the highest tier the user qualifies for
    let qualifiedTier: LoyaltyTier | null = null;

    for (const tier of sortedTiers) {
      const qualifies =
        loyaltyAccount.lifetimePoints >= (tier.pointsRequired || 0) &&
        loyaltyAccount.totalSpent >= (tier.totalSpendRequired || 0) &&
        loyaltyAccount.totalOrders >= (tier.ordersRequired || 0);

      if (qualifies) {
        qualifiedTier = tier;
      }
    }

    // Check if upgrade is needed
    if (qualifiedTier && (!loyaltyAccount.currentTier || qualifiedTier.level > loyaltyAccount.currentTier.level)) {
      await manager.update(LoyaltyAccount, loyaltyAccountId, {
        currentTierId: qualifiedTier.id,
        tierAchievedAt: new Date(),
        tierExpiresAt: new Date(Date.now() + qualifiedTier.validityDays * 24 * 60 * 60 * 1000),
      });

      // Award tier upgrade bonus
      await this.createPointsTransaction(
        {
          loyaltyAccountId,
          cafeId: loyaltyAccount.cafeId,
          type: LoyaltyTransactionType.BONUS,
          points: 100 * qualifiedTier.level, // Bonus points for tier upgrade
          description: `Tier upgrade bonus - Welcome to ${qualifiedTier.name}!`,
          metadata: {
            previousTier: loyaltyAccount.currentTier?.name,
            newTier: qualifiedTier.name,
            tierLevel: qualifiedTier.level,
          },
        },
        manager,
      );

      this.logger.log(`User ${loyaltyAccount.loyaltyNumber} upgraded to ${qualifiedTier.name}`);
      return qualifiedTier;
    }

    return null;
  }

  // ==================== PROMOTIONS ====================

  /**
   * Calculate promotional bonus for an order
   */
  private async calculatePromotionalBonus(
    order: Order,
    loyaltyAccount: LoyaltyAccount,
  ): Promise<{ bonusPoints: number; appliedPromotions: LoyaltyPromotion[] }> {
    const activePromotions = await this.loyaltyPromotionRepo.find({
      where: {
        cafeId: order.cafeId,
        status: LoyaltyPromotionStatus.ACTIVE,
        startDate: LessThan(new Date()),
        endDate: MoreThan(new Date()),
      },
    });

    let totalBonusPoints = 0;
    const appliedPromotions: LoyaltyPromotion[] = [];

    for (const promotion of activePromotions) {
      const eligibility = await this.checkPromotionEligibility(promotion, order, loyaltyAccount);

      if (eligibility.isEligible) {
        if (promotion.type === LoyaltyPromotionType.BONUS_POINTS && promotion.rules.bonusPoints) {
          totalBonusPoints += promotion.rules.bonusPoints;
          appliedPromotions.push(promotion);
        } else if (promotion.type === LoyaltyPromotionType.POINTS_MULTIPLIER && promotion.rules.pointsMultiplier) {
          const basePoints = Math.floor(order.totalAmount);
          totalBonusPoints += Math.floor(basePoints * (promotion.rules.pointsMultiplier - 1));
          appliedPromotions.push(promotion);
        }
      }
    }

    return { bonusPoints: totalBonusPoints, appliedPromotions };
  }

  /**
   * Check if a user is eligible for a promotion
   */
  private async checkPromotionEligibility(
    promotion: LoyaltyPromotion,
    order: Order,
    loyaltyAccount: LoyaltyAccount,
  ): Promise<{ isEligible: boolean; promotion?: LoyaltyPromotion; bonusPoints?: number; multiplier?: number; reason?: string }> {
    // Check tier requirements
    if (promotion.rules.eligibleTierLevels?.length) {
      const currentTierLevel = loyaltyAccount.currentTier?.level || 0;
      if (!promotion.rules.eligibleTierLevels.includes(currentTierLevel)) {
        return { isEligible: false, reason: 'Tier requirement not met' };
      }
    }

    // Check minimum spend
    if (promotion.rules.minimumSpend && order.totalAmount < promotion.rules.minimumSpend) {
      return { isEligible: false, reason: 'Minimum spend not met' };
    }

    // Check usage limits
    if (promotion.rules.maxUsesPerCustomer) {
      const usageCount = await this.loyaltyTransactionRepo.count({
        where: {
          loyaltyAccountId: loyaltyAccount.id,
          type: LoyaltyTransactionType.PROMOTION,
          metadata: { promotionId: promotion.id } as any,
        },
      });

      if (usageCount >= promotion.rules.maxUsesPerCustomer) {
        return { isEligible: false, reason: 'Usage limit exceeded' };
      }
    }

    // Additional eligibility checks would go here...

    return { isEligible: true, promotion };
  }

  // ==================== CHALLENGES ====================

  /**
   * Update challenge progress for a user
   */
  private async updateChallengeProgress(loyaltyAccountId: string, order: Order, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.loyaltyAccountRepo.manager;

    const activeChallenges = await manager.find(LoyaltyChallenge, {
      where: {
        cafeId: order.cafeId,
        status: LoyaltyChallengeStatus.ACTIVE,
        startDate: LessThan(new Date()),
        endDate: MoreThan(new Date()),
      },
    });

    const loyaltyAccount = (await manager.findOne(LoyaltyAccount, {
      where: { id: loyaltyAccountId },
    })) as LoyaltyAccount;

    if (!loyaltyAccount) return;

    for (const challenge of activeChallenges) {
      const fullChallenge = challenge as unknown as LoyaltyChallenge;
      const progress = await this.calculateChallengeProgress(fullChallenge, loyaltyAccount, order);

      // Find or create challenge progress record
      let challengeProgressRecord = loyaltyAccount.challengeProgresses?.find(
        cp => cp.challengeId === fullChallenge.id
      );

      if (!challengeProgressRecord) {
        challengeProgressRecord = manager.create('LoyaltyAccountChallengeProgress' as any, {
          loyaltyAccountId: loyaltyAccount.id,
          challengeId: fullChallenge.id,
          progress: 0,
          target: fullChallenge.goals?.targetValue || 1,
          startedAt: new Date(),
        });
        if (!loyaltyAccount.challengeProgresses) {
          loyaltyAccount.challengeProgresses = [];
        }
        if (challengeProgressRecord) {
          loyaltyAccount.challengeProgresses.push(challengeProgressRecord);
        }
      }

      if (!challengeProgressRecord) {
        continue;
      }

      challengeProgressRecord.progress = progress.currentProgress;

      // Check if challenge is completed
      if (progress.isCompleted && !challengeProgressRecord.completedAt) {
        challengeProgressRecord.completedAt = new Date();

        // Award challenge completion rewards
        await this.awardChallengeRewards(fullChallenge, loyaltyAccount.id, manager);
      }
    }

    await manager.save(LoyaltyAccount, loyaltyAccount);
  }

  /**
   * Calculate challenge progress for a specific challenge
   */
  private async calculateChallengeProgress(
    challenge: LoyaltyChallenge,
    loyaltyAccount: LoyaltyAccount,
    order?: Order,
  ): Promise<{
    challenge: LoyaltyChallenge;
    currentProgress: number;
    targetValue: number;
    progressPercentage: number;
    isCompleted: boolean;
    timeRemaining?: number;
    nextMilestone?: { percentage: number; title: string; reward?: any };
  }> {
    let currentProgress = 0;
    const targetValue = challenge.goals.targetValue || 1;

    switch (challenge.type) {
      case LoyaltyChallengeType.ORDER_COUNT:
        currentProgress = loyaltyAccount.totalOrders;
        break;
      case LoyaltyChallengeType.SPEND_AMOUNT:
        currentProgress = loyaltyAccount.totalSpent;
        break;
      case LoyaltyChallengeType.POINTS_EARNED:
        currentProgress = loyaltyAccount.lifetimePoints;
        break;
      // Add more challenge types as needed
      default:
        currentProgress = 0;
    }

    const progressPercentage = Math.min((currentProgress / targetValue) * 100, 100);
    const isCompleted = currentProgress >= targetValue;

    // Find next milestone
    const nextMilestone = challenge.milestones.filter((m) => m.percentage > progressPercentage).sort((a, b) => a.percentage - b.percentage)[0];

    return {
      challenge,
      currentProgress,
      targetValue,
      progressPercentage,
      isCompleted,
      nextMilestone,
    };
  }

  /**
   * Award rewards for challenge completion
   */
  private async awardChallengeRewards(challenge: LoyaltyChallenge, loyaltyAccountId: string, entityManager: EntityManager): Promise<void> {
    const rewards = challenge.rewards;

    if (rewards.completionPoints) {
      await this.createPointsTransaction(
        {
          loyaltyAccountId,
          cafeId: challenge.cafeId,
          type: LoyaltyTransactionType.CHALLENGE,
          points: rewards.completionPoints,
          description: `Challenge completed: ${challenge.name}`,
          metadata: {
            challengeId: challenge.id,
            challengeName: challenge.name,
          },
        },
        entityManager,
      );
    }

    // Award badges, tier upgrades, etc. would go here...
  }

  // ==================== BIRTHDAY & ANNIVERSARY REWARDS ====================

  /**
   * Process birthday rewards for eligible users
   */
  async processBirthdayRewards(cafeId: string): Promise<void> {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const eligibleAccounts = await this.loyaltyAccountRepo
      .createQueryBuilder('account')
      .where('account.cafeId = :cafeId', { cafeId })
      .andWhere('account.isActive = :isActive', { isActive: true })
      .andWhere('EXTRACT(MONTH FROM account.birthDate) = :month', { month: currentMonth + 1 })
      .andWhere('EXTRACT(DAY FROM account.birthDate) = :day', { day: currentDay })
      .andWhere('(account.lastBirthdayRewardAt IS NULL OR EXTRACT(YEAR FROM account.lastBirthdayRewardAt) < EXTRACT(YEAR FROM :today))', { today })
      .getMany();

    for (const account of eligibleAccounts) {
      await this.awardBirthdayReward(account.id);
    }
  }

  /**
   * Award birthday reward to a specific user
   */
  private async awardBirthdayReward(loyaltyAccountId: string): Promise<void> {
    const loyaltyAccount = await this.loyaltyAccountRepo.findOne({
      where: { id: loyaltyAccountId },
      relations: ['currentTier', 'currentTier.benefit'],
    });

    if (!loyaltyAccount) return;

    const birthdayBonus = loyaltyAccount.currentTier?.benefit?.birthdayBonus || 100;

    await this.createPointsTransaction({
      loyaltyAccountId,
      cafeId: loyaltyAccount.cafeId,
      type: LoyaltyTransactionType.BIRTHDAY,
      points: birthdayBonus,
      description: 'Happy Birthday! Here are your bonus points!',
      metadata: {
        tierLevel: loyaltyAccount.currentTier?.level,
        birthdayYear: new Date().getFullYear(),
      },
    });

    // Update last birthday reward date
    await this.loyaltyAccountRepo.update(loyaltyAccountId, {
      lastBirthdayRewardAt: new Date(),
    });

    this.logger.log(`Birthday reward awarded to account ${loyaltyAccount.loyaltyNumber}`);
  }

  // ==================== REFERRAL PROGRAM ====================

  /**
   * Process a referral when a new user signs up
   */
  async processReferral(referrerUserId: string, newUserId: string, cafeId: string): Promise<void> {
    const referrerAccount = await this.getLoyaltyAccount(referrerUserId, cafeId);
    const newUserAccount = await this.getOrCreateLoyaltyAccount(newUserId, cafeId);

    if (!referrerAccount) return;

    // Mark the new user as referred
    await this.loyaltyAccountRepo.update(newUserAccount.id, {
      referredByUserId: referrerUserId,
    });

    // Award referral bonus to referrer
    const referralBonus = 500; // This could be configurable

    await this.createPointsTransaction({
      loyaltyAccountId: referrerAccount.id,
      cafeId,
      type: LoyaltyTransactionType.REFERRAL,
      points: referralBonus,
      description: 'Referral bonus - Thanks for bringing a friend!',
      metadata: {
        referredUserId: newUserId,
        referralDate: new Date(),
      },
    });

    // Update referrer statistics
    await this.loyaltyAccountRepo.update(referrerAccount.id, {
      referralCount: referrerAccount.referralCount + 1,
      referralBonusEarned: referrerAccount.referralBonusEarned + referralBonus,
    });

    this.logger.log(`Referral bonus awarded to ${referrerAccount.loyaltyNumber} for referring new user`);
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get loyalty program statistics
   */
  async getLoyaltyStats(cafeId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    averageOrderValue: number;
    topTierMembers: number;
    redemptionRate: number;
    engagementRate: number;
  }> {
    const totalMembers = await this.loyaltyAccountRepo.count({
      where: { cafeId },
    });

    const activeMembers = await this.loyaltyAccountRepo.count({
      where: {
        cafeId,
        isActive: true,
        lastActivityAt: MoreThan(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)), // Active in last 90 days
      },
    });

    const pointsStats = await this.loyaltyTransactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(CASE WHEN points > 0 THEN points ELSE 0 END)', 'totalIssued')
      .addSelect('SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END)', 'totalRedeemed')
      .where('transaction.cafeId = :cafeId', { cafeId })
      .getRawOne();

    const orderStats = await this.orderRepo
      .createQueryBuilder('order')
      .select('AVG(order.totalAmount)', 'avgOrderValue')
      .where('order.cafeId = :cafeId', { cafeId })
      .andWhere('order.customerId IS NOT NULL')
      .getRawOne();

    const topTierMembers = await this.loyaltyAccountRepo
      .createQueryBuilder('account')
      .innerJoin('account.currentTier', 'tier')
      .where('account.cafeId = :cafeId', { cafeId })
      .andWhere('tier.level >= :topTierLevel', { topTierLevel: 3 })
      .getCount();

    const redemptionStats = await this.loyaltyRedemptionRepo
      .createQueryBuilder('redemption')
      .select('COUNT(*)', 'totalRedemptions')
      .where('redemption.cafeId = :cafeId', { cafeId })
      .getRawOne();

    return {
      totalMembers,
      activeMembers,
      totalPointsIssued: parseInt(pointsStats.totalIssued) || 0,
      totalPointsRedeemed: parseInt(pointsStats.totalRedeemed) || 0,
      averageOrderValue: parseFloat(orderStats.avgOrderValue) || 0,
      topTierMembers,
      redemptionRate: totalMembers > 0 ? (redemptionStats.totalRedemptions / totalMembers) * 100 : 0,
      engagementRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique loyalty number
   */
  private async generateLoyaltyNumber(cafeId: string, entityManager: EntityManager): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const number = `LP${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;

      const existing = await entityManager.findOne(LoyaltyAccount, {
        where: { loyaltyNumber: number },
      });

      if (!existing) return number;
      attempts++;
    }

    throw new Error('Failed to generate unique loyalty number');
  }

  /**
   * Generate unique redemption code
   */
  private async generateRedemptionCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate reward redemption
   */
  private async validateRewardRedemption(loyaltyAccount: LoyaltyAccount, reward: LoyaltyReward, entityManager: EntityManager): Promise<void> {
    // Check if reward is available
    if (!reward.isAvailable) {
      throw new BadRequestException('Reward is not available');
    }

    // Check points balance
    if (loyaltyAccount.currentPoints < reward.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    // Check tier requirements
    if (reward.requiredTierLevels.length > 0) {
      const currentTierLevel = loyaltyAccount.currentTier?.level || 0;
      if (!reward.requiredTierLevels.includes(currentTierLevel)) {
        throw new BadRequestException('Tier requirement not met');
      }
    }

    // Check usage limits
    if (reward.maxRedemptionsPerUser > 0) {
      const userRedemptions = await entityManager.count(LoyaltyRewardRedemption, {
        where: {
          loyaltyAccountId: loyaltyAccount.id,
          rewardId: reward.id,
          status: LoyaltyRedemptionStatus.REDEEMED,
        },
      });

      if (userRedemptions >= reward.maxRedemptionsPerUser) {
        throw new BadRequestException('Redemption limit exceeded for this reward');
      }
    }
  }

  /**
   * Process welcome bonus for new members
   */
  private async processWelcomeBonus(loyaltyAccountId: string, cafeId: string, entityManager: EntityManager): Promise<void> {
    const welcomeBonus = 100; // This could be configurable

    await this.createPointsTransaction(
      {
        loyaltyAccountId,
        cafeId,
        type: LoyaltyTransactionType.BONUS,
        points: welcomeBonus,
        description: 'Welcome bonus - Thanks for joining our loyalty program!',
        metadata: {
          isWelcomeBonus: true,
        },
      },
      entityManager,
    );
  }
}
