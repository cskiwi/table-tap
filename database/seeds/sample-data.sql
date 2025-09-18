-- =====================================================
-- RESTAURANT ORDERING SYSTEM - SAMPLE DATA
-- =====================================================

-- Clear existing data (in correct order to respect foreign keys)
TRUNCATE TABLE
    loyalty_transactions,
    customer_loyalty_accounts,
    loyalty_rewards,
    loyalty_programs,
    store_credit_transactions,
    store_credits,
    gdpr_requests,
    financial_audit_trail,
    security_logs,
    system_logs,
    data_access_logs,
    audit_logs,
    integrations,
    notification_templates,
    tip_calculation_rules,
    counter_configurations,
    order_workflows,
    cafe_settings,
    employee_availability,
    employee_performance,
    proxy_orders,
    personal_consumption,
    time_sheets,
    work_shifts,
    employee_role_assignments,
    employee_roles,
    employee_profiles,
    reorder_recommendations,
    glass_inventory,
    waste_logs,
    purchase_items,
    purchases,
    product_ingredients,
    stock_movements,
    inventory_items,
    inventory_categories,
    suppliers,
    tip_distributions,
    refunds,
    transactions,
    payments,
    payment_methods,
    order_items,
    orders,
    counters,
    products,
    product_categories,
    users,
    cafes
RESTART IDENTITY CASCADE;

-- =====================================================
-- 1. CAFES
-- =====================================================

INSERT INTO cafes (id, name, slug, description, address, contact_info, business_settings, timezone, currency, tax_rate) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'The Coffee Corner',
    'coffee-corner',
    'A cozy neighborhood coffee shop specializing in artisan coffee and fresh pastries',
    '{"street": "123 Main Street", "city": "Amsterdam", "postal_code": "1000 AA", "country": "Netherlands", "coordinates": {"lat": 52.3676, "lng": 4.9041}}',
    '{"phone": "+31-20-123-4567", "email": "hello@coffeecorner.nl", "website": "https://coffeecorner.nl", "social_media": {"instagram": "@coffeecorner_amsterdam"}}',
    '{"opening_hours": {"monday": "07:00-19:00", "tuesday": "07:00-19:00", "wednesday": "07:00-19:00", "thursday": "07:00-19:00", "friday": "07:00-19:00", "saturday": "08:00-18:00", "sunday": "09:00-17:00"}, "max_order_items": 20, "order_timeout_minutes": 30}',
    'Europe/Amsterdam',
    'EUR',
    0.21
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Bistro Deluxe',
    'bistro-deluxe',
    'Upscale bistro offering gourmet meals and premium beverages',
    '{"street": "456 Restaurant Row", "city": "Amsterdam", "postal_code": "1001 BB", "country": "Netherlands", "coordinates": {"lat": 52.3702, "lng": 4.8952}}',
    '{"phone": "+31-20-987-6543", "email": "reservations@bistrodeluxe.nl", "website": "https://bistrodeluxe.nl"}',
    '{"opening_hours": {"tuesday": "17:00-23:00", "wednesday": "17:00-23:00", "thursday": "17:00-23:00", "friday": "17:00-24:00", "saturday": "17:00-24:00", "sunday": "17:00-22:00"}, "max_order_items": 15, "requires_reservations": true}',
    'Europe/Amsterdam',
    'EUR',
    0.21
);

-- =====================================================
-- 2. USERS
-- =====================================================

INSERT INTO users (id, cafe_id, email, password_hash, first_name, last_name, phone, role, status, gdpr_consent_at, marketing_consent) VALUES
-- Cafe 1 Users
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'admin@coffeecorner.nl', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'Sarah', 'Johnson', '+31-6-12345678', 'admin', 'active', NOW() - INTERVAL '1 month', true),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'manager@coffeecorner.nl', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'Mike', 'Chen', '+31-6-23456789', 'manager', 'active', NOW() - INTERVAL '20 days', true),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'barista1@coffeecorner.nl', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'Emma', 'Williams', '+31-6-34567890', 'employee', 'active', NOW() - INTERVAL '15 days', false),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440001', 'barista2@coffeecorner.nl', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'James', 'Brown', '+31-6-45678901', 'employee', 'active', NOW() - INTERVAL '10 days', true),
-- Customers
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'john.doe@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'John', 'Doe', '+31-6-56789012', 'customer', 'active', NOW() - INTERVAL '5 days', true),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', 'jane.smith@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'Jane', 'Smith', '+31-6-67890123', 'customer', 'active', NOW() - INTERVAL '3 days', false),
-- Cafe 2 Users
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440002', 'chef@bistrodeluxe.nl', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewxVPd8/P6XSqOyG', 'Pierre', 'Dubois', '+31-6-78901234', 'admin', 'active', NOW() - INTERVAL '2 months', true);

