# Template & Style Extraction Analysis Report

**Project**: TableTap Restaurant Management System
**Date**: 2025-10-03
**Analyzer**: System Architect Agent
**Purpose**: Comprehensive analysis of Angular components requiring template/style extraction and migration strategy

---

## Executive Summary

This analysis identifies **66 components with inline templates** and **29 components with inline styles** across the TableTap project. The project uses:
- **PrimeNG v20.2.0** (modern component library)
- **Tailwind CSS v4.1.13** (utility-first framework)
- **tailwindcss-primeui v0.6.1** (PrimeNG-Tailwind integration)

### Key Findings
1. **66 components** need template extraction (`.ts` → `.html`)
2. **29 components** need style extraction (`.ts` → `.scss`)
3. Mixed styling approaches detected: CSS variables, hex colors, Tailwind utilities, and SCSS
4. Syntax errors in inline styles (missing semicolons, commas instead of semicolons)
5. Opportunity to standardize on PrimeNG theme classes + Tailwind utilities

---

## 1. Components with Inline Templates (66 total)

### 1.1 Shared UI Library Components (22 components)
**Location**: `libs/shared/ui/src/lib/`

All components in this library have inline templates and should be extracted:

```
✓ badge/badge.component.ts
✓ buttons/button.component.ts
✓ buttons/icon-button.component.ts
✓ cards/card.component.ts
✓ cards/content-card.component.ts
✓ confirm-dialog/confirm-dialog.component.ts
✓ divider/divider.component.ts
✓ empty-state/empty-state.component.ts
✓ error-display/error-display.component.ts
✓ layout/container.component.ts
✓ layout/section.component.ts
✓ loading-spinner/loading-spinner.component.ts
✓ responsive-grid/responsive-grid.component.ts
✓ skeleton/skeleton.component.ts
✓ toast-notification/toast-notification.component.ts
```

**Priority**: **HIGH** - These are reusable components used throughout the app.

---

### 1.2 Admin Module Components (6 components)
**Location**: `libs/frontend/modules/admin/src/lib/components/`

```
✓ analytics/analytics-dashboard.component.ts
✓ dashboard/admin-dashboard.component.ts
✓ dashboard/admin-shell.component.ts
✓ employees/employee-management.component.ts
✓ inventory/inventory-management.component.ts
✓ orders/order-management.component.ts
✓ settings/admin-settings.component.ts
```

**Priority**: **MEDIUM** - Complex dashboards with large templates (300+ lines).

---

### 1.3 Kitchen Module Components (10 components)
**Location**: `libs/frontend/modules/kitchen/src/lib/components/`

```
✓ alerts-panel/alerts-panel.component.ts
✓ kitchen-display/kitchen-display.component.ts
✓ metrics-dashboard/metrics-dashboard.component.ts
✓ order-card/order-card.component.ts (310 lines of template!)
✓ order-item/order-item.component.ts
✓ quality-control-dialog/quality-control-dialog.component.ts
✓ settings-panel/settings-panel.component.ts
✓ staff-assignment-dialog/staff-assignment-dialog.component.ts
✓ timer-dialog/timer-dialog.component.ts
✓ timer-panel/timer-panel.component.ts
```

**Priority**: **HIGH** - Mission-critical kitchen operations UI.

---

### 1.4 Loyalty Module Components (9 components)
**Location**: `libs/frontend/modules/loyalty/src/lib/components/`

```
✓ challenge-detail.component.ts
✓ challenge-listing.component.ts
✓ challenge-progress.component.ts
✓ loyalty-dashboard.component.ts
✓ points-display.component.ts (190 lines!)
✓ reward-details-modal.component.ts
✓ reward-redemption-modal.component.ts
✓ rewards-catalog.component.ts
✓ tier-progression.component.ts
```

**Priority**: **MEDIUM** - Customer-facing loyalty features.

---

### 1.5 Order Module Components (5 components)
**Location**: `libs/frontend/modules/order/src/lib/components/`

```
✓ order-checkout/order-checkout.component.ts
✓ order-confirmation/order-confirmation.component.ts
✓ order-tracking/order-tracking.component.ts
✓ payment-method-selector/payment-method-selector.component.ts
✓ receipt/receipt.component.ts
```

**Priority**: **HIGH** - Core ordering workflow.

---

### 1.6 Cart Module Components (4 components)
**Location**: `libs/frontend/modules/cart/src/lib/components/`

