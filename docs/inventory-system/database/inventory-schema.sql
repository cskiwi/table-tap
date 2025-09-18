-- Inventory and Stock Management System Database Schema
-- Compatible with existing table-tap PostgreSQL database

-- ================================
-- INVENTORY CORE TABLES
-- ================================

-- Product Categories for inventory items
CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES inventory_categories(id),
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(name, cafe_id),
    INDEX idx_inventory_categories_cafe_parent (cafe_id, parent_id),
    INDEX idx_inventory_categories_name (name)
);

-- Storage locations within the restaurant
CREATE TABLE storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'refrigerator', 'freezer', 'pantry', 'bar', 'storage_room'
    description TEXT,
    temperature_min DECIMAL(5,2), -- Celsius
    temperature_max DECIMAL(5,2),
    capacity_volume DECIMAL(10,2), -- Liters
    capacity_weight DECIMAL(10,2), -- Kilograms
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(name, cafe_id),
    INDEX idx_storage_locations_cafe_type (cafe_id, type)
);

-- Products in inventory
CREATE TABLE inventory_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    category_id UUID REFERENCES inventory_categories(id),
    unit_of_measurement VARCHAR(50) NOT NULL, -- 'kg', 'l', 'pieces', 'bottles'
    unit_cost DECIMAL(10,4) NOT NULL,
    supplier_cost DECIMAL(10,4),
    storage_requirements TEXT,
    shelf_life_days INTEGER,
    min_stock_level DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    reorder_point DECIMAL(10,2) NOT NULL,
    reorder_quantity DECIMAL(10,2) NOT NULL,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_inventory_products_cafe_category (cafe_id, category_id),
    INDEX idx_inventory_products_sku (sku),
    INDEX idx_inventory_products_barcode (barcode),
    INDEX idx_inventory_products_reorder (reorder_point, is_active),
    FULLTEXT idx_inventory_products_search (name, description, sku)
);

-- Current stock levels
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0, -- Reserved for orders
    cost_per_unit DECIMAL(10,4) NOT NULL,
    expiration_date DATE,
    received_date DATE NOT NULL,
    last_counted_at TIMESTAMP,
    last_counted_quantity DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id, location_id, batch_number),
    INDEX idx_inventory_stock_product_location (product_id, location_id),
    INDEX idx_inventory_stock_expiration (expiration_date),
    INDEX idx_inventory_stock_low_stock (quantity, reserved_quantity),
    INDEX idx_inventory_stock_batch (batch_number)
);

-- ================================
-- SUPPLIER MANAGEMENT
-- ================================

-- Supplier information
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    payment_terms VARCHAR(100), -- 'NET_30', 'NET_15', 'COD', etc.
    lead_time_days INTEGER DEFAULT 1,
    minimum_order_amount DECIMAL(10,2),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5 rating
    is_active BOOLEAN DEFAULT true,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_suppliers_cafe_active (cafe_id, is_active),
    INDEX idx_suppliers_rating (rating DESC)
);

-- Products offered by suppliers
CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100),
    unit_cost DECIMAL(10,4) NOT NULL,
    minimum_order_quantity DECIMAL(10,2) DEFAULT 1,
    lead_time_days INTEGER DEFAULT 1,
    is_preferred BOOLEAN DEFAULT false,
    last_price_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(supplier_id, product_id),
    INDEX idx_supplier_products_product (product_id),
    INDEX idx_supplier_products_cost (unit_cost),
    INDEX idx_supplier_products_preferred (is_preferred DESC)
);

-- ================================
-- PURCHASE MANAGEMENT
-- ================================

-- Purchase orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'received', 'cancelled'
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50), -- 'credit_card', 'cash', 'bank_transfer', 'company_account'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue'
    notes TEXT,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES "Users"(id),
    approved_by_user_id UUID REFERENCES "Users"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_purchase_orders_supplier_status (supplier_id, status),
    INDEX idx_purchase_orders_cafe_date (cafe_id, order_date DESC),
    INDEX idx_purchase_orders_status_payment (status, payment_status),
    INDEX idx_purchase_orders_po_number (po_number)
);

-- Purchase order line items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,4) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    expiration_date DATE,
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_po_items_purchase_order (purchase_order_id),
    INDEX idx_po_items_product (product_id)
);

-- Receipt and invoice tracking
CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    receipt_number VARCHAR(100),
    receipt_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    image_url TEXT, -- Scanned receipt image
    ocr_data JSONB, -- Extracted text from OCR
    is_verified BOOLEAN DEFAULT false,
    verified_by_user_id UUID REFERENCES "Users"(id),
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_receipts_po (purchase_order_id),
    INDEX idx_receipts_cafe_date (cafe_id, receipt_date DESC),
    INDEX idx_receipts_verification (is_verified)
);

