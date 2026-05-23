-- ============================================================
-- SUPERADMIN & SAAS CONTROL PLANE UPDATES (IDEMPOTENT)
-- ============================================================

-- 1. SUBSCRIPTION & BILLING
CREATE TABLE IF NOT EXISTS system_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) DEFAULT 'Enterprise',
  billing_amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annual
  start_date DATE DEFAULT CURRENT_DATE,
  next_billing_date DATE,
  is_locked_manually BOOLEAN DEFAULT FALSE,
  auto_lock_grace_days INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'active', -- active, overdue, suspended, locked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  subscription_id UUID REFERENCES system_subscriptions(id),
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method VARCHAR(50), -- bank_transfer, mobile_money, card
  reference_no VARCHAR(100) UNIQUE,
  payment_link_uid VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT
);

-- 2. SYSTEM OWNER OVERHEAD (Financial Statements & Projections)
CREATE TABLE IF NOT EXISTS system_owner_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL, -- Server/Cloud, SMS/WhatsApp API, Staff, Legal
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  description TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GEO-TRACKING & LOGIN SECURITY
CREATE TABLE IF NOT EXISTS system_login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50), -- mobile, desktop, tablet
  os_name VARCHAR(50),
  browser_name VARCHAR(50),
  
  -- Geolocation
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  status VARCHAR(20) DEFAULT 'success', -- success, failed_password, throttled
  failure_reason TEXT
);

-- 4. INDICES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON system_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_tenant ON system_login_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON system_login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_system_payments_tenant ON system_payments(tenant_id);

-- 5. UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS trg_system_subscriptions_updated ON system_subscriptions;
CREATE TRIGGER trg_system_subscriptions_updated BEFORE UPDATE ON system_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. VIEW FOR SYSTEM OWNER FINANCIAL STATEMENT
CREATE OR REPLACE VIEW v_system_owner_financials AS
SELECT 
  'revenue' as type,
  category,
  SUM(amount) as total,
  currency,
  EXTRACT(MONTH FROM date) as month,
  EXTRACT(YEAR FROM date) as year
FROM (
  SELECT 'Subscription' as category, amount, payment_date as date, currency FROM system_payments WHERE status = 'completed'
) r
GROUP BY type, category, currency, month, year
UNION ALL
SELECT 
  'expense' as type,
  category,
  SUM(amount) as total,
  currency,
  EXTRACT(MONTH FROM date) as month,
  EXTRACT(YEAR FROM date) as year
FROM (
  SELECT category, amount, expense_date as date, currency FROM system_owner_expenses
) e
GROUP BY type, category, currency, month, year;
