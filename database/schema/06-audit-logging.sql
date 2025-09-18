-- =====================================================
-- RESTAURANT ORDERING SYSTEM - AUDIT & LOGGING
-- =====================================================

-- =====================================================
-- 1. AUDIT LOGS (Complete action tracking)
-- =====================================================

CREATE TYPE audit_action AS ENUM (
    'create', 'update', 'delete', 'login', 'logout', 'view',
    'export', 'import', 'approve', 'reject', 'cancel', 'refund'
);

CREATE TYPE audit_entity AS ENUM (
    'user', 'order', 'product', 'payment', 'inventory', 'employee',
    'setting', 'report', 'integration', 'loyalty', 'counter', 'shift'
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action audit_action NOT NULL,
    entity_type audit_entity NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB, -- Array of field names that changed
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    duration_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    gdpr_sensitive BOOLEAN DEFAULT FALSE, -- Marks logs containing sensitive data
    retention_until TIMESTAMP WITH TIME ZONE, -- When this log should be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT valid_changed_fields CHECK (changed_fields IS NULL OR jsonb_typeof(changed_fields) = 'array')
);

-- Partition audit_logs by month for performance
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_y2024m02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Additional partitions would be created as needed

-- =====================================================
-- 2. DATA ACCESS LOGS (GDPR compliance)
-- =====================================================

CREATE TYPE access_type AS ENUM ('read', 'export', 'delete', 'anonymize', 'rectify');

CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    subject_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User whose data was accessed
    accessor_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who accessed the data
    access_type access_type NOT NULL,
    data_types JSONB NOT NULL, -- Array of data types accessed (personal, financial, etc.)
    legal_basis VARCHAR(100), -- GDPR legal basis for access
    purpose TEXT, -- Why the data was accessed
    tables_accessed JSONB, -- Database tables that were accessed
    records_count INTEGER,
    ip_address INET,
    user_agent TEXT,
    consent_given BOOLEAN,
    automated_processing BOOLEAN DEFAULT FALSE,
    retention_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_data_types CHECK (jsonb_typeof(data_types) = 'array'),
    CONSTRAINT valid_tables_accessed CHECK (tables_accessed IS NULL OR jsonb_typeof(tables_accessed) = 'array')
);

-- =====================================================
-- 3. SECURITY LOGS
-- =====================================================

CREATE TYPE security_event AS ENUM (
    'failed_login', 'account_locked', 'password_changed', 'suspicious_activity',
    'privilege_escalation', 'data_breach_attempt', 'unauthorized_access',
    'multiple_sessions', 'unusual_location', 'rate_limit_exceeded'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type security_event NOT NULL,
    risk_level risk_level DEFAULT 'medium',
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB, -- Geolocation info
    device_fingerprint VARCHAR(255),
    session_id VARCHAR(255),
    additional_data JSONB DEFAULT '{}',
    investigated BOOLEAN DEFAULT FALSE,
    investigated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    investigated_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT,
    false_positive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_location_data CHECK (location_data IS NULL OR jsonb_typeof(location_data) = 'object'),
    CONSTRAINT valid_additional_data CHECK (jsonb_typeof(additional_data) = 'object')
);

-- =====================================================
-- 4. SYSTEM LOGS
-- =====================================================

CREATE TYPE log_level AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
CREATE TYPE log_source AS ENUM ('api', 'web', 'mobile', 'pos', 'integration', 'system', 'cron');

CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    log_level log_level NOT NULL,
    source log_source NOT NULL,
    component VARCHAR(100), -- API endpoint, service name, etc.
    message TEXT NOT NULL,
    stack_trace TEXT,
    request_id VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    correlation_id VARCHAR(100), -- For tracking related events
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    additional_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_additional_context CHECK (jsonb_typeof(additional_context) = 'object')
);

-- Partition system_logs by month
CREATE TABLE system_logs_y2024m01 PARTITION OF system_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- =====================================================
-- 5. FINANCIAL AUDIT TRAIL
-- =====================================================

