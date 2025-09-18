-- =====================================================
-- RESTAURANT ORDERING SYSTEM - INVENTORY MANAGEMENT
-- =====================================================

-- =====================================================
-- 1. SUPPLIERS
-- =====================================================

CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'blacklisted');

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Internal supplier code
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB, -- {street, city, postal_code, country}
    payment_terms VARCHAR(100), -- e.g., "Net 30", "Cash on Delivery"
    tax_number VARCHAR(50),
    website VARCHAR(255),
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status supplier_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, code),
    CONSTRAINT valid_address CHECK (jsonb_typeof(address) = 'object'),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- 2. INVENTORY CATEGORIES
-- =====================================================

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- =====================================================
-- 3. INVENTORY ITEMS
-- =====================================================

CREATE TYPE unit_type AS ENUM ('piece', 'kg', 'g', 'l', 'ml', 'pack', 'box', 'bottle', 'bag');
CREATE TYPE inventory_status AS ENUM ('active', 'discontinued', 'out_of_stock');

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    sku VARCHAR(50), -- Stock Keeping Unit
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit unit_type NOT NULL,
    unit_size DECIMAL(10,3), -- Size per unit (e.g., 0.5 for 500ml bottles)
    current_stock DECIMAL(10,3) DEFAULT 0 CHECK (current_stock >= 0),
    reserved_stock DECIMAL(10,3) DEFAULT 0 CHECK (reserved_stock >= 0),
    available_stock DECIMAL(10,3) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    reorder_level DECIMAL(10,3) DEFAULT 0,
    max_stock_level DECIMAL(10,3),
    cost_per_unit DECIMAL(10,4),
    last_cost_per_unit DECIMAL(10,4),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_sku VARCHAR(100), -- Supplier's SKU
    lead_time_days INTEGER DEFAULT 7,
    shelf_life_days INTEGER,
    storage_location VARCHAR(100),
    barcode VARCHAR(100),
    status inventory_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, sku),
    CONSTRAINT valid_stock_levels CHECK (max_stock_level IS NULL OR max_stock_level >= reorder_level)
);

-- =====================================================
-- 4. PRODUCT INGREDIENTS (Recipe Management)
-- =====================================================

CREATE TABLE product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10,3) NOT NULL CHECK (quantity_required > 0),
    unit unit_type NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(product_id, inventory_item_id)
);

-- =====================================================
-- 5. STOCK MOVEMENTS
-- =====================================================

CREATE TYPE movement_type AS ENUM (
    'purchase', 'sale', 'waste', 'theft', 'adjustment',
    'transfer', 'return', 'production', 'sample'
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,4),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reference_id UUID, -- Reference to order, purchase, etc.
    reference_type VARCHAR(50), -- 'order', 'purchase', 'adjustment', etc.
    batch_number VARCHAR(100),
    expiry_date DATE,
    reason TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_quantity CHECK (
        (movement_type IN ('purchase', 'return', 'adjustment', 'production') AND quantity > 0) OR
        (movement_type IN ('sale', 'waste', 'theft', 'transfer', 'sample') AND quantity < 0)
    )
);

-- =====================================================
-- 6. PURCHASES
-- =====================================================

CREATE TYPE purchase_status AS ENUM ('draft', 'ordered', 'received', 'invoiced', 'paid', 'cancelled');

CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_number VARCHAR(50) NOT NULL,
    supplier_invoice_number VARCHAR(100),
    status purchase_status DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    received_date DATE,
    invoice_date DATE,
    payment_due_date DATE,
    subtotal DECIMAL(10,2) DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax_amount + shipping_cost) STORED,
    currency VARCHAR(3) DEFAULT 'EUR',
    notes TEXT,
    ordered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, purchase_number)
);

-- =====================================================
-- 7. PURCHASE ITEMS
-- =====================================================

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_ordered DECIMAL(10,3) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received DECIMAL(10,3) DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost DECIMAL(10,4) NOT NULL CHECK (unit_cost >= 0),
    line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(purchase_id, inventory_item_id)
);

-- =====================================================
-- 8. WASTE TRACKING
-- =====================================================

CREATE TYPE waste_reason AS ENUM ('expired', 'damaged', 'spillage', 'over_production', 'quality_issue', 'other');

CREATE TABLE waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,4),
    waste_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reason waste_reason NOT NULL,
    description TEXT,
    batch_number VARCHAR(100),
    expiry_date DATE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. GLASS INVENTORY (Optional specialized tracking)