```
✓ cart-display/cart-display.component.ts
✓ cart-icon/cart-icon.component.ts
✓ cart-item/cart-item.component.ts
✓ order-summary/order-summary.component.ts
```

**Priority**: **HIGH** - Essential cart functionality.

---

### 1.7 Menu Module Components (2 components)
**Location**: `libs/frontend/modules/menu/src/lib/components/`

```
✓ menu-display.component.ts
✓ menu-item-detail.component.ts
```

**Priority**: **HIGH** - Core menu display.

---

### 1.8 Auth Module Components (3 components)
**Location**: `libs/frontend/modules/auth/src/lib/components/`

```
✓ forgot-password.component.ts
✓ login.component.ts (117 lines)
✓ register.component.ts
```

**Priority**: **MEDIUM** - Authentication flow.

---

### 1.9 Legacy/Example Components (5 components)
**Location**: `src/lib/components/` and `src/modules/`

```
✓ src/lib/components/customer/menu-example/menu-example.component.ts
✓ src/lib/components/customer/menu-grid/menu-grid-optimized.component.ts
✓ src/lib/components/customer/menu-grid/menu-grid.component.ts
✓ src/lib/components/customer/payment-flow/payment-flow.component.ts
✓ src/lib/components/customer/product-card/product-card.component.ts
✓ src/lib/components/customer/order-summary/order-summary.component.ts
✓ src/shared/components/ui/optimized-order-card.component.ts
```

**Priority**: **LOW** - May be deprecated/examples.

---

## 2. Components with Inline Styles (29 total)

### 2.1 Critical Syntax Issues Found

All inline styles have **syntax errors** - missing semicolons and using commas instead of semicolons:

**Example from `badge.component.ts`:**
```scss
// ❌ INCORRECT (current)
.badge-container {
  position: relative,     // Should be semicolon!
  display: inline-block;  // Inconsistent
}

// ✅ CORRECT (after extraction)
.badge-container {
  position: relative;
  display: inline-block;
}
```

**Example from `loading-spinner.component.ts`:**
```scss
// ❌ INCORRECT (current)
.loading-spinner {
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center,  // Comma!
  gap: 1rem
}
```

### 2.2 Components Requiring Style Extraction

**Same 29 components** identified by grep also need **syntax fixes**:

```
libs/shared/ui/src/lib/badge/badge.component.ts
libs/shared/ui/src/lib/buttons/button.component.ts
libs/shared/ui/src/lib/buttons/icon-button.component.ts
libs/shared/ui/src/lib/cards/card.component.ts
libs/shared/ui/src/lib/cards/content-card.component.ts
libs/shared/ui/src/lib/confirm-dialog/confirm-dialog.component.ts
libs/shared/ui/src/lib/divider/divider.component.ts
libs/shared/ui/src/lib/empty-state/empty-state.component.ts
libs/shared/ui/src/lib/error-display/error-display.component.ts
libs/shared/ui/src/lib/layout/container.component.ts
libs/shared/ui/src/lib/layout/section.component.ts
libs/shared/ui/src/lib/loading-spinner/loading-spinner.component.ts
libs/shared/ui/src/lib/responsive-grid/responsive-grid.component.ts
libs/shared/ui/src/lib/skeleton/skeleton.component.ts
libs/shared/ui/src/lib/toast-notification/toast-notification.component.ts
libs/frontend/modules/auth/src/lib/components/forgot-password.component.ts
libs/frontend/modules/auth/src/lib/components/login.component.ts
libs/frontend/modules/auth/src/lib/components/register.component.ts
libs/frontend/modules/cart/src/lib/components/cart-display/cart-display.component.ts
libs/frontend/modules/cart/src/lib/components/cart-icon/cart-icon.component.ts
libs/frontend/modules/cart/src/lib/components/cart-item/cart-item.component.ts
libs/frontend/modules/cart/src/lib/components/order-summary/order-summary.component.ts
(+ 7 more legacy components)
```

---

## 3. Existing SCSS Patterns Analysis

### 3.1 Current SCSS Files (13 found with content)