-- ================================
-- INVENTORY MOVEMENTS
-- ================================

-- Track all inventory movements
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    location_id UUID NOT NULL REFERENCES storage_locations(id),
    movement_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'transfer', 'waste', 'return'
    reference_type VARCHAR(50), -- 'purchase_order', 'order', 'adjustment', 'transfer'
    reference_id UUID, -- Reference to the related record
    batch_number VARCHAR(100),
    quantity_change DECIMAL(10,2) NOT NULL, -- Positive for additions, negative for removals
    quantity_before DECIMAL(10,2) NOT NULL,
    quantity_after DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,4) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    expiration_date DATE,
    reason TEXT,
    user_id UUID REFERENCES "Users"(id),
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_movements_product_date (product_id, created_at DESC),
    INDEX idx_movements_location_date (location_id, created_at DESC),
    INDEX idx_movements_type_date (movement_type, created_at DESC),
    INDEX idx_movements_reference (reference_type, reference_id),
    INDEX idx_movements_cafe_date (cafe_id, created_at DESC)
);

-- ================================
-- ANALYTICS AND FORECASTING
-- ================================

-- Product performance analytics
CREATE TABLE product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'

    -- Sales metrics
    total_sold DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    gross_profit DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,4) DEFAULT 0,

    -- Inventory metrics
    avg_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2) DEFAULT 0,
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    stockouts_count INTEGER DEFAULT 0,
    waste_quantity DECIMAL(10,2) DEFAULT 0,
    waste_cost DECIMAL(10,2) DEFAULT 0,

    -- Forecasting
    predicted_demand DECIMAL(10,2),
    confidence_score DECIMAL(3,2), -- 0-1 confidence in prediction
    seasonality_factor DECIMAL(5,4) DEFAULT 1,
    trend_factor DECIMAL(5,4) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id, period_start, period_end, period_type),
    INDEX idx_product_analytics_product_period (product_id, period_start DESC),
    INDEX idx_product_analytics_cafe_period (cafe_id, period_start DESC),
    INDEX idx_product_analytics_profit (profit_margin DESC),
    INDEX idx_product_analytics_performance (total_sold DESC, profit_margin DESC)
);

-- Demand forecasting models
CREATE TABLE demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecast_horizon_days INTEGER NOT NULL, -- How many days ahead
    predicted_demand DECIMAL(10,2) NOT NULL,
    confidence_interval_lower DECIMAL(10,2),
    confidence_interval_upper DECIMAL(10,2),
    model_version VARCHAR(50), -- Version of ML model used
    features_used JSONB, -- Input features for the prediction
    actual_demand DECIMAL(10,2), -- Filled in after the fact for accuracy tracking
    accuracy_score DECIMAL(5,4), -- How close the prediction was
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id, forecast_date, forecast_horizon_days),
    INDEX idx_demand_forecasts_product_date (product_id, forecast_date DESC),
    INDEX idx_demand_forecasts_cafe_date (cafe_id, forecast_date DESC),
    INDEX idx_demand_forecasts_accuracy (accuracy_score DESC)
);

-- ================================
-- GLASS TRACKING SYSTEM
-- ================================

-- Glass types and specifications
CREATE TABLE glass_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity_ml INTEGER,
    purchase_cost DECIMAL(10,2),
    replacement_cost DECIMAL(10,2),
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    rfid_enabled BOOLEAN DEFAULT false,
    qr_enabled BOOLEAN DEFAULT true,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(name, cafe_id),
    INDEX idx_glass_types_cafe_active (cafe_id, is_active)
);

-- Individual glass items
CREATE TABLE glass_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glass_type_id UUID NOT NULL REFERENCES glass_types(id),
    identifier VARCHAR(100) UNIQUE NOT NULL, -- RFID tag or QR code
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'in_use', 'dirty', 'broken', 'lost', 'retired'
    current_location VARCHAR(100), -- 'bar', 'kitchen', 'table_1', 'dishwasher', etc.
    purchase_date DATE NOT NULL,
    last_cleaned_at TIMESTAMP,
    total_uses INTEGER DEFAULT 0,
    total_breakages INTEGER DEFAULT 0,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_glass_inventory_type_status (glass_type_id, status),
    INDEX idx_glass_inventory_identifier (identifier),
    INDEX idx_glass_inventory_location (current_location),
    INDEX idx_glass_inventory_cafe_status (cafe_id, status)
);

