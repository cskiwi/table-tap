-- =====================================================
-- RESTAURANT ORDERING SYSTEM - EMPLOYEE MANAGEMENT
-- =====================================================

-- =====================================================
-- 1. EMPLOYEE PROFILES (Extended user information)
-- =====================================================

CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'terminated', 'resigned');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'casual', 'intern');

CREATE TABLE employee_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    employee_number VARCHAR(50),
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_type employment_type NOT NULL DEFAULT 'part_time',
    employment_status employment_status DEFAULT 'active',
    department VARCHAR(100),
    position VARCHAR(100),
    reports_to UUID REFERENCES users(id) ON DELETE SET NULL,
    hourly_rate DECIMAL(10,2),
    salary DECIMAL(10,2),
    commission_rate DECIMAL(5,2), -- Percentage
    emergency_contact JSONB, -- {name, phone, relationship, address}
    address JSONB, -- {street, city, postal_code, country}
    bank_details JSONB, -- {account_name, account_number, sort_code, bank_name} - encrypted
    tax_information JSONB, -- {tax_number, tax_code, allowances} - encrypted
    certifications JSONB DEFAULT '[]', -- Array of certification objects
    training_records JSONB DEFAULT '[]', -- Array of training completion records
    performance_notes TEXT,
    disciplinary_records JSONB DEFAULT '[]', -- Array of disciplinary actions
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, employee_number),
    CONSTRAINT valid_emergency_contact CHECK (jsonb_typeof(emergency_contact) = 'object'),
    CONSTRAINT valid_address CHECK (jsonb_typeof(address) = 'object'),
    CONSTRAINT valid_employment_dates CHECK (termination_date IS NULL OR termination_date >= hire_date),
    CONSTRAINT valid_certifications CHECK (jsonb_typeof(certifications) = 'array'),
    CONSTRAINT valid_training_records CHECK (jsonb_typeof(training_records) = 'array'),
    CONSTRAINT valid_disciplinary_records CHECK (jsonb_typeof(disciplinary_records) = 'array')
);

-- =====================================================
-- 2. EMPLOYEE ROLES AND PERMISSIONS
-- =====================================================

CREATE TABLE employee_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of permission strings
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    can_access_pos BOOLEAN DEFAULT FALSE,
    can_process_refunds BOOLEAN DEFAULT FALSE,
    can_manage_inventory BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT FALSE,
    can_manage_employees BOOLEAN DEFAULT FALSE,
    max_discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cafe_id, name),
    CONSTRAINT valid_permissions CHECK (jsonb_typeof(permissions) = 'array')
);

-- =====================================================
-- 3. EMPLOYEE ROLE ASSIGNMENTS
-- =====================================================

CREATE TABLE employee_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES employee_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,

    UNIQUE(employee_id, role_id)
);

-- =====================================================
-- 4. WORK SHIFTS
-- =====================================================

CREATE TYPE shift_status AS ENUM ('scheduled', 'started', 'break', 'completed', 'missed', 'cancelled');

CREATE TABLE work_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    break_duration_minutes INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    status shift_status DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_shift_times CHECK (scheduled_end > scheduled_start),
    CONSTRAINT valid_actual_times CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end > actual_start),
    CONSTRAINT valid_break_times CHECK (break_end IS NULL OR break_start IS NULL OR break_end > break_start)
);

-- =====================================================
-- 5. TIME SHEETS (Payroll calculation)
-- =====================================================

CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'paid', 'disputed');

CREATE TABLE time_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_hours_worked DECIMAL(10,2) DEFAULT 0,
    regular_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    break_hours DECIMAL(10,2) DEFAULT 0,
    regular_pay DECIMAL(10,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    tips_earned DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) GENERATED ALWAYS AS (regular_pay + overtime_pay + commission + tips_earned) STORED,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) GENERATED ALWAYS AS (regular_pay + overtime_pay + commission + tips_earned - deductions) STORED,
    status timesheet_status DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(employee_id, period_start, period_end),
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- =====================================================
-- 6. PERSONAL CONSUMPTION (Employee purchases)
-- =====================================================

CREATE TYPE consumption_status AS ENUM ('pending', 'approved', 'deducted', 'cancelled');

CREATE TABLE personal_consumption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    final_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount * (100 - discount_percentage) / 100) STORED,
    status consumption_status DEFAULT 'pending',
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    deducted_from_timesheet UUID REFERENCES time_sheets(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. PROXY ORDERS (Orders placed by employees for customers)
-- =====================================================

CREATE TABLE proxy_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    reason TEXT, -- Why the order was placed by proxy
    customer_present BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(50), -- How customer paid
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. EMPLOYEE PERFORMANCE METRICS
-- =====================================================

CREATE TABLE employee_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    orders_processed INTEGER DEFAULT 0,
    total_sales DECIMAL(10,2) DEFAULT 0,
    average_order_time INTERVAL,
    customer_ratings_avg DECIMAL(3,2),
    customer_ratings_count INTEGER DEFAULT 0,
    late_arrivals INTEGER DEFAULT 0,
    early_departures INTEGER DEFAULT 0,
    breaks_exceeded INTEGER DEFAULT 0,
    training_hours DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(employee_id, metric_date)
);