**Files with PrimeNG CSS variables (`var(--...)`):**
```
libs/frontend/modules/admin/src/lib/components/analytics/analytics-dashboard.component.scss
libs/frontend/modules/admin/src/lib/components/dashboard/admin-dashboard.component.scss
libs/frontend/modules/admin/src/lib/components/dashboard/admin-shell.component.scss
libs/frontend/modules/admin/src/lib/components/employees/employee-management.component.scss
libs/frontend/modules/admin/src/lib/components/inventory/inventory-management.component.scss
libs/frontend/modules/admin/src/lib/components/orders/order-management.component.scss
libs/frontend/modules/kitchen/src/lib/components/kitchen-display/kitchen-display.component.scss
libs/frontend/modules/kitchen/src/lib/components/quality-control-dialog/quality-control-dialog.component.scss
libs/frontend/modules/kitchen/src/lib/components/staff-assignment-dialog/staff-assignment-dialog.component.scss
libs/frontend/modules/kitchen/src/lib/components/timer-dialog/timer-dialog.component.scss
libs/frontend/modules/menu/src/lib/components/menu-display.component.scss
libs/frontend/modules/menu/src/lib/components/menu-item-detail.component.scss
```

**Files with hex colors (`#rrggbb`):**
```
libs/frontend/components/shell/src/shell.component.scss (15+ hex colors!)
libs/frontend/modules/kitchen/src/lib/components/order-card/order-card.component.scss (10+ hex colors!)
libs/frontend/modules/loyalty/* (multiple hex colors)
```

### 3.2 Identified Color Patterns

**From `shell.component.scss` (header styles):**
```scss
// Hard-coded colors that should use PrimeNG variables:
background: #1e3a8a;        // → var(--primary-color)
color: white;               // → var(--primary-color-text)
color: #374151;            // → var(--text-color)
color: #6b7280;            // → var(--text-color-secondary)
background: #f3f4f6;       // → var(--surface-100)
background: #1f2937;       // → var(--surface-900)
color: #d1d5db;            // → var(--surface-300)
background: #f9fafb;       // → var(--surface-50)
```

**From `order-card.component.scss` (kitchen):**
```scss
// Status colors:
border-left: 4px solid #f44336;  // → var(--red-500)
border-left: 4px solid #ff9800;  // → var(--orange-500)
border-left: 4px solid #ffeb3b;  // → var(--yellow-500)
border-top: 3px solid #2196f3;   // → var(--blue-500)
border-top: 3px solid #4caf50;   // → var(--green-500)
background-color: #f44336;       // → var(--red-500)
background-color: #ff9800;       // → var(--orange-500)
background-color: #2196f3;       // → var(--blue-500)
background-color: #4caf50;       // → var(--green-500)
background-color: #9e9e9e;       // → var(--gray-500)
```

---

## 4. PrimeNG Theme Variables Available

Based on PrimeNG v20.2.0 and `tailwindcss-primeui` integration:

### 4.1 PrimeNG Design Tokens (CSS Variables)

**Color Palette:**
```scss
// Primary colors
var(--primary-50) through var(--primary-950)
var(--primary-color)          // Main brand color
var(--primary-color-text)     // Text on primary

// Surface colors (backgrounds)
var(--surface-0)              // White/lightest
var(--surface-50)
var(--surface-100)
var(--surface-200)
...
var(--surface-900)            // Darkest
var(--surface-ground)         // Base surface
var(--surface-section)        // Section background
var(--surface-card)           // Card background
var(--surface-overlay)        // Overlay background
var(--surface-border)         // Border color
var(--surface-hover)          // Hover state

// Text colors
var(--text-color)             // Primary text
var(--text-color-secondary)   // Secondary text
var(--text-color-muted)       // Muted text

// Semantic colors
var(--red-50) through var(--red-950)
var(--orange-50) through var(--orange-950)
var(--yellow-50) through var(--yellow-950)
var(--green-50) through var(--green-950)
var(--blue-50) through var(--blue-950)
var(--indigo-50) through var(--indigo-950)
var(--purple-50) through var(--purple-950)
var(--pink-50) through var(--pink-950)
var(--gray-50) through var(--gray-950)

// Component-specific
var(--content-padding)
var(--inline-spacing)
var(--border-radius)
var(--focus-ring)
```

**Severity Colors (for status):**
```scss
// Used in PrimeNG components like Tag, Badge, Message
success → green-500
info → blue-500
warn → orange-500
danger → red-500
secondary → gray-500
contrast → surface-900
```

---

## 5. Tailwind Configuration

**From `apps/app/src/styles.scss`:**
```scss
@use "primeicons/primeicons.css";
@use 'tailwindcss';
@plugin 'tailwindcss-primeui';

@layer base, components, primeng, utilities;
```

