-- =====================================================
-- RESTAURANT ORDERING SYSTEM - INDEXES & PERFORMANCE
-- =====================================================

-- =====================================================
-- 1. CORE ENTITY INDEXES
-- =====================================================

-- Cafes
CREATE INDEX idx_cafes_slug ON cafes(slug);
CREATE INDEX idx_cafes_status ON cafes(status);
CREATE INDEX idx_cafes_subscription_tier ON cafes(subscription_tier);
CREATE INDEX idx_cafes_trial_ends_at ON cafes(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- Users
CREATE INDEX idx_users_cafe_id ON users(cafe_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
CREATE INDEX idx_users_external_id ON users(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE INDEX idx_users_gdpr_consent ON users(gdpr_consent_at) WHERE gdpr_consent_at IS NOT NULL;
CREATE INDEX idx_users_data_retention ON users(data_retention_until) WHERE data_retention_until IS NOT NULL;

-- Product Categories
CREATE INDEX idx_product_categories_cafe_id ON product_categories(cafe_id);
CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_product_categories_active ON product_categories(cafe_id, is_active);
CREATE INDEX idx_product_categories_sort ON product_categories(cafe_id, sort_order);

-- Products
CREATE INDEX idx_products_cafe_id ON products(cafe_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(cafe_id, sku);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_availability ON products(availability_status);
CREATE INDEX idx_products_active ON products(cafe_id, is_active);
CREATE INDEX idx_products_featured ON products(cafe_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_track_inventory ON products(track_inventory) WHERE track_inventory = TRUE;
CREATE INDEX idx_products_sort ON products(cafe_id, sort_order);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_seasonal ON products(seasonal_from, seasonal_until) WHERE seasonal_from IS NOT NULL;

-- Counters
CREATE INDEX idx_counters_cafe_id ON counters(cafe_id);
CREATE INDEX idx_counters_status ON counters(status);
CREATE INDEX idx_counters_type ON counters(counter_type);

-- Orders
CREATE INDEX idx_orders_cafe_id ON orders(cafe_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_counter_id ON orders(counter_id);
CREATE INDEX idx_orders_number ON orders(cafe_id, order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_completed_at ON orders(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_orders_ready_at ON orders(ready_at) WHERE ready_at IS NOT NULL;
CREATE INDEX idx_orders_estimated_ready ON orders(estimated_ready_at) WHERE estimated_ready_at IS NOT NULL;
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX idx_orders_date_range ON orders(cafe_id, created_at, status);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- 2. PAYMENT & TRANSACTION INDEXES
-- =====================================================

-- Payment Methods
CREATE INDEX idx_payment_methods_cafe_id ON payment_methods(cafe_id);
CREATE INDEX idx_payment_methods_type ON payment_methods(payment_type);
CREATE INDEX idx_payment_methods_status ON payment_methods(status);
CREATE INDEX idx_payment_methods_active ON payment_methods(cafe_id, status) WHERE status = 'active';

-- Payments
CREATE INDEX idx_payments_cafe_id ON payments(cafe_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_method_id ON payments(payment_method_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_intent_id ON payments(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_processed_by ON payments(processed_by);
CREATE INDEX idx_payments_processed_at ON payments(processed_at) WHERE processed_at IS NOT NULL;
CREATE INDEX idx_payments_amount ON payments(amount);
CREATE INDEX idx_payments_date_range ON payments(cafe_id, created_at, status);

-- Transactions
CREATE INDEX idx_transactions_cafe_id ON transactions(cafe_id);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_amount ON transactions(amount);

-- Refunds
CREATE INDEX idx_refunds_cafe_id ON refunds(cafe_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_processed_by ON refunds(processed_by);
CREATE INDEX idx_refunds_reason ON refunds(reason);

-- Store Credits
CREATE INDEX idx_store_credits_cafe_id ON store_credits(cafe_id);
CREATE INDEX idx_store_credits_user_id ON store_credits(user_id);
CREATE INDEX idx_store_credits_code ON store_credits(code);
CREATE INDEX idx_store_credits_status ON store_credits(status);
CREATE INDEX idx_store_credits_expires_at ON store_credits(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_store_credits_remaining ON store_credits(remaining_amount) WHERE remaining_amount > 0;

-- =====================================================
-- 3. INVENTORY MANAGEMENT INDEXES
-- =====================================================

-- Suppliers
CREATE INDEX idx_suppliers_cafe_id ON suppliers(cafe_id);
CREATE INDEX idx_suppliers_code ON suppliers(cafe_id, code);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_rating ON suppliers(rating) WHERE rating IS NOT NULL;

-- Inventory Items
CREATE INDEX idx_inventory_items_cafe_id ON inventory_items(cafe_id);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(cafe_id, sku);
CREATE INDEX idx_inventory_items_supplier_id ON inventory_items(supplier_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(cafe_id, current_stock, reorder_level) WHERE current_stock <= reorder_level;
CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_inventory_items_name_search ON inventory_items USING gin(to_tsvector('english', name));

-- Stock Movements
CREATE INDEX idx_stock_movements_cafe_id ON stock_movements(cafe_id);
CREATE INDEX idx_stock_movements_item_id ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_stock_movements_expiry ON stock_movements(expiry_date) WHERE expiry_date IS NOT NULL;

-- Purchases
CREATE INDEX idx_purchases_cafe_id ON purchases(cafe_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_number ON purchases(cafe_id, purchase_number);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_order_date ON purchases(order_date);
CREATE INDEX idx_purchases_received_date ON purchases(received_date) WHERE received_date IS NOT NULL;
CREATE INDEX idx_purchases_ordered_by ON purchases(ordered_by);

-- Waste Logs
CREATE INDEX idx_waste_logs_cafe_id ON waste_logs(cafe_id);
CREATE INDEX idx_waste_logs_item_id ON waste_logs(inventory_item_id);
CREATE INDEX idx_waste_logs_reason ON waste_logs(reason);
CREATE INDEX idx_waste_logs_reported_by ON waste_logs(reported_by);
CREATE INDEX idx_waste_logs_created_at ON waste_logs(created_at);

-- Reorder Recommendations
CREATE INDEX idx_reorder_recommendations_cafe_id ON reorder_recommendations(cafe_id);
CREATE INDEX idx_reorder_recommendations_item_id ON reorder_recommendations(inventory_item_id);
CREATE INDEX idx_reorder_recommendations_status ON reorder_recommendations(status);
CREATE INDEX idx_reorder_recommendations_priority ON reorder_recommendations(priority);
CREATE INDEX idx_reorder_recommendations_stockout ON reorder_recommendations(days_until_stockout);

-- =====================================================
-- 4. EMPLOYEE MANAGEMENT INDEXES
-- =====================================================

-- Employee Profiles
CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_cafe_id ON employee_profiles(cafe_id);
CREATE INDEX idx_employee_profiles_number ON employee_profiles(cafe_id, employee_number);
CREATE INDEX idx_employee_profiles_status ON employee_profiles(employment_status);
CREATE INDEX idx_employee_profiles_type ON employee_profiles(employment_type);
CREATE INDEX idx_employee_profiles_reports_to ON employee_profiles(reports_to);
CREATE INDEX idx_employee_profiles_hire_date ON employee_profiles(hire_date);
CREATE INDEX idx_employee_profiles_department ON employee_profiles(department);

-- Work Shifts
CREATE INDEX idx_work_shifts_cafe_id ON work_shifts(cafe_id);
CREATE INDEX idx_work_shifts_employee_id ON work_shifts(employee_id);
CREATE INDEX idx_work_shifts_counter_id ON work_shifts(counter_id);
CREATE INDEX idx_work_shifts_status ON work_shifts(status);
CREATE INDEX idx_work_shifts_scheduled_start ON work_shifts(scheduled_start);
CREATE INDEX idx_work_shifts_actual_times ON work_shifts(actual_start, actual_end);
CREATE INDEX idx_work_shifts_date ON work_shifts(DATE(scheduled_start));

-- Time Sheets
CREATE INDEX idx_time_sheets_cafe_id ON time_sheets(cafe_id);
CREATE INDEX idx_time_sheets_employee_id ON time_sheets(employee_id);
CREATE INDEX idx_time_sheets_period ON time_sheets(period_start, period_end);
CREATE INDEX idx_time_sheets_status ON time_sheets(status);
CREATE INDEX idx_time_sheets_approved_by ON time_sheets(approved_by);

-- Personal Consumption
CREATE INDEX idx_personal_consumption_cafe_id ON personal_consumption(cafe_id);
CREATE INDEX idx_personal_consumption_employee_id ON personal_consumption(employee_id);
CREATE INDEX idx_personal_consumption_order_id ON personal_consumption(order_id);
CREATE INDEX idx_personal_consumption_status ON personal_consumption(status);
CREATE INDEX idx_personal_consumption_consumed_at ON personal_consumption(consumed_at);

-- =====================================================
-- 5. CONFIGURATION & SETTINGS INDEXES
-- =====================================================

-- Cafe Settings
CREATE INDEX idx_cafe_settings_cafe_id ON cafe_settings(cafe_id);
CREATE INDEX idx_cafe_settings_key ON cafe_settings(cafe_id, setting_key);
CREATE INDEX idx_cafe_settings_category ON cafe_settings(category);
CREATE INDEX idx_cafe_settings_public ON cafe_settings(is_public) WHERE is_public = TRUE;

-- Loyalty Programs
CREATE INDEX idx_loyalty_programs_cafe_id ON loyalty_programs(cafe_id);
CREATE INDEX idx_loyalty_programs_active ON loyalty_programs(is_active) WHERE is_active = TRUE;

-- Customer Loyalty Accounts
CREATE INDEX idx_customer_loyalty_customer_id ON customer_loyalty_accounts(customer_id);
CREATE INDEX idx_customer_loyalty_program_id ON customer_loyalty_accounts(loyalty_program_id);
CREATE INDEX idx_customer_loyalty_membership ON customer_loyalty_accounts(membership_number);
CREATE INDEX idx_customer_loyalty_active ON customer_loyalty_accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_customer_loyalty_points ON customer_loyalty_accounts(current_points);
CREATE INDEX idx_customer_loyalty_tier ON customer_loyalty_accounts(current_tier);
CREATE INDEX idx_customer_loyalty_expiry ON customer_loyalty_accounts(points_expire_at) WHERE points_expire_at IS NOT NULL;

-- Loyalty Transactions
CREATE INDEX idx_loyalty_transactions_account_id ON loyalty_transactions(loyalty_account_id);
CREATE INDEX idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 6. AUDIT & LOGGING INDEXES
-- =====================================================

-- Audit Logs
CREATE INDEX idx_audit_logs_cafe_id ON audit_logs(cafe_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);
CREATE INDEX idx_audit_logs_gdpr ON audit_logs(gdpr_sensitive) WHERE gdpr_sensitive = TRUE;
CREATE INDEX idx_audit_logs_retention ON audit_logs(retention_until) WHERE retention_until IS NOT NULL;

-- Data Access Logs
CREATE INDEX idx_data_access_logs_cafe_id ON data_access_logs(cafe_id);
CREATE INDEX idx_data_access_logs_subject_user ON data_access_logs(subject_user_id);
CREATE INDEX idx_data_access_logs_accessor_user ON data_access_logs(accessor_user_id);
CREATE INDEX idx_data_access_logs_access_type ON data_access_logs(access_type);
CREATE INDEX idx_data_access_logs_created_at ON data_access_logs(created_at);

-- Security Logs
CREATE INDEX idx_security_logs_cafe_id ON security_logs(cafe_id);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_risk_level ON security_logs(risk_level);
CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX idx_security_logs_investigated ON security_logs(investigated);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);

-- System Logs
CREATE INDEX idx_system_logs_cafe_id ON system_logs(cafe_id);
CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE INDEX idx_system_logs_component ON system_logs(component);
CREATE INDEX idx_system_logs_request_id ON system_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_system_logs_correlation_id ON system_logs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- Financial Audit Trail
CREATE INDEX idx_financial_audit_cafe_id ON financial_audit_trail(cafe_id);
CREATE INDEX idx_financial_audit_action ON financial_audit_trail(action);
CREATE INDEX idx_financial_audit_reference ON financial_audit_trail(reference_type, reference_id);
CREATE INDEX idx_financial_audit_counter_id ON financial_audit_trail(counter_id);
CREATE INDEX idx_financial_audit_employee_id ON financial_audit_trail(employee_id);
CREATE INDEX idx_financial_audit_reconciled ON financial_audit_trail(reconciled);
CREATE INDEX idx_financial_audit_batch_id ON financial_audit_trail(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_financial_audit_created_at ON financial_audit_trail(created_at);

-- =====================================================
-- 7. COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Orders dashboard queries
CREATE INDEX idx_orders_dashboard ON orders(cafe_id, status, created_at DESC);
CREATE INDEX idx_orders_counter_status ON orders(counter_id, status, created_at DESC);
CREATE INDEX idx_orders_customer_history ON orders(customer_id, created_at DESC);

-- Product performance
CREATE INDEX idx_order_items_product_stats ON order_items(product_id, created_at);

-- Employee performance
CREATE INDEX idx_orders_employee_stats ON orders(cafe_id, created_at, status) WHERE status = 'completed';

-- Inventory alerts
CREATE INDEX idx_inventory_alerts ON inventory_items(cafe_id, status, current_stock, reorder_level)
    WHERE status = 'active' AND current_stock <= reorder_level;

-- Financial reporting
CREATE INDEX idx_payments_financial_report ON payments(cafe_id, status, created_at, amount)
    WHERE status = 'completed';
CREATE INDEX idx_transactions_financial_report ON transactions(cafe_id, created_at, transaction_type, amount);

-- Loyalty program performance
CREATE INDEX idx_loyalty_program_stats ON customer_loyalty_accounts(loyalty_program_id, current_tier, current_points, last_activity_at);

-- GDPR compliance
CREATE INDEX idx_gdpr_retention_cleanup ON users(data_retention_until) WHERE data_retention_until IS NOT NULL;

-- =====================================================
-- 8. PARTIAL INDEXES FOR OPTIMIZATION
-- =====================================================

-- Active records only
CREATE INDEX idx_products_active_only ON products(cafe_id, category_id, sort_order)
    WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_users_active_only ON users(cafe_id, role, last_login_at)
    WHERE status = 'active' AND deleted_at IS NULL;

-- Pending orders
CREATE INDEX idx_orders_pending ON orders(cafe_id, counter_id, created_at)
    WHERE status IN ('pending', 'confirmed', 'preparing');

-- Low stock items
CREATE INDEX idx_inventory_low_stock_active ON inventory_items(cafe_id, current_stock)
    WHERE status = 'active' AND track_inventory = TRUE AND current_stock <= reorder_level;

-- Failed payments
CREATE INDEX idx_payments_failed ON payments(cafe_id, payment_method_id, created_at)
    WHERE status IN ('failed', 'cancelled');

-- Security incidents
CREATE INDEX idx_security_high_risk ON security_logs(cafe_id, created_at, event_type)
    WHERE risk_level IN ('high', 'critical') AND investigated = FALSE;

-- =====================================================
-- 9. FUNCTIONAL INDEXES
-- =====================================================

-- Case-insensitive email lookup
CREATE INDEX idx_users_email_lower ON users(lower(email));

-- Product name search
CREATE INDEX idx_products_name_trigram ON products USING gin(name gin_trgm_ops);

-- Customer phone search
CREATE INDEX idx_orders_customer_phone_trigram ON orders USING gin(customer_phone gin_trgm_ops)
    WHERE customer_phone IS NOT NULL;

-- Order number search
CREATE INDEX idx_orders_number_trigram ON orders USING gin(order_number gin_trgm_ops);

-- =====================================================
-- 10. STATISTICS AND MAINTENANCE
-- =====================================================

-- Update table statistics
ANALYZE cafes;
ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;
ANALYZE inventory_items;
ANALYZE stock_movements;
ANALYZE employee_profiles;
ANALYZE audit_logs;

-- Create extension for better search if not exists
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =====================================================
-- INDEX MONITORING VIEWS
-- =====================================================

-- View for monitoring index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- View for unused indexes
CREATE OR REPLACE VIEW unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexname NOT LIKE '%pkey'
    AND indexname NOT LIKE '%_unique'
ORDER BY pg_relation_size(indexrelid) DESC;

-- View for table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;