-- Glass usage tracking
CREATE TABLE glass_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glass_id UUID NOT NULL REFERENCES glass_inventory(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'checkout', 'checkin', 'clean', 'break', 'lose', 'find'
    order_id UUID REFERENCES "Orders"(id), -- If associated with an order
    customer_id UUID REFERENCES "Users"(id), -- If checked out to customer
    location_from VARCHAR(100),
    location_to VARCHAR(100),
    deposit_charged DECIMAL(10,2) DEFAULT 0,
    deposit_returned DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    user_id UUID REFERENCES "Users"(id), -- Staff member performing action
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_glass_transactions_glass_date (glass_id, created_at DESC),
    INDEX idx_glass_transactions_order (order_id),
    INDEX idx_glass_transactions_customer (customer_id),
    INDEX idx_glass_transactions_type_date (transaction_type, created_at DESC),
    INDEX idx_glass_transactions_cafe_date (cafe_id, created_at DESC)
);

-- ================================
-- AUTOMATION AND ALERTS
-- ================================

-- Alert rules and configurations
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- 'low_stock', 'expiring_soon', 'overstock', 'waste_threshold'
    conditions JSONB NOT NULL, -- Flexible conditions definition
    recipients JSONB NOT NULL, -- Email addresses, user IDs, etc.
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES "Users"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_alert_rules_cafe_active (cafe_id, is_active),
    INDEX idx_alert_rules_type (rule_type)
);

-- Alert history
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_rule_id UUID REFERENCES alert_rules(id),
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Related data that triggered the alert
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_by_user_id UUID REFERENCES "Users"(id),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_alerts_cafe_status (cafe_id, status),
    INDEX idx_alerts_severity_date (severity, created_at DESC),
    INDEX idx_alerts_rule (alert_rule_id)
);

-- Automated reorder suggestions
CREATE TABLE reorder_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    supplier_id UUID REFERENCES suppliers(id),
    suggested_quantity DECIMAL(10,2) NOT NULL,
    estimated_cost DECIMAL(10,2),
    priority_score DECIMAL(5,2), -- 0-10 priority rating
    reason TEXT,
    algorithm_version VARCHAR(50),
    input_data JSONB, -- Data used to generate suggestion
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'ordered'
    approved_by_user_id UUID REFERENCES "Users"(id),
    created_purchase_order_id UUID REFERENCES purchase_orders(id),
    cafe_id UUID NOT NULL REFERENCES "Cafes"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reorder_suggestions_product_status (product_id, status),
    INDEX idx_reorder_suggestions_cafe_priority (cafe_id, priority_score DESC),
    INDEX idx_reorder_suggestions_status_date (status, created_at DESC)
);

-- ================================
-- PERFORMANCE TRACKING
-- ================================

-- System performance metrics
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    tags JSONB, -- Additional metadata
    cafe_id UUID REFERENCES "Cafes"(id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_system_metrics_name_date (metric_name, recorded_at DESC),
    INDEX idx_system_metrics_cafe_date (cafe_id, recorded_at DESC)
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Composite indexes for common queries
CREATE INDEX idx_inventory_stock_low_stock_alert ON inventory_stock (product_id, quantity, reorder_point)
WHERE quantity <= reorder_point;

CREATE INDEX idx_inventory_stock_expiring_soon ON inventory_stock (expiration_date, product_id)
WHERE expiration_date IS NOT NULL AND expiration_date <= CURRENT_DATE + INTERVAL '7 days';

CREATE INDEX idx_purchase_orders_pending_approval ON purchase_orders (cafe_id, created_at DESC)
WHERE status = 'draft' AND approved_by_user_id IS NULL;

CREATE INDEX idx_alerts_active_high_priority ON alerts (cafe_id, created_at DESC)
WHERE status = 'active' AND severity IN ('high', 'critical');

-- ================================
-- FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update stock levels
CREATE OR REPLACE FUNCTION update_stock_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the stock quantity in inventory_stock
    UPDATE inventory_stock
    SET quantity = quantity + NEW.quantity_change,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id
    AND COALESCE(batch_number, '') = COALESCE(NEW.batch_number, '');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock when movements are recorded
CREATE TRIGGER trigger_update_stock_level
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_level();

-- Function to check for low stock and create alerts
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock has fallen below reorder point
    IF NEW.quantity <= (
        SELECT reorder_point
        FROM inventory_products
        WHERE id = NEW.product_id
    ) THEN
        -- Create a low stock alert
        INSERT INTO alerts (
            severity,
            title,
            message,
            data,
            cafe_id
        )
        SELECT
            'high',
            'Low Stock Alert: ' || ip.name,
            'Product ' || ip.name || ' is below reorder point. Current stock: ' || NEW.quantity || ', Reorder point: ' || ip.reorder_point,
            jsonb_build_object(
                'product_id', NEW.product_id,
                'current_stock', NEW.quantity,
                'reorder_point', ip.reorder_point,
                'location_id', NEW.location_id
            ),
            ip.cafe_id
        FROM inventory_products ip
        WHERE ip.id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for low stock alerts
CREATE TRIGGER trigger_check_low_stock
    AFTER UPDATE ON inventory_stock
    FOR EACH ROW
    WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
    EXECUTE FUNCTION check_low_stock();