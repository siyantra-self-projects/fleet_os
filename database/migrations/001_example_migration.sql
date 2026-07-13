-- ============================================
-- MIGRATION: 001 - Example Migration Template
-- Date: 2024-01-15
-- Description: This is a template for future database migrations
-- ============================================

-- Example: Adding a new column to an existing table
-- ALTER TABLE drivers ADD COLUMN emergency_contact TEXT;

-- Example: Creating a new table
-- CREATE TABLE IF NOT EXISTS driver_licenses (
--     id TEXT PRIMARY KEY,
--     driver_id TEXT NOT NULL,
--     license_number TEXT NOT NULL,
--     license_type TEXT NOT NULL,
--     issue_date TEXT NOT NULL,
--     expiry_date TEXT NOT NULL,
--     created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
--     FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
-- );

-- Example: Creating an index
-- CREATE INDEX IF NOT EXISTS idx_driver_licenses_driver_id ON driver_licenses(driver_id);

-- Example: Updating existing data
-- UPDATE drivers SET status = 'Active' WHERE status IS NULL;

-- Example: Adding a constraint (SQLite doesn't support ADD CONSTRAINT, so recreate table)
-- Note: For complex constraints, you need to:
-- 1. Create new table with constraint
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- To apply this migration:
-- wrangler d1 execute fleet_os --file=database/migrations/001_example_migration.sql

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- Document rollback steps here in comments
-- DROP TABLE IF EXISTS driver_licenses;
-- ALTER TABLE drivers DROP COLUMN emergency_contact; -- Note: SQLite doesn't support DROP COLUMN directly
