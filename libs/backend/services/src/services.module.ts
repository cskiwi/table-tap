import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Order,
  OrderItem,
  Stock,
  Employee,
  TimeSheet,
  Counter,
  Cafe,
  Product,
  Payment,
} from '@app/models';
import {
  User,
  LoyaltyAccount,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyTier,
  LoyaltyPromotion,
  LoyaltyChallenge,
  LoyaltyRewardRedemption
} from '@app/models';
// import { RedisModule } from '@app/backend-redis'; // Temporarily disabled due to cross-module import issues

import { EmployeeService } from './lib/employee.service';
import { LoyaltyService } from './lib/loyalty.service';
import { RedisPubSubService, RedisCacheService } from '@app/backend-redis';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Restaurant entities
      Order,
      OrderItem,
      Stock,
      Employee,
      TimeSheet,
      Counter,
      Cafe,
      Product,
      Payment,
      // User entity
      User,
      // Loyalty entities
      LoyaltyAccount,
      LoyaltyReward,
      LoyaltyTransaction,
      LoyaltyTier,
      LoyaltyPromotion,
      LoyaltyChallenge,
      LoyaltyRewardRedemption,
    ]),
    // RedisModule, // Temporarily disabled due to cross-module import issues
  ],
  providers: [
    EmployeeService,
    LoyaltyService,
    RedisPubSubService,
    RedisCacheService,
  ],
  exports: [
    EmployeeService,
    LoyaltyService,
    RedisPubSubService,
    RedisCacheService,
  ],
})
export class ServicesModule {}