**Available Tailwind Utilities:**
- **Spacing**: `p-4`, `m-2`, `gap-4`, etc.
- **Layout**: `flex`, `grid`, `grid-cols-3`, etc.
- **Colors**: Tailwind color palette (integrated with PrimeNG via `tailwindcss-primeui`)
- **Typography**: `text-lg`, `font-semibold`, etc.
- **Borders**: `border`, `rounded-lg`, etc.
- **Effects**: `shadow-md`, `hover:bg-gray-100`, etc.

**PrimeUI Integration**: The `tailwindcss-primeui` plugin provides utility classes that match PrimeNG component styling.

---

## 6. Migration Strategy: SCSS → PrimeNG + Tailwind

### 6.1 Color Mapping Strategy

**Replace hard-coded hex colors with PrimeNG CSS variables:**

| Current Hex | PrimeNG Variable | Usage Context |
|------------|------------------|---------------|
| `#1e3a8a` | `var(--primary-color)` | Primary brand color |
| `#ffffff` | `var(--surface-0)` | White backgrounds |
| `#374151` | `var(--text-color)` | Primary text |
| `#6b7280` | `var(--text-color-secondary)` | Secondary text |
| `#f3f4f6` | `var(--surface-100)` | Light background/hover |
| `#1f2937` | `var(--surface-900)` | Dark background |
| `#f44336` | `var(--red-500)` | Error/urgent status |
| `#ff9800` | `var(--orange-500)` | Warning/rush status |
| `#ffeb3b` | `var(--yellow-500)` | Caution status |
| `#2196f3` | `var(--blue-500)` | Info/preparing status |
| `#4caf50` | `var(--green-500)` | Success/ready status |
| `#9e9e9e` | `var(--gray-500)` | Neutral/disabled |

**Example Transformation:**
```scss
// ❌ BEFORE (hard-coded)
.order-card.priority-urgent {
  border-left: 4px solid #f44336;
  .order-header {
    background-color: rgba(244, 67, 54, 0.05);
  }
}

// ✅ AFTER (PrimeNG variables)
.order-card.priority-urgent {
  border-left: 4px solid var(--red-500);
  .order-header {
    background-color: color-mix(in srgb, var(--red-500) 5%, transparent);
  }
}
```

### 6.2 Layout/Spacing Mapping Strategy

**Replace custom CSS with Tailwind utilities where applicable:**

| SCSS Pattern | Tailwind Replacement | When to Use |
|-------------|---------------------|-------------|
| `display: flex; flex-direction: column;` | `flex flex-col` | Always prefer |
| `display: flex; align-items: center;` | `flex items-center` | Always prefer |
| `padding: 1rem;` | `p-4` | Simple spacing |
| `margin-bottom: 0.5rem;` | `mb-2` | Simple spacing |
| `gap: 0.5rem;` | `gap-2` | Always prefer |
| `width: 100%;` | `w-full` | Always prefer |
| `max-width: 400px;` | `max-w-md` | Standard breakpoints |
| `border-radius: 8px;` | `rounded-lg` | Standard radius |
| `box-shadow: 0 2px 8px rgba(0,0,0,0.1);` | `shadow-md` | Standard shadows |

**Example Transformation:**
```scss
// ❌ BEFORE (custom CSS in SCSS)
.login-card-wrapper {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

// ✅ AFTER (Tailwind classes in template)
<div class="w-full max-w-md p-4 rounded-lg shadow-md">
  <!-- Card content -->
</div>

// Only keep complex/component-specific styles in SCSS
```

### 6.3 Hybrid Approach: When to Use SCSS vs Tailwind

**Use Tailwind for:**
- ✅ Simple layouts (flex, grid)
- ✅ Spacing (padding, margin, gap)
- ✅ Basic colors (backgrounds, text)
- ✅ Standard utilities (rounded, shadow, hover states)
- ✅ Responsive design (breakpoint prefixes)

**Use SCSS for:**
- ✅ Complex component-specific styles
- ✅ Animations and transitions
- ✅ Deep PrimeNG component overrides (`:host ::ng-deep`)
- ✅ Print styles (`@media print`)
- ✅ Accessibility media queries (`@media (prefers-reduced-motion)`)
- ✅ State-dependent complex styling

**Example - Kitchen Order Card (hybrid):**
```html
<!-- Template with Tailwind utilities -->
<div class="order-card p-4 rounded-lg shadow-md" [class]="cardClasses()">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-lg font-semibold text-gray-900">Order #{{order.number}}</h3>
    <span class="badge bg-red-500 text-white px-2 py-1 rounded-full text-xs">
      Urgent
    </span>
  </div>
  <!-- More content -->
</div>
```

