-- ============================================================
-- SMART MICROFINANCE OPERATING SYSTEM (SMOS)
-- PostgreSQL Schema v1.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE; -- for geo queries (optional, fallback to float)

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE loan_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'disbursed',
  'active', 'at_risk', 'delinquent', 'defaulted',
  'non_performing', 'written_off', 'dormant', 'closed'
);

CREATE TYPE repayment_frequency AS ENUM ('daily', 'weekly', 'monthly');

CREATE TYPE user_role AS ENUM (
  'super_admin', 'tenant_admin', 'branch_manager',
  'loan_officer', 'cashier', 'auditor', 'supervisor'
);

CREATE TYPE gender AS ENUM ('male', 'female', 'other');

CREATE TYPE risk_grade AS ENUM ('A', 'B', 'C', 'D', 'E');

CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'email', 'system');

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

CREATE TYPE expense_category AS ENUM (
  'transport', 'airtime', 'recovery', 'operational', 'other'
);

CREATE TYPE legal_case_status AS ENUM (
  'open', 'in_progress', 'resolved', 'escalated', 'closed'
);

-- ============================================================
-- TENANTS (institutions)
-- ============================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  country VARCHAR(100) DEFAULT 'Uganda',
  currency VARCHAR(10) DEFAULT 'UGX',
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(255),
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  district VARCHAR(100),
  region VARCHAR(100),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  phone VARCHAR(30),
  email VARCHAR(255),
  manager_id UUID, -- set after users created (FK added later)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- ============================================================
-- USERS (staff)
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  role user_role NOT NULL DEFAULT 'loan_officer',

  -- Identity
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  national_id VARCHAR(50),
  gender gender,
  date_of_birth DATE,
  phone_primary VARCHAR(30),
  phone_secondary VARCHAR(30),
  email VARCHAR(255) UNIQUE,
  photo_url TEXT,
  password_hash TEXT NOT NULL,

  -- Traceability
  recommender_name VARCHAR(255),
  recommender_phone VARCHAR(30),
  recommender_relationship VARCHAR(100),
  interviewer_id UUID REFERENCES users(id),
  recruitment_branch_id UUID REFERENCES branches(id),
  employment_date DATE,

  -- Locations (GPS mandatory)
  village_name VARCHAR(255),
  village_latitude NUMERIC(10, 7),
  village_longitude NUMERIC(10, 7),
  village_district VARCHAR(100),
  urban_address TEXT,
  urban_latitude NUMERIC(10, 7),
  urban_longitude NUMERIC(10, 7),
  urban_district VARCHAR(100),

  -- Local authority contact
  lc1_name VARCHAR(255),
  lc1_phone VARCHAR(30),
  lc1_address TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,

  -- Incident flags
  has_fraud_case BOOLEAN DEFAULT FALSE,
  has_absconded BOOLEAN DEFAULT FALSE,
  audit_failures INTEGER DEFAULT 0,
  discrepancy_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add manager FK on branches
ALTER TABLE branches ADD CONSTRAINT fk_branch_manager
  FOREIGN KEY (manager_id) REFERENCES users(id);

-- ============================================================
-- USER INTERNAL REFEREES
-- ============================================================

CREATE TABLE user_referees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER EXTERNAL GUARANTORS (staff guarantors)
-- ============================================================

CREATE TABLE user_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(50),
  phone VARCHAR(30),
  relationship VARCHAR(100),
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  assigned_staff_id UUID NOT NULL REFERENCES users(id),
  registered_by_id UUID NOT NULL REFERENCES users(id),

  -- KYC
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  national_id VARCHAR(50),
  gender gender,
  date_of_birth DATE,
  education_level VARCHAR(100),
  marital_status VARCHAR(50),
  dependants INTEGER DEFAULT 0,

  -- Contact
  phone_primary VARCHAR(30) NOT NULL,
  phone_secondary VARCHAR(30),
  email VARCHAR(255),
  photo_url TEXT,

  -- Business info
  business_type VARCHAR(255),
  business_name VARCHAR(255),
  monthly_income_estimate NUMERIC(15, 2),

  -- GPS (MANDATORY)
  home_latitude NUMERIC(10, 7) NOT NULL,
  home_longitude NUMERIC(10, 7) NOT NULL,
  home_address TEXT,
  home_district VARCHAR(100),

  business_latitude NUMERIC(10, 7),
  business_longitude NUMERIC(10, 7),
  business_address TEXT,
  business_district VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  supervisor_approved BOOLEAN DEFAULT FALSE,
  supervisor_approved_by UUID REFERENCES users(id),
  supervisor_approved_at TIMESTAMPTZ,

  -- Anti-ghost flags
  gps_captured BOOLEAN DEFAULT FALSE,
  photo_verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENT NEXT OF KIN
-- ============================================================

CREATE TABLE client_next_of_kin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  phone VARCHAR(30),
  address TEXT,
  national_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOANS
