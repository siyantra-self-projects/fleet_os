-- ============================================
-- FLEET MANAGEMENT PLATFORM - SEED DATA
-- Sample Data for Testing and Development
-- ============================================

-- Note: In production, use proper password hashing (bcrypt, argon2)
-- These are example hashed passwords: 'password123'
-- Hash generated with: bcrypt.hash('password123', 10)

-- ============================================
-- USER ACCOUNTS
-- ============================================

-- Platform Admin Account
INSERT OR IGNORE INTO user_accounts (id, email, password_hash, company_name, onboarded, currency, role, plan, status)
VALUES (1, 'admin@fleetmanager.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Fleet Manager Platform', 1, 'GBP (£)', 'platform', 'Enterprise', 'Active');

-- Demo Company 1: UK Transport Company
INSERT OR IGNORE INTO user_accounts (id, email, password_hash, company_name, onboarded, currency, role, plan, status)
VALUES (2, 'james@uktransport.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'UK Transport Ltd', 1, 'GBP (£)', 'user', 'Premium', 'Active');

-- Demo Company 2: Euro Logistics
INSERT OR IGNORE INTO user_accounts (id, email, password_hash, company_name, onboarded, currency, role, plan, status)
VALUES (3, 'maria@eurologistics.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Euro Logistics GmbH', 1, 'EUR (€)', 'user', 'Enterprise', 'Active');

-- Demo Company 3: Free Plan User
INSERT OR IGNORE INTO user_accounts (id, email, password_hash, company_name, onboarded, currency, role, plan, status)
VALUES (4, 'john@smallfleet.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Small Fleet Services', 1, 'USD ($)', 'user', 'Free', 'Active');

-- ============================================
-- APP CONFIGURATION
-- ============================================

INSERT OR IGNORE INTO app_config (user_id, week_start, fuel_unit, currency, fuel_threshold, garage_threshold, revenue_target)
VALUES 
  (2, 'Monday', 'Litres', 'GBP (£)', '120', '600', '75000'),
  (3, 'Monday', 'Litres', 'EUR (€)', '100', '500', '80000'),
  (4, 'Monday', 'Gallons', 'USD ($)', '100', '400', '50000');

-- ============================================
-- DRIVERS (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO drivers (id, user_id, name, phone, license, status) VALUES
  ('drv_001', 2, 'John Smith', '+44 7700 900001', 'GB123456789', 'Active'),
  ('drv_002', 2, 'Emma Wilson', '+44 7700 900002', 'GB987654321', 'Active'),
  ('drv_003', 2, 'Michael Brown', '+44 7700 900003', 'GB456789123', 'Active'),
  ('drv_004', 2, 'Sarah Davis', '+44 7700 900004', 'GB789123456', 'Inactive'),
  ('drv_005', 2, 'David Johnson', '+44 7700 900005', 'GB321654987', 'Active');

-- ============================================
-- VEHICLES (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO vehicles (id, user_id, reg, name, type, status) VALUES
  ('veh_001', 2, 'LB23 XYZ', 'Scania R450', 'Truck', 'Active'),
  ('veh_002', 2, 'LB23 ABC', 'Volvo FH16', 'Truck', 'Active'),
  ('veh_003', 2, 'LB22 DEF', 'Mercedes Actros', 'Truck', 'Active'),
  ('veh_004', 2, 'LB21 GHI', 'DAF XF', 'Truck', 'Inactive'),
  ('veh_005', 2, 'LB23 JKL', 'MAN TGX', 'Truck', 'Active');

-- ============================================
-- ROUTES (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO routes (id, user_id, name) VALUES
  ('rte_001', 2, 'London → Paris, France'),
  ('rte_002', 2, 'Manchester → Berlin, Germany'),
  ('rte_003', 2, 'Birmingham → Amsterdam, Netherlands'),
  ('rte_004', 2, 'Glasgow → Brussels, Belgium'),
  ('rte_005', 2, 'London → Madrid, Spain'),
  ('rte_006', 2, 'Liverpool → Rome, Italy');

-- ============================================
-- ORDERS (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO orders (id, user_id, date, driver_id, vehicle_id, route_id, status) VALUES
  ('ord_001', 2, '2024-01-15', 'drv_001', 'veh_001', 'rte_001', 'Completed'),
  ('ord_002', 2, '2024-01-16', 'drv_002', 'veh_002', 'rte_002', 'Completed'),
  ('ord_003', 2, '2024-01-18', 'drv_003', 'veh_003', 'rte_003', 'Completed'),
  ('ord_004', 2, '2024-01-20', 'drv_001', 'veh_001', 'rte_004', 'Completed'),
  ('ord_005', 2, '2024-01-22', 'drv_005', 'veh_005', 'rte_005', 'Completed'),
  ('ord_006', 2, '2024-01-25', 'drv_002', 'veh_002', 'rte_001', 'Assigned'),
  ('ord_007', 2, '2024-01-26', 'drv_003', 'veh_003', 'rte_002', 'Assigned'),
  ('ord_008', 2, '2024-01-27', 'drv_001', 'veh_001', 'rte_006', 'Picked up');

-- ============================================
-- FUEL ENTRIES (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO fuel_entries (id, user_id, date, driver_id, vehicle_id, route_id, litres, miles, cost) VALUES
  ('fuel_001', 2, '2024-01-15', 'drv_001', 'veh_001', 'rte_001', 85.5, 340, 145.35),
  ('fuel_002', 2, '2024-01-16', 'drv_002', 'veh_002', 'rte_002', 92.0, 380, 156.40),
  ('fuel_003', 2, '2024-01-16', 'drv_001', 'veh_001', 'rte_001', 78.3, 315, 133.11),
  ('fuel_004', 2, '2024-01-18', 'drv_003', 'veh_003', 'rte_003', 88.7, 355, 150.79),
  ('fuel_005', 2, '2024-01-20', 'drv_001', 'veh_001', 'rte_004', 95.2, 390, 161.84),
  ('fuel_006', 2, '2024-01-22', 'drv_005', 'veh_005', 'rte_005', 110.5, 445, 187.85),
  ('fuel_007', 2, '2024-01-23', 'drv_002', 'veh_002', 'rte_002', 87.4, 350, 148.58),
  ('fuel_008', 2, '2024-01-24', 'drv_003', 'veh_003', 'rte_003', 82.1, 330, 139.57);

-- ============================================
-- GARAGE ENTRIES (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO garage_entries (id, user_id, date, vehicle_id, driver_id, issue_type, cost) VALUES
  ('gar_001', 2, '2024-01-10', 'veh_001', 'drv_001', 'Oil Change', 85.00),
  ('gar_002', 2, '2024-01-12', 'veh_002', 'drv_002', 'Brake Pads Replacement', 320.00),
  ('gar_003', 2, '2024-01-14', 'veh_003', 'drv_003', 'Tire Replacement', 680.00),
  ('gar_004', 2, '2024-01-17', 'veh_004', 'drv_004', 'Engine Diagnostics', 150.00),
  ('gar_005', 2, '2024-01-19', 'veh_005', 'drv_005', 'Suspension Repair', 425.00),
  ('gar_006', 2, '2024-01-21', 'veh_001', 'drv_001', 'Air Filter Replacement', 45.00),
  ('gar_007', 2, '2024-01-23', 'veh_002', 'drv_002', 'Clutch Repair', 750.00);

-- ============================================
-- PAYROLL ENTRIES (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO payroll_entries (id, user_id, week, date, driver_id, salary, bonus, advance, total_paid) VALUES
  ('pay_001', 2, 'Week 1 (Jan 1-7)', '2024-01-07', 'drv_001', 850.00, 100.00, 0.00, 950.00),
  ('pay_002', 2, 'Week 1 (Jan 1-7)', '2024-01-07', 'drv_002', 850.00, 75.00, 50.00, 875.00),
  ('pay_003', 2, 'Week 1 (Jan 1-7)', '2024-01-07', 'drv_003', 850.00, 50.00, 0.00, 900.00),
  ('pay_004', 2, 'Week 2 (Jan 8-14)', '2024-01-14', 'drv_001', 850.00, 120.00, 0.00, 970.00),
  ('pay_005', 2, 'Week 2 (Jan 8-14)', '2024-01-14', 'drv_002', 850.00, 80.00, 0.00, 930.00),
  ('pay_006', 2, 'Week 2 (Jan 8-14)', '2024-01-14', 'drv_003', 850.00, 60.00, 100.00, 810.00),
  ('pay_007', 2, 'Week 2 (Jan 8-14)', '2024-01-14', 'drv_005', 850.00, 90.00, 0.00, 940.00),
  ('pay_008', 2, 'Week 3 (Jan 15-21)', '2024-01-21', 'drv_001', 850.00, 110.00, 0.00, 960.00),
  ('pay_009', 2, 'Week 3 (Jan 15-21)', '2024-01-21', 'drv_002', 850.00, 85.00, 0.00, 935.00),
  ('pay_010', 2, 'Week 3 (Jan 15-21)', '2024-01-21', 'drv_003', 850.00, 70.00, 0.00, 920.00);

-- ============================================
-- SETTLEMENTS (User 2: UK Transport Ltd)
-- ============================================

INSERT OR IGNORE INTO settlements (id, user_id, date, vehicle_id, driver_id, route_id, amount) VALUES
  ('set_001', 2, '2024-01-15', 'veh_001', 'drv_001', 'rte_001', 2450.00),
  ('set_002', 2, '2024-01-16', 'veh_002', 'drv_002', 'rte_002', 3200.00),
  ('set_003', 2, '2024-01-18', 'veh_003', 'drv_003', 'rte_003', 2850.00),
  ('set_004', 2, '2024-01-20', 'veh_001', 'drv_001', 'rte_004', 2950.00),
  ('set_005', 2, '2024-01-22', 'veh_005', 'drv_005', 'rte_005', 4100.00),
  ('set_006', 2, '2024-01-23', 'veh_002', 'drv_002', 'rte_001', 2550.00),
  ('set_007', 2, '2024-01-24', 'veh_003', 'drv_003', 'rte_006', 3800.00);

-- ============================================
-- PLATFORM PAYMENTS
-- ============================================

INSERT OR IGNORE INTO platform_payments (id, user_id, date, company_name, email, amount, plan, status) VALUES
  ('pay_p001', 2, '2024-01-01', 'UK Transport Ltd', 'james@uktransport.com', 29.99, 'Premium', 'Paid'),
  ('pay_p002', 3, '2024-01-01', 'Euro Logistics GmbH', 'maria@eurologistics.com', 99.99, 'Enterprise', 'Paid'),
  ('pay_p003', 2, '2024-02-01', 'UK Transport Ltd', 'james@uktransport.com', 29.99, 'Premium', 'Paid'),
  ('pay_p004', 3, '2024-02-01', 'Euro Logistics GmbH', 'maria@eurologistics.com', 99.99, 'Enterprise', 'Pending');

-- ============================================
-- PLATFORM ACTIVITY LOGS
-- ============================================

INSERT OR IGNORE INTO platform_activity_logs (id, user_id, date, email, action, level) VALUES
  ('log_001', 2, '2024-01-01', 'james@uktransport.com', 'User registered', 'success'),
  ('log_002', 3, '2024-01-01', 'maria@eurologistics.com', 'User registered', 'success'),
  ('log_003', 2, '2024-01-05', 'james@uktransport.com', 'Driver added: John Smith', 'info'),
  ('log_004', 2, '2024-01-05', 'james@uktransport.com', 'Vehicle added: LB23 XYZ', 'info'),
  ('log_005', 2, '2024-01-10', 'james@uktransport.com', 'High garage cost detected', 'warning'),
  ('log_006', 4, '2024-01-15', 'john@smallfleet.com', 'User registered', 'success'),
  ('log_007', 2, '2024-01-20', 'james@uktransport.com', 'Monthly report generated', 'info');

-- ============================================
-- PLATFORM TICKETS
-- ============================================

INSERT OR IGNORE INTO platform_tickets (id, user_id, email, company_name, subject, message, status, date) VALUES
  ('tkt_001', 2, 'james@uktransport.com', 'UK Transport Ltd', 'Cannot export fuel reports', 'When I try to export fuel data as CSV, the download fails. Please help.', 'Resolved', '2024-01-10'),
  ('tkt_002', 3, 'maria@eurologistics.com', 'Euro Logistics GmbH', 'Upgrade to Enterprise', 'I would like to upgrade my account to Enterprise plan. What is the process?', 'Resolved', '2024-01-12'),
  ('tkt_003', 4, 'john@smallfleet.com', 'Small Fleet Services', 'Feature request: Mobile app', 'Is there a mobile app version available? Would be very useful for drivers.', 'Open', '2024-01-18');

-- ============================================
-- ADDITIONAL DATA FOR USER 3 (Euro Logistics)
-- ============================================

-- Drivers for User 3
INSERT OR IGNORE INTO drivers (id, user_id, name, phone, license, status) VALUES
  ('drv_101', 3, 'Hans Mueller', '+49 151 12345678', 'DE123456789', 'Active'),
  ('drv_102', 3, 'Anna Schmidt', '+49 151 87654321', 'DE987654321', 'Active'),
  ('drv_103', 3, 'Thomas Weber', '+49 151 23456789', 'DE456789123', 'Active');

-- Vehicles for User 3
INSERT OR IGNORE INTO vehicles (id, user_id, reg, name, type, status) VALUES
  ('veh_101', 3, 'B-XY-1234', 'Scania S500', 'Truck', 'Active'),
  ('veh_102', 3, 'B-AB-5678', 'Volvo FH', 'Truck', 'Active');

-- Routes for User 3
INSERT OR IGNORE INTO routes (id, user_id, name) VALUES
  ('rte_101', 3, 'Berlin → Vienna, Austria'),
  ('rte_102', 3, 'Munich → Prague, Czech Republic');

-- Orders for User 3
INSERT OR IGNORE INTO orders (id, user_id, date, driver_id, vehicle_id, route_id, status) VALUES
  ('ord_101', 3, '2024-01-15', 'drv_101', 'veh_101', 'rte_101', 'Completed'),
  ('ord_102', 3, '2024-01-20', 'drv_102', 'veh_102', 'rte_102', 'Assigned');

-- ============================================
-- DATA FOR USER 4 (Small Fleet Services)
-- ============================================

-- Driver for User 4
INSERT OR IGNORE INTO drivers (id, user_id, name, phone, license, status) VALUES
  ('drv_201', 4, 'Robert Johnson', '+1 555-0100', 'US123456', 'Active');

-- Vehicle for User 4
INSERT OR IGNORE INTO vehicles (id, user_id, reg, name, type, status) VALUES
  ('veh_201', 4, 'ABC-1234', 'Freightliner Cascadia', 'Truck', 'Active');

-- Route for User 4
INSERT OR IGNORE INTO routes (id, user_id, name) VALUES
  ('rte_201', 4, 'New York → Boston, USA');

-- Order for User 4
INSERT OR IGNORE INTO orders (id, user_id, date, driver_id, vehicle_id, route_id, status) VALUES
  ('ord_201', 4, '2024-01-25', 'drv_201', 'veh_201', 'rte_201', 'Assigned');

-- ============================================
-- SEED DATA COMPLETE
-- ============================================

-- Verify data insertion
SELECT 'Seed data inserted successfully!' as status;
SELECT 
  (SELECT COUNT(*) FROM user_accounts) as users,
  (SELECT COUNT(*) FROM drivers) as drivers,
  (SELECT COUNT(*) FROM vehicles) as vehicles,
  (SELECT COUNT(*) FROM routes) as routes,
  (SELECT COUNT(*) FROM orders) as orders,
  (SELECT COUNT(*) FROM fuel_entries) as fuel_entries,
  (SELECT COUNT(*) FROM garage_entries) as garage_entries,
  (SELECT COUNT(*) FROM payroll_entries) as payroll_entries,
  (SELECT COUNT(*) FROM settlements) as settlements;
