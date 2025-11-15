# Hostname-Based Cafe Detection Architecture

## Overview

The TableTap application now supports hostname-based cafe detection, allowing a single deployment to serve multiple cafes based on the hostname/domain being accessed. This replaces the previous user-permission-based approach where the cafe was determined from `user.cafeId`.

## Architecture Changes

### Database Schema

#### New Entity: CafeHostname

A new `CafeHostnames` table has been added to support multiple hostnames per cafe:

```typescript
{
  id: string (UUID)
  hostname: string (unique)
  isPrimary: boolean
  isActive: boolean
  cafeId: string (FK to Cafes)
  createdAt: Date
  updatedAt: Date
}
```

**Examples:**
- `{ hostname: 'my-cafe.tabletap.com', isPrimary: true, cafeId: 'cafe-123' }`
- `{ hostname: 'mycafe.com', isPrimary: false, cafeId: 'cafe-123' }`
- `{ hostname: 'localhost:4200', isPrimary: false, cafeId: 'cafe-dev' }` (for development)

#### Updated Entity: Cafe

The `Cafe` model now includes a `hostnames` relation:

```typescript
@OneToMany(() => CafeHostname, (hostname) => hostname.cafe, { cascade: true })
declare hostnames: Relation<CafeHostname[]>;
```

### Backend Changes

#### GraphQL Resolver

**New Query: `cafeByHostname`**

Location: [libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts](../../libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts:67)

```graphql
query GetCafeByHostname($hostname: String!) {
  cafeByHostname(hostname: $hostname) {
    id
    name
    description
    slug
    logo
    # ... other fields
  }
}
```

This query does NOT require authentication, allowing cafe detection before user login.

#### Module Configuration

Location: [libs/backend/graphql/src/graphql.module.ts](../../libs/backend/graphql/src/graphql.module.ts:78)

- Added `CafeHostname` entity to TypeORM configuration
- Updated imports to include `CafeHostname` from `@app/models`

### Frontend Changes

#### CafeDetectionService

Location: [libs/frontend/utils/src/lib/cafe-detection.service.ts](../../libs/frontend/utils/src/lib/cafe-detection.service.ts:70)

**New Method: `detectCafeByHostname()`**

```typescript
// Old approach (environment-based)
detectVisitingCafeId(): string | null

// New approach (hostname-based with GraphQL)
detectCafeByHostname(): Observable<CafeInfo | null>
```

The new method:
1. Gets the current hostname from `window.location.hostname`
2. Queries the GraphQL API with the hostname
3. Returns the full cafe information (not just ID)
4. Works on both client and server side

#### CafeGuard

Location: [libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts](../../libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts:43)

**Major Behavior Change:**

**Before:**
- Checked user authentication
- Validated `user.cafeId` matched visiting cafe
- Redirected if mismatch

**After:**
- Detects cafe from hostname via GraphQL
- Stores cafe info in route data
- No longer validates user permissions (handled by RoleGuard)
- Independent of authentication status

**Route Data Injection:**

```typescript
route.data = {
  ...route.data,
  cafe: { id, name, description, ... },
  cafeId: 'cafe-123'
};
```

#### Component Updates

All components that previously used `user.cafeId` now use `injectRouteData('cafeId')`:

1. **MenuDisplayComponent**
   Location: [libs/frontend/modules/menu/src/lib/components/menu-display.component.ts](../../libs/frontend/modules/menu/src/lib/components/menu-display.component.ts:62)

   ```typescript
   import { injectRouteData } from 'ngxtension/inject-route-data';

   // Before
   readonly cafeId = computed(() => this.authService.state.user()?.cafeId);

   // After
   readonly cafeId = injectRouteData<string>('cafeId');
   ```

2. **StaffAssignmentDialogComponent**
   Location: [libs/frontend/modules/kitchen/src/lib/components/staff-assignment-dialog/staff-assignment-dialog.component.ts](../../libs/frontend/modules/kitchen/src/lib/components/staff-assignment-dialog/staff-assignment-dialog.component.ts:62)

   Same pattern as MenuDisplayComponent.

## Data Flow

### 1. Request Arrives
```
User visits: my-cafe.tabletap.com/menu
```

### 2. CafeGuard Activation
```typescript
CafeGuard.canActivate()
  → CafeDetectionService.detectCafeByHostname()
  → GraphQL: cafeByHostname(hostname: "my-cafe.tabletap.com")
  → Returns: { id: "cafe-123", name: "My Cafe", ... }
  → Stores in route.data
```

### 3. Component Access
```typescript
MenuDisplayComponent
  → injectRouteData<string>('cafeId')
  → Returns: 'cafe-123'
  → Uses for menu queries
```

## Migration Guide

### Database Migration

**Step 1: Create the CafeHostnames table**