CREATE TYPE financial_action AS ENUM (
    'payment_processed', 'refund_issued', 'adjustment_made', 'discount_applied',
    'tip_distributed', 'cash_drawer_opened', 'reconciliation_performed',
    'payout_processed', 'fee_charged', 'chargeback_received'
);

CREATE TABLE financial_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    action financial_action NOT NULL,
    amount DECIMAL(15,4) NOT NULL, -- High precision for financial calculations
    currency VARCHAR(3) DEFAULT 'EUR',
    reference_type VARCHAR(50), -- 'order', 'payment', 'refund', etc.
    reference_id UUID,
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_method VARCHAR(100),
    transaction_fee DECIMAL(10,4) DEFAULT 0,
    before_balance DECIMAL(15,4),
    after_balance DECIMAL(15,4),
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    external_reference VARCHAR(255), -- External system reference
    batch_id VARCHAR(100), -- For batch processing
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT non_zero_amount CHECK (amount != 0)
);

-- =====================================================
-- 6. GDPR DATA REQUESTS
-- =====================================================

CREATE TYPE gdpr_request_type AS ENUM (
    'access', 'rectification', 'erasure', 'portability',
    'restriction', 'objection', 'withdraw_consent'
);

CREATE TYPE gdpr_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected', 'expired');

CREATE TABLE gdpr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    subject_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_type gdpr_request_type NOT NULL,
    status gdpr_status DEFAULT 'pending',
    request_details TEXT,
    identity_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100),
    verification_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE, -- 30 days from request
    completed_date TIMESTAMP WITH TIME ZONE,
    response_sent BOOLEAN DEFAULT FALSE,
    response_method VARCHAR(50), -- 'email', 'postal', 'in_person'
    data_exported_path VARCHAR(500), -- Path to exported data
    deletion_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. DATA RETENTION POLICIES
-- =====================================================

CREATE TYPE retention_action AS ENUM ('delete', 'anonymize', 'archive', 'review');

CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    data_category VARCHAR(100) NOT NULL, -- 'user_data', 'transaction_data', etc.
    table_name VARCHAR(100) NOT NULL,
    retention_period_months INTEGER NOT NULL CHECK (retention_period_months > 0),
    action_after_retention retention_action DEFAULT 'delete',
    legal_basis TEXT,
    exceptions JSONB DEFAULT '[]', -- Conditions where retention period differs
    automated_processing BOOLEAN DEFAULT TRUE,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    next_processing_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, data_category, table_name),
    CONSTRAINT valid_exceptions CHECK (jsonb_typeof(exceptions) = 'array')
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC AUDITING
-- =====================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_audit_action audit_action;
    v_entity_type audit_entity;
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields JSONB;
    v_cafe_id UUID;
