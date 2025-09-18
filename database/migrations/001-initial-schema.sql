-- =====================================================
-- MIGRATION 001: INITIAL SCHEMA
-- Version: 1.0.0
-- Date: 2024-01-01
-- Description: Initial database schema for restaurant ordering system
-- =====================================================

-- Migration metadata
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rollback_sql TEXT
);

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_sql) VALUES
('001', 'Initial schema creation', $$
-- Rollback script for migration 001
DROP TABLE IF EXISTS schema_migrations CASCADE;
-- Add other rollback statements as needed
$$);

-- =====================================================
-- EXECUTE SCHEMA CREATION SCRIPTS
-- =====================================================

-- Core entities
\i '../schema/01-core-entities.sql'

-- Payments and transactions
\i '../schema/02-payments-transactions.sql'

-- Inventory management
\i '../schema/03-inventory-management.sql'

-- Employee management
\i '../schema/04-employee-management.sql'

-- Configuration and settings
\i '../schema/05-configuration-settings.sql'

-- Audit and logging
\i '../schema/06-audit-logging.sql'

-- Indexes and performance
\i '../schema/07-indexes-performance.sql'

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

-- Update migration record
UPDATE schema_migrations
SET applied_at = NOW()
WHERE version = '001';