# Component Migration Registry

## Migration Status Legend

- ✅ **Migrated** - Fully migrated to PrimeNG + Tailwind
- 🔄 **In Progress** - Partially migrated, needs completion
- ⏳ **Pending** - Not yet migrated
- ❌ **Blocked** - Migration blocked by dependencies
- 📝 **Needs Review** - Migrated but requires review

## Shared UI Components

### Core Components (`libs/shared/ui/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `badge.component.ts` | ✅ | 2025-10-03 | Uses PrimeNG Badge with Tailwind utilities |
| `button.component.ts` | ✅ | 2025-10-03 | Wraps p-button with custom variants |
| `icon-button.component.ts` | ✅ | 2025-10-03 | Specialized button for icon-only actions |
| `card.component.ts` | ✅ | 2025-10-03 | Wraps p-card with custom styling options |
| `content-card.component.ts` | ✅ | 2025-10-03 | Specialized card variant |
| `divider.component.ts` | ✅ | 2025-10-03 | Uses PrimeNG Divider |
| `empty-state.component.ts` | ✅ | 2025-10-03 | Custom component with Tailwind |
| `error-display.component.ts` | ✅ | 2025-10-03 | PrimeNG Message component |
| `loading-spinner.component.ts` | ✅ | 2025-10-03 | PrimeNG ProgressSpinner |
| `skeleton.component.ts` | ✅ | 2025-10-03 | PrimeNG Skeleton |
| `container.component.ts` | ✅ | 2025-10-03 | Layout component with Tailwind |
| `section.component.ts` | ✅ | 2025-10-03 | Layout component with Tailwind |
| `responsive-grid.component.ts` | ✅ | 2025-10-03 | Grid layout with Tailwind grid |
| `confirm-dialog.component.ts` | ✅ | 2025-10-03 | PrimeNG ConfirmDialog |
| `toast-notification.component.ts` | ✅ | 2025-10-03 | PrimeNG Toast |

## Feature Modules

### Shell Component (`libs/frontend/components/shell/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `shell.component.ts` | ✅ | 2025-10-03 | Hybrid SCSS + Tailwind for complex layout |

**Shell Migration Details:**
- Header uses custom SCSS for complex theming
- Navigation uses Tailwind utilities
- Responsive sidebar with custom transitions
- Breadcrumbs styled with Tailwind

### Admin Module (`libs/frontend/modules/admin/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `admin-shell.component.ts` | ✅ | 2025-10-03 | Admin layout wrapper |
| `admin-dashboard.component.ts` | ✅ | 2025-10-03 | Dashboard with card grid |
| `analytics-dashboard.component.ts` | ✅ | 2025-10-03 | Uses PrimeNG Chart |
| `employee-management.component.ts` | ✅ | 2025-10-03 | PrimeNG Table with actions |
| `inventory-management.component.ts` | ✅ | 2025-10-03 | PrimeNG Table with filters |
| `order-management.component.ts` | ✅ | 2025-10-03 | Real-time order table |
| `admin-settings.component.ts` | ✅ | 2025-10-03 | Form with PrimeNG inputs |

### Authentication Module (`libs/frontend/modules/auth/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `login.component.ts` | ✅ | 2025-10-03 | PrimeNG Card + InputText |
| `register.component.ts` | ✅ | 2025-10-03 | Multi-step form |
| `forgot-password.component.ts` | ✅ | 2025-10-03 | Simple form layout |

### Cart Module (`libs/frontend/modules/cart/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `cart-display.component.ts` | ✅ | 2025-10-03 | Card-based layout |
| `cart-icon.component.ts` | ✅ | 2025-10-03 | Badge with item count |
| `cart-item.component.ts` | ✅ | 2025-10-03 | Line item component |
| `order-summary.component.ts` | ✅ | 2025-10-03 | Summary card with totals |

### Kitchen Module (`libs/frontend/modules/kitchen/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `kitchen-display.component.ts` | ✅ | 2025-10-03 | Real-time order display |
| `order-card.component.ts` | ✅ | 2025-10-03 | Draggable order card |
| `order-item.component.ts` | ✅ | 2025-10-03 | Individual item display |
| `timer-panel.component.ts` | ✅ | 2025-10-03 | Countdown timers |
| `timer-dialog.component.ts` | ✅ | 2025-10-03 | PrimeNG Dialog |
| `metrics-dashboard.component.ts` | ✅ | 2025-10-03 | Performance charts |
| `settings-panel.component.ts` | ✅ | 2025-10-03 | Configuration panel |
| `alerts-panel.component.ts` | ✅ | 2025-10-03 | Alert messages |
| `staff-assignment-dialog.component.ts` | ✅ | 2025-10-03 | Employee selection |
| `quality-control-dialog.component.ts` | ✅ | 2025-10-03 | QC checklist |

### Kitchen Mobile Module (`libs/frontend/modules/kitchen-mobile/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `kitchen-mobile-dashboard.component.ts` | ✅ | 2025-10-03 | Mobile-optimized dashboard |
| `kitchen-order-card.component.ts` | ✅ | 2025-10-03 | Touch-friendly order card |

### Loyalty Module (`libs/frontend/modules/loyalty/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `loyalty-dashboard.component.ts` | ✅ | 2025-10-03 | Points overview |
| `tier-progression.component.ts` | ✅ | 2025-10-03 | Progress visualization |
| `points-display.component.ts` | ✅ | 2025-10-03 | Points badge |
| `challenge-progress.component.ts` | ✅ | 2025-10-03 | Challenge tracker |
| `challenge-listing.component.ts` | ✅ | 2025-10-03 | Available challenges |
| `challenge-detail.component.ts` | ✅ | 2025-10-03 | Challenge details |
| `rewards-catalog.component.ts` | ✅ | 2025-10-03 | Reward grid |
| `reward-details-modal.component.ts` | ✅ | 2025-10-03 | Reward modal |
| `reward-redemption-modal.component.ts` | ✅ | 2025-10-03 | Redemption flow |

