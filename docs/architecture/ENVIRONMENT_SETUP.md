# Environment Configuration Guide

## Overview

TableTap supports multiple methods for cafe detection to accommodate different deployment scenarios. This guide explains how to configure your environment for local development and production deployments.

## Cafe Detection Priority

The system detects which cafe to load using the following priority order:

1. **Environment Variable** (`NEXT_PUBLIC_CAFE_ID`) - Highest priority
2. **Hostname Detection** (subdomain extraction)
3. **User's Current Cafe** (`currentCafeId` field)
4. **User's Default Cafe** (`cafeId` field or first cafe in `cafes` array)

## Local Development Setup

### Method 1: Environment Variable (Recommended)

For localhost testing, set the `NEXT_PUBLIC_CAFE_ID` environment variable:

#### Step 1: Create `.env.local` file

```bash
# In project root
cp .env.example .env.local
```

#### Step 2: Set cafe ID

```env
# .env.local
NEXT_PUBLIC_CAFE_ID=your-cafe-uuid-here
```

**How to get your cafe UUID:**

```bash
# Connect to your database
psql postgresql://user:password@localhost:5432/tabletap

# Query for cafe IDs
SELECT id, name, slug FROM "Cafes";
```

#### Step 3: Restart development server

```bash
npm run dev
```

**Benefits:**
- ✅ Fast testing of specific cafes
- ✅ No need to modify hosts file
- ✅ Easy to switch between cafes
- ✅ Works on any port (localhost:4200, localhost:3000, etc.)

### Method 2: Hostname Subdomain (Advanced)

For testing hostname-based detection locally, you need to configure DNS:

#### Step 1: Edit hosts file

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux:** `/etc/hosts`

Add entries:

```
127.0.0.1   my-cafe.localhost
127.0.0.1   another-cafe.localhost
```

#### Step 2: Access via subdomain

```
http://my-cafe.localhost:4200
```

The system will extract `my-cafe` as the cafe slug and look up the corresponding cafe.

**Limitations:**
- ⚠️ Requires admin/sudo to edit hosts file
- ⚠️ Subdomain must match a cafe's `slug` field in database
- ⚠️ More complex setup for simple testing

## Production Deployment

### Subdomain-Based Multi-Tenancy

In production, cafe detection happens automatically via hostname:

**Example hostnames:**

```
https://starbucks-downtown.tabletap.com  → slug: "starbucks-downtown"
https://joes-diner.tabletap.com          → slug: "joes-diner"
https://cafe-centrale.tabletap.com       → slug: "cafe-centrale"
```

**How it works:**

1. User visits `https://my-cafe.tabletap.com`
2. `CafeDetectionService.extractSubdomain()` extracts `my-cafe`
3. System looks up cafe where `slug = 'my-cafe'`
4. If found, user is associated with that cafe
5. If not found, falls back to user's `currentCafeId` or default cafe

**Ignored subdomains:**

These subdomains are reserved and will NOT be treated as cafe slugs:
- `www`
- `app`
- `admin`
- `api`
- `staging`
- `dev`

### Custom Domain Mapping (Future Feature)

**Status:** Not yet implemented

Custom domains like `www.mycafe.com` will be supported in future releases through a domain mapping table.

## Multi-Cafe User Support

Users can belong to multiple cafes with the following model:

```typescript
interface User {
  // Deprecated - single cafe (backward compatibility)
  cafeId?: string;
  cafe?: Cafe;

  // Current active cafe
  currentCafeId?: string;
  currentCafe?: Cafe;

  // All cafes user belongs to (future - requires migration)
  cafes?: Cafe[];
}
```

### Switching Between Cafes

**Current Implementation:**

Users are associated with a single cafe via `cafeId` or `currentCafeId`. Hostname detection allows accessing different cafes.

**Future Implementation:**

Users will have a `cafes` array (many-to-many) and can switch between them via:
1. Hostname (automatic)
2. Cafe switcher UI component
3. API endpoint to set `currentCafeId`

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_CAFE_ID` | Override cafe detection for testing | No | `null` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |
| `API_URL` | GraphQL API endpoint | No | `/graphql` |

## Testing Cafe Detection

### Test Environment Variable Detection

```bash
# Set cafe ID
export NEXT_PUBLIC_CAFE_ID=cafe-uuid-123

