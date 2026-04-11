-- database/init.sql
-- Complete schema for Agent Tracking System (PostgreSQL)

-- 1. Create Enums
CREATE TYPE role AS ENUM ('admin', 'supervisor', 'manager', 'agent');
CREATE TYPE branch_status AS ENUM ('active', 'closed', 'maintenance');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE employee_role AS ENUM ('agent', 'supervisor', 'manager');
CREATE TYPE payout_method AS ENUM ('EcoCash', 'InnBucks', 'OneMoney', 'Bank', 'Cash');
CREATE TYPE provider_category AS ENUM ('mobile_money', 'bank', 'fintech', 'aggregator');
CREATE TYPE auth_type AS ENUM ('oauth2', 'apikey', 'basic', 'mtls', 'none');
CREATE TYPE transaction_type AS ENUM (
  'cash_in', 'cash_out', 'send_money', 'receive_money', 'bill_payment', 
  'airtime', 'data_bundle', 'ticket_purchase', 'bank_transfer', 
  'salary_disbursement', 'float_purchase', 'float_redemption'
);
CREATE TYPE transaction_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'reversed', 'disputed'
);
CREATE TYPE reconciliation_status AS ENUM (
  'unreconciled', 'matched', 'mismatch', 'investigating'
);
CREATE TYPE float_request_status AS ENUM (
  'pending', 'approved', 'declined', 'transferred', 'completed'
);
CREATE TYPE payout_frequency AS ENUM ('instant', 'weekly', 'bi_weekly', 'monthly');
CREATE TYPE settlement_status AS ENUM ('pending', 'completed', 'failed', 'investigating');
CREATE TYPE ledger_type AS ENUM ('earning', 'disbursement', 'shortage_penalty');
CREATE TYPE ledger_status AS ENUM ('pending', 'cleared', 'failed');
CREATE TYPE flag_type AS ENUM (
  'suspicious_pattern', 'unusual_amount', 'timing_anomaly', 
  'duplicate_risk', 'fraud_risk', 'kyc_missing', 'other'
);
CREATE TYPE flag_status AS ENUM ('flagged', 'reviewed', 'resolved', 'false_positive');
CREATE TYPE alert_type AS ENUM (
  'discrepancy', 'low_float', 'failed_reconciliation', 
  'suspicious_transaction', 'high_commission', 'other'
);
CREATE TYPE threshold_unit AS ENUM ('amount', 'percentage', 'count');
CREATE TYPE alert_status AS ENUM ('triggered', 'acknowledged', 'resolved', 'dismissed');
CREATE TYPE severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE check_in_status AS ENUM ('pending_adjustment', 'verified', 'discrepancy');
CREATE TYPE csv_import_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE salary_status AS ENUM ('pending', 'processing', 'disbursed', 'failed');

-- 2. Create Tables

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    password TEXT,
    "loginMethod" VARCHAR(64),
    role role NOT NULL DEFAULT 'agent',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW(),
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "termsAgreedAt" TIMESTAMP,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    region VARCHAR(100),
    manager_name VARCHAR(100),
    contact_phone VARCHAR(20),
    status branch_status DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    unique_code VARCHAR(50) NOT NULL UNIQUE,
    branch_id INTEGER REFERENCES branches(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    location VARCHAR(255),
    status employee_status DEFAULT 'active',
    role employee_role DEFAULT 'agent',
    payout_method payout_method DEFAULT 'EcoCash',
    payout_account VARCHAR(100),
    salary_percentage NUMERIC(5,2) DEFAULT 15.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category provider_category NOT NULL,
    agent_service_name VARCHAR(100),
    api_endpoint VARCHAR(255),
    auth_type auth_type NOT NULL,
    auth_config JSONB,
    webhook_url VARCHAR(255),
    settlement_account VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_registrations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    agent_code VARCHAR(50) NOT NULL,
    merchant_id VARCHAR(50),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    float_account VARCHAR(50),
    commission_rate NUMERIC(5,2),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider_id, agent_code)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    agent_registration_id INTEGER REFERENCES agent_registrations(id),
    employee_code VARCHAR(20),
    provider_reference VARCHAR(200) NOT NULL,
    internal_reference VARCHAR(100) NOT NULL UNIQUE,
    type transaction_type NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    fee NUMERIC(15,2) DEFAULT 0,
    tax NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2),
    customer_phone VARCHAR(15),
    customer_national_id VARCHAR(20),
    customer_name VARCHAR(100),
    status transaction_status DEFAULT 'pending',
    failure_reason TEXT,
    reconciliation_status reconciliation_status DEFAULT 'unreconciled',
    transaction_time TIMESTAMP NOT NULL,
    provider_processed_at TIMESTAMP,
    synced_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(provider_id, provider_reference)
);

