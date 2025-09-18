# Database Schema Design

## PostgreSQL Schema Structure

### Core Entities Overview

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 1. Multi-Tenancy & Configuration

### Cafes Table
```sql
CREATE TABLE cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',

    -- Configuration
    config JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_cafes_slug ON cafes(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_cafes_config ON cafes USING GIN(config) WHERE deleted_at IS NULL;
```

### Cafe Settings Table
```sql
CREATE TABLE cafe_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

    -- Order Management
    order_workflow JSONB DEFAULT '["pending", "preparing", "ready", "completed"]',
    auto_accept_orders BOOLEAN DEFAULT false,
    prep_time_minutes INTEGER DEFAULT 15,

    -- Payment Settings
    payment_methods JSONB DEFAULT '["cash", "card"]',
    tip_suggestions JSONB DEFAULT '[0.10, 0.15, 0.20]',
    tip_enabled BOOLEAN DEFAULT true,

    -- Counter Management
    counters JSONB DEFAULT '[]',
    counter_distribution_strategy VARCHAR(20) DEFAULT 'round_robin',

    -- Inventory Features
    glass_tracking_enabled BOOLEAN DEFAULT false,
    low_stock_alert_threshold INTEGER DEFAULT 10,

    -- Employee Features
    proxy_ordering_enabled BOOLEAN DEFAULT true,
    personal_drink_limit INTEGER DEFAULT 2,
    timesheet_required BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 2. User Management

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

    -- Basic Info
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),

    -- Authentication
    email_verified_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Profile
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE UNIQUE INDEX idx_users_cafe_email ON users(cafe_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified_at) WHERE deleted_at IS NULL;
```

### User Roles Table
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

    role VARCHAR(50) NOT NULL, -- 'customer', 'employee', 'manager', 'admin'
    permissions JSONB DEFAULT '[]',

    -- Employee specific
    employee_id VARCHAR(50),
    hourly_rate DECIMAL(10,2),
    hire_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles(user_id, cafe_id, role) WHERE is_active = true;
CREATE INDEX idx_user_roles_cafe_role ON user_roles(cafe_id, role) WHERE is_active = true;
```

## 3. Menu Management

### Categories Table
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_categories_cafe_active ON categories(cafe_id, is_active, sort_order);
```

### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sku VARCHAR(100),

    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),

    -- Inventory
    track_inventory BOOLEAN DEFAULT true,
    current_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    max_stock INTEGER,

    -- Glass tracking
    requires_glass BOOLEAN DEFAULT false,
    glass_type VARCHAR(50),

    -- Configuration
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Nutritional/Additional Info
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_products_cafe_active ON products(cafe_id, is_active, is_available);
CREATE INDEX idx_products_category ON products(category_id, sort_order);
CREATE INDEX idx_products_sku ON products(cafe_id, sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_inventory ON products(track_inventory, current_stock, reorder_level) WHERE is_active = true;
```

### Product Variants Table
```sql
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,

    -- Inventory (if variant-specific tracking needed)
    track_inventory BOOLEAN DEFAULT false,
    current_stock INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Order Management

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Order Details
    order_number VARCHAR(50) NOT NULL,

    -- Customer Info (for guest orders)
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),

    -- Counter Assignment
    assigned_counter VARCHAR(100),
    counter_activated_at TIMESTAMP WITH TIME ZONE,

    -- Order Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    status_history JSONB DEFAULT '[]',

    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),

    -- Employee Relations
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    proxy_order_for_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Special Instructions
    notes TEXT,
    special_instructions TEXT,

    -- Timing
    estimated_ready_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_orders_cafe_number ON orders(cafe_id, order_number);
