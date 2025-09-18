-- =====================================================
-- RESTAURANT ORDERING SYSTEM - CONFIGURATION & SETTINGS
-- =====================================================

-- =====================================================
-- 1. CAFE SETTINGS (Business-specific configurations)
-- =====================================================

CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json', 'encrypted');

CREATE TABLE cafe_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type setting_type DEFAULT 'string',
    default_value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- Can be shown to customers
    category VARCHAR(50) DEFAULT 'general', -- general, payment, order, inventory, employee
    sort_order INTEGER DEFAULT 0,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, setting_key),
    CONSTRAINT valid_category CHECK (category IN ('general', 'payment', 'order', 'inventory', 'employee', 'notification', 'integration'))
);

-- =====================================================
-- 2. ORDER WORKFLOW CONFIGURATIONS
-- =====================================================

CREATE TABLE order_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    workflow_steps JSONB NOT NULL, -- Array of step configurations
    auto_transitions JSONB DEFAULT '{}', -- Automatic state transitions
    notification_rules JSONB DEFAULT '{}', -- When to send notifications
    estimated_times JSONB DEFAULT '{}', -- Expected time for each step
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT valid_workflow_steps CHECK (jsonb_typeof(workflow_steps) = 'array'),
    CONSTRAINT valid_auto_transitions CHECK (jsonb_typeof(auto_transitions) = 'object'),
    CONSTRAINT valid_notification_rules CHECK (jsonb_typeof(notification_rules) = 'object'),
    CONSTRAINT valid_estimated_times CHECK (jsonb_typeof(estimated_times) = 'object')
);

-- =====================================================
-- 3. COUNTER CONFIGURATIONS
-- =====================================================

CREATE TABLE counter_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counter_id UUID UNIQUE NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    pos_system_config JSONB DEFAULT '{}', -- POS system settings
    printer_config JSONB DEFAULT '{}', -- Receipt/kitchen printer settings
    payment_terminal_config JSONB DEFAULT '{}', -- Payment terminal settings
    display_settings JSONB DEFAULT '{}', -- Screen layout and display options
    workflow_id UUID REFERENCES order_workflows(id) ON DELETE SET NULL,
    auto_print_receipts BOOLEAN DEFAULT TRUE,
    auto_print_kitchen_orders BOOLEAN DEFAULT TRUE,
    require_customer_signature BOOLEAN DEFAULT FALSE,
    max_cash_drawer_amount DECIMAL(10,2) DEFAULT 1000.00,
    allow_negative_inventory BOOLEAN DEFAULT FALSE,
    enable_loyalty_program BOOLEAN DEFAULT TRUE,
    default_tip_percentages JSONB DEFAULT '[15, 18, 20, 25]', -- Suggested tip percentages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_pos_config CHECK (jsonb_typeof(pos_system_config) = 'object'),
    CONSTRAINT valid_printer_config CHECK (jsonb_typeof(printer_config) = 'object'),
    CONSTRAINT valid_payment_terminal_config CHECK (jsonb_typeof(payment_terminal_config) = 'object'),
    CONSTRAINT valid_display_settings CHECK (jsonb_typeof(display_settings) = 'object'),
    CONSTRAINT valid_tip_percentages CHECK (jsonb_typeof(default_tip_percentages) = 'array')
);

-- =====================================================
-- 4. TIP CALCULATION RULES
-- =====================================================

CREATE TYPE tip_distribution_method AS ENUM ('equal_split', 'hours_worked', 'sales_percentage', 'role_based', 'custom');

CREATE TABLE tip_calculation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    distribution_method tip_distribution_method DEFAULT 'equal_split',
    role_multipliers JSONB DEFAULT '{}', -- Role-based tip multipliers
    minimum_hours_threshold DECIMAL(4,2) DEFAULT 0, -- Minimum hours to qualify for tips
    maximum_tip_percentage DECIMAL(5,2) DEFAULT 25, -- Maximum tip % of order
    pool_percentage DECIMAL(5,2) DEFAULT 100, -- % of tips that go to pool
    house_percentage DECIMAL(5,2) DEFAULT 0, -- % that goes to house
    exclude_management BOOLEAN DEFAULT FALSE,
    calculation_period VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    auto_distribution BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT valid_role_multipliers CHECK (jsonb_typeof(role_multipliers) = 'object'),
    CONSTRAINT valid_percentages CHECK (
        pool_percentage + house_percentage <= 100 AND
        maximum_tip_percentage >= 0 AND maximum_tip_percentage <= 100
    ),
    CONSTRAINT valid_effective_dates CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