CREATE TABLE provider_floats (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    agent_registration_id INTEGER REFERENCES agent_registrations(id),
    opening_balance NUMERIC(15,2) NOT NULL,
    current_balance NUMERIC(15,2) NOT NULL,
    minimum_threshold NUMERIC(15,2) DEFAULT 0,
    maximum_threshold NUMERIC(15,2),
    last_reconciled_at TIMESTAMP,
    reconciled_by INTEGER,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE float_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    amount NUMERIC(15,2) NOT NULL,
    status float_request_status DEFAULT 'pending',
    request_time TIMESTAMP DEFAULT NOW(),
    processed_time TIMESTAMP,
    processed_by INTEGER,
    worker_notes TEXT,
    admin_notes TEXT,
    transaction_reference VARCHAR(255)
);

CREATE TABLE commission_structures (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    transaction_type VARCHAR(30),
    min_amount NUMERIC(15,2) DEFAULT 0,
    max_amount NUMERIC(15,2) DEFAULT 999999999,
    commission_percentage NUMERIC(5,2),
    commission_fixed NUMERIC(15,2) DEFAULT 0,
    payout_frequency payout_frequency DEFAULT 'instant',
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE daily_settlements (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    settlement_date DATE NOT NULL,
    expected_total NUMERIC(15,2) NOT NULL,
    actual_total NUMERIC(15,2),
    discrepancy NUMERIC(15,2),
    bank_reference VARCHAR(100),
    settled_at TIMESTAMP,
    status settlement_status DEFAULT 'pending',
    notes TEXT,
    UNIQUE(provider_id, settlement_date)
);

CREATE TABLE commission_ledger (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    transaction_id INTEGER REFERENCES transactions(id),
    amount NUMERIC(15,2) NOT NULL,
    type ledger_type NOT NULL,
    status ledger_status DEFAULT 'pending',
    earned_at TIMESTAMP DEFAULT NOW(),
    payout_date DATE,
    payout_reference VARCHAR(255)
);

CREATE TABLE transaction_flags (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    flag_type flag_type NOT NULL,
    risk_score NUMERIC(3,2),
    reason TEXT NOT NULL,
    llm_analysis JSONB,
    status flag_status DEFAULT 'flagged',
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert_configurations (
    id SERIAL PRIMARY KEY,
    alert_type alert_type NOT NULL,
    provider_id INTEGER REFERENCES providers(id),
    threshold NUMERIC(15,2),
    threshold_unit threshold_unit,
    is_active BOOLEAN DEFAULT true,
    notification_channels JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert_history (
    id SERIAL PRIMARY KEY,
    alert_config_id INTEGER NOT NULL REFERENCES alert_configurations(id),
    provider_id INTEGER REFERENCES providers(id),
    transaction_id INTEGER REFERENCES transactions(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity severity DEFAULT 'medium',
    status alert_status DEFAULT 'triggered',
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMP,
    triggered_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE check_ins (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    branch_id INTEGER REFERENCES branches(id),
    opening_cash NUMERIC(15,2),
    closing_cash NUMERIC(15,2),
    opening_line_balances JSONB,
    closing_line_balances JSONB,
    expected_closing_cash NUMERIC(15,2),
    expected_closing_line_balances JSONB,
    discrepancy_amount NUMERIC(15,2) DEFAULT 0,
    check_in_time TIMESTAMP DEFAULT NOW(),
    check_out_time TIMESTAMP,
    status check_in_status DEFAULT 'verified',
    notes TEXT,
    metadata JSONB
);

CREATE TABLE worker_balance_snapshots (
    id SERIAL PRIMARY KEY,
    check_in_id INTEGER NOT NULL REFERENCES check_ins(id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    cash_amount NUMERIC(15,2),
    float_balances JSONB,
    update_reason VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE csv_imports (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    file_name VARCHAR(255) NOT NULL,
    import_date DATE NOT NULL,
    total_records INTEGER,
    successful_records INTEGER,
    failed_records INTEGER,
    status csv_import_status DEFAULT 'pending',
    error_log TEXT,
    imported_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE salaries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    month VARCHAR(7) NOT NULL,
    total_commission_produced NUMERIC(15,2) NOT NULL,
    salary_amount NUMERIC(15,2) NOT NULL,
    bonus_amount NUMERIC(15,2) DEFAULT 0,
    deductions NUMERIC(15,2) DEFAULT 0,
    net_payout NUMERIC(15,2) NOT NULL,
    status salary_status DEFAULT 'pending',
    payout_reference VARCHAR(255),
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month)
);

-- 3. Create Indexes

CREATE INDEX idx_employees_unique_code ON employees (unique_code);
CREATE INDEX idx_employees_branch ON employees (branch_id);
CREATE INDEX idx_providers_name ON providers (name);
CREATE INDEX idx_providers_category ON providers (category);
CREATE INDEX idx_agent_reg_employee ON agent_registrations (employee_id);
CREATE INDEX idx_agent_reg_provider ON agent_registrations (provider_id);
CREATE INDEX idx_transactions_provider ON transactions (provider_id);
CREATE INDEX idx_transactions_employee ON transactions (employee_code);
CREATE INDEX idx_transactions_time ON transactions (transaction_time);
CREATE INDEX idx_transactions_recon_status ON transactions (reconciliation_status);
CREATE INDEX idx_floats_provider ON provider_floats (provider_id);
CREATE INDEX idx_floats_agent_reg ON provider_floats (agent_registration_id);
CREATE INDEX idx_float_req_employee ON float_requests (employee_id);
CREATE INDEX idx_float_req_provider ON float_requests (provider_id);
CREATE INDEX idx_float_req_status ON float_requests (status);
CREATE INDEX idx_commission_provider ON commission_structures (provider_id);
CREATE INDEX idx_commission_effective_from ON commission_structures (effective_from);
CREATE INDEX idx_settlement_provider ON daily_settlements (provider_id);
CREATE INDEX idx_settlement_date ON daily_settlements (settlement_date);
CREATE INDEX idx_comm_ledger_employee ON commission_ledger (employee_id);
CREATE INDEX idx_comm_ledger_provider ON commission_ledger (provider_id);
CREATE INDEX idx_comm_ledger_type ON commission_ledger (type);
CREATE INDEX idx_flags_transaction ON transaction_flags (transaction_id);
CREATE INDEX idx_flags_type ON transaction_flags (flag_type);
CREATE INDEX idx_flags_status ON transaction_flags (status);
CREATE INDEX idx_alert_config_type ON alert_configurations (alert_type);
CREATE INDEX idx_alert_config_provider ON alert_configurations (provider_id);
CREATE INDEX idx_alert_history_config ON alert_history (alert_config_id);
CREATE INDEX idx_alert_history_provider ON alert_history (provider_id);
CREATE INDEX idx_alert_history_transaction ON alert_history (transaction_id);
CREATE INDEX idx_alert_history_status ON alert_history (status);
CREATE INDEX idx_alert_history_triggered_at ON alert_history (triggered_at);
CREATE INDEX idx_checkin_employee ON check_ins (employee_id);
CREATE INDEX idx_checkin_branch ON check_ins (branch_id);
CREATE INDEX idx_checkin_time ON check_ins (check_in_time);
CREATE INDEX idx_balance_snapshot_checkin ON worker_balance_snapshots (check_in_id);
CREATE INDEX idx_balance_snapshot_employee ON worker_balance_snapshots (employee_id);
CREATE INDEX idx_csv_imports_provider ON csv_imports (provider_id);
CREATE INDEX idx_csv_imports_date ON csv_imports (import_date);
CREATE INDEX idx_salary_employee ON salaries (employee_id);
CREATE INDEX idx_salary_month ON salaries (month);

-- 4. Real-time Triggers (PostgreSQL LISTEN/NOTIFY)

-- Function to notify on employee changes
CREATE OR REPLACE FUNCTION notify_employee_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('employee_updates', json_build_object(
        'event', TG_OP,
        'id', NEW.id,
        'unique_code', NEW.unique_code,
        'name', NEW.name,
        'status', NEW.status
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_change_trigger
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION notify_employee_change();

-- Function to notify on transaction changes
CREATE OR REPLACE FUNCTION notify_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('transaction_updates', json_build_object(
        'event', TG_OP,
        'id', NEW.id,
        'provider_id', NEW.provider_id,
        'amount', NEW.amount,
        'status', NEW.status,
        'internal_reference', NEW.internal_reference
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_change_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION notify_transaction_change();

-- 5. Seed initial data (optional but helpful for first launch)
INSERT INTO users ("openId", name, email, password, role, "mustChangePassword")
VALUES ('admin-prod-id', 'System Admin', 'master@agent.co.zw', '$2b$10$YourHashedPasswordHere', 'admin', false)
ON CONFLICT DO NOTHING;

INSERT INTO providers (name, category, auth_type, is_active)
VALUES 
('EcoCash', 'mobile_money', 'oauth2', true),
('OneMoney', 'mobile_money', 'apikey', true),
('InnBucks', 'fintech', 'apikey', true)
ON CONFLICT DO NOTHING;

INSERT INTO branches (name, region, status)
VALUES 
('Harare Central', 'Harare', 'active'),
('Bulawayo Main', 'Bulawayo', 'active'),
('Chitungwiza', 'Harare', 'active'),
('Mutare Hub', 'Manicaland', 'active'),
('Gweru Branch', 'Midlands', 'active'),
('Masvingo', 'Masvingo', 'active'),
('Victoria Falls', 'Matabeleland North', 'active')
ON CONFLICT DO NOTHING;
