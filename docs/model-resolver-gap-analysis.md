# Model-Resolver Gap Analysis Report

## Executive Summary

Analysis of GraphQL resolvers vs TypeORM models reveals several critical gaps in the codebase.

## Resolver Inventory

**Existing Resolvers:** (12 total)
1. cafe.resolver.ts
2. employee.resolver.ts
3. inventory.resolver.ts
4. loyalty-account.resolver.ts
5. loyalty-challenge.resolver.ts
6. loyalty-promotion.resolver.ts
7. loyalty-reward.resolver.ts
8. loyalty-tier.resolver.ts
9. loyalty-transaction.resolver.ts
10. **menu.resolver.ts** ⚠️
11. order.resolver.ts ⚠️
12. payment.resolver.ts

## Model Inventory

**Existing Models:** (25 total)

### Core Entities
- ✅ Cafe
- ✅ Configuration
- ✅ Counter
- ✅ User

### Employee Management
- ✅ Employee
- ✅ TimeEntry
- ✅ TimeSheet

### Glass Management
- ✅ Glass
- ✅ GlassMovement

### Inventory/Stock Management
- ✅ Stock
- ✅ StockMovement
- ✅ Purchase
- ✅ PurchaseItem

### Loyalty System
- ✅ LoyaltyAccount
- ✅ LoyaltyChallenge
- ✅ LoyaltyPromotion
- ✅ LoyaltyReward
- ✅ LoyaltyRewardRedemption
- ✅ LoyaltyTier
- ✅ LoyaltyTransaction

### Order Management
- ✅ Order
- ✅ OrderItem
- ✅ Payment
- ✅ **Product** (serves as menu items)
- ✅ Credit

## Critical Gaps Identified

### 1. Menu System - MAJOR GAP ⚠️

**Status:** menu.resolver.ts exists but required models DO NOT exist

**Missing Models:**
- ❌ Menu model
- ❌ MenuCategory model

**Missing Input Types:**
- ❌ CreateMenuItemInput
- ❌ UpdateMenuItemInput
- ❌ CreateMenuCategoryInput
- ❌ PaginatedMenuResponse

**Missing Service:**
- ❌ MenuService

**Current Situation:**
- The Product model exists and likely represents menu items
- The menu.resolver.ts is completely non-functional
- All Menu-related queries/mutations will fail

**Recommendations:**
1. **Option A:** Rename Product → Menu and create MenuCategory model
2. **Option B:** Delete menu.resolver.ts and create product.resolver.ts
3. **Option C:** Keep Product model, update menu.resolver.ts to use Product

### 2. Order Resolver - CORRUPTED ⚠️

**Status:** order.resolver.ts is corrupted in git repository

**Issues:**
- `orders()` query missing @Query decorator (committed corrupted)
- Multiple syntax errors throughout file
- Missing proper method signatures

**Recommendation:**
- Completely rewrite order.resolver.ts based on cafe.resolver.ts pattern

### 3. No Restaurant Model

**Status:** No "Restaurant" model exists

**Analysis:**
- The Cafe model serves as the restaurant/tenant entity
- This is correct architecture for multi-tenant system
- No Restaurant model is needed

## Model-Resolver Mapping

| Resolver | Primary Model | Status |
|----------|--------------|--------|
| cafe.resolver.ts | Cafe | ✅ Working |
| employee.resolver.ts | Employee | ✅ Working |
| inventory.resolver.ts | Stock | ✅ Working |
| loyalty-account.resolver.ts | LoyaltyAccount | ✅ Working |
| loyalty-challenge.resolver.ts | LoyaltyChallenge | ✅ Working |
| loyalty-promotion.resolver.ts | LoyaltyPromotion | ✅ Working |
| loyalty-reward.resolver.ts | LoyaltyReward | ✅ Working |
| loyalty-tier.resolver.ts | LoyaltyTier | ✅ Working |
| loyalty-transaction.resolver.ts | LoyaltyTransaction | ✅ Working |
| **menu.resolver.ts** | **Menu (MISSING)** | ❌ **BROKEN** |
| order.resolver.ts | Order | ⚠️ Corrupted |
| payment.resolver.ts | Payment | ✅ Working |

## Missing Resolvers (Models without Resolvers)

These models exist but have NO resolvers:
1. Configuration
2. Counter
3. User (has basic resolver in auth module)
4. TimeEntry
5. TimeSheet
6. Glass
7. GlassMovement
8. StockMovement
9. Purchase
10. PurchaseItem
11. OrderItem
12. **Product** (should have resolver!)
13. Credit
14. LoyaltyRewardRedemption

**Note:** Some models may not need resolvers (like TimeEntry, which is a child of TimeSheet)

## ORM Configuration Status

✅ **All 27 models are correctly registered in `libs/backend/database/src/orm.config.ts`**

Models are in proper dependency order to prevent circular dependency issues.

## Immediate Action Required

### Priority 1 - Menu System
1. **Decision needed:** Product vs Menu naming
2. Create MenuCategory model if needed
3. Create menu input types
4. Create MenuService or ProductService
5. Fix/rewrite menu.resolver.ts

### Priority 2 - Order Resolver
1. Rewrite order.resolver.ts from scratch
2. Follow pattern from cafe.resolver.ts
3. Test all order queries and mutations

### Priority 3 - Product Resolver
1. Create product.resolver.ts for Product model
2. Add product queries (by category, search, etc.)
3. Link to inventory and order systems

## Recommendations

1. **Menu/Product Consolidation:**
   - Use Product as the primary model
   - Rename menu.resolver.ts → product.resolver.ts
   - Create ProductCategory model for menu organization

2. **Complete Order Resolver:**
   - Rewrite from scratch using working resolvers as template
   - Add comprehensive error handling
   - Properly integrate with order.service.ts

3. **Optional Resolvers:**
   - Add Counter resolver for counter management
   - Add TimeSheet resolver for employee time tracking
   - Add Configuration resolver for system settings

4. **Code Quality:**
   - Run full TypeScript build to catch all errors
   - Add integration tests for all resolvers
   - Document all GraphQL schemas

## Conclusion

The codebase has a solid foundation with 25 models properly configured. The main issues are:

1. **Menu system is incomplete** - needs models and proper resolver
2. **Order resolver is corrupted** - needs rewrite
3. **Several models lack resolvers** - Product being the most critical

The "Restaurant" model concept mentioned doesn't exist because **Cafe serves as the restaurant/tenant entity**, which is the correct architecture for a multi-tenant cafe management system.
