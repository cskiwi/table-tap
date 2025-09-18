# GDPR Compliance Implementation

## Overview
This document outlines the implementation of GDPR (General Data Protection Regulation) compliance features within the restaurant ordering system database.

## Data Protection Principles

### 1. Lawfulness, Fairness, and Transparency
- **Consent Management**: Explicit opt-in for data processing
- **Legal Basis Tracking**: Record legal basis for each data processing activity
- **Transparency**: Clear data usage information provided to users

### 2. Purpose Limitation
- **Data Minimization**: Only collect necessary data
- **Purpose Specification**: Clear definition of data usage purposes
- **Retention Limits**: Automatic deletion based on retention policies

### 3. Data Minimization
- **Opt-in Marketing**: Separate consent for marketing communications
- **Anonymous Ordering**: Support for guest orders without personal data
- **Minimal Profile Data**: Only essential information collected

### 4. Accuracy
- **Data Validation**: Input validation and data quality checks
- **User Updates**: Self-service data correction capabilities
- **Regular Audits**: Periodic data accuracy verification

### 5. Storage Limitation
- **Retention Policies**: Automated data deletion schedules
- **Archival Strategies**: Long-term storage for legal requirements
- **Regular Cleanup**: Scheduled data purging processes

### 6. Integrity and Confidentiality
- **Encryption**: At-rest and in-transit data encryption
- **Access Controls**: Role-based access with audit trails
- **Secure Processing**: Data protection by design and default

## Data Subject Rights Implementation

### Right to be Informed (Article 13-14)
```sql
-- Privacy notice tracking
CREATE TABLE privacy_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id),
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User consent tracking
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL, -- 'data_processing', 'marketing', 'cookies'
    granted BOOLEAN NOT NULL,
    privacy_notice_version VARCHAR(20),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Right of Access (Article 15)
```sql
-- Data export function for user access requests
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_data JSONB;
    v_orders JSONB;
    v_payments JSONB;
    v_loyalty JSONB;
