-- =====================================================
-- RESTAURANT ORDERING SYSTEM - PAYMENTS & TRANSACTIONS
-- =====================================================

-- =====================================================
-- 1. PAYMENT METHODS
-- =====================================================

CREATE TYPE payment_type AS ENUM ('cash', 'card', 'digital_wallet', 'bank_transfer', 'crypto', 'store_credit');
CREATE TYPE payment_method_status AS ENUM ('active', 'inactive', 'maintenance');

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Visa", "PayPal", "Cash"
    payment_type payment_type NOT NULL,
    provider VARCHAR(100), -- Stripe, Square, PayPal, etc.
    configuration JSONB DEFAULT '{}', -- Provider-specific settings
    fee_percentage DECIMAL(5,4) DEFAULT 0, -- Transaction fee %
    fee_fixed DECIMAL(10,2) DEFAULT 0, -- Fixed fee per transaction
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    maximum_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    requires_verification BOOLEAN DEFAULT FALSE,
    is_refundable BOOLEAN DEFAULT TRUE,
    status payment_method_status DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT valid_configuration CHECK (jsonb_typeof(configuration) = 'object'),
    CONSTRAINT valid_fees CHECK (fee_percentage >= 0 AND fee_fixed >= 0)
);

-- =====================================================
-- 2. PAYMENTS
-- =====================================================

CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'completed', 'failed',
    'cancelled', 'refunded', 'partially_refunded', 'disputed'
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
    payment_intent_id VARCHAR(255), -- External payment provider ID
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    fee_amount DECIMAL(10,2) DEFAULT 0 CHECK (fee_amount >= 0),
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - fee_amount) STORED,
    currency VARCHAR(3) DEFAULT 'EUR',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    status payment_status DEFAULT 'pending',
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}', -- Provider-specific data
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Employee who processed
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- =====================================================
-- 3. TRANSACTIONS (Audit trail for all financial movements)
-- =====================================================

CREATE TYPE transaction_type AS ENUM (
    'payment', 'refund', 'fee', 'tip', 'discount',
    'adjustment', 'payout', 'chargeback'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT NOT NULL,
    reference_id VARCHAR(255), -- External reference
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT non_zero_amount CHECK (amount != 0)
);

-- =====================================================
-- 4. REFUNDS
-- =====================================================

CREATE TYPE refund_reason AS ENUM (
    'customer_request', 'order_error', 'product_unavailable',
    'quality_issue', 'processing_error', 'duplicate_payment', 'other'
);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    refund_id VARCHAR(255), -- External provider refund ID
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    reason refund_reason NOT NULL,
    notes TEXT,
    processed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TIP DISTRIBUTIONS
-- =====================================================

CREATE TABLE tip_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tip_amount DECIMAL(10,2) NOT NULL CHECK (tip_amount >= 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    distribution_method VARCHAR(50) DEFAULT 'equal_split', -- equal_split, hours_worked, custom
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- =====================================================
-- 6. STORE CREDITS
-- =====================================================

CREATE TYPE credit_status AS ENUM ('active', 'used', 'expired', 'cancelled');

CREATE TABLE store_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL CHECK (original_amount > 0),
    remaining_amount DECIMAL(10,2) NOT NULL CHECK (remaining_amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    reason TEXT,
    issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status credit_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_remaining_amount CHECK (remaining_amount <= original_amount)
);

-- =====================================================
-- 7. STORE CREDIT TRANSACTIONS
-- =====================================================

CREATE TABLE store_credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_credit_id UUID NOT NULL REFERENCES store_credits(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('issued', 'used', 'expired', 'refunded')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update payment method updated_at
CREATE TRIGGER payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update payments updated_at
CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update refunds updated_at
CREATE TRIGGER refunds_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update store credits updated_at
CREATE TRIGGER store_credits_updated_at
    BEFORE UPDATE ON store_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR FINANCIAL CALCULATIONS
-- =====================================================

-- Calculate payment fees
CREATE OR REPLACE FUNCTION calculate_payment_fee(
    p_amount DECIMAL(10,2),
    p_payment_method_id UUID
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_fee_percentage DECIMAL(5,4);
    v_fee_fixed DECIMAL(10,2);
    v_total_fee DECIMAL(10,2);
BEGIN
    SELECT fee_percentage, fee_fixed
    INTO v_fee_percentage, v_fee_fixed
    FROM payment_methods
    WHERE id = p_payment_method_id;

    v_total_fee := (p_amount * v_fee_percentage / 100) + v_fee_fixed;

    RETURN ROUND(v_total_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Update store credit remaining amount
CREATE OR REPLACE FUNCTION update_store_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'used' THEN
        UPDATE store_credits
        SET remaining_amount = remaining_amount - NEW.amount,
            status = CASE
                WHEN remaining_amount - NEW.amount <= 0 THEN 'used'::credit_status
                ELSE status
            END
        WHERE id = NEW.store_credit_id;
    ELSIF NEW.type = 'refunded' THEN
        UPDATE store_credits
        SET remaining_amount = remaining_amount + NEW.amount,
            status = 'active'::credit_status
        WHERE id = NEW.store_credit_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_credit_balance_trigger
    AFTER INSERT ON store_credit_transactions
    FOR EACH ROW EXECUTE FUNCTION update_store_credit_balance();