-- ============================================================

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_number VARCHAR(50) UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  staff_id UUID NOT NULL REFERENCES users(id),  -- mandatory ownership
  approved_by UUID REFERENCES users(id),
  disbursed_by UUID REFERENCES users(id),

  -- Loan terms
  principal_amount NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(7, 4) NOT NULL,         -- flat rate %
  interest_amount NUMERIC(15, 2),               -- computed
  total_repayable NUMERIC(15, 2),               -- principal + interest
  repayment_frequency repayment_frequency NOT NULL,
  duration_days INTEGER NOT NULL,               -- total loan term in days
  installment_count INTEGER NOT NULL,           -- number of installments
  installment_amount NUMERIC(15, 2),            -- per installment

  -- Dates
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approval_date DATE,
  disbursement_date DATE,
  expected_closure_date DATE,
  actual_closure_date DATE,

  -- Status & classification
  status loan_status NOT NULL DEFAULT 'draft',

  -- Balances (updated on repayment)
  total_paid NUMERIC(15, 2) DEFAULT 0,
  outstanding_balance NUMERIC(15, 2),
  arrears_amount NUMERIC(15, 2) DEFAULT 0,
  arrears_days INTEGER DEFAULT 0,

  -- Anti-ghost checks
  gps_verified BOOLEAN DEFAULT FALSE,
  photo_verified BOOLEAN DEFAULT FALSE,
  supervisor_approved BOOLEAN DEFAULT FALSE,

  -- Purpose
  loan_purpose TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOAN GUARANTORS
-- ============================================================

CREATE TABLE loan_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(50),
  phone VARCHAR(30),
  photo_url TEXT,
  relationship VARCHAR(100),
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPAYMENT SCHEDULES (auto-generated)
-- ============================================================

CREATE TABLE repayment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_due NUMERIC(15, 2) NOT NULL,
  interest_due NUMERIC(15, 2) NOT NULL,
  total_due NUMERIC(15, 2) NOT NULL,
  total_paid NUMERIC(15, 2) DEFAULT 0,
  balance NUMERIC(15, 2),
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, installment_number)
);

-- ============================================================
-- REPAYMENTS (actual payments)
-- ============================================================

CREATE TABLE repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  schedule_id UUID REFERENCES repayment_schedules(id),
  collected_by UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),

  amount_paid NUMERIC(15, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time TIMESTAMPTZ DEFAULT NOW(),

  -- GPS of collection point
  collection_latitude NUMERIC(10, 7),
  collection_longitude NUMERIC(10, 7),

  payment_method VARCHAR(50) DEFAULT 'cash', -- cash, mobile_money, bank
  reference_number VARCHAR(100),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_reversed BOOLEAN DEFAULT FALSE,
  reversal_reason TEXT,
  reversed_by UUID REFERENCES users(id),
  reversed_at TIMESTAMPTZ
);

-- ============================================================
-- CREDIT SCORES
-- ============================================================

CREATE TABLE credit_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 1000),
  grade risk_grade NOT NULL,

  -- Score components (0–100 each, weighted)
  repayment_consistency_score INTEGER,
  arrears_frequency_score INTEGER,
  loan_history_score INTEGER,
  repayment_speed_score INTEGER,
  guarantor_strength_score INTEGER,
  staff_portfolio_risk_score INTEGER,

  computed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================================
-- STAFF EXPENSES
-- ============================================================

CREATE TABLE staff_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  loan_id UUID REFERENCES loans(id),  -- optional link
  client_id UUID REFERENCES clients(id), -- optional link

  category expense_category NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  approved_by UUID REFERENCES users(id),
  is_approved BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_reversed BOOLEAN DEFAULT FALSE,
  reversal_reason TEXT,
  reversed_by UUID REFERENCES users(id),
  reversed_at TIMESTAMPTZ
);

-- ============================================================
-- CLIENT FIELD VISITS
-- ============================================================

CREATE TABLE field_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  loan_id UUID REFERENCES loans(id),
  branch_id UUID NOT NULL REFERENCES branches(id),

  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,

  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  collection_made BOOLEAN DEFAULT FALSE,
  amount_collected NUMERIC(15, 2),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEGAL CASES
-- ============================================================

CREATE TABLE legal_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  staff_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  status legal_case_status DEFAULT 'open',
  filed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  filed_by UUID NOT NULL REFERENCES users(id),

  total_outstanding NUMERIC(15, 2),
  total_arrears NUMERIC(15, 2),

  court_name VARCHAR(255),
  court_reference VARCHAR(100),
  hearing_date DATE,
  resolution_date DATE,
  resolution_notes TEXT,

  case_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  loan_id UUID REFERENCES loans(id),
  client_id UUID REFERENCES clients(id),
  staff_id UUID REFERENCES users(id),

  channel notification_channel NOT NULL,
  status notification_status DEFAULT 'pending',

  recipient_phone VARCHAR(30),
  recipient_email VARCHAR(255),
  subject VARCHAR(255),
  message TEXT NOT NULL,

  sent_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),

  action VARCHAR(100) NOT NULL,        -- e.g. 'loan.disbursed', 'client.created'
  entity_type VARCHAR(100),            -- e.g. 'loan', 'client', 'user'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_branch ON clients(branch_id);