-- =====================================================
-- 5. NOTIFICATION TEMPLATES
-- =====================================================

CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app', 'webhook');
CREATE TYPE notification_trigger AS ENUM (
    'order_placed', 'order_ready', 'order_completed', 'payment_failed',
    'inventory_low', 'employee_late', 'shift_reminder', 'daily_report',
    'weekly_report', 'customer_birthday', 'loyalty_reward'
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    trigger_event notification_trigger NOT NULL,
    channel notification_channel NOT NULL,
    subject VARCHAR(255), -- For email/push notifications
    template_body TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Available template variables
    is_html BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    send_delay_minutes INTEGER DEFAULT 0,
    conditions JSONB DEFAULT '{}', -- Conditions for sending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, trigger_event, channel),
    CONSTRAINT valid_variables CHECK (jsonb_typeof(variables) = 'array'),
    CONSTRAINT valid_conditions CHECK (jsonb_typeof(conditions) = 'object')
);

-- =====================================================
-- 6. LOYALTY PROGRAM CONFIGURATION
-- =====================================================

CREATE TYPE loyalty_action AS ENUM ('purchase', 'visit', 'referral', 'review', 'birthday', 'signup');
CREATE TYPE reward_type AS ENUM ('points', 'discount_percentage', 'discount_fixed', 'free_item', 'free_drink');

CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_per_dollar DECIMAL(5,2) DEFAULT 1.0, -- Points earned per dollar spent
    signup_bonus_points INTEGER DEFAULT 0,
    referral_bonus_points INTEGER DEFAULT 0,
    birthday_bonus_points INTEGER DEFAULT 0,
    tier_thresholds JSONB DEFAULT '[]', -- Array of tier configurations
    point_expiry_months INTEGER DEFAULT 12,
    minimum_redemption_points INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT valid_tier_thresholds CHECK (jsonb_typeof(tier_thresholds) = 'array')
);

-- =====================================================
-- 7. LOYALTY REWARDS
-- =====================================================

CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    reward_type reward_type NOT NULL,
    points_required INTEGER NOT NULL CHECK (points_required > 0),
    discount_value DECIMAL(10,2), -- Discount amount or percentage
    free_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    usage_limit_per_customer INTEGER, -- How many times a customer can use this reward
    total_usage_limit INTEGER, -- Total times this reward can be used
    current_usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_validity_dates CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- =====================================================
-- 8. CUSTOMER LOYALTY ACCOUNTS
-- =====================================================

CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

CREATE TABLE customer_loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    membership_number VARCHAR(50) UNIQUE NOT NULL,
    current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
    lifetime_points INTEGER DEFAULT 0 CHECK (lifetime_points >= 0),
    current_tier loyalty_tier DEFAULT 'bronze',
    tier_progress INTEGER DEFAULT 0, -- Points towards next tier
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_expire_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(customer_id, loyalty_program_id)
);

-- =====================================================
-- 9. LOYALTY TRANSACTIONS
-- =====================================================

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_account_id UUID NOT NULL REFERENCES customer_loyalty_accounts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type loyalty_action NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    points_balance_after INTEGER NOT NULL,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT points_consistency CHECK (
        (points_earned > 0 AND points_redeemed = 0) OR
        (points_earned = 0 AND points_redeemed > 0) OR
        (points_earned = 0 AND points_redeemed = 0)
    )
);

-- =====================================================
-- 10. INTEGRATIONS CONFIGURATION
-- =====================================================

CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending_setup');

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'accounting', 'inventory', 'delivery', 'marketing'
    provider_name VARCHAR(100) NOT NULL, -- 'quickbooks', 'xero', 'mailchimp', etc.
    configuration JSONB NOT NULL DEFAULT '{}',
    credentials JSONB, -- Encrypted API keys, tokens, etc.
    webhook_url VARCHAR(500),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency_minutes INTEGER DEFAULT 60,
    status integration_status DEFAULT 'pending_setup',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, integration_type, provider_name),
    CONSTRAINT valid_configuration CHECK (jsonb_typeof(configuration) = 'object')
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER cafe_settings_updated_at BEFORE UPDATE ON cafe_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER order_workflows_updated_at BEFORE UPDATE ON order_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER counter_configurations_updated_at BEFORE UPDATE ON counter_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tip_calculation_rules_updated_at BEFORE UPDATE ON tip_calculation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER customer_loyalty_accounts_updated_at BEFORE UPDATE ON customer_loyalty_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONFIGURATION FUNCTIONS
-- =====================================================

-- Get cafe setting with type casting
CREATE OR REPLACE FUNCTION get_cafe_setting(
    p_cafe_id UUID,
    p_setting_key VARCHAR(100),
    p_default_value TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_setting_value TEXT;
BEGIN
    SELECT setting_value INTO v_setting_value
    FROM cafe_settings
    WHERE cafe_id = p_cafe_id AND setting_key = p_setting_key;

    RETURN COALESCE(v_setting_value, p_default_value);
END;
$$ LANGUAGE plpgsql;

-- Set cafe setting
CREATE OR REPLACE FUNCTION set_cafe_setting(
    p_cafe_id UUID,
    p_setting_key VARCHAR(100),
    p_setting_value TEXT,
    p_setting_type setting_type DEFAULT 'string',
    p_updated_by UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cafe_settings (cafe_id, setting_key, setting_value, setting_type, updated_by)
    VALUES (p_cafe_id, p_setting_key, p_setting_value, p_setting_type, p_updated_by)
    ON CONFLICT (cafe_id, setting_key)
    DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        setting_type = EXCLUDED.setting_type,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Update loyalty points
CREATE OR REPLACE FUNCTION update_loyalty_points(
    p_customer_id UUID,
    p_loyalty_program_id UUID,
    p_points_change INTEGER,
    p_transaction_type loyalty_action,
    p_order_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_account_id UUID;
    v_current_points INTEGER;
    v_new_balance INTEGER;
    v_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get or create loyalty account
    SELECT id, current_points INTO v_account_id, v_current_points
    FROM customer_loyalty_accounts
    WHERE customer_id = p_customer_id AND loyalty_program_id = p_loyalty_program_id;

    IF v_account_id IS NULL THEN
        INSERT INTO customer_loyalty_accounts (customer_id, loyalty_program_id, membership_number)
        VALUES (p_customer_id, p_loyalty_program_id, 'LM' || EXTRACT(EPOCH FROM NOW())::BIGINT)
        RETURNING id, current_points INTO v_account_id, v_current_points;
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_points + p_points_change;

    -- Set expiry date for earned points (12 months from now)
    IF p_points_change > 0 THEN
        v_expiry_date := NOW() + INTERVAL '12 months';
    END IF;

    -- Update account
    UPDATE customer_loyalty_accounts SET
        current_points = v_new_balance,
        lifetime_points = CASE WHEN p_points_change > 0 THEN lifetime_points + p_points_change ELSE lifetime_points END,
        last_activity_at = NOW()
    WHERE id = v_account_id;

    -- Record transaction
    INSERT INTO loyalty_transactions (
        loyalty_account_id, order_id, transaction_type,
        points_earned, points_redeemed, points_balance_after,
        description, expires_at
    ) VALUES (
        v_account_id, p_order_id, p_transaction_type,
        CASE WHEN p_points_change > 0 THEN p_points_change ELSE 0 END,
        CASE WHEN p_points_change < 0 THEN ABS(p_points_change) ELSE 0 END,
        v_new_balance, p_description, v_expiry_date
    );
END;
$$ LANGUAGE plpgsql;