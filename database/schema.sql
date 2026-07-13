-- ============================================
-- FLEET MANAGEMENT PLATFORM - CLOUDFLARE D1 DATABASE SCHEMA
-- Complete SQL Script for All Tables
-- ============================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================
-- USER ACCOUNTS & AUTHENTICATION
-- ============================================

-- User accounts table (for both regular users and platform admins)
CREATE TABLE IF NOT EXISTS user_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    company_name TEXT NOT NULL,
    onboarded INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true (SQLite boolean)
    currency TEXT NOT NULL DEFAULT 'GBP (£)',
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'platform')),
    plan TEXT NOT NULL DEFAULT 'Free' CHECK(plan IN ('Free', 'Premium', 'Enterprise')),
    joined_date TEXT NOT NULL DEFAULT (DATE('now')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Suspended')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_status ON user_accounts(status);

-- ============================================
-- FLEET MANAGEMENT CORE ENTITIES
-- ============================================

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY, -- Using TEXT ID from frontend (uid())
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    license TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reg TEXT NOT NULL, -- Registration number
    name TEXT NOT NULL, -- Vehicle name/model
    type TEXT NOT NULL, -- Vehicle type (Truck, Van, etc.)
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- Route name (e.g., "London → Paris, France")
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);

-- ============================================
-- OPERATIONAL TRANSACTIONS
-- ============================================