CREATE INDEX idx_orders_status ON orders(cafe_id, status, created_at);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at);
CREATE INDEX idx_orders_counter ON orders(cafe_id, assigned_counter, status);
CREATE INDEX idx_orders_payment ON orders(payment_status, payment_method);
CREATE INDEX idx_orders_proxy ON orders(proxy_order_for_user_id) WHERE proxy_order_for_user_id IS NOT NULL;
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,

    -- Item Details
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    -- Snapshot of product info at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    variant_name VARCHAR(255),

    -- Customizations
    customizations JSONB DEFAULT '[]',
    special_instructions TEXT,

    -- Glass tracking
    glass_assigned_id UUID,
    glass_returned BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id, created_at);
CREATE INDEX idx_order_items_glass ON order_items(glass_assigned_id) WHERE glass_assigned_id IS NOT NULL;
```

## 5. Payment Management

### Payment Transactions Table
```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Transaction Details
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    external_transaction_id VARCHAR(255),

    -- Payment Info
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'qr', 'credit'
    payment_provider VARCHAR(50), -- 'payconic', 'stripe', etc.

    -- Amounts
    amount DECIMAL(10,2) NOT NULL,
    fee_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Provider Response
    provider_response JSONB,

    -- QR Code specific
    qr_code_data TEXT,
    qr_code_expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_payment_transactions_external ON payment_transactions(external_transaction_id) WHERE external_transaction_id IS NOT NULL;
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(cafe_id, status, created_at);
```

### Credit Accounts Table
```sql
CREATE TABLE credit_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    balance DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_credit_accounts_user_cafe ON credit_accounts(user_id, cafe_id);
```

### Credit Transactions Table
```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,

    -- Transaction Details
    type VARCHAR(20) NOT NULL, -- 'credit', 'debit'
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,

    -- Reference
    reference_type VARCHAR(50), -- 'order', 'topup', 'refund', 'adjustment'
    reference_id UUID,

    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_credit_transactions_account ON credit_transactions(credit_account_id, created_at);
```

## 6. Employee Management

### Employee Time Sheets Table
```sql
CREATE TABLE employee_time_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Time Tracking
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    break_duration_minutes INTEGER DEFAULT 0,

    -- Work Details
    shift_date DATE NOT NULL,
    total_hours DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    total_pay DECIMAL(10,2),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'approved'

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_time_sheets_user_date ON employee_time_sheets(user_id, shift_date);
CREATE INDEX idx_time_sheets_cafe_date ON employee_time_sheets(cafe_id, shift_date);
CREATE INDEX idx_time_sheets_active ON employee_time_sheets(user_id, status) WHERE status = 'active';
```

### Employee Drink Tracking Table
```sql
CREATE TABLE employee_drinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Drink Details
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,

    -- Tracking
    date_consumed DATE NOT NULL DEFAULT CURRENT_DATE,
    month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM' for easy querying

    -- Allowance tracking
    counted_against_allowance BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_employee_drinks_user_month ON employee_drinks(user_id, month_year);
CREATE INDEX idx_employee_drinks_cafe_date ON employee_drinks(cafe_id, date_consumed);
```

## 7. Inventory Management

### Inventory Adjustments Table
```sql
CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Adjustment Details
    adjustment_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'waste', 'count', 'transfer'
    quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,

    -- Cost tracking
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),

    -- Reference
    reference_type VARCHAR(50), -- 'order', 'purchase', 'manual'
    reference_id UUID,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_inventory_adjustments_product ON inventory_adjustments(product_id, created_at);
CREATE INDEX idx_inventory_adjustments_cafe_date ON inventory_adjustments(cafe_id, created_at);
CREATE INDEX idx_inventory_adjustments_type ON inventory_adjustments(cafe_id, adjustment_type, created_at);
```

### Purchase Orders Table
```sql
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Order Details
    order_number VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'ordered', 'received', 'cancelled'

    -- Totals
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Receipt
    receipt_image_url VARCHAR(500),
    receipt_notes TEXT,

    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    received_date DATE,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_purchase_orders_cafe_number ON purchase_orders(cafe_id, order_number);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(cafe_id, status, order_date);
```

### Purchase Order Items Table
```sql
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Item Details
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,

    -- Product info snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 8. Glass Tracking (Optional)

