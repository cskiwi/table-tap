-- =====================================================
-- RESTAURANT ORDERING SYSTEM - CORE ENTITIES SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. CAFES (Multi-tenant root entity)
-- =====================================================

CREATE TABLE cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address JSONB, -- {street, city, postal_code, country, coordinates}
    contact_info JSONB, -- {phone, email, website, social_media}
    business_settings JSONB DEFAULT '{}', -- Cafe-specific configurations
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'EUR',
    tax_rate DECIMAL(5,4) DEFAULT 0.21, -- 21% VAT by default
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_tier VARCHAR(20) DEFAULT 'basic',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_business_settings CHECK (jsonb_typeof(business_settings) = 'object'),
    CONSTRAINT valid_address CHECK (jsonb_typeof(address) = 'object'),
    CONSTRAINT valid_contact_info CHECK (jsonb_typeof(contact_info) = 'object')
);

-- =====================================================
-- 2. USERS (Customers, Employees, Admins)
-- =====================================================

CREATE TYPE user_role AS ENUM ('customer', 'employee', 'manager', 'admin', 'super_admin');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple', 'facebook');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255), -- bcrypt hash
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_picture_url VARCHAR(500),
    role user_role DEFAULT 'customer',
    permissions JSONB DEFAULT '[]', -- Additional granular permissions
    auth_provider auth_provider DEFAULT 'email',
    external_id VARCHAR(255), -- ID from external auth provider
    preferences JSONB DEFAULT '{}', -- User preferences and settings
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    gdpr_consent_at TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    data_retention_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_permissions CHECK (jsonb_typeof(permissions) = 'array'),
    CONSTRAINT valid_preferences CHECK (jsonb_typeof(preferences) = 'object'),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- 3. PRODUCT CATEGORIES
-- =====================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(100), -- Icon identifier
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- =====================================================
-- 4. PRODUCTS
-- =====================================================

CREATE TYPE product_type AS ENUM ('drink', 'food', 'merchandise', 'service');
CREATE TYPE availability_status AS ENUM ('available', 'limited', 'out_of_stock', 'discontinued');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sku VARCHAR(50), -- Stock Keeping Unit
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_type product_type NOT NULL DEFAULT 'drink',
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    images JSONB DEFAULT '[]', -- Array of image URLs
    nutritional_info JSONB, -- Calories, allergens, etc.
    preparation_time INTEGER, -- Minutes
    ingredients JSONB DEFAULT '[]', -- Array of ingredient objects
    customizations JSONB DEFAULT '[]', -- Available customization options
    tags JSONB DEFAULT '[]', -- Searchable tags
    availability_status availability_status DEFAULT 'available',
    available_from TIME,
    available_until TIME,
    seasonal_from DATE,
    seasonal_until DATE,
    min_stock_level INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(cafe_id, sku),
    CONSTRAINT valid_images CHECK (jsonb_typeof(images) = 'array'),
    CONSTRAINT valid_ingredients CHECK (jsonb_typeof(ingredients) = 'array'),
    CONSTRAINT valid_customizations CHECK (jsonb_typeof(customizations) = 'array'),
    CONSTRAINT valid_tags CHECK (jsonb_typeof(tags) = 'array')
);

-- =====================================================
-- 5. COUNTERS (Physical service points)
-- =====================================================

CREATE TYPE counter_status AS ENUM ('active', 'maintenance', 'closed');

CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100), -- Physical location description
    counter_type VARCHAR(50) DEFAULT 'main', -- main, express, mobile, etc.
    max_concurrent_orders INTEGER DEFAULT 10,
    configuration JSONB DEFAULT '{}', -- Counter-specific settings
    status counter_status DEFAULT 'active',
    opened_at TIME,
    closed_at TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT valid_configuration CHECK (jsonb_typeof(configuration) = 'object')
);

-- =====================================================
-- 6. ORDERS
-- =====================================================

CREATE TYPE order_status AS ENUM (
    'draft', 'pending', 'confirmed', 'preparing', 'ready',
    'completed', 'cancelled', 'refunded'
);

CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    order_number VARCHAR(20) NOT NULL, -- Human-readable order number
    order_type order_type DEFAULT 'dine_in',
    status order_status DEFAULT 'draft',
    customer_name VARCHAR(255), -- For guest orders
    customer_phone VARCHAR(20),
    customer_notes TEXT,
    internal_notes TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    tip_amount DECIMAL(10,2) DEFAULT 0 CHECK (tip_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    estimated_ready_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    metadata JSONB DEFAULT '{}', -- Additional order data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, order_number),
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT valid_amounts CHECK (total_amount = subtotal + tax_amount + tip_amount - discount_amount)
);

-- =====================================================
-- 7. ORDER ITEMS
-- =====================================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    customizations JSONB DEFAULT '{}', -- Item-specific customizations
    special_instructions TEXT,
    line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_customizations CHECK (jsonb_typeof(customizations) = 'object'),
    CONSTRAINT valid_line_total CHECK (line_total = quantity * unit_price)
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER cafes_updated_at BEFORE UPDATE ON cafes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER counters_updated_at BEFORE UPDATE ON counters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();