# Start dev server
npm run dev

# Visit localhost:4200
# Should load cafe-uuid-123 regardless of hostname
```

### Test Hostname Detection

```bash
# Edit hosts file (Mac/Linux)
sudo nano /etc/hosts

# Add: 127.0.0.1 my-cafe.localhost

# Visit http://my-cafe.localhost:4200
# Should look up cafe with slug "my-cafe"
```

### Test User Fallback

```bash
# Don't set NEXT_PUBLIC_CAFE_ID
# Visit http://localhost:4200

# Should use user.currentCafeId or user.cafeId
```

## Troubleshooting

### Issue: "No cafeId could be detected"

**Possible causes:**
1. User has no `cafeId` or `currentCafeId` set
2. Hostname subdomain doesn't match any cafe slug
3. Environment variable is not set

**Solutions:**

```bash
# Check user's cafe assignment
SELECT id, "firstName", "lastName", "cafeId", "currentCafeId"
FROM "Users"
WHERE id = 'your-user-id';

# Check cafe slugs
SELECT id, name, slug FROM "Cafes";

# Verify environment variable
echo $NEXT_PUBLIC_CAFE_ID
```

### Issue: "CafeGuard redirecting to home"

**Cause:** User doesn't have access to detected cafe

**Solution:**

```sql
-- Assign user to cafe
UPDATE "Users"
SET "cafeId" = 'cafe-uuid-here'
WHERE id = 'user-uuid-here';
```

### Issue: Hostname detection not working locally

**Cause:** Hostname is `localhost` (no subdomain)

**Solutions:**
1. Use `NEXT_PUBLIC_CAFE_ID` environment variable (easier)
2. Edit hosts file and use `my-cafe.localhost` (advanced)

## Database Migration

### Adding Multi-Cafe Support

To enable many-to-many cafe relationships:

```sql
-- Step 1: Add currentCafeId column
ALTER TABLE "Users"
ADD COLUMN "currentCafeId" UUID;

-- Step 2: Migrate existing data
UPDATE "Users"
SET "currentCafeId" = "cafeId"
WHERE "cafeId" IS NOT NULL;

-- Step 3: Make cafeId nullable (backward compatibility)
ALTER TABLE "Users"
ALTER COLUMN "cafeId" DROP NOT NULL;

-- Step 4: Create join table for many-to-many (future)
CREATE TABLE "UserCafes" (
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "cafeId" UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
  "role" VARCHAR(50) DEFAULT 'customer',
  "joinedAt" TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY ("userId", "cafeId")
);

-- Step 5: Create index for performance
CREATE INDEX "idx_user_cafes_user" ON "UserCafes"("userId");
CREATE INDEX "idx_user_cafes_cafe" ON "UserCafes"("cafeId");
```

## Security Considerations

### Environment Variable Security

⚠️ **IMPORTANT:** Never commit `.env.local` to version control!

```bash
# .gitignore should include:
.env.local
.env*.local
```

### Hostname Validation

The system validates hostnames to prevent subdomain injection:

```typescript
// Ignored subdomains (won't be treated as cafes)
const ignoredSubdomains = ['www', 'app', 'admin', 'api', 'staging', 'dev'];
```

### Cafe Access Control

Even if a cafe is detected, the backend still validates:
1. User has permission to access the cafe
2. Cafe exists and is active
3. User's role allows the requested operation

See `@RequireCafeAccess` decorator in GraphQL resolvers.

## Related Documentation

- [Cafe Loading Architecture](./cafe-loading-architecture.md)
- [Guard Composition Strategy](./GUARD_COMPOSITION.md)
- [Authentication Flow](../authentication/README.md)

## Support

If you encounter issues with cafe detection:

1. Check console logs for `[CafeDetection]` messages
2. Verify database cafe records and user assignments
3. Test with `NEXT_PUBLIC_CAFE_ID` environment variable
4. Review this documentation for troubleshooting steps
