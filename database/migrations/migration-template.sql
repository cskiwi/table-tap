-- =====================================================
-- MIGRATION XXX: [DESCRIPTION]
-- Version: X.X.X
-- Date: YYYY-MM-DD
-- Description: [Detailed description of changes]
-- Dependencies: [List of required migrations]
-- =====================================================

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 'XXX') THEN
        RAISE NOTICE 'Migration XXX has already been applied. Skipping.';
        RETURN;
    END IF;
END $$;

-- Begin transaction for migration
BEGIN;

-- =====================================================
-- MIGRATION STEPS
-- =====================================================

-- Step 1: [Description]
-- [SQL statements]

-- Step 2: [Description]
-- [SQL statements]

-- Step 3: [Description]
-- [SQL statements]

-- =====================================================
-- DATA MIGRATION (if needed)
-- =====================================================

-- Update existing data if necessary
-- [SQL statements for data migration]

-- =====================================================
-- REGISTER MIGRATION
-- =====================================================

-- Record this migration with rollback script
INSERT INTO schema_migrations (version, description, rollback_sql) VALUES
('XXX', '[Description]', $$
-- Rollback script for migration XXX
-- [Rollback SQL statements in reverse order]
DELETE FROM schema_migrations WHERE version = 'XXX';
$$);

-- Commit the migration
COMMIT;

-- =====================================================
-- POST-MIGRATION TASKS
-- =====================================================

-- Update statistics
ANALYZE;

-- Vacuum if needed
-- VACUUM ANALYZE;