### Glasses Table
```sql
CREATE TABLE glasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

    -- Glass Details
    glass_type VARCHAR(50) NOT NULL,
    glass_code VARCHAR(50) UNIQUE NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'in_use', 'dirty', 'broken', 'lost'

    -- Tracking
    current_order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_uses INTEGER DEFAULT 0,

    -- Maintenance
    last_cleaned_at TIMESTAMP WITH TIME ZONE,
    needs_replacement BOOLEAN DEFAULT false,
    replacement_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_glasses_code ON glasses(glass_code);
CREATE INDEX idx_glasses_cafe_status ON glasses(cafe_id, status);
CREATE INDEX idx_glasses_type_status ON glasses(cafe_id, glass_type, status);
```

## 9. Analytics & Reporting

### Daily Sales Summary Table
```sql
CREATE TABLE daily_sales_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,

    summary_date DATE NOT NULL,

    -- Order Metrics
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,

    -- Revenue Metrics
    gross_revenue DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) DEFAULT 0,
    tax_collected DECIMAL(10,2) DEFAULT 0,
    tips_collected DECIMAL(10,2) DEFAULT 0,

    -- Payment Method Breakdown
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    credit_sales DECIMAL(10,2) DEFAULT 0,

    -- Product Performance
    top_selling_product_id UUID REFERENCES products(id),
    top_selling_quantity INTEGER DEFAULT 0,

    -- Efficiency Metrics
    avg_prep_time_minutes DECIMAL(5,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,

    -- Generated timestamp
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(cafe_id, summary_date)
);

-- Indexes
CREATE INDEX idx_daily_sales_cafe_date ON daily_sales_summary(cafe_id, summary_date);
```

## Database Functions & Triggers

### Updated At Trigger Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_cafes_updated_at BEFORE UPDATE ON cafes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all relevant tables)
```

### Order Number Generation Function
```sql
CREATE OR REPLACE FUNCTION generate_order_number(p_cafe_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    order_count INTEGER;
    order_number VARCHAR(50);
BEGIN
    -- Get today's order count for the cafe
    SELECT COUNT(*)
    INTO order_count
    FROM orders
    WHERE cafe_id = p_cafe_id
    AND DATE(created_at) = CURRENT_DATE;

    -- Generate order number: CAFE_PREFIX + YYYYMMDD + COUNT
    order_number := 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD((order_count + 1)::TEXT, 4, '0');

    RETURN order_number;
END;
$$ LANGUAGE plpgsql;
```

### Stock Level Update Trigger
```sql
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock when order item is created
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.product_id
        AND track_inventory = true;

        -- Check if stock is low and needs reordering
        INSERT INTO inventory_adjustments (
            cafe_id, product_id, user_id, adjustment_type,
            quantity_change, previous_stock, new_stock,
            reference_type, reference_id, notes
        )
        SELECT
            p.cafe_id, p.id,
            COALESCE(o.created_by_user_id, o.customer_id),
            'sale',
            -NEW.quantity,
            p.current_stock + NEW.quantity,
            p.current_stock,
            'order',
            NEW.order_id,
            'Automatic stock adjustment from order'
        FROM products p
        JOIN orders o ON o.id = NEW.order_id
        WHERE p.id = NEW.product_id
        AND p.track_inventory = true;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_order_item
    AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();
```

This comprehensive database schema provides:

1. **Multi-tenancy** with cafe-specific configurations
2. **Flexible user management** with role-based access
3. **Comprehensive order tracking** with status workflows
4. **Multi-payment support** with transaction logging
5. **Employee management** with time tracking and drink allowances
6. **Inventory management** with purchase tracking and adjustments
7. **Optional glass tracking** system
8. **Analytics and reporting** capabilities
9. **Audit trails** for all critical operations
10. **Performance optimization** with proper indexing

The schema is designed to scale and handle the complexity of multi-location restaurant operations while maintaining data integrity and providing rich querying capabilities.