-- =====================================================
-- 9. EMPLOYEE AVAILABILITY
-- =====================================================

CREATE TYPE availability_type AS ENUM ('available', 'unavailable', 'preferred', 'limited');

CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME,
    end_time TIME,
    availability_type availability_type DEFAULT 'available',
    max_hours DECIMAL(4,2),
    notes TEXT,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_time_range CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time),
    CONSTRAINT valid_effective_dates CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER employee_profiles_updated_at BEFORE UPDATE ON employee_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER employee_roles_updated_at BEFORE UPDATE ON employee_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER work_shifts_updated_at BEFORE UPDATE ON work_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER time_sheets_updated_at BEFORE UPDATE ON time_sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER personal_consumption_updated_at BEFORE UPDATE ON personal_consumption FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER employee_availability_updated_at BEFORE UPDATE ON employee_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EMPLOYEE MANAGEMENT FUNCTIONS
-- =====================================================

-- Calculate timesheet totals
CREATE OR REPLACE FUNCTION calculate_timesheet_totals(p_timesheet_id UUID)
RETURNS VOID AS $$
DECLARE
    v_timesheet RECORD;
    v_regular_rate DECIMAL(10,2);
    v_overtime_rate DECIMAL(10,2);
    v_total_hours DECIMAL(10,2) := 0;
    v_regular_hours DECIMAL(10,2) := 0;
    v_overtime_hours DECIMAL(10,2) := 0;
    v_break_hours DECIMAL(10,2) := 0;
    v_shift RECORD;
BEGIN
    -- Get timesheet and employee info
    SELECT ts.*, ep.hourly_rate
    INTO v_timesheet, v_regular_rate
    FROM time_sheets ts
    JOIN employee_profiles ep ON ts.employee_id = ep.id
    WHERE ts.id = p_timesheet_id;

    v_overtime_rate := v_regular_rate * 1.5; -- 1.5x overtime rate

    -- Calculate hours from shifts
    FOR v_shift IN
        SELECT
            EXTRACT(EPOCH FROM (actual_end - actual_start))/3600 as worked_hours,
            COALESCE(break_duration_minutes, 0)/60.0 as break_hours_shift
        FROM work_shifts
        WHERE employee_id = v_timesheet.employee_id
          AND actual_start::date >= v_timesheet.period_start
          AND actual_start::date <= v_timesheet.period_end
          AND status = 'completed'
    LOOP
        v_total_hours := v_total_hours + v_shift.worked_hours;
        v_break_hours := v_break_hours + v_shift.break_hours_shift;
    END LOOP;

    -- Calculate regular vs overtime (over 40 hours/week)
    IF v_total_hours <= 40 THEN
        v_regular_hours := v_total_hours;
        v_overtime_hours := 0;
    ELSE
        v_regular_hours := 40;
        v_overtime_hours := v_total_hours - 40;
    END IF;

    -- Update timesheet
    UPDATE time_sheets SET
        total_hours_worked = v_total_hours,
        regular_hours = v_regular_hours,
        overtime_hours = v_overtime_hours,
        break_hours = v_break_hours,
        regular_pay = v_regular_hours * v_regular_rate,
        overtime_pay = v_overtime_hours * v_overtime_rate
    WHERE id = p_timesheet_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate performance metrics
CREATE OR REPLACE FUNCTION update_employee_performance(
    p_employee_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    v_orders_count INTEGER;
    v_total_sales DECIMAL(10,2);
    v_avg_order_time INTERVAL;
BEGIN
    -- Count orders processed by employee on the date
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
    INTO v_orders_count, v_total_sales
    FROM orders o
    JOIN employee_profiles ep ON o.cafe_id = ep.cafe_id
    WHERE ep.id = p_employee_id
      AND o.created_at::date = p_date
      AND o.status = 'completed';

    -- Calculate average order processing time (placeholder logic)
    SELECT AVG(completed_at - created_at)
    INTO v_avg_order_time
    FROM orders o
    JOIN employee_profiles ep ON o.cafe_id = ep.cafe_id
    WHERE ep.id = p_employee_id
      AND o.created_at::date = p_date
      AND o.status = 'completed'
      AND completed_at IS NOT NULL;

    -- Insert or update performance record
    INSERT INTO employee_performance (
        employee_id, metric_date, orders_processed, total_sales, average_order_time
    ) VALUES (
        p_employee_id, p_date, v_orders_count, v_total_sales, v_avg_order_time
    )
    ON CONFLICT (employee_id, metric_date)
    DO UPDATE SET
        orders_processed = EXCLUDED.orders_processed,
        total_sales = EXCLUDED.total_sales,
        average_order_time = EXCLUDED.average_order_time;
END;
$$ LANGUAGE plpgsql;