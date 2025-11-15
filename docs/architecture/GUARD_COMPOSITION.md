# Guard Composition Strategy

## Overview

This document explains the guard composition strategy used in the TableTap application for route protection.

## Design Principle: Single Responsibility Guards

We follow the **Single Responsibility Principle** for guards:

- **CafeGuard**: Validates only cafe membership (user has a valid `cafeId`)
- **RoleGuard**: Validates only role permissions (user has required role)

When both validations are needed, we **compose guards** rather than embedding one validation inside another.

## Why Composition Over Inheritance?

### ❌ Previous Approach (Avoided)

```typescript
// RoleGuard validates BOTH cafeId AND role
export class RoleGuard {
  canActivate(route) {
    // Check cafe
    if (!user.cafeId) return false;

    // Check role
    if (!hasRole) return false;

    return true;
  }
}

// Routes
{
  path: 'order',
  canActivate: [RoleGuard],  // Implicitly checks cafe
  data: { roles: ['customer'] }
}
```

**Problems:**
- ❌ Hidden behavior - not clear that cafe is validated
- ❌ Can't use RoleGuard without cafe validation
- ❌ Harder to maintain - one guard does multiple things
- ❌ Can't reorder or customize validation flow

### ✅ Current Approach (Composition)

```typescript
// CafeGuard - only validates cafe
export class CafeGuard {
  canActivate(route) {
    return user?.cafeId ? true : false;
  }
}

// RoleGuard - only validates role
export class RoleGuard {
  canActivate(route) {
    return hasRequiredRole(user, route.data.roles);
  }
}

// Routes - explicit composition
{
  path: 'order',
  canActivate: [CafeGuard, RoleGuard],  // Clear: both validations
  data: { roles: ['customer'] }
}
```

**Benefits:**
- ✅ Explicit - clear what validations run
- ✅ Flexible - can use guards independently or together
- ✅ Maintainable - each guard has one job
- ✅ Testable - test each guard in isolation
- ✅ Reusable - mix and match as needed

## Guard Execution Order

Angular runs guards in the order they appear in the `canActivate` array:

```typescript
canActivate: [CafeGuard, RoleGuard]
```

**Execution:**
1. `CafeGuard.canActivate()` runs first
   - If it returns `false`, routing stops
   - If it returns `true`, proceed to next guard
2. `RoleGuard.canActivate()` runs second
   - If it returns `false`, routing stops
   - If it returns `true`, route activates

**Order matters!** We validate cafe first because:
- More fundamental requirement (can't check role without cafe context)
- Fails faster (cheaper validation)
- Better user experience (clear error message)

## Route Protection Patterns

### Pattern 1: Public Routes

No authentication or cafe required:

```typescript
{
  path: 'auth',
  loadChildren: () => import('./auth'),
  // No guards
}
```

### Pattern 2: Cafe-Only Routes

Authentication + cafe required, any role:

```typescript
{
  path: 'menu',
  loadChildren: () => import('./menu'),
  canActivate: [CafeGuard],
}
```

**Use case:** Features available to all authenticated users in a cafe

### Pattern 3: Cafe + Role Routes

Authentication + cafe + specific role required:

```typescript
{
  path: 'order',
  loadChildren: () => import('./order'),
  canActivate: [CafeGuard, RoleGuard],
  data: { roles: ['customer'] }
}
```

**Use case:** Features restricted to specific roles within a cafe

### Pattern 4: Multi-Role Routes

Authentication + cafe + one of several roles:

```typescript
{
  path: 'kitchen',
  loadChildren: () => import('./kitchen'),
  canActivate: [CafeGuard, RoleGuard],
  data: { roles: ['kitchen_staff', 'admin'] }
}
```

**Use case:** Features accessible to multiple roles

## Adding New Guards

When adding new validation requirements, create a new guard:

```typescript
// Example: TableGuard validates user has access to specific table
export class TableGuard {
  canActivate(route) {
    const tableId = route.params['tableId'];
    return userHasAccessToTable(user, tableId);
  }
}

// Compose with existing guards
{
  path: 'table/:tableId/order',
  canActivate: [CafeGuard, TableGuard, RoleGuard],
  data: { roles: ['customer'] }
}
```

**Execution order:**
1. Validate cafe membership
2. Validate table access
3. Validate role
4. Activate route

## Testing Strategy

Each guard is tested independently:

```typescript
describe('CafeGuard', () => {
  it('should allow access when user has cafeId', () => {
    // Test only cafe validation
  });

  it('should deny access when user has no cafeId', () => {
    // Test only cafe validation
  });
});

describe('RoleGuard', () => {
  it('should allow access when user has required role', () => {
    // Test only role validation
  });

  it('should deny access when user lacks required role', () => {
    // Test only role validation
  });
});
```

Integration tests validate composition:

```typescript
describe('Order Route Protection', () => {
  it('should require both cafe and customer role', async () => {
    // Test: user without cafe cannot access
    // Test: user without role cannot access
    // Test: user with both can access
  });
});
```

## Migration Guide

If you have routes with only `RoleGuard`, update them:

### Before:
```typescript
{
  path: 'order',
  canActivate: [RoleGuard],
  data: { roles: ['customer'] }
}
```

### After:
```typescript
{
  path: 'order',
  canActivate: [CafeGuard, RoleGuard],
  data: { roles: ['customer'] }
}
```

**Why?** Makes cafe requirement explicit and easier to audit.

## Summary

✅ **Use CafeGuard** when route requires cafe membership
✅ **Use RoleGuard** when route requires specific role
✅ **Use both** when route requires both validations
✅ **Order matters** - validate fundamentals first
✅ **Keep guards focused** - one responsibility per guard
✅ **Compose freely** - mix guards as needed

This approach gives us:
- 🎯 Clarity - know what each route requires
- 🔧 Flexibility - adapt guards to new requirements
- 🧪 Testability - test each guard in isolation
- 📚 Maintainability - easy to understand and modify