### Menu Module (`libs/frontend/modules/menu/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `menu-display.component.ts` | ✅ | 2025-10-03 | Category-based menu |
| `menu-item-detail.component.ts` | ✅ | 2025-10-03 | Item detail modal |

### Order Module (`libs/frontend/modules/order/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `order-checkout.component.ts` | ✅ | 2025-10-03 | Multi-step checkout |
| `payment-method-selector.component.ts` | ✅ | 2025-10-03 | Payment options |
| `order-confirmation.component.ts` | ✅ | 2025-10-03 | Success screen |
| `order-tracking.component.ts` | ✅ | 2025-10-03 | Real-time tracking |
| `receipt.component.ts` | ✅ | 2025-10-03 | Printable receipt |

### Translation Module (`libs/frontend/modules/translation/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `selection.component.ts` | ✅ | 2025-10-03 | Language dropdown |

### Home Page (`libs/frontend/pages/home/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `page-home.component.ts` | ✅ | 2025-10-03 | Landing page |

## Legacy Components (src/)

### Customer Module (`src/modules/customer/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `order-card.component.ts` | ⏳ | - | To be replaced by libs version |
| `product-grid.component.ts` | ⏳ | - | To be replaced by libs version |
| `payment-dialog.component.ts` | ⏳ | - | To be replaced by libs version |

### Kitchen Module (`src/modules/kitchen/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `counter-dashboard.component.ts` | ⏳ | - | To be replaced by libs version |

### Customer Components (`src/lib/components/customer/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `menu-grid.component.ts` | ⏳ | - | Deprecated - use libs/menu |
| `menu-grid-optimized.component.ts` | ⏳ | - | Deprecated - use libs/menu |
| `menu-example.component.ts` | ⏳ | - | Example code only |
| `product-card.component.ts` | ⏳ | - | Deprecated - use libs/menu |
| `order-summary.component.ts` | ⏳ | - | Deprecated - use libs/cart |
| `payment-flow.component.ts` | ⏳ | - | Deprecated - use libs/order |

### Shared Components (`src/shared/`)

| Component | Status | Migration Date | Notes |
|-----------|--------|----------------|-------|
| `base.component.ts` | ⏳ | - | Base class - to be reviewed |
| `optimized-order-card.component.ts` | ⏳ | - | Deprecated - use libs version |

## Migration Statistics

### Overall Progress

- **Total Components**: 72
- **Migrated**: 52 (72%)
- **In Progress**: 0 (0%)
- **Pending**: 20 (28%)
- **Blocked**: 0 (0%)

### By Module

| Module | Total | Migrated | Progress |
|--------|-------|----------|----------|
| Shared UI | 15 | 15 | 100% |
| Shell | 1 | 1 | 100% |
| Admin | 7 | 7 | 100% |
| Auth | 3 | 3 | 100% |
| Cart | 4 | 4 | 100% |
| Kitchen | 10 | 10 | 100% |
| Kitchen Mobile | 2 | 2 | 100% |
| Loyalty | 9 | 9 | 100% |
| Menu | 2 | 2 | 100% |
| Order | 5 | 5 | 100% |
| Translation | 1 | 1 | 100% |
| Home | 1 | 1 | 100% |
| Legacy (src/) | 12 | 0 | 0% |

## Known Issues

### Component-Specific Issues

1. **Shell Component - Mobile Sidebar**
   - Issue: Complex transition animations
   - Status: Working with custom SCSS
   - Fix: Keeping SCSS for animations

2. **Kitchen Display - Drag & Drop**
   - Issue: Custom drag behavior needed
   - Status: Using PrimeNG DragDrop module
   - Fix: Combined with custom SCSS for visual feedback

3. **Legacy Components (src/)**
   - Issue: Duplicate functionality with libs/ versions
   - Status: Pending deprecation
   - Fix: Plan to remove after full migration

## Deprecation Schedule

### Phase 1 (Completed)
- ✅ Migrate all shared UI components
- ✅ Migrate all feature modules in libs/

### Phase 2 (Current)
- 🔄 Testing migrated components
- 🔄 Documentation updates
- 🔄 Developer training

### Phase 3 (Next)
- ⏳ Deprecate legacy src/ components
- ⏳ Remove old SCSS files
- ⏳ Final cleanup

## Review Checklist

For each migrated component:

- [ ] Uses PrimeNG components where appropriate
- [ ] Applies Tailwind utilities for layout/spacing
- [ ] Minimal custom SCSS (only for complex patterns)
- [ ] Responsive design with Tailwind breakpoints
- [ ] Accessible (ARIA attributes, keyboard navigation)
- [ ] Dark mode compatible (.dark-theme)
- [ ] Documented in this registry
- [ ] Tested in development build
- [ ] Tested in production build
- [ ] No console errors or warnings

## Next Components to Migrate

Priority order for remaining legacy components:

1. `src/modules/customer/order-card.component.ts` - High usage
2. `src/modules/customer/product-grid.component.ts` - High usage
3. `src/modules/kitchen/counter-dashboard.component.ts` - Medium usage
4. Remaining customer components - Low priority (deprecated)

## Notes

- All new components should be created in `libs/` structure
- Legacy `src/` components are deprecated and should not be enhanced
- Focus on reusable components in `libs/shared/ui/`
- Feature-specific components belong in their respective feature modules

## Last Updated

**Date**: 2025-10-03
**Updated By**: Documentation Researcher Agent
**Next Review**: After Phase 3 completion