BEGIN
    -- Determine action type
    CASE TG_OP
        WHEN 'INSERT' THEN v_audit_action := 'create';
        WHEN 'UPDATE' THEN v_audit_action := 'update';
        WHEN 'DELETE' THEN v_audit_action := 'delete';
    END CASE;

    -- Determine entity type from table name
    v_entity_type := CASE TG_TABLE_NAME
        WHEN 'users' THEN 'user'::audit_entity
        WHEN 'orders' THEN 'order'::audit_entity
        WHEN 'products' THEN 'product'::audit_entity
        WHEN 'payments' THEN 'payment'::audit_entity
        WHEN 'inventory_items' THEN 'inventory'::audit_entity
        WHEN 'employee_profiles' THEN 'employee'::audit_entity
        ELSE 'setting'::audit_entity -- Default fallback
    END;

    -- Get cafe_id and prepare values
    CASE TG_OP
        WHEN 'INSERT' THEN
            v_new_values := to_jsonb(NEW);
            v_cafe_id := COALESCE((NEW.cafe_id)::UUID, NULL);
        WHEN 'UPDATE' THEN
            v_old_values := to_jsonb(OLD);
            v_new_values := to_jsonb(NEW);
            v_cafe_id := COALESCE((NEW.cafe_id)::UUID, (OLD.cafe_id)::UUID);

            -- Calculate changed fields
            SELECT jsonb_agg(key) INTO v_changed_fields
            FROM jsonb_each(v_old_values) o
            WHERE NOT (v_new_values ? o.key AND v_new_values->o.key = o.value);

        WHEN 'DELETE' THEN
            v_old_values := to_jsonb(OLD);
            v_cafe_id := COALESCE((OLD.cafe_id)::UUID, NULL);
    END CASE;

    -- Insert audit record (only if cafe_id exists)
    IF v_cafe_id IS NOT NULL THEN
        INSERT INTO audit_logs (
            cafe_id, action, entity_type, entity_id,
            old_values, new_values, changed_fields,
            user_id, created_at
        ) VALUES (
            v_cafe_id, v_audit_action, v_entity_type,
            CASE TG_OP
                WHEN 'DELETE' THEN (OLD.id)::UUID
                ELSE (NEW.id)::UUID
            END,
            v_old_values, v_new_values, v_changed_fields,
            current_setting('app.current_user_id')::UUID, -- Set by application
            NOW()
        );
    END IF;

    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER orders_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER payments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- GDPR COMPLIANCE FUNCTIONS
-- =====================================================

-- Anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize personal data while preserving referential integrity
    UPDATE users SET
        email = 'anonymized_' || id || '@deleted.local',
        first_name = 'Deleted',
        last_name = 'User',
        phone = NULL,
        date_of_birth = NULL,
        profile_picture_url = NULL,
        preferences = '{}',
        status = 'deleted',
        deleted_at = NOW()
    WHERE id = p_user_id;

    -- Log the anonymization
    INSERT INTO audit_logs (
        cafe_id, user_id, action, entity_type, entity_id,
        entity_name, metadata, gdpr_sensitive
    ) SELECT
        cafe_id, p_user_id, 'delete', 'user', p_user_id,
        'User Data Anonymized', '{"reason": "GDPR erasure request"}', TRUE
    FROM users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Process data retention
CREATE OR REPLACE FUNCTION process_data_retention(p_cafe_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_policy RECORD;
    v_processed_count INTEGER := 0;
    v_sql TEXT;
BEGIN
    FOR v_policy IN
        SELECT * FROM data_retention_policies
        WHERE cafe_id = p_cafe_id AND is_active = TRUE
          AND (next_processing_at IS NULL OR next_processing_at <= NOW())
    LOOP
        -- Build dynamic SQL based on retention policy
        CASE v_policy.action_after_retention
            WHEN 'delete' THEN
                v_sql := format(
                    'DELETE FROM %I WHERE cafe_id = $1 AND created_at < NOW() - INTERVAL ''%s months''',
                    v_policy.table_name, v_policy.retention_period_months
                );
            WHEN 'anonymize' THEN
                -- This would need custom logic per table
                CONTINUE;
        END CASE;

        -- Execute retention action
        EXECUTE v_sql USING p_cafe_id;
        GET DIAGNOSTICS v_processed_count = ROW_COUNT;

        -- Update policy processing time
        UPDATE data_retention_policies SET
            last_processed_at = NOW(),
            next_processing_at = NOW() + INTERVAL '1 day'
        WHERE id = v_policy.id;

        -- Log retention action
        INSERT INTO audit_logs (
            cafe_id, action, entity_type, metadata
        ) VALUES (
            p_cafe_id, 'delete', 'setting',
            jsonb_build_object(
                'retention_policy_id', v_policy.id,
                'table_name', v_policy.table_name,
                'records_processed', v_processed_count
            )
        );
    END LOOP;

    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER gdpr_requests_updated_at BEFORE UPDATE ON gdpr_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();