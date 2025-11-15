# Hostname-Based Cafe Detection - Implementation Summary

## What Was Changed

### 1. Database Layer

**New Entity: CafeHostname** ([libs/models/models/src/models/core/cafe/cafe-hostname.model.ts](../../libs/models/models/src/models/core/cafe/cafe-hostname.model.ts))
- Stores multiple hostnames per cafe
- Supports custom domains and subdomains
- Includes `isPrimary` and `isActive` flags

**Updated Entity: Cafe** ([libs/models/models/src/models/core/cafe/cafe.model.ts](../../libs/models/models/src/models/core/cafe/cafe.model.ts:139))
- Added `hostnames` relation (one-to-many)

### 2. Backend (GraphQL API)

**New Query: `cafeByHostname`** ([libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts](../../libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts:67))
- No authentication required
- Returns cafe details for a given hostname
- Example: `cafeByHostname(hostname: "my-cafe.tabletap.com")`

**Module Updates** ([libs/backend/graphql/src/graphql.module.ts](../../libs/backend/graphql/src/graphql.module.ts:78))
- Added `CafeHostname` to TypeORM entities
- Resolver can now access hostname lookup

### 3. Frontend - Detection Service

**CafeDetectionService** ([libs/frontend/utils/src/lib/cafe-detection.service.ts](../../libs/frontend/utils/src/lib/cafe-detection.service.ts:70))

**New Method:**
```typescript
detectCafeByHostname(): Observable<CafeInfo | null>
```

- Queries GraphQL API with current hostname
- Returns full cafe information
- Works on both client and server side
- Handles errors gracefully

**Deprecated Method:**
```typescript
detectVisitingCafeId(): string | null  // Now only returns env var
```

### 4. Frontend - Route Guard

**CafeGuard** ([libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts](../../libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts:43))

**Old Behavior:**
- ✗ Required user authentication
- ✗ Checked `user.cafeId` permissions
- ✗ Validated user could access cafe

**New Behavior:**
- ✓ Detects cafe from hostname
- ✓ Injects cafe info into `route.data`
- ✓ Independent of authentication
- ✓ Permissions handled by `RoleGuard`

**What's Available in Route Data:**
```typescript
route.snapshot.data['cafeId']  // string
route.snapshot.data['cafe']    // CafeInfo object
```

### 5. Frontend - Components

**MenuDisplayComponent** ([libs/frontend/modules/menu/src/lib/components/menu-display.component.ts](../../libs/frontend/modules/menu/src/lib/components/menu-display.component.ts:62))

```typescript
import { injectRouteData } from 'ngxtension/inject-route-data';

// Before
readonly cafeId = computed(() => {
  const user = this.authService.state.user();
  return user?.cafeId ?? '';
});

// After
readonly cafeId = injectRouteData<string>('cafeId');
```

**StaffAssignmentDialogComponent** ([libs/frontend/modules/kitchen/src/lib/components/staff-assignment-dialog/staff-assignment-dialog.component.ts](../../libs/frontend/modules/kitchen/src/lib/components/staff-assignment-dialog/staff-assignment-dialog.component.ts:62))

Same pattern - uses `injectRouteData('cafeId')` instead of `user.cafeId`.

## How It Works

### Flow Diagram

```
1. User visits URL
   ↓
   my-cafe.tabletap.com/menu

2. CafeGuard activates
   ↓
   detectCafeByHostname()
   ↓
   GraphQL: cafeByHostname(hostname: "my-cafe.tabletap.com")
   ↓
   Returns: { id: "cafe-123", name: "My Cafe", ... }
   ↓
   Stores in route.data

3. Component renders
   ↓
   route.snapshot.data['cafeId']
   ↓
   Uses "cafe-123" for all queries
```

### Example Usage

**In any component protected by CafeGuard:**

```typescript
import { inject } from '@angular/core';
import { injectRouteData } from 'ngxtension/inject-route-data';

export class MyComponent {
  // Recommended approach - reactive signal
  readonly cafeId = injectRouteData<string>('cafeId');
  readonly cafe = injectRouteData<CafeInfo>('cafe');

  ngOnInit() {
    // Use cafe info
    console.log(this.cafe().name, this.cafe().logo);

    // Use in GraphQL queries
    this.apollo.query({
      query: GET_MENU,
      variables: { cafeId: this.cafeId() }
    });
  }
}

// Alternative: Direct access (not reactive)
export class MyOtherComponent {
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    const cafeId = this.route.snapshot.data['cafeId'];
    const cafe = this.route.snapshot.data['cafe'];
  }
}
```

## Database Migration

### Run Migration

```bash
# Development
psql -U postgres -d tabletap_dev -f migrations/001_create_cafe_hostnames.sql

# Production (after testing!)
psql -U postgres -d tabletap_prod -f migrations/001_create_cafe_hostnames.sql
```

### Seed Your Cafes

```sql
-- For each cafe, add hostname entries
INSERT INTO "CafeHostnames" ("hostname", "isPrimary", "cafeId")
VALUES
  ('localhost:4200', TRUE, 'your-dev-cafe-id'),
  ('my-cafe.tabletap.com', TRUE, 'production-cafe-id'),
  ('custom-domain.com', FALSE, 'production-cafe-id');
```

### Verify Migration

```sql
-- Check table structure
\d "CafeHostnames"

-- View hostname mappings
SELECT c.name, ch.hostname, ch."isPrimary", ch."isActive"
FROM "Cafes" c
JOIN "CafeHostnames" ch ON c.id = ch."cafeId"
ORDER BY c.name, ch."isPrimary" DESC;
```

## Testing Checklist

### Backend Tests