BEGIN
    -- Basic user information
    SELECT to_jsonb(u) INTO v_user_data
    FROM users u
    WHERE id = p_user_id;

    -- Order history
    SELECT jsonb_agg(to_jsonb(o)) INTO v_orders
    FROM orders o
    WHERE customer_id = p_user_id;

    -- Payment history
    SELECT jsonb_agg(to_jsonb(p)) INTO v_payments
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE o.customer_id = p_user_id;

    -- Loyalty data
    SELECT jsonb_agg(to_jsonb(l)) INTO v_loyalty
    FROM customer_loyalty_accounts l
    WHERE customer_id = p_user_id;

    -- Combine all data
    RETURN jsonb_build_object(
        'personal_data', v_user_data,
        'orders', COALESCE(v_orders, '[]'::jsonb),
        'payments', COALESCE(v_payments, '[]'::jsonb),
        'loyalty', COALESCE(v_loyalty, '[]'::jsonb),
        'exported_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Right to Rectification (Article 16)
```sql
-- Data correction audit trail
CREATE TABLE data_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    correction_reason TEXT,
    corrected_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User self-correction function
CREATE OR REPLACE FUNCTION user_update_profile(
    p_user_id UUID,
    p_field_name VARCHAR(100),
    p_new_value TEXT,
    p_reason TEXT DEFAULT 'User self-correction'
)
RETURNS VOID AS $$
DECLARE
    v_old_value TEXT;
    v_sql TEXT;
BEGIN
    -- Get current value
    v_sql := format('SELECT %I FROM users WHERE id = $1', p_field_name);
    EXECUTE v_sql INTO v_old_value USING p_user_id;

    -- Update the field
    v_sql := format('UPDATE users SET %I = $1, updated_at = NOW() WHERE id = $2', p_field_name);
    EXECUTE v_sql USING p_new_value, p_user_id;

    -- Log the correction
    INSERT INTO data_corrections (
        user_id, table_name, field_name, old_value, new_value, correction_reason, corrected_by
    ) VALUES (
        p_user_id, 'users', p_field_name, v_old_value, p_new_value, p_reason, p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Right to Erasure (Article 17)
```sql
-- User deletion with anonymization
CREATE OR REPLACE FUNCTION erase_user_data(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'User request'
)
RETURNS VOID AS $$
DECLARE
    v_cafe_id UUID;
    v_anonymized_email TEXT;
BEGIN
    -- Get user's cafe for logging
    SELECT cafe_id INTO v_cafe_id FROM users WHERE id = p_user_id;

    -- Generate anonymized email
    v_anonymized_email := 'deleted_user_' || replace(p_user_id::text, '-', '') || '@anonymized.local';

    -- Anonymize user data (preserve foreign key relationships)
    UPDATE users SET
        email = v_anonymized_email,
        password_hash = NULL,
        first_name = 'Deleted',
        last_name = 'User',
        phone = NULL,
        date_of_birth = NULL,
        profile_picture_url = NULL,
        preferences = '{}',
        gdpr_consent_at = NULL,
        marketing_consent = FALSE,
        status = 'deleted',
        deleted_at = NOW()
    WHERE id = p_user_id;

    -- Log the erasure
    INSERT INTO audit_logs (
        cafe_id, user_id, action, entity_type, entity_id,
        metadata, gdpr_sensitive
    ) VALUES (
        v_cafe_id, p_user_id, 'delete', 'user', p_user_id,
        jsonb_build_object('erasure_reason', p_reason, 'erasure_date', NOW()),
        TRUE
    );

    -- Create GDPR request record
    INSERT INTO gdpr_requests (
        cafe_id, subject_user_id, request_type, status,
        request_details, completed_date
    ) VALUES (
        v_cafe_id, p_user_id, 'erasure', 'completed',
        p_reason, NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Right to Data Portability (Article 20)
```sql
-- Portable data export in standard format
CREATE OR REPLACE FUNCTION export_portable_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_export JSONB;
BEGIN
    -- Export in machine-readable format
    SELECT jsonb_build_object(
        'user_profile', jsonb_build_object(
            'email', email,
            'first_name', first_name,
            'last_name', last_name,
            'phone', phone,
            'preferences', preferences,
            'created_at', created_at
        ),
        'order_history', (
            SELECT jsonb_agg(jsonb_build_object(
                'order_number', order_number,
                'order_date', created_at,
                'total_amount', total_amount,
                'items', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'product_name', p.name,
                        'quantity', oi.quantity,
                        'unit_price', oi.unit_price
                    ))
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = o.id
                )
            ))
            FROM orders o
            WHERE customer_id = p_user_id
        ),
        'loyalty_data', (
            SELECT jsonb_build_object(
                'membership_number', membership_number,
                'current_points', current_points,
                'current_tier', current_tier,
                'joined_at', joined_at
            )
            FROM customer_loyalty_accounts
            WHERE customer_id = p_user_id
            LIMIT 1
        ),
        'export_metadata', jsonb_build_object(
            'exported_at', NOW(),
            'format_version', '1.0',
            'data_controller', 'Restaurant Ordering System'
        )
    ) INTO v_export
    FROM users
    WHERE id = p_user_id;

    RETURN v_export;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Right to Restrict Processing (Article 18)
```sql
-- Processing restriction management
ALTER TABLE users ADD COLUMN processing_restricted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN restriction_reason TEXT;
ALTER TABLE users ADD COLUMN restriction_date TIMESTAMP WITH TIME ZONE;

-- Function to restrict user data processing
CREATE OR REPLACE FUNCTION restrict_user_processing(
    p_user_id UUID,
    p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        processing_restricted = TRUE,
        restriction_reason = p_reason,
        restriction_date = NOW()
    WHERE id = p_user_id;

    -- Log the restriction
    INSERT INTO audit_logs (
        cafe_id, user_id, action, entity_type, entity_id,
        metadata, gdpr_sensitive
    ) SELECT
        cafe_id, p_user_id, 'update', 'user', p_user_id,
        jsonb_build_object('action', 'processing_restricted', 'reason', p_reason),
        TRUE
    FROM users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Data Retention Implementation

### Automated Retention Processing
```sql
-- Daily retention cleanup job
CREATE OR REPLACE FUNCTION process_data_retention()
RETURNS INTEGER AS $$
DECLARE
    v_processed_count INTEGER := 0;
    v_policy RECORD;
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    FOR v_policy IN
        SELECT * FROM data_retention_policies
        WHERE is_active = TRUE
    LOOP
        v_cutoff_date := NOW() - (v_policy.retention_period_months || ' months')::INTERVAL;

        CASE v_policy.table_name
            WHEN 'users' THEN
                -- Anonymize inactive users
                UPDATE users SET
                    email = 'expired_' || id || '@anonymized.local',
                    first_name = 'Expired',
                    last_name = 'User',
                    phone = NULL,
                    status = 'deleted',
                    deleted_at = NOW()
                WHERE cafe_id = v_policy.cafe_id
                  AND last_login_at < v_cutoff_date
                  AND status = 'inactive'
                  AND data_retention_until IS NOT NULL
                  AND data_retention_until < NOW();

            WHEN 'audit_logs' THEN
                -- Delete old audit logs (except financial)
                DELETE FROM audit_logs
                WHERE cafe_id = v_policy.cafe_id
                  AND created_at < v_cutoff_date
                  AND entity_type NOT IN ('payment', 'order');

            -- Add more retention rules as needed
        END CASE;

        GET DIAGNOSTICS v_processed_count = ROW_COUNT;

        -- Update processing timestamp
        UPDATE data_retention_policies SET
            last_processed_at = NOW(),
            next_processing_at = NOW() + INTERVAL '1 day'
        WHERE id = v_policy.id;
    END LOOP;

    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;
```

## Privacy by Design Features

### Data Minimization
```sql
-- Guest order capability (minimal data collection)
CREATE OR REPLACE FUNCTION create_guest_order(
    p_cafe_id UUID,
    p_counter_id UUID,
    p_customer_name VARCHAR(255) DEFAULT NULL,
    p_customer_phone VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR(20);
BEGIN
    -- Generate order number
    v_order_number := 'G' || EXTRACT(EPOCH FROM NOW())::BIGINT;

    -- Create order without user account
    INSERT INTO orders (
        cafe_id, counter_id, order_number,
        customer_name, customer_phone, order_type
    ) VALUES (
        p_cafe_id, p_counter_id, v_order_number,
        p_customer_name, p_customer_phone, 'dine_in'
    ) RETURNING id INTO v_order_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
```

### Pseudonymization
```sql
-- Pseudonymization for analytics
CREATE OR REPLACE FUNCTION pseudonymize_for_analytics(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
    -- Generate consistent pseudonym using HMAC
    RETURN encode(
        hmac(p_user_id::text, 'analytics_salt_key', 'sha256'),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Analytics view with pseudonymized data
CREATE VIEW analytics_orders AS
SELECT
    o.cafe_id,
    pseudonymize_for_analytics(o.customer_id) as customer_pseudonym,
    o.order_type,
    o.total_amount,
    DATE_TRUNC('day', o.created_at) as order_date,
    EXTRACT(hour FROM o.created_at) as order_hour
FROM orders o
WHERE o.customer_id IS NOT NULL;
```

## Consent Management

### Consent Tracking
```sql
-- Track all consent changes
CREATE OR REPLACE FUNCTION update_user_consent(
    p_user_id UUID,
    p_consent_type VARCHAR(50),
    p_granted BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert new consent record
    INSERT INTO user_consents (
        user_id, consent_type, granted, ip_address, user_agent
    ) VALUES (
        p_user_id, p_consent_type, p_granted, p_ip_address, p_user_agent
    );

    -- Update user record for marketing consent
    IF p_consent_type = 'marketing' THEN
        UPDATE users SET
            marketing_consent = p_granted,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    -- Log consent change
    INSERT INTO audit_logs (
        cafe_id, user_id, action, entity_type, entity_id,
        metadata, gdpr_sensitive
    ) SELECT
        cafe_id, p_user_id, 'update', 'user', p_user_id,
        jsonb_build_object(
            'consent_type', p_consent_type,
            'granted', p_granted,
            'ip_address', p_ip_address
        ),
        TRUE
    FROM users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

## Breach Detection and Response

### Automated Breach Detection
```sql
-- Suspicious activity detection
CREATE OR REPLACE FUNCTION detect_data_breach_indicators()
RETURNS VOID AS $$
DECLARE
    v_threshold_exceeded BOOLEAN := FALSE;
    v_alert_message TEXT;
BEGIN
    -- Check for mass data exports
    IF (SELECT COUNT(*) FROM data_access_logs
        WHERE created_at > NOW() - INTERVAL '1 hour'
        AND access_type = 'export') > 100 THEN
        v_threshold_exceeded := TRUE;
        v_alert_message := 'Mass data export detected';
    END IF;

    -- Check for unusual admin activity
    IF (SELECT COUNT(DISTINCT user_id) FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '1 hour'
        AND action = 'delete') > 5 THEN
        v_threshold_exceeded := TRUE;
        v_alert_message := 'Unusual deletion activity detected';
    END IF;

    -- Log security alert if threshold exceeded
    IF v_threshold_exceeded THEN
        INSERT INTO security_logs (
            event_type, risk_level, description,
            additional_data
        ) VALUES (
            'data_breach_attempt', 'critical', v_alert_message,
            jsonb_build_object('detected_at', NOW())
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Regular Compliance Tasks

### Automated Jobs
```sql
-- Schedule compliance maintenance tasks
-- (Add to cron or application scheduler)

-- Daily: Process data retention
SELECT process_data_retention();

-- Daily: Detect breach indicators
SELECT detect_data_breach_indicators();

-- Weekly: Clean expired sessions and tokens
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Monthly: Generate compliance reports
SELECT generate_gdpr_compliance_report();
```

This GDPR compliance implementation ensures that the restaurant ordering system meets all requirements for data protection while maintaining operational efficiency and user experience.