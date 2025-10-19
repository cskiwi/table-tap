import {
  User,
  Cafe,
  Order,
  Employee,
  Stock,
  Configuration,
  Counter,
  TimeEntry,
  TimeSheet,
  Glass,
  GlassMovement,
  Purchase,
  PurchaseItem,
  StockMovement,
  LoyaltyAccount,
  LoyaltyChallenge,
  LoyaltyPromotion,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyTier,
  LoyaltyTransaction,
  Credit,
  OrderItem,
  Payment,
  Product,
} from '@app/models';
import { args } from '../utils';
import { appendSortableObjects, SortOrderType } from '../utils/sort-order';

// Register all SortOrderTypes
SortOrderType(User, 'User');
SortOrderType(Cafe, 'Cafe');
SortOrderType(Order, 'Order');
SortOrderType(Employee, 'Employee');
SortOrderType(Stock, 'Stock');
SortOrderType(Configuration, 'Configuration');
SortOrderType(Counter, 'Counter');
SortOrderType(TimeEntry, 'TimeEntry');
SortOrderType(TimeSheet, 'TimeSheet');
SortOrderType(Glass, 'Glass');
SortOrderType(GlassMovement, 'GlassMovement');
SortOrderType(Purchase, 'Purchase');
SortOrderType(PurchaseItem, 'PurchaseItem');
SortOrderType(StockMovement, 'StockMovement');
SortOrderType(LoyaltyAccount, 'LoyaltyAccount');
SortOrderType(LoyaltyChallenge, 'LoyaltyChallenge');
SortOrderType(LoyaltyPromotion, 'LoyaltyPromotion');
SortOrderType(LoyaltyReward, 'LoyaltyReward');
SortOrderType(LoyaltyRewardRedemption, 'LoyaltyRewardRedemption');
SortOrderType(LoyaltyTier, 'LoyaltyTier');
SortOrderType(LoyaltyTransaction, 'LoyaltyTransaction');
SortOrderType(Credit, 'Credit');
SortOrderType(OrderItem, 'OrderItem');
SortOrderType(Payment, 'Payment');
SortOrderType(Product, 'Product');

// Append nested objects to orders
appendSortableObjects(User, 'User');
appendSortableObjects(Cafe, 'Cafe');
appendSortableObjects(Order, 'Order');
appendSortableObjects(Employee, 'Employee');
appendSortableObjects(Stock, 'Stock');
appendSortableObjects(Configuration, 'Configuration');
appendSortableObjects(Counter, 'Counter');
appendSortableObjects(TimeEntry, 'TimeEntry');
appendSortableObjects(TimeSheet, 'TimeSheet');
appendSortableObjects(Glass, 'Glass');
appendSortableObjects(GlassMovement, 'GlassMovement');
appendSortableObjects(Purchase, 'Purchase');
appendSortableObjects(PurchaseItem, 'PurchaseItem');
appendSortableObjects(StockMovement, 'StockMovement');
appendSortableObjects(LoyaltyAccount, 'LoyaltyAccount');
appendSortableObjects(LoyaltyChallenge, 'LoyaltyChallenge');
appendSortableObjects(LoyaltyPromotion, 'LoyaltyPromotion');
appendSortableObjects(LoyaltyReward, 'LoyaltyReward');
appendSortableObjects(LoyaltyRewardRedemption, 'LoyaltyRewardRedemption');
appendSortableObjects(LoyaltyTier, 'LoyaltyTier');
appendSortableObjects(LoyaltyTransaction, 'LoyaltyTransaction');
appendSortableObjects(Credit, 'Credit');
appendSortableObjects(OrderItem, 'OrderItem');
appendSortableObjects(Payment, 'Payment');
appendSortableObjects(Product, 'Product');

export const UserArgs = args<User>('User');
export const CafeArgs = args<Cafe>('Cafe');
export const OrderArgs = args<Order>('Order');
export const EmployeeArgs = args<Employee>('Employee');
export const StockArgs = args<Stock>('Stock');
export const ConfigurationArgs = args<Configuration>('Configuration');
export const CounterArgs = args<Counter>('Counter');
export const TimeEntryArgs = args<TimeEntry>('TimeEntry');
export const TimeSheetArgs = args<TimeSheet>('TimeSheet');
export const GlassArgs = args<Glass>('Glass');
export const GlassMovementArgs = args<GlassMovement>('GlassMovement');
export const PurchaseArgs = args<Purchase>('Purchase');
export const PurchaseItemArgs = args<PurchaseItem>('PurchaseItem');
export const StockMovementArgs = args<StockMovement>('StockMovement');
export const LoyaltyAccountArgs = args<LoyaltyAccount>('LoyaltyAccount');
export const LoyaltyChallengeArgs = args<LoyaltyChallenge>('LoyaltyChallenge');
export const LoyaltyPromotionArgs = args<LoyaltyPromotion>('LoyaltyPromotion');
export const LoyaltyRewardArgs = args<LoyaltyReward>('LoyaltyReward');
export const LoyaltyRewardRedemptionArgs = args<LoyaltyRewardRedemption>('LoyaltyRewardRedemption');
export const LoyaltyTierArgs = args<LoyaltyTier>('LoyaltyTier');
export const LoyaltyTransactionArgs = args<LoyaltyTransaction>('LoyaltyTransaction');
export const CreditArgs = args<Credit>('Credit');
export const OrderItemArgs = args<OrderItem>('OrderItem');
export const PaymentArgs = args<Payment>('Payment');
export const ProductArgs = args<Product>('Product');