```sql
CREATE TABLE "CafeHostnames" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "hostname" VARCHAR UNIQUE NOT NULL,
  "isPrimary" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "cafeId" UUID NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP,
  FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_cafehostnames_hostname" ON "CafeHostnames"("hostname");
CREATE INDEX "idx_cafehostnames_cafeId" ON "CafeHostnames"("cafeId");
```

**Step 2: Seed with existing cafes**

```sql
-- For each existing cafe, create a hostname entry
-- Example for development:
INSERT INTO "CafeHostnames" ("hostname", "isPrimary", "cafeId")
SELECT 'localhost:4200', TRUE, id
FROM "Cafes"
WHERE slug = 'default-cafe';

-- For production cafes:
INSERT INTO "CafeHostnames" ("hostname", "isPrimary", "cafeId")
VALUES
  ('my-cafe.tabletap.com', TRUE, 'cafe-uuid-here'),
  ('custom-domain.com', FALSE, 'cafe-uuid-here');
```

### Code Migration Checklist

- [x] Update `Cafe` model with `hostnames` relation
- [x] Create `CafeHostname` entity model
- [x] Add `cafeByHostname` resolver
- [x] Update GraphQL module to include `CafeHostname`
- [x] Update `CafeDetectionService` with GraphQL query
- [x] Refactor `CafeGuard` to use hostname detection
- [x] Update components to use route data instead of user.cafeId
- [ ] Run database migration
- [ ] Seed hostname data for existing cafes
- [ ] Test with multiple hostnames

## Development Setup

### Environment Variables

For local development, you can still use environment-based detection:

**.env.local**
```bash
# Legacy support for environment-based detection
NEXT_PUBLIC_CAFE_ID=cafe-dev-id
```

### Localhost Hostname

Add a hostname entry for localhost:

```sql
INSERT INTO "CafeHostnames" ("hostname", "isPrimary", "cafeId")
VALUES ('localhost:4200', TRUE, 'your-dev-cafe-id');
```

## Benefits

1. **Multi-tenancy Support**: Single deployment serves multiple cafes
2. **Custom Domains**: Each cafe can have custom domains
3. **Decoupled from Auth**: Cafe detection works before authentication
4. **Flexible Routing**: Subdomain-based routing (cafe-name.tabletap.com)
5. **Better UX**: Users automatically see the correct cafe based on URL

## Testing

### Unit Tests

```typescript
// Test CafeDetectionService
it('should detect cafe by hostname', (done) => {
  service.detectCafeByHostname().subscribe(cafe => {
    expect(cafe.id).toBe('expected-cafe-id');
    expect(cafe.name).toBe('Expected Cafe Name');
    done();
  });
});

// Test CafeGuard
it('should inject cafe into route data', (done) => {
  guard.canActivate(route, state).subscribe(result => {
    expect(result).toBe(true);
    expect(route.data['cafeId']).toBeDefined();
    expect(route.data['cafe']).toBeDefined();
    done();
  });
});
```

### Integration Tests

1. Start app on different hostnames
2. Verify correct cafe loads for each hostname
3. Test menu, cart, orders work with hostname-detected cafe
4. Verify user permissions still work with RoleGuard

## Troubleshooting

### "No cafe found for hostname"

**Problem**: CafeGuard logs "No cafe detected for current hostname"

**Solutions**:
1. Check `CafeHostnames` table has entry for the hostname
2. Verify hostname exactly matches (including port for localhost)
3. Check `isActive` is `true` in database
4. Verify GraphQL resolver is working: test `cafeByHostname` query in playground

### "cafeId not in route data"

**Problem**: Components can't find `cafeId` in route.snapshot.data

**Solutions**:
1. Verify route has `CafeGuard` in `canActivate` array
2. Check guard is executing before component loads
3. Confirm guard is returning `true` (not redirecting)
4. Check browser console for CafeGuard logs

### Development hostname not working

**Problem**: localhost detection fails

**Solutions**:
1. Add hostname entry: `INSERT INTO "CafeHostnames" VALUES ('localhost:4200', ...)`
2. Use exact match including port number
3. Check GraphQL API is accessible from frontend

## Related Files

- [libs/models/models/src/models/core/cafe/cafe-hostname.model.ts](../../libs/models/models/src/models/core/cafe/cafe-hostname.model.ts)
- [libs/models/models/src/models/core/cafe/cafe.model.ts](../../libs/models/models/src/models/core/cafe/cafe.model.ts:139)
- [libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts](../../libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts:67)
- [libs/frontend/utils/src/lib/cafe-detection.service.ts](../../libs/frontend/utils/src/lib/cafe-detection.service.ts:70)
- [libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts](../../libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts:43)
- [apps/app/config/app.routes.ts](../../apps/app/config/app.routes.ts:13)

## Next Steps

1. Run database migration to create `CafeHostnames` table
2. Seed hostname data for existing cafes
3. Test with multiple hostnames in development
4. Update CI/CD to handle hostname-based routing
5. Document hostname configuration for new cafes