-- =====================================================
-- 3. PRODUCT CATEGORIES
-- =====================================================

INSERT INTO product_categories (id, cafe_id, name, description, sort_order, icon, color) VALUES
-- Cafe 1 Categories
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440001', 'Coffee', 'All coffee beverages', 1, 'coffee', '#8B4513'),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440001', 'Tea', 'Tea varieties and blends', 2, 'tea', '#228B22'),
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440001', 'Pastries', 'Fresh baked goods', 3, 'croissant', '#DEB887'),
('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440001', 'Sandwiches', 'Light meals and sandwiches', 4, 'sandwich', '#F4A460'),
-- Cafe 2 Categories
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440002', 'Appetizers', 'Starter dishes', 1, 'appetizer', '#FF6347'),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440002', 'Main Courses', 'Full dinner dishes', 2, 'dinner', '#CD853F'),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440002', 'Desserts', 'Sweet endings', 3, 'dessert', '#FFB6C1'),
('550e8400-e29b-41d4-a716-446655440504', '550e8400-e29b-41d4-a716-446655440002', 'Beverages', 'Wine, cocktails, and drinks', 4, 'wine', '#800080');

-- =====================================================
-- 4. PRODUCTS
-- =====================================================

INSERT INTO products (id, cafe_id, category_id, sku, name, description, product_type, base_price, cost_price, images, nutritional_info, preparation_time, ingredients, customizations, tags, min_stock_level, track_inventory) VALUES
-- Coffee Corner Products
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440401', 'ESP001', 'Espresso', 'Rich, bold espresso shot', 'drink', 2.50, 0.80, '["https://example.com/espresso.jpg"]', '{"calories": 5, "caffeine_mg": 65, "allergens": []}', 2, '["espresso_beans", "water"]', '["extra_shot", "decaf"]', '["coffee", "espresso", "strong"]', 50, true),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440401', 'CAP001', 'Cappuccino', 'Perfect balance of espresso, steamed milk, and foam', 'drink', 4.20, 1.50, '["https://example.com/cappuccino.jpg"]', '{"calories": 120, "caffeine_mg": 65, "allergens": ["milk"]}', 4, '["espresso_beans", "milk", "water"]', '["oat_milk", "soy_milk", "extra_shot", "vanilla_syrup", "caramel_syrup"]', '["coffee", "milk", "foam"]', 30, true),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440401', 'LAT001', 'Latte', 'Smooth espresso with steamed milk', 'drink', 4.50, 1.60, '["https://example.com/latte.jpg"]', '{"calories": 150, "caffeine_mg": 65, "allergens": ["milk"]}', 4, '["espresso_beans", "milk", "water"]', '["oat_milk", "soy_milk", "almond_milk", "extra_shot", "vanilla_syrup", "caramel_syrup", "hazelnut_syrup"]', '["coffee", "milk", "creamy"]', 30, true),
('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440402', 'TEA001', 'Earl Grey Tea', 'Classic bergamot-flavored black tea', 'drink', 3.20, 0.90, '["https://example.com/earl-grey.jpg"]', '{"calories": 0, "caffeine_mg": 40, "allergens": []}', 5, '["earl_grey_tea", "water"]', '["lemon", "honey", "milk"]', '["tea", "bergamot", "classic"]', 20, true),
('550e8400-e29b-41d4-a716-446655440605', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440403', 'CRO001', 'Butter Croissant', 'Flaky, buttery French croissant', 'food', 3.80, 1.20, '["https://example.com/croissant.jpg"]', '{"calories": 280, "fat_g": 16, "allergens": ["gluten", "eggs", "milk"]}', 3, '["flour", "butter", "eggs", "yeast"]', '["jam", "butter", "honey"]', '["pastry", "breakfast", "french"]', 10, true),
('550e8400-e29b-41d4-a716-446655440606', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440404', 'SAN001', 'Club Sandwich', 'Triple-decker with turkey, bacon, lettuce, tomato', 'food', 8.90, 4.20, '["https://example.com/club-sandwich.jpg"]', '{"calories": 520, "protein_g": 28, "allergens": ["gluten"]}', 8, '["bread", "turkey", "bacon", "lettuce", "tomato", "mayo"]', '["no_mayo", "extra_bacon", "avocado"]', '["sandwich", "lunch", "hearty"]', 5, false);

-- =====================================================
-- 5. COUNTERS
-- =====================================================

INSERT INTO counters (id, cafe_id, name, description, location, counter_type, max_concurrent_orders, opened_at, closed_at) VALUES
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440001', 'Main Counter', 'Primary service counter', 'Front of store', 'main', 15, '07:00', '19:00'),
('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440001', 'Express Bar', 'Quick service for drinks only', 'Left side', 'express', 8, '07:30', '18:30'),
('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440002', 'Dining Counter', 'Full service dining counter', 'Reception area', 'main', 12, '17:00', '23:00');

-- =====================================================
-- 6. PAYMENT METHODS
-- =====================================================

INSERT INTO payment_methods (id, cafe_id, name, payment_type, provider, fee_percentage, fee_fixed, minimum_amount, is_refundable) VALUES
('550e8400-e29b-41d4-a716-446655440801', '550e8400-e29b-41d4-a716-446655440001', 'Cash', 'cash', NULL, 0, 0, 0, true),
('550e8400-e29b-41d4-a716-446655440802', '550e8400-e29b-41d4-a716-446655440001', 'Card Payment', 'card', 'Stripe', 1.4, 0.25, 1.00, true),
('550e8400-e29b-41d4-a716-446655440803', '550e8400-e29b-41d4-a716-446655440001', 'Mobile Payment', 'digital_wallet', 'Apple Pay', 1.2, 0.20, 0.50, true),
('550e8400-e29b-41d4-a716-446655440804', '550e8400-e29b-41d4-a716-446655440002', 'Cash', 'cash', NULL, 0, 0, 0, true),
('550e8400-e29b-41d4-a716-446655440805', '550e8400-e29b-41d4-a716-446655440002', 'Card Payment', 'card', 'Square', 2.6, 0.30, 5.00, true);

-- =====================================================
-- 7. ORDERS
-- =====================================================

INSERT INTO orders (id, cafe_id, customer_id, counter_id, order_number, order_type, status, customer_name, subtotal, tax_amount, tip_amount, total_amount, estimated_ready_at, completed_at) VALUES
-- Recent completed orders
('550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440701', 'CC001', 'dine_in', 'completed', 'John Doe', 7.70, 1.62, 1.50, 10.82, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes'),
('550e8400-e29b-41d4-a716-446655440902', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440702', 'CC002', 'takeaway', 'completed', 'Jane Smith', 4.20, 0.88, 0.00, 5.08, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 25 minutes'),
-- Current active orders
('550e8400-e29b-41d4-a716-446655440903', '550e8400-e29b-41d4-a716-446655440001', NULL, '550e8400-e29b-41d4-a716-446655440701', 'CC003', 'dine_in', 'preparing', 'Walk-in Customer', 12.70, 2.67, 0.00, 15.37, NOW() + INTERVAL '10 minutes', NULL),
('550e8400-e29b-41d4-a716-446655440904', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440701', 'CC004', 'takeaway', 'confirmed', 'John Doe', 8.90, 1.87, 0.00, 10.77, NOW() + INTERVAL '15 minutes', NULL);

-- =====================================================
-- 8. ORDER ITEMS
-- =====================================================

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total, customizations, special_instructions) VALUES
-- Order CC001 items
('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440602', 1, 4.20, 4.20, '{"milk_type": "oat_milk"}', 'Extra hot please'),
('550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440605', 1, 3.50, 3.50, '{"additions": ["butter"]}', NULL),
-- Order CC002 items
('550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440902', '550e8400-e29b-41d4-a716-446655440602', 1, 4.20, 4.20, '{}', NULL),
-- Order CC003 items
('550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440903', '550e8400-e29b-41d4-a716-446655440603', 1, 4.50, 4.50, '{"syrup": "vanilla_syrup", "milk_type": "almond_milk"}', NULL),
('550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655440903', '550e8400-e29b-41d4-a716-446655440606', 1, 8.90, 8.90, '{"additions": ["avocado"]}', 'Cut in half'),
-- Order CC004 items
('550e8400-e29b-41d4-a716-446655441006', '550e8400-e29b-41d4-a716-446655440904', '550e8400-e29b-41d4-a716-446655440606', 1, 8.90, 8.90, '{"modifications": ["no_mayo", "extra_bacon"]}', 'To go box please');

-- =====================================================
-- 9. PAYMENTS
-- =====================================================

INSERT INTO payments (id, cafe_id, order_id, payment_method_id, amount, fee_amount, status, processed_at) VALUES
('550e8400-e29b-41d4-a716-446655441101', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440803', 10.82, 0.15, 'completed', NOW() - INTERVAL '1 hour 45 minutes'),
('550e8400-e29b-41d4-a716-446655441102', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440902', '550e8400-e29b-41d4-a716-446655440801', 5.08, 0.00, 'completed', NOW() - INTERVAL '1 hour 25 minutes');

-- =====================================================
-- 10. EMPLOYEE PROFILES
-- =====================================================

INSERT INTO employee_profiles (id, user_id, cafe_id, employee_number, hire_date, employment_type, department, position, hourly_rate, emergency_contact) VALUES
('550e8400-e29b-41d4-a716-446655441201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'EMP001', '2023-01-15', 'full_time', 'Management', 'Store Manager', 25.00, '{"name": "Mike Johnson", "phone": "+31-6-99988877", "relationship": "spouse"}'),
('550e8400-e29b-41d4-a716-446655441202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'EMP002', '2023-03-01', 'full_time', 'Operations', 'Assistant Manager', 20.00, '{"name": "Lisa Chen", "phone": "+31-6-88877766", "relationship": "sister"}'),
('550e8400-e29b-41d4-a716-446655441203', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'EMP003', '2023-06-15', 'part_time', 'Service', 'Barista', 14.50, '{"name": "Tom Williams", "phone": "+31-6-77766655", "relationship": "father"}'),
('550e8400-e29b-41d4-a716-446655441204', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440001', 'EMP004', '2023-08-01', 'part_time', 'Service', 'Barista', 14.50, '{"name": "Sarah Brown", "phone": "+31-6-66655544", "relationship": "mother"}');

-- =====================================================
-- 11. SUPPLIERS
-- =====================================================

INSERT INTO suppliers (id, cafe_id, name, code, contact_person, email, phone, payment_terms, rating) VALUES
('550e8400-e29b-41d4-a716-446655441301', '550e8400-e29b-41d4-a716-446655440001', 'Amsterdam Coffee Roasters', 'ACR001', 'Peter van der Berg', 'orders@amsterdamcoffee.nl', '+31-20-555-0101', 'Net 30', 5),
('550e8400-e29b-41d4-a716-446655441302', '550e8400-e29b-41d4-a716-446655440001', 'Fresh Dairy Co', 'FDC001', 'Maria Santos', 'supply@freshdairy.nl', '+31-20-555-0202', 'Net 15', 4),
('550e8400-e29b-41d4-a716-446655441303', '550e8400-e29b-41d4-a716-446655440001', 'Artisan Bakery Supply', 'ABS001', 'Jean-Claude Dubois', 'orders@artisanbakery.nl', '+31-20-555-0303', 'Cash on Delivery', 5);

-- =====================================================
-- 12. INVENTORY CATEGORIES
-- =====================================================

INSERT INTO inventory_categories (id, cafe_id, name, description, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655441401', '550e8400-e29b-41d4-a716-446655440001', 'Coffee Beans', 'Various coffee bean varieties', 1),
('550e8400-e29b-41d4-a716-446655441402', '550e8400-e29b-41d4-a716-446655440001', 'Dairy Products', 'Milk, cream, and dairy alternatives', 2),
('550e8400-e29b-41d4-a716-446655441403', '550e8400-e29b-41d4-a716-446655440001', 'Bakery Ingredients', 'Flour, sugar, and baking supplies', 3),
('550e8400-e29b-41d4-a716-446655441404', '550e8400-e29b-41d4-a716-446655440001', 'Disposables', 'Cups, lids, napkins, and packaging', 4);

-- =====================================================
-- 13. INVENTORY ITEMS
-- =====================================================

INSERT INTO inventory_items (id, cafe_id, category_id, sku, name, unit, current_stock, reorder_level, max_stock_level, cost_per_unit, supplier_id) VALUES
('550e8400-e29b-41d4-a716-446655441501', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441401', 'BEAN001', 'Arabica Coffee Beans', 'kg', 25.5, 10.0, 50.0, 18.50, '550e8400-e29b-41d4-a716-446655441301'),
('550e8400-e29b-41d4-a716-446655441502', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441402', 'MILK001', 'Whole Milk', 'l', 45.0, 20.0, 100.0, 1.20, '550e8400-e29b-41d4-a716-446655441302'),
('550e8400-e29b-41d4-a716-446655441503', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441402', 'OATMILK001', 'Oat Milk', 'l', 18.0, 15.0, 40.0, 2.80, '550e8400-e29b-41d4-a716-446655441302'),
('550e8400-e29b-41d4-a716-446655441504', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441404', 'CUP001', 'Paper Cups 12oz', 'piece', 850, 200, 2000, 0.15, '550e8400-e29b-41d4-a716-446655441303'),
('550e8400-e29b-41d4-a716-446655441505', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441403', 'FLOUR001', 'All-Purpose Flour', 'kg', 12.0, 8.0, 25.0, 1.85, '550e8400-e29b-41d4-a716-446655441303');

-- =====================================================
-- 14. STOCK MOVEMENTS (Recent transactions)
-- =====================================================

INSERT INTO stock_movements (id, cafe_id, inventory_item_id, movement_type, quantity, unit_cost, reference_type, reason, created_by, created_at) VALUES
-- Recent purchases
('550e8400-e29b-41d4-a716-446655441601', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441501', 'purchase', 20.0, 18.50, 'purchase', 'Weekly stock replenishment', '550e8400-e29b-41d4-a716-446655440102', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655441602', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441502', 'purchase', 50.0, 1.20, 'purchase', 'Dairy delivery', '550e8400-e29b-41d4-a716-446655440102', NOW() - INTERVAL '1 day'),
-- Sales consumption
('550e8400-e29b-41d4-a716-446655441603', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441501', 'sale', -0.5, 18.50, 'order', 'Order CC001 - Cappuccino', '550e8400-e29b-41d4-a716-446655440103', NOW() - INTERVAL '1 hour 45 minutes'),
('550e8400-e29b-41d4-a716-446655441604', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441502', 'sale', -0.2, 1.20, 'order', 'Order CC001 - Cappuccino', '550e8400-e29b-41d4-a716-446655440103', NOW() - INTERVAL '1 hour 45 minutes');

-- =====================================================
-- 15. LOYALTY PROGRAMS
-- =====================================================

INSERT INTO loyalty_programs (id, cafe_id, name, description, points_per_dollar, signup_bonus_points, birthday_bonus_points) VALUES
('550e8400-e29b-41d4-a716-446655441701', '550e8400-e29b-41d4-a716-446655440001', 'Coffee Lovers Rewards', 'Earn points with every purchase and get free drinks', 1.0, 100, 50);

-- =====================================================
-- 16. CUSTOMER LOYALTY ACCOUNTS
-- =====================================================

INSERT INTO customer_loyalty_accounts (id, customer_id, loyalty_program_id, membership_number, current_points, lifetime_points, current_tier) VALUES
('550e8400-e29b-41d4-a716-446655441801', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655441701', 'CLR001234', 250, 350, 'silver'),
('550e8400-e29b-41d4-a716-446655441802', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655441701', 'CLR001235', 80, 180, 'bronze');

-- =====================================================
-- 17. LOYALTY TRANSACTIONS
-- =====================================================

INSERT INTO loyalty_transactions (id, loyalty_account_id, order_id, transaction_type, points_earned, points_redeemed, points_balance_after, description) VALUES
('550e8400-e29b-41d4-a716-446655441901', '550e8400-e29b-41d4-a716-446655441801', '550e8400-e29b-41d4-a716-446655440901', 'purchase', 11, 0, 250, 'Purchase reward for order CC001'),
('550e8400-e29b-41d4-a716-446655441902', '550e8400-e29b-41d4-a716-446655441802', '550e8400-e29b-41d4-a716-446655440902', 'purchase', 5, 0, 80, 'Purchase reward for order CC002');

-- =====================================================
-- 18. CAFE SETTINGS
-- =====================================================

INSERT INTO cafe_settings (cafe_id, setting_key, setting_value, setting_type, description, category) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'order_timeout_minutes', '30', 'number', 'Order timeout in minutes', 'order'),
('550e8400-e29b-41d4-a716-446655440001', 'max_order_items', '20', 'number', 'Maximum items per order', 'order'),
('550e8400-e29b-41d4-a716-446655440001', 'enable_tips', 'true', 'boolean', 'Enable tip collection', 'payment'),
('550e8400-e29b-41d4-a716-446655440001', 'default_tip_percentages', '[15, 18, 20, 25]', 'json', 'Default tip percentage options', 'payment'),
('550e8400-e29b-41d4-a716-446655440001', 'loyalty_program_enabled', 'true', 'boolean', 'Enable loyalty program', 'general'),
('550e8400-e29b-41d4-a716-446655440001', 'notification_email', 'manager@coffeecorner.nl', 'string', 'Email for system notifications', 'notification');

-- Set application user for audit logging
SELECT set_config('app.current_user_id', '550e8400-e29b-41d4-a716-446655440101', false);