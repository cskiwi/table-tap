import * as Models from '@app/models';
import { appendWhereObjects, args, WhereInputType } from '../utils';
import { appendSortableObjects, SortOrderType } from '../utils/sort-order';

// Extract all entity classes from the models package
// An entity class extends BaseEntity and is decorated with @Entity
const entities = Object.entries(Models).filter(([name, value]) => {
  if (typeof value !== 'function' || !value.prototype) return false;

  // Check if it extends BaseEntity (TypeORM entity base class)
  let proto = value.prototype;
  while (proto) {
    if (proto.constructor.name === 'BaseEntity') return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}) as Array<[string, new () => any]>;

// Register all SortOrderTypes and append sortable objects
entities.forEach(([name, EntityClass]) => {
  SortOrderType(EntityClass, name);
  appendSortableObjects(EntityClass, name);

  WhereInputType(EntityClass, name);
  appendWhereObjects(EntityClass, name);
});

// Create typed args map
type EntityArgsMap = {
  [K in keyof typeof Models as `${K & string}Args`]: ReturnType<typeof args<InstanceType<(typeof Models)[K]>>>;
};

// Dynamically create args for all entities with proper typing
const createEntityArgs = (): EntityArgsMap => {
  const map = {} as EntityArgsMap;
  entities.forEach(([name]) => {
    (map as any)[`${name}Args`] = args(name);
  });
  return map;
};

const argsMap = createEntityArgs();

// Export all args as named exports (ESM compatible)
// This creates exports like: export const CafeArgs = args('Cafe');
export const {
  AdminDisplaySettingsArgs,
  AdminNotificationDataArgs,
  AdminReportingSettingsArgs,
  AdminSettingsArgs,
  AdminWorkflowSettingsArgs,
  AttendanceRecordArgs,
  CafeBusinessHoursArgs,
  CafeSettingsArgs,
  CertificationRecordArgs,
  ConfigurationArgs,
  ConfigurationUIOptionArgs,
  ConfigurationUIOptionsArgs,
  ConfigurationValidationArgs,
  CounterArgs,
  CounterCapabilitiesArgs,
  CounterWorkingHoursArgs,
  CreditArgs,
  CreditRestrictionsArgs,
  EmployeeAnalyticsArgs,
  EmployeeEmergencyContactArgs,
  EmployeeGoalArgs,
  GlassArgs,
  EmployeeReviewArgs,
  EmployeeWorkingHoursArgs,
  GlassMovementArgs,
  InventoryAlertArgs,
  InventoryAlertMetadataArgs,
  LoyaltyAccountBadgeArgs,
  LoyaltyAccountChallengeProgressArgs,
  LoyaltyAccountPreferencesArgs,
  LoyaltyChallengeEligibilityArgs,
  LoyaltyChallengeGoalsArgs,
  LoyaltyChallengeMilestoneArgs,
  LoyaltyChallengeRewardsArgs,
  LoyaltyChallengeTrackingRulesArgs,
  LoyaltyPromotionMessagingArgs,
  LoyaltyPromotionRulesArgs,
  LoyaltyPromotionTargetingArgs,
  LoyaltyRewardApplicableProductsArgs,
  LoyaltyRewardRedemptionArgs,
  LoyaltyRewardRedemptionMetadataArgs,
  LoyaltyRewardSpecialPropertiesArgs,
  LoyaltyTierBenefitArgs,
  LoyaltyTransactionMetadataArgs,
  OrderItemCounterStatusArgs,
  OrderItemCustomizationArgs,
  OrderWorkflowStepArgs,
  PaymentMetadataArgs,
  PaymentProviderDataArgs,
  PaymentReceiptDataArgs,
  PayrollDataArgs,
  PerformanceMetricsArgs,
  ProductAttributeArgs,
  PurchaseArgs,
  PurchaseItemArgs,
  SalesAnalyticsArgs,
  SalesCategoryBreakdownArgs,
  SalesOrderTypeBreakdownArgs,
  SalesPaymentMethodBreakdownArgs,
  AdminNotificationArgs,
  CafeArgs,
  CafeHostnameArgs,
  EmployeeArgs,
  LoyaltyAccountArgs,
  OrderArgs,
  ProductArgs,
  LoyaltyChallengeArgs,
  LoyaltyPromotionArgs,
  LoyaltyRewardArgs,
  LoyaltyTierArgs,
  LoyaltyTransactionArgs,
  OrderItemArgs,
  PaymentArgs,
  SalesPeakHourArgs,
  SalesTopProductArgs,
  ScheduleConflictArgs,
  ScheduledShiftArgs,
  ShiftSwapRequestArgs,
  SkillAssessmentArgs,
  StockArgs,
  StockMovementArgs,
  SupplierInfoArgs,
  TimeEntryArgs,
  UserArgs,
  TimeSheetArgs,
  TrainingRecordArgs,
  UserPreferencesArgs,
} = argsMap;