- [ ] Query `cafeByHostname` with valid hostname
- [ ] Query with invalid hostname (should return null)
- [ ] Query with inactive hostname (should return null)
- [ ] Verify no authentication required
- [ ] Test with multiple hostnames for same cafe

### Frontend Tests

- [ ] CafeDetectionService detects cafe correctly
- [ ] CafeGuard injects data into route
- [ ] Components can access `route.data['cafeId']`
- [ ] Menu loads with correct cafe
- [ ] Kitchen features work with route-based cafe
- [ ] Test on localhost:4200
- [ ] Test with different subdomains (if available)

### Integration Tests

```typescript
describe('Hostname-based Cafe Detection', () => {
  it('should detect cafe from hostname', async () => {
    // Mock hostname
    Object.defineProperty(window, 'location', {
      value: { hostname: 'test-cafe.tabletap.com' }
    });

    // Trigger detection
    const cafe = await service.detectCafeByHostname().toPromise();

    // Verify
    expect(cafe).toBeTruthy();
    expect(cafe.id).toBe('expected-cafe-id');
  });

  it('should inject cafe into route data', async () => {
    const result = await guard.canActivate(route, state).toPromise();

    expect(result).toBe(true);
    expect(route.data['cafeId']).toBeDefined();
    expect(route.data['cafe']).toBeDefined();
  });
});
```

## Benefits

✅ **Multi-Tenancy**: One deployment serves many cafes
✅ **Custom Domains**: Each cafe can have unique URLs
✅ **Pre-Auth Detection**: Works before user logs in
✅ **Flexible Routing**: Subdomain-based (cafe.tabletap.com)
✅ **Better UX**: Automatic cafe selection from URL
✅ **Decoupled**: Cafe detection separate from permissions

## Breaking Changes

### Components Using `user.cafeId`

**All components that used:**
```typescript
user.cafeId or user?.cafeId
```

**Must now use (recommended):**
```typescript
import { injectRouteData } from 'ngxtension/inject-route-data';

readonly cafeId = injectRouteData<string>('cafeId');
```

**Or (alternative):**
```typescript
readonly cafeId = computed(() => this.route.snapshot.data['cafeId']);
```

**Components Updated:**
- [x] MenuDisplayComponent
- [x] StaffAssignmentDialogComponent
- [ ] Any other components using `user.cafeId` (search codebase)

### Guard Behavior

**CafeGuard no longer:**
- Checks user authentication (use AuthGuard for that)
- Validates user permissions (use RoleGuard for that)
- Compares user.cafeId with visiting cafe

**CafeGuard now only:**
- Detects cafe from hostname
- Injects cafe data into route
- Redirects if no cafe found for hostname

## Troubleshooting

### "No cafe found for hostname"

1. Check database: `SELECT * FROM "CafeHostnames" WHERE hostname = 'your-hostname';`
2. Verify `isActive = true`
3. Match exact hostname (including port for localhost)
4. Test GraphQL query in playground

### "cafeId not in route.data"

1. Verify `CafeGuard` in route's `canActivate`
2. Check guard execution logs
3. Ensure guard returns `true`
4. Verify route hierarchy (parent routes)

### Localhost Issues

1. Add entry: `INSERT INTO "CafeHostnames" VALUES ('localhost:4200', TRUE, TRUE, 'cafe-id');`
2. Include port number
3. Check case sensitivity
4. Verify GraphQL endpoint accessible

## Files Modified

### Database/Models
- `libs/models/models/src/models/core/cafe/cafe-hostname.model.ts` (NEW)
- `libs/models/models/src/models/core/cafe/cafe.model.ts` (MODIFIED)
- `libs/models/models/src/models/core/cafe/index.ts` (MODIFIED)

### Backend
- `libs/backend/graphql/src/resolvers/restaurant/cafe.resolver.ts` (MODIFIED)
- `libs/backend/graphql/src/graphql.module.ts` (MODIFIED)

### Frontend - Services
- `libs/frontend/utils/src/lib/cafe-detection.service.ts` (MODIFIED)
- `libs/frontend/utils/src/index.ts` (MODIFIED)
- `libs/frontend/modules/cafe/src/lib/services/cafe.service.ts` (NEW)
- `libs/frontend/modules/cafe/src/lib/graphql/cafe.queries.ts` (NEW)
- `libs/frontend/modules/cafe/src/index.ts` (NEW)

### Frontend - Guards
- `libs/frontend/modules/auth/guard/src/lib/cafe.guard.ts` (MODIFIED)

### Frontend - Components
- `libs/frontend/modules/menu/src/lib/components/menu-display.component.ts` (MODIFIED)
- `libs/frontend/modules/kitchen/src/lib/components/staff-assignment-dialog/staff-assignment-dialog.component.ts` (MODIFIED)

### Documentation
- `docs/architecture/HOSTNAME_CAFE_DETECTION.md` (NEW)
- `docs/architecture/HOSTNAME_CAFE_IMPLEMENTATION_SUMMARY.md` (NEW)

### Migrations
- `migrations/001_create_cafe_hostnames.sql` (NEW)
- `migrations/README.md` (NEW)

## Next Steps

1. **Run Migration**: Execute `001_create_cafe_hostnames.sql`
2. **Seed Hostnames**: Add hostname entries for your cafes
3. **Test Locally**: Verify localhost:4200 works
4. **Search for user.cafeId**: Find any remaining usages
5. **Update Tests**: Add tests for hostname detection
6. **Deploy**: Test in staging before production
7. **Monitor**: Watch logs for any cafe detection issues

## Questions?

See [HOSTNAME_CAFE_DETECTION.md](./HOSTNAME_CAFE_DETECTION.md) for detailed architecture documentation.
