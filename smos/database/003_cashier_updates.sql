-- ============================================================
-- SMOS SCHEMA UPDATE: Cashier Operations & New Transaction Types
-- ============================================================

-- 1. Update loan_status enum to include 'cancelled'
ALTER TYPE loan_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 2. Add processing_fee to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS processing_fee NUMERIC(15, 2) DEFAULT 0;

-- 3. Create misc_transactions table for shortages, excess, unknown funds, fines, etc.
CREATE TABLE IF NOT EXISTS misc_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id), -- staff responsible/related
  client_id UUID REFERENCES clients(id),      -- optional client link
  loan_id UUID REFERENCES loans(id),          -- optional loan link
  
  type VARCHAR(50) NOT NULL, -- 'shortage', 'excess', 'unknown_funds', 'loan_fine', 'loan_return'
  category VARCHAR(20) NOT NULL, -- 'cash_in' or 'cash_out'
  amount NUMERIC(15, 2) NOT NULL,
  
  reference VARCHAR(100),
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  is_reversed BOOLEAN DEFAULT FALSE,
  reversal_reason TEXT,
  reversed_by UUID REFERENCES users(id),
  reversed_at TIMESTAMPTZ
);

-- 4. Update v_transactions view to include misc_transactions
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
WHERE status NOT IN ('draft', 'pending_approval')

UNION ALL

-- Misc Transactions (Inflows/Outflows)
SELECT 
  id,
  type,
  category,
  loan_id,
  amount,
  transaction_date AS date,
  created_at AS timestamp,
  user_id,
  branch_id,
  reference,
  notes,
  CASE WHEN is_reversed THEN 'reversed' ELSE 'valid' END AS status
FROM misc_transactions;

-- 5. Add document URLs to clients table for attachments
ALTER TABLE clients ADD COLUMN IF NOT EXISTS passport_photo_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_front_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_back_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS other_docs_url TEXT;