CREATE INDEX idx_clients_staff ON clients(assigned_staff_id);
CREATE INDEX idx_loans_tenant ON loans(tenant_id);
CREATE INDEX idx_loans_branch ON loans(branch_id);
CREATE INDEX idx_loans_client ON loans(client_id);
CREATE INDEX idx_loans_staff ON loans(staff_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_repayments_loan ON repayments(loan_id);
CREATE INDEX idx_repayment_schedules_loan ON repayment_schedules(loan_id);
CREATE INDEX idx_repayment_schedules_due ON repayment_schedules(due_date);
CREATE INDEX idx_credit_scores_client ON credit_scores(client_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_field_visits_staff ON field_visits(staff_id);
CREATE INDEX idx_field_visits_client ON field_visits(client_id);
CREATE INDEX idx_staff_expenses_staff ON staff_expenses(staff_id);

-- ============================================================
-- VIEWS: Loan Performance Summary
-- ============================================================

CREATE OR REPLACE VIEW v_loan_performance AS
SELECT
  l.id,
  l.loan_number,
  l.tenant_id,
  l.branch_id,
  l.client_id,
  l.staff_id,
  l.status,
  l.principal_amount,
  l.total_repayable,
  l.total_paid,
  l.outstanding_balance,
  l.arrears_amount,
  l.arrears_days,
  l.disbursement_date,
  l.expected_closure_date,
  COALESCE(l.total_paid / NULLIF(l.total_repayable, 0) * 100, 0) AS repayment_rate_pct,
  c.first_name || ' ' || c.last_name AS client_name,
  u.first_name || ' ' || u.last_name AS staff_name,
  b.name AS branch_name
FROM loans l
JOIN clients c ON l.client_id = c.id
JOIN users u ON l.staff_id = u.id
JOIN branches b ON l.branch_id = b.id;

-- ============================================================
-- VIEWS: Staff P&L Summary
-- ============================================================

CREATE OR REPLACE VIEW v_staff_pnl AS
SELECT
  u.id AS staff_id,
  u.tenant_id,
  u.branch_id,
  u.first_name || ' ' || u.last_name AS staff_name,
  COUNT(DISTINCT l.id) AS total_loans,
  COALESCE(SUM(l.principal_amount), 0) AS total_portfolio,
  COALESCE(SUM(l.interest_amount), 0) AS total_interest_expected,
  COALESCE(SUM(CASE WHEN l.status IN ('active','closed') THEN
    (l.interest_amount * (l.total_paid / NULLIF(l.total_repayable, 0)))
  ELSE 0 END), 0) AS interest_earned,
  COALESCE(SUM(CASE WHEN l.status IN ('defaulted','written_off') THEN l.outstanding_balance ELSE 0 END), 0) AS defaulted_amount,
  COALESCE((SELECT SUM(se.amount) FROM staff_expenses se WHERE se.staff_id = u.id), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN l.status IN ('active','closed') THEN
    (l.interest_amount * (l.total_paid / NULLIF(l.total_repayable, 0)))
  ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN l.status IN ('defaulted','written_off') THEN l.outstanding_balance ELSE 0 END), 0)
  - COALESCE((SELECT SUM(se.amount) FROM staff_expenses se WHERE se.staff_id = u.id), 0) AS net_profit
FROM users u
LEFT JOIN loans l ON l.staff_id = u.id
GROUP BY u.id, u.tenant_id, u.branch_id, u.first_name, u.last_name;

-- ============================================================
-- VIEWS: Unified Transactions (Inflows + Outflows)
-- ============================================================

CREATE OR REPLACE VIEW v_transactions AS
-- Repayments (Inflows)
SELECT 
  id,
  'repayment' AS type,
  'cash_in' AS category,
  loan_id,
  amount_paid AS amount,
  payment_date AS date,
  payment_time AS timestamp,
  collected_by AS user_id,
  branch_id,
  reference_number AS reference,
  notes,
  CASE WHEN is_reversed THEN 'reversed' ELSE 'valid' END AS status
FROM repayments

UNION ALL

-- Expenses (Outflows)
SELECT 
  id,
  'expense' AS type,
  'cash_out' AS category,
  loan_id,
  amount,
  expense_date AS date,
  created_at AS timestamp,
  staff_id AS user_id,
  branch_id,
  category::text AS reference,
  description AS notes,
  CASE WHEN is_reversed THEN 'reversed' WHEN is_approved THEN 'valid' ELSE 'pending' END AS status
FROM staff_expenses

UNION ALL

-- Disbursements (Outflows)
SELECT 
  id,
  'disbursement' AS type,
  'cash_out' AS category,
  id AS loan_id,
  principal_amount AS amount,
  disbursement_date AS date,
  created_at AS timestamp,
  disbursed_by AS user_id,
  branch_id,
  loan_number AS reference,
  loan_purpose AS notes,
  'valid' AS status
FROM loans
WHERE status NOT IN ('draft', 'pending_approval');

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_loans_updated BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_legal_cases_updated BEFORE UPDATE ON legal_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