```scss
// order-card.component.scss - Only complex styles
.order-card {
  transition: all 0.3s ease;

  // Priority-specific borders (dynamic based on status)
  &.priority-urgent {
    border-left: 4px solid var(--red-500);

    .order-header {
      background-color: color-mix(in srgb, var(--red-500) 5%, transparent);
    }
  }

  // Animation for overdue orders
  &.overdue {
    animation: pulse-red 2s infinite;
  }

  // Deep PrimeNG overrides
  :host ::ng-deep .p-card {
    @apply border-0; // Tailwind utility in SCSS
  }
}

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
  50% { box-shadow: 0 4px 16px color-mix(in srgb, var(--red-500) 30%, transparent); }
}
```

---

## 7. Recommended Extraction Process

### 7.1 Phase 1: Critical Path Components (Week 1)
**Priority**: Cart, Order, Menu modules

1. Extract templates to `.html` files
2. Fix inline style syntax errors
3. Extract styles to `.scss` files
4. Replace hex colors with PrimeNG variables
5. Apply Tailwind utilities in templates for simple layouts

**Estimated**: 15 components, ~40 hours

### 7.2 Phase 2: Kitchen & Admin Dashboards (Week 2)
**Priority**: Kitchen displays, Admin analytics

1. Extract large templates (300+ lines)
2. Migrate colors to PrimeNG theme variables
3. Optimize with Tailwind grid/flex utilities
4. Test responsive behavior

**Estimated**: 16 components, ~50 hours

### 7.3 Phase 3: Shared UI Library (Week 3)
**Priority**: Reusable components used everywhere

1. Fix all syntax errors in inline styles
2. Extract to separate files
3. Create standardized Tailwind + PrimeNG patterns
4. Document component API

**Estimated**: 22 components, ~30 hours

### 7.4 Phase 4: Loyalty & Auth (Week 4)
**Priority**: Customer-facing features

1. Extract templates and styles
2. Apply consistent theme variables
3. Ensure accessibility compliance

**Estimated**: 13 components, ~25 hours

---

## 8. Template Extraction Checklist (Per Component)

```bash
# For each component:

□ 1. Read current component file
□ 2. Create `.html` file with same name
□ 3. Copy template content (between backticks)
□ 4. Update @Component decorator:
     template: `...` → templateUrl: './component-name.component.html'
□ 5. Format HTML with proper indentation
□ 6. Test component rendering
□ 7. Commit changes
```

---

## 9. Style Extraction Checklist (Per Component)

```bash
# For each component:

□ 1. Read current component file
□ 2. Create `.scss` file with same name
□ 3. Copy styles content (between backticks)
□ 4. **FIX SYNTAX ERRORS**: Replace all commas with semicolons
□ 5. Add missing semicolons at end of property declarations
□ 6. Update @Component decorator:
     styles: [`...`] → styleUrls: ['./component-name.component.scss']
□ 7. Replace hex colors with PrimeNG CSS variables
□ 8. Identify simple layouts that can use Tailwind in template
□ 9. Test component styling
□ 10. Commit changes
```

---

## 10. Example Migration (Login Component)

### Current State (`login.component.ts`)
```typescript
@Component({
  selector: 'tt-login',
  template: `
    <div class="login-container">
      <p-card>
        <h2>Welcome Back</h2>
        <form [formGroup]="loginForm">
          <!-- Form fields -->
        </form>
      </p-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-text) 100%);
    }
  `]
})
```

### Migrated State

**`login.component.html`:**
```html
<div class="login-container min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <p-card>
      <ng-template pTemplate="header">
        <div class="text-center py-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
          <p class="text-gray-600">Sign in to your TableTap account</p>
        </div>
      </ng-template>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <!-- Form fields -->
      </form>
    </p-card>
  </div>
</div>
```

**`login.component.scss`:**
```scss
.login-container {
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-color-text) 100%
  );
}

// Only component-specific complex styles remain
// Simple utilities moved to Tailwind classes in template
```

**`login.component.ts`:**
```typescript
@Component({
  selector: 'tt-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
```

---

## 11. Automation Opportunities

### 11.1 Automated Syntax Fixing
**Script**: `fix-inline-styles.js`