-- Orders/Shipments table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    driver_id TEXT,
    vehicle_id TEXT,
    route_id TEXT,
    status TEXT NOT NULL DEFAULT 'Assigned' CHECK(status IN ('Assigned', 'Completed', 'Picked up')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON orders(vehicle_id);

-- Fuel entries table
CREATE TABLE IF NOT EXISTS fuel_entries (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    driver_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    litres REAL NOT NULL,
    miles REAL NOT NULL,
    cost REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_user_id ON fuel_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_date ON fuel_entries(date);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle_id ON fuel_entries(vehicle_id);

-- Garage/Service entries table
CREATE TABLE IF NOT EXISTS garage_entries (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    driver_id TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    cost REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_garage_entries_user_id ON garage_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_garage_entries_date ON garage_entries(date);
CREATE INDEX IF NOT EXISTS idx_garage_entries_vehicle_id ON garage_entries(vehicle_id);

-- Payroll entries table
CREATE TABLE IF NOT EXISTS payroll_entries (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    week TEXT NOT NULL, -- Week identifier/range
    date TEXT NOT NULL,
    driver_id TEXT NOT NULL,
    salary REAL NOT NULL,
    bonus REAL NOT NULL DEFAULT 0,
    advance REAL NOT NULL DEFAULT 0,
    total_paid REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_user_id ON payroll_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_date ON payroll_entries(date);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_driver_id ON payroll_entries(driver_id);

-- Settlements table
CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    driver_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_settlements_user_id ON settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements(date);
CREATE INDEX IF NOT EXISTS idx_settlements_route_id ON settlements(route_id);

-- ============================================
-- CONFIGURATION & SETTINGS
-- ============================================

-- App configuration per user
CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    week_start TEXT NOT NULL DEFAULT 'Monday',
    fuel_unit TEXT NOT NULL DEFAULT 'Litres',
    currency TEXT NOT NULL DEFAULT 'GBP (£)',
    fuel_threshold TEXT NOT NULL DEFAULT '100',
    garage_threshold TEXT NOT NULL DEFAULT '500',
    revenue_target TEXT NOT NULL DEFAULT '50000',
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_config_user_id ON app_config(user_id);

-- ============================================
-- PLATFORM ADMINISTRATION TABLES
-- ============================================

-- Platform payments (subscription billing)
CREATE TABLE IF NOT EXISTS platform_payments (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    amount REAL NOT NULL,
    plan TEXT NOT NULL CHECK(plan IN ('Free', 'Premium', 'Enterprise')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Paid', 'Pending', 'Refunded', 'Failed')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_platform_payments_user_id ON platform_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_date ON platform_payments(date);
CREATE INDEX IF NOT EXISTS idx_platform_payments_status ON platform_payments(status);

-- Platform activity logs
CREATE TABLE IF NOT EXISTS platform_activity_logs (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    date TEXT NOT NULL,
    email TEXT NOT NULL,
    action TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('info', 'warning', 'danger', 'success')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_activity_logs_date ON platform_activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_platform_activity_logs_level ON platform_activity_logs(level);
CREATE INDEX IF NOT EXISTS idx_platform_activity_logs_user_id ON platform_activity_logs(user_id);

-- Platform support tickets
CREATE TABLE IF NOT EXISTS platform_tickets (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Resolved')),
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_platform_tickets_user_id ON platform_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_tickets_status ON platform_tickets(status);
CREATE INDEX IF NOT EXISTS idx_platform_tickets_date ON platform_tickets(date);

-- Platform global settings (single row table)
CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1), -- Ensure only one row
    premium_price REAL NOT NULL DEFAULT 29.99,
    enterprise_price REAL NOT NULL DEFAULT 99.99,
    maintenance_mode INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
    registration_open INTEGER NOT NULL DEFAULT 1, -- 0 = false, 1 = true
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- Insert default platform settings
INSERT OR IGNORE INTO platform_settings (id, premium_price, enterprise_price, maintenance_mode, registration_open)
VALUES (1, 29.99, 99.99, 0, 1);

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

-- User accounts timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_user_accounts_timestamp 
AFTER UPDATE ON user_accounts
BEGIN
    UPDATE user_accounts SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Drivers timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_drivers_timestamp 
AFTER UPDATE ON drivers
BEGIN
    UPDATE drivers SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Vehicles timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_vehicles_timestamp 
AFTER UPDATE ON vehicles
BEGIN
    UPDATE vehicles SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Routes timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_routes_timestamp 
AFTER UPDATE ON routes
BEGIN
    UPDATE routes SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Orders timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
AFTER UPDATE ON orders
BEGIN
    UPDATE orders SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Fuel entries timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_fuel_entries_timestamp 
AFTER UPDATE ON fuel_entries
BEGIN
    UPDATE fuel_entries SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Garage entries timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_garage_entries_timestamp 
AFTER UPDATE ON garage_entries
BEGIN
    UPDATE garage_entries SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Payroll entries timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_payroll_entries_timestamp 
AFTER UPDATE ON payroll_entries
BEGIN
    UPDATE payroll_entries SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Settlements timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_settlements_timestamp 
AFTER UPDATE ON settlements
BEGIN
    UPDATE settlements SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- App config timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_app_config_timestamp 
AFTER UPDATE ON app_config
BEGIN
    UPDATE app_config SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Platform payments timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_platform_payments_timestamp 
AFTER UPDATE ON platform_payments
BEGIN
    UPDATE platform_payments SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Platform tickets timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_platform_tickets_timestamp 
AFTER UPDATE ON platform_tickets
BEGIN
    UPDATE platform_tickets SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- Platform settings timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_platform_settings_timestamp 
AFTER UPDATE ON platform_settings
BEGIN
    UPDATE platform_settings SET updated_at = DATETIME('now') WHERE id = NEW.id;
END;

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Create a demo admin account (password should be hashed in production)
-- Password: 'admin123' (you should use bcrypt/argon2 to hash this)
INSERT OR IGNORE INTO user_accounts (email, password_hash, company_name, onboarded, role, plan, status)
VALUES ('admin@fleetmanager.com', '$2a$10$demo_hashed_password_here', 'Fleet Manager Admin', 1, 'platform', 'Enterprise', 'Active');

-- Create a demo user account
-- Password: 'demo123' (you should use bcrypt/argon2 to hash this)
INSERT OR IGNORE INTO user_accounts (email, password_hash, company_name, onboarded, role, plan, status)
VALUES ('demo@company.com', '$2a$10$demo_hashed_password_here', 'Demo Transport Ltd', 1, 'user', 'Premium', 'Active');

-- ============================================
-- VIEWS FOR COMMON QUERIES (OPTIONAL)
-- ============================================

-- View for driver performance summary
CREATE VIEW IF NOT EXISTS view_driver_performance AS
SELECT 
    d.id,
    d.user_id,
    d.name,
    d.status,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'Completed' THEN o.id END) as completed_orders,
    COALESCE(SUM(s.amount), 0) as total_revenue,
    COALESCE(SUM(p.total_paid), 0) as total_payroll
FROM drivers d
LEFT JOIN orders o ON d.id = o.driver_id
LEFT JOIN settlements s ON d.id = s.driver_id
LEFT JOIN payroll_entries p ON d.id = p.driver_id
GROUP BY d.id, d.user_id, d.name, d.status;

-- View for vehicle utilization summary
CREATE VIEW IF NOT EXISTS view_vehicle_utilization AS
SELECT 
    v.id,
    v.user_id,
    v.reg,
    v.name,
    v.status,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(f.cost), 0) as total_fuel_cost,
    COALESCE(SUM(f.litres), 0) as total_litres,
    COALESCE(SUM(f.miles), 0) as total_miles,
    COALESCE(SUM(g.cost), 0) as total_maintenance_cost
FROM vehicles v
LEFT JOIN orders o ON v.id = o.vehicle_id
LEFT JOIN fuel_entries f ON v.id = f.vehicle_id
LEFT JOIN garage_entries g ON v.id = g.vehicle_id
GROUP BY v.id, v.user_id, v.reg, v.name, v.status;

-- View for financial summary by user
CREATE VIEW IF NOT EXISTS view_financial_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.company_name,
    COALESCE(SUM(s.amount), 0) as total_revenue,
    COALESCE(SUM(f.cost), 0) as total_fuel_cost,
    COALESCE(SUM(g.cost), 0) as total_garage_cost,
    COALESCE(SUM(p.total_paid), 0) as total_payroll_cost,
    COALESCE(SUM(s.amount), 0) - (COALESCE(SUM(f.cost), 0) + COALESCE(SUM(g.cost), 0) + COALESCE(SUM(p.total_paid), 0)) as net_profit
FROM user_accounts u
LEFT JOIN settlements s ON u.id = s.user_id
LEFT JOIN fuel_entries f ON u.id = f.user_id
LEFT JOIN garage_entries g ON u.id = g.user_id
LEFT JOIN payroll_entries p ON u.id = p.user_id
WHERE u.role = 'user'
GROUP BY u.id, u.email, u.company_name;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

-- To apply this schema to your Cloudflare D1 database, run:
-- wrangler d1 execute <DATABASE_NAME> --file=database/schema.sql
