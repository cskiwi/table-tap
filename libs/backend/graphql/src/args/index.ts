import * as Models from '@app/models';
import { args } from '../utils';
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
  AttendanceRecordCreateInputArgs,
  AttendanceRecordUpdateInputArgs,
  CafeCreateInputArgs,
  CafeBusinessHoursArgs,
  CafeSettingsArgs,
  CafeUpdateInputArgs,
  CertificationRecordArgs,
  CertificationRecordCreateInputArgs,
  CertificationRecordUpdateInputArgs,
  ConfigurationArgs,
  ConfigurationCreateInputArgs,
  ConfigurationUIOptionArgs,
  ConfigurationUpdateInputArgs,
  ConfigurationUIOptionsArgs,
  ConfigurationValidationArgs,
  CounterArgs,
  CounterCapabilitiesArgs,
  CounterCreateInputArgs,
  CounterUpdateInputArgs,
  CounterWorkingHoursArgs,
  CreditArgs,
  CreditCreateInputArgs,
  CreditRestrictionsArgs,
  CreditUpdateInputArgs,
  EmployeeAnalyticsArgs,
  EmployeeCreateInputArgs,
  EmployeeEmergencyContactArgs,
  EmployeeGoalArgs,
  EmployeeUpdateInputArgs,
  GlassArgs,
  GlassCreateInputArgs,
  EmployeeGoalCreateInputArgs,
  EmployeeGoalUpdateInputArgs,
  EmployeeReviewArgs,
  EmployeeWorkingHoursArgs,
  GlassMovementArgs,
  GlassMovementCreateInputArgs,
  GlassMovementUpdateInputArgs,
  GlassUpdateInputArgs,
  UserCreateInputArgs,
  UserUpdateInputArgs,
  InventoryAlertArgs,
  InventoryAlertMetadataArgs,
  InventoryCreateInputArgs,
  InventoryUpdateInputArgs,
  LoyaltyAccountBadgeArgs,
  LoyaltyAccountChallengeProgressArgs,
  LoyaltyAccountCreateInputArgs,
  LoyaltyAccountUpdateInputArgs,
  LoyaltyAccountPreferencesArgs,
  LoyaltyChallengeCreateInputArgs,
  LoyaltyChallengeUpdateInputArgs,
  LoyaltyPromotionCreateInputArgs,
  LoyaltyPromotionUpdateInputArgs,
  LoyaltyChallengeEligibilityArgs,
  LoyaltyChallengeGoalsArgs,
  LoyaltyChallengeMilestoneArgs,
  LoyaltyChallengeRewardsArgs,
  LoyaltyChallengeTrackingRulesArgs,
  LoyaltyPromotionMessagingArgs,
  LoyaltyPromotionRulesArgs,
  LoyaltyPromotionTargetingArgs,
  LoyaltyRewardApplicableProductsArgs,
  LoyaltyRewardCreateInputArgs,
  LoyaltyRewardRedemptionArgs,
  LoyaltyRewardRedemptionCreateInputArgs,
  LoyaltyRewardRedemptionMetadataArgs,
  LoyaltyRewardRedemptionUpdateInputArgs,
  LoyaltyRewardSpecialPropertiesArgs,
  LoyaltyRewardUpdateInputArgs,
  LoyaltyTierBenefitArgs,
  LoyaltyTierCreateInputArgs,
  LoyaltyTierUpdateInputArgs,
  LoyaltyTransactionCreateInputArgs,
  LoyaltyTransactionUpdateInputArgs,
  OrderCreateInputArgs,
  LoyaltyTransactionMetadataArgs,
  OrderItemCounterStatusArgs,
  OrderItemCreateInputArgs,
  OrderItemCustomizationArgs,
  OrderItemUpdateInputArgs,
  OrderUpdateInputArgs,
  OrderWorkflowStepArgs,
  PaymentMetadataArgs,
  PaymentProviderDataArgs,
  PaymentReceiptDataArgs,
  PayrollDataArgs,
  PerformanceMetricsArgs,
  ProductAttributeArgs,
  ProductCreateInputArgs,
  ProductUpdateInputArgs,
  PurchaseArgs,
  PurchaseCreateInputArgs,
  PurchaseUpdateInputArgs,
  PurchaseItemArgs,
  PurchaseItemCreateInputArgs,
  PurchaseItemUpdateInputArgs,
  SalesAnalyticsArgs,
  SalesCategoryBreakdownArgs,
  SalesOrderTypeBreakdownArgs,
  SalesPaymentMethodBreakdownArgs,
  AdminNotificationArgs,
  CafeArgs,
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
  ScheduledShiftCreateInputArgs,
  ScheduledShiftUpdateInputArgs,
  ShiftSwapRequestArgs,
  ShiftSwapRequestCreateInputArgs,
  ShiftSwapRequestUpdateInputArgs,
  SkillAssessmentArgs,
  StockArgs,
  StockMovementArgs,
  StockMovementCreateInputArgs,
  StockMovementUpdateInputArgs,
  SupplierInfoArgs,
  TimeEntryArgs,
  TimeEntryCreateInputArgs,
  TimeEntryUpdateInputArgs,
  UserArgs,
  TimeSheetArgs,
  TimeSheetCreateInputArgs,
  TimeSheetUpdateInputArgs,
  TrainingRecordArgs,
  UserPreferencesArgs,
} = argsMap;