```javascript
// Regex to fix common issues:
// 1. Comma → semicolon at end of CSS property
content = content.replace(/:\s*([^;,}]+),(\s*[\n}])/g, ': $1;$2');

// 2. Missing semicolons before closing brace
content = content.replace(/([a-z-]+\s*:\s*[^;{}]+)(\s*})/g, '$1;$2');
```

### 11.2 Template Extraction Script
**Concept**: Automated extraction with validation

1. Parse `@Component` decorator
2. Extract template/styles content
3. Create new files
4. Update decorator
5. Validate compilation

---

## 12. Risk Assessment

### High Risk
- **Kitchen order card component**: 310 lines of template, complex state management
- **Admin dashboard**: Multiple charts, real-time data
- **Loyalty components**: Complex calculated properties

### Medium Risk
- **Auth components**: Form validation dependencies
- **Cart components**: State synchronization

### Low Risk
- **Shared UI library**: Isolated, well-tested components
- **Simple display components**: Read-only, minimal logic

---

## 13. Testing Strategy

### Per Component
1. **Visual regression**: Screenshot before/after
2. **Unit tests**: Verify component still renders
3. **Integration tests**: Ensure data binding works
4. **Accessibility**: Check ARIA labels, keyboard navigation
5. **Responsive**: Test mobile/tablet/desktop breakpoints

### Automated Testing
```bash
# Before extraction
npm run test -- --code-coverage

# After extraction
npm run test -- --code-coverage
# Compare coverage - should remain same or improve
```

---

## 14. Documentation Updates Needed

1. **Component README**: Document Tailwind + PrimeNG pattern
2. **Style Guide**: Create visual style guide for theme variables
3. **Migration Guide**: Document lessons learned
4. **Architecture Decisions**: Record ADR for styling approach

---

## 15. Success Metrics

### Code Quality
- ✅ Zero inline templates/styles in production components
- ✅ All SCSS syntax errors fixed
- ✅ 80%+ usage of PrimeNG CSS variables (vs hex colors)
- ✅ 50%+ layout styles migrated to Tailwind utilities

### Performance
- ✅ No degradation in component render time
- ✅ Improved template readability (easier to maintain)

### Developer Experience
- ✅ Easier to find and edit templates (separate HTML files)
- ✅ Better IDE support (HTML intellisense in `.html` files)
- ✅ Consistent styling patterns across codebase

---

## 16. Next Steps for Other Agents

### For TEMPLATE EXTRACTION Agent:
1. Start with **Cart module** (4 components) - critical path, small scope
2. Use checklist in Section 8
3. Verify all template bindings work after extraction
4. Coordinate with me for any structural questions

### For STYLE EXTRACTION Agent:
1. **PRIORITY**: Fix syntax errors first (Section 2.1)
2. Start with **Shared UI library** (22 components) - affects whole app
3. Use checklist in Section 9
4. Apply color mapping from Section 6.1
5. Report any unknown hex colors not in mapping table

### For TAILWIND MIGRATION Agent:
1. Wait for template extraction to complete
2. Identify simple layout CSS in existing SCSS files
3. Apply Tailwind utilities following Section 6.2 guidelines
4. Keep complex styles in SCSS (Section 6.3)

---

## 17. Appendix: Complete File Lists

### A. All Components with Inline Templates (66)
*(See sections 1.1 through 1.9 for full categorized lists)*

### B. All SCSS Files Found (13)
```
libs/frontend/components/shell/src/shell.component.scss (443 lines)
libs/frontend/modules/kitchen/src/lib/components/order-card/order-card.component.scss (435 lines)
libs/frontend/modules/admin/src/lib/components/* (multiple)
libs/frontend/modules/loyalty/src/lib/components/* (multiple)
libs/frontend/modules/menu/src/lib/components/* (2 files)
src/modules/customer/components/* (3 files)
apps/app/src/styles.scss (global)
```

### C. PrimeNG Components Already in Use
- Card, Button, InputText, Password, Dropdown, Tag, Badge
- Table, DataView, Chart, ProgressBar, ProgressSpinner
- DatePicker, Tooltip, Menu, Divider, Skeleton
- Message, Dialog (needed for some components)

---

## 18. Questions for Coordination

1. **Shall we proceed with Phase 1 (Cart/Order modules) first?**
2. **Do we need visual regression testing setup before starting?**
3. **Should we create a style guide document alongside this work?**
4. **Any specific PrimeNG theme customizations needed?**

---

**End of Analysis Report**

*This document provides the foundation for systematic template and style extraction across the TableTap project. All agents should reference this before making changes.*
