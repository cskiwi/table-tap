# JSON to Relational Tables Migration

## Overview
This migration converts JSON columns in various models to proper relational tables, improving data integrity, query performance, and database normalization.

## Changes Made

### 1. OrderItem Model
**Old JSON columns removed:**
- `customizations` (JSON)
- `counterStatus` (JSON array)

**New tables created:**
- `OrderItemCustomizations` - One-to-one relationship storing size, temperature, milkType, sweetness, extras, removals
- `OrderItemCounterStatuses` - One-to-many relationship tracking status per counter

**Benefits:**
- Better query performance when filtering by customization options
- Easier to track counter-specific processing status
- Improved data validation

### 2. Payment Model
**Old JSON columns removed:**
- `providerData` (JSON)
- `receiptData` (JSON)

**New tables created:**
- `PaymentProviderData` - One-to-one relationship storing provider-specific fields (qrCode, last4, cardType, authCode, walletType, providerResponse)
- `PaymentReceiptData` - One-to-one relationship storing receipt information (customerEmail, customerPhone, printedAt, emailedAt)

**Benefits:**
- Structured storage of payment provider information
- Better indexing on receipt data
- Clearer separation of concerns

### 3. SalesAnalytics Model
**Old JSON columns removed:**
- `topProducts` (JSON array)
- `categoryBreakdown` (JSON array)
- `paymentMethodBreakdown` (JSON object)
- `orderTypeBreakdown` (JSON object)
- `peakHours` (JSON array)

**New tables created:**
- `SalesTopProducts` - One-to-many relationship for top performing products
- `SalesCategoryBreakdowns` - One-to-many relationship for category-wise breakdown
- `SalesPaymentMethodBreakdowns` - One-to-one relationship for payment method totals
- `SalesOrderTypeBreakdowns` - One-to-one relationship for order type totals
- `SalesPeakHours` - One-to-many relationship for hourly performance data

**Benefits:**
- Much better query performance for analytics queries
- Easier to aggregate and filter data
- Can index on specific metrics
- Kept `additionalMetrics` as text for flexible custom metrics

### 4. LoyaltyAccount Model
**Old JSON columns removed:**
- `badges` (JSON array)
- `challengeProgress` (JSON object)
- `preferences` (JSON object)

**New tables created:**
- `LoyaltyAccountBadges` - One-to-many relationship storing earned badges
- `LoyaltyAccountChallengeProgresses` - One-to-many relationship tracking challenge completion
- `LoyaltyAccountPreferences` - One-to-one relationship for notification preferences

**Benefits:**
- Query badges by category or earned date
- Track challenge progress over time
- Standardized preferences structure

### 5. LoyaltyTier Model
**Old JSON columns removed:**
- `benefits` (JSON object)

**New tables created:**
- `LoyaltyTierBenefits` - One-to-one relationship storing all tier benefit details

**Benefits:**
- Structured benefit information
- Easier to query tiers by specific benefits
- Better data validation

### 6. LoyaltyReward Model
**Old JSON columns removed:**
- `applicableProducts` (JSON object)
- `specialProperties` (JSON object)

**New tables created:**
- `LoyaltyRewardApplicableProducts` - One-to-one relationship for product restrictions
- `LoyaltyRewardSpecialProperties` - One-to-one relationship for reward-specific properties

**Benefits:**
- Can efficiently query rewards by applicable products
- Structured special properties per reward type
- Better type safety

## Migration Strategy

### Phase 1: Create New Tables (Completed)
All new tables have been created with proper TypeORM decorators, indexes, and relationships.

### Phase 2: Data Migration (To Do)
A TypeORM migration needs to be created to:
1. Create all new tables
2. Migrate existing JSON data to new tables
3. Drop old JSON columns after verification
4. Update all indexes

### Phase 3: Update Application Code (To Do)
Services and resolvers need to be updated to:
1. Load relationships when needed
2. Update create/update logic to work with new models
3. Update GraphQL resolvers to expose new relationships
4. Update any business logic that accessed JSON fields directly

## Files Created

### Order Models
- `libs/models/models/src/models/order/order-item-customization.model.ts`
- `libs/models/models/src/models/order/order-item-counter-status.model.ts`
- `libs/models/models/src/models/order/payment-provider-data.model.ts`
- `libs/models/models/src/models/order/payment-receipt-data.model.ts`
- `libs/models/models/src/models/order/sales-top-product.model.ts`
- `libs/models/models/src/models/order/sales-category-breakdown.model.ts`
- `libs/models/models/src/models/order/sales-payment-method-breakdown.model.ts`
- `libs/models/models/src/models/order/sales-order-type-breakdown.model.ts`
- `libs/models/models/src/models/order/sales-peak-hour.model.ts`

### Loyalty Models
- `libs/models/models/src/models/loyalty/loyalty-account-badge.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-account-challenge-progress.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-account-preferences.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-tier-benefit.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-reward-applicable-products.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-reward-special-properties.model.ts`

## Files Modified

### Order Models
- `libs/models/models/src/models/order/order-item.model.ts`
- `libs/models/models/src/models/order/payment.model.ts`
- `libs/models/models/src/models/order/sales-analytics.model.ts`

### Loyalty Models
- `libs/models/models/src/models/loyalty/loyalty-account.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-tier.model.ts`
- `libs/models/models/src/models/loyalty/loyalty-reward.model.ts`

## Next Steps

1. **Create TypeORM Migration**: Generate a migration that creates all new tables and migrates data
2. **Update Index File**: Add all new models to the main index.ts export file
3. **Test Migration**: Run migration in development environment
4. **Update Services**: Modify services to use new relationships
5. **Update Resolvers**: Update GraphQL resolvers to expose new structure
6. **Update Tests**: Update unit tests to work with new models
7. **Deploy**: Roll out changes to production with proper rollback plan

## Remaining JSON Columns

Some JSON columns were intentionally kept:
- `Configuration.value` - Generic configuration storage, flexible by design
- `Configuration.validation` - Schema validation rules
- `SalesAnalytics.additionalMetrics` - Flexible custom metrics storage
- Various `settings` fields in Cafe and AdminSettings - Application settings

These columns are appropriate for JSON storage as they contain truly dynamic/flexible data.