-- =====================================================

CREATE TYPE glass_status AS ENUM ('available', 'in_use', 'dirty', 'broken', 'lost');

CREATE TABLE glass_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    glass_type VARCHAR(100) NOT NULL, -- e.g., "Beer Glass 500ml", "Wine Glass"
    size_ml INTEGER NOT NULL,
    total_count INTEGER NOT NULL DEFAULT 0 CHECK (total_count >= 0),
    available_count INTEGER NOT NULL DEFAULT 0 CHECK (available_count >= 0),
    in_use_count INTEGER NOT NULL DEFAULT 0 CHECK (in_use_count >= 0),
    dirty_count INTEGER NOT NULL DEFAULT 0 CHECK (dirty_count >= 0),
    broken_count INTEGER NOT NULL DEFAULT 0 CHECK (broken_count >= 0),
    lost_count INTEGER NOT NULL DEFAULT 0 CHECK (lost_count >= 0),
    purchase_cost_per_unit DECIMAL(10,2),
    replacement_cost_per_unit DECIMAL(10,2),
    last_inventory_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, glass_type, size_ml),
    CONSTRAINT glass_count_consistency CHECK (
        total_count = available_count + in_use_count + dirty_count + broken_count + lost_count
    )
);

-- =====================================================
-- 10. REORDER RECOMMENDATIONS
-- =====================================================

CREATE TABLE reorder_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    current_stock DECIMAL(10,3) NOT NULL,
    reorder_level DECIMAL(10,3) NOT NULL,
    recommended_quantity DECIMAL(10,3) NOT NULL,
    estimated_cost DECIMAL(10,2),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    days_until_stockout INTEGER,
    last_sale_date DATE,
    average_daily_usage DECIMAL(10,3),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER inventory_categories_updated_at BEFORE UPDATE ON inventory_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER product_ingredients_updated_at BEFORE UPDATE ON product_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER purchase_items_updated_at BEFORE UPDATE ON purchase_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER glass_inventory_updated_at BEFORE UPDATE ON glass_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INVENTORY MANAGEMENT FUNCTIONS
-- =====================================================

-- Update inventory after stock movement
CREATE OR REPLACE FUNCTION update_inventory_from_movement()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.inventory_item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_movement_trigger
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_inventory_from_movement();

-- Generate reorder recommendations
CREATE OR REPLACE FUNCTION generate_reorder_recommendations(p_cafe_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_item RECORD;
    v_avg_usage DECIMAL(10,3);
    v_days_until_stockout INTEGER;
    v_recommended_qty DECIMAL(10,3);
    v_count INTEGER := 0;
BEGIN
    -- Clear existing recommendations
    DELETE FROM reorder_recommendations WHERE cafe_id = p_cafe_id;

    FOR v_item IN
        SELECT * FROM inventory_items
        WHERE cafe_id = p_cafe_id
          AND status = 'active'
          AND current_stock <= reorder_level
    LOOP
        -- Calculate average daily usage from last 30 days
        SELECT COALESCE(ABS(AVG(quantity)), 0) INTO v_avg_usage
        FROM stock_movements
        WHERE inventory_item_id = v_item.id
          AND movement_type = 'sale'
          AND created_at >= NOW() - INTERVAL '30 days';

        -- Calculate days until stockout
        IF v_avg_usage > 0 THEN
            v_days_until_stockout := FLOOR(v_item.current_stock / v_avg_usage);
        ELSE
            v_days_until_stockout := 999;
        END IF;

        -- Calculate recommended quantity (30 days supply)
        v_recommended_qty := GREATEST(
            v_item.max_stock_level - v_item.current_stock,
            v_avg_usage * 30
        );

        INSERT INTO reorder_recommendations (
            cafe_id, inventory_item_id, current_stock, reorder_level,
            recommended_quantity, estimated_cost, priority,
            days_until_stockout, average_daily_usage
        ) VALUES (
            p_cafe_id, v_item.id, v_item.current_stock, v_item.reorder_level,
            v_recommended_qty, v_recommended_qty * v_item.cost_per_unit,
            CASE
                WHEN v_days_until_stockout <= 3 THEN 5
                WHEN v_days_until_stockout <= 7 THEN 4
                WHEN v_days_until_stockout <= 14 THEN 3
                WHEN v_days_until_stockout <= 21 THEN 2
                ELSE 1
            END,
            v_days_until_stockout, v_avg_usage
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;