-- Recreate v_staff_pnl view to exclude administrative expenses (operational and other)
-- from individual staff performance reports

CREATE OR REPLACE VIEW v_staff_pnl AS
SELECT
  u.id AS staff_id,
  u.tenant_id,
  u.branch_id,
  u.first_name || ' ' || u.last_name AS staff_name,
  COUNT(DISTINCT l.id) AS total_loans,
  COALESCE(SUM(l.principal_amount), 0) AS total_portfolio,
  COALESCE(SUM(l.interest_amount), 0) AS total_interest_expected,
  COALESCE(SUM(CASE WHEN l.status IN ('active','closed','at_risk','delinquent','dormant') THEN
    (l.interest_amount * (l.total_paid / NULLIF(l.total_repayable, 0)))
  ELSE 0 END), 0) AS interest_earned,
  COALESCE(SUM(CASE WHEN l.status IN ('defaulted','written_off') THEN l.outstanding_balance ELSE 0 END), 0) AS defaulted_amount,
  COALESCE((SELECT SUM(se.amount) FROM staff_expenses se WHERE se.staff_id = u.id AND se.category NOT IN ('operational', 'other')), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN l.status IN ('active','closed','at_risk','delinquent','dormant') THEN
    (l.interest_amount * (l.total_paid / NULLIF(l.total_repayable, 0)))
  ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN l.status IN ('defaulted','written_off') THEN l.outstanding_balance ELSE 0 END), 0)
  - COALESCE((SELECT SUM(se.amount) FROM staff_expenses se WHERE se.staff_id = u.id AND se.category NOT IN ('operational', 'other')), 0) AS net_profit
FROM users u
LEFT JOIN loans l ON l.staff_id = u.id
GROUP BY u.id, u.tenant_id, u.branch_id, u.first_name, u.last_name;
