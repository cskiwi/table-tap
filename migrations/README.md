# Database Migrations

This directory contains SQL migration scripts for the TableTap application.

## How to Run Migrations

### Development

```bash
# Using your preferred PostgreSQL client
psql -U your_user -d tabletap_dev -f migrations/001_create_cafe_hostnames.sql
```

### Production

1. Review the migration script
2. Test in staging environment first
3. Create a backup of the production database
4. Run the migration:

```bash
psql -U your_user -d tabletap_prod -f migrations/001_create_cafe_hostnames.sql
```

## Migration Files

### 001_create_cafe_hostnames.sql

**Purpose**: Adds hostname-based cafe detection support

**Changes**:
- Creates `CafeHostnames` table
- Adds indexes for performance
- Seeds localhost hostname for development
- Includes rollback script

**Dependencies**: Requires `Cafes` table to exist

## Adding New Migrations

1. Create a new file with format: `XXX_description.sql`
2. Include:
   - Date and description comments
   - CREATE/ALTER statements
   - Indexes and constraints
   - Seed data if needed
   - Rollback script as comment
3. Update this README with migration details
4. Test in development first

## Rollback

Each migration includes a commented rollback script at the bottom. To rollback:

```sql
-- For 001_create_cafe_hostnames.sql
DROP TABLE IF EXISTS "CafeHostnames";
```

## Verifying Migrations

After running migrations, verify:

```sql
-- Check table exists
\dt CafeHostnames

-- Check structure
\d "CafeHostnames"

-- Check seed data
SELECT * FROM "CafeHostnames";

-- Verify cafe relation
SELECT c.name, ch.hostname, ch."isPrimary"
FROM "Cafes" c
JOIN "CafeHostnames" ch ON c.id = ch."cafeId";
```
