const express = require('express');
const db = require('../../config/db');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /reports/company — company-wide dashboard
router.get('/company', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const isOfficer = req.user.role === 'loan_officer';
    const officerId = req.user.id;
    const qParams = isOfficer ? [tenantId, officerId] : [tenantId];
    const filterSql = isOfficer ? ' AND staff_id = $2' : '';

    const [portfolio, byStatus, branchPerf, arrearsBreakdown, nplRatio, monthlyDisb] = await Promise.all([
      // Total portfolio
      db.query(`
        SELECT
          COUNT(*) AS total_loans,
          COUNT(*) FILTER (WHERE status IN ('active','at_risk','delinquent','defaulted','non_performing')) AS active_loans,
          COALESCE(SUM(principal_amount), 0) AS total_disbursed,
          COALESCE(SUM(outstanding_balance) FILTER (WHERE status NOT IN ('draft','closed','written_off')), 0) AS outstanding_portfolio,
          COALESCE(SUM(total_paid), 0) AS total_collected,
          COALESCE(SUM(arrears_amount) FILTER (WHERE arrears_amount > 0), 0) AS total_arrears,
          COALESCE(SUM(outstanding_balance) FILTER (WHERE status IN ('non_performing','written_off')), 0) AS npl_amount
        FROM loans WHERE tenant_id=$1${filterSql}
      `, qParams),

      // By status
      db.query(`
        SELECT status, COUNT(*) AS count, COALESCE(SUM(outstanding_balance),0) AS amount
        FROM loans WHERE tenant_id=$1${filterSql} GROUP BY status
      `, qParams),

      // Branch performance
      db.query(`
        SELECT b.name, b.id,
          COUNT(l.id) FILTER (WHERE l.status NOT IN ('draft','closed','written_off')) AS active_loans,
          COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.status NOT IN ('draft','closed','written_off')), 0) AS portfolio,
          COALESCE(SUM(l.total_paid), 0) AS collected,
          COALESCE(SUM(l.arrears_amount), 0) AS arrears
        FROM branches b
        LEFT JOIN loans l ON l.branch_id = b.id${isOfficer ? ' AND l.staff_id = $2' : ''}
        WHERE b.tenant_id=$1 GROUP BY b.id, b.name ORDER BY portfolio DESC
      `, qParams),

      // Arrears breakdown (days buckets)
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE arrears_days BETWEEN 1 AND 7) AS days_1_7,
          COUNT(*) FILTER (WHERE arrears_days BETWEEN 8 AND 30) AS days_8_30,
          COUNT(*) FILTER (WHERE arrears_days BETWEEN 31 AND 90) AS days_31_90,
          COUNT(*) FILTER (WHERE arrears_days > 90) AS days_over_90,
          SUM(arrears_amount) FILTER (WHERE arrears_days BETWEEN 1 AND 7) AS amount_1_7,
          SUM(arrears_amount) FILTER (WHERE arrears_days BETWEEN 8 AND 30) AS amount_8_30,
          SUM(arrears_amount) FILTER (WHERE arrears_days BETWEEN 31 AND 90) AS amount_31_90,
          SUM(arrears_amount) FILTER (WHERE arrears_days > 90) AS amount_over_90
        FROM loans WHERE tenant_id=$1 AND arrears_days > 0${filterSql}
      `, qParams),

      // NPL ratio
      db.query(`
        SELECT
          COALESCE(SUM(outstanding_balance) FILTER (WHERE status IN ('non_performing','written_off')), 0) AS npl,
          COALESCE(SUM(outstanding_balance) FILTER (WHERE status NOT IN ('draft','closed')), 0) AS total
        FROM loans WHERE tenant_id=$1${filterSql}
      `, qParams),

      // Monthly disbursements (last 12 months)
      db.query(`
        SELECT TO_CHAR(disbursement_date, 'YYYY-MM') AS month,
          COUNT(*) AS count, SUM(principal_amount) AS amount
        FROM loans WHERE tenant_id=$1 AND disbursement_date IS NOT NULL
          ${filterSql}
          AND disbursement_date >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month
      `, qParams),
    ]);

    const npl = parseFloat(nplRatio.rows[0].npl);
    const totalPort = parseFloat(nplRatio.rows[0].total);
    const nplPercent = totalPort > 0 ? ((npl / totalPort) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        portfolio: portfolio.rows[0],
        by_status: byStatus.rows,
        branch_performance: branchPerf.rows,
        arrears_breakdown: arrearsBreakdown.rows[0],
        npl_ratio: nplPercent,
        monthly_disbursements: monthlyDisb.rows,
      },
    });
  } catch (err) {
    console.error('GET /reports/company error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /reports/branch/:id — branch dashboard
router.get('/branch/:id', async (req, res) => {
  try {
    const branchId = req.params.id;

    // Verify branch belongs to user's tenant
    const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1 AND tenant_id = $2', [branchId, req.user.tenant_id]);
    if (branchCheck.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });

    const [summary, staffPerf, todayActivity] = await Promise.all([
      db.query(`
        SELECT
          COUNT(l.*) AS total_loans,
          COUNT(l.*) FILTER (WHERE l.status = 'active') AS active,
          COUNT(l.*) FILTER (WHERE l.status = 'at_risk') AS at_risk,
          COUNT(l.*) FILTER (WHERE l.status IN ('delinquent','defaulted','non_performing')) AS delinquent,
          COALESCE(SUM(l.principal_amount), 0) AS total_disbursed,
          COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.status NOT IN ('draft','closed','written_off')), 0) AS outstanding,
          COALESCE(SUM(l.total_paid), 0) AS collected,
          COALESCE(SUM(l.arrears_amount), 0) AS total_arrears,
          COUNT(DISTINCT c.id) AS total_clients,
          COUNT(DISTINCT u.id) AS total_staff
        FROM branches b
        LEFT JOIN loans l ON l.branch_id = b.id
        LEFT JOIN clients c ON c.branch_id = b.id
        LEFT JOIN users u ON u.branch_id = b.id
        WHERE b.id=$1
      `, [branchId]),

      db.query('SELECT * FROM v_staff_pnl WHERE branch_id=$1 ORDER BY net_profit DESC', [branchId]),

      db.query(`
        SELECT COALESCE(SUM(amount_paid),0) AS today_collections, COUNT(*) AS payment_count
        FROM repayments WHERE branch_id=$1 AND payment_date=CURRENT_DATE
      `, [branchId]),
    ]);

    res.json({
      success: true,
      data: {
        summary: summary.rows[0],
        staff_performance: staffPerf.rows,
        today: todayActivity.rows[0],
      },
    });
  } catch (err) {
    console.error('GET /reports/branch/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/audit — audit log query
router.get('/audit', async (req, res) => {
  try {
    const { entity_type, action, from_date, to_date, user_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['al.tenant_id = $1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (entity_type) { conditions.push(`al.entity_type = $${idx++}`); params.push(entity_type); }
    if (action)      { conditions.push(`al.action = $${idx++}`); params.push(action); }
    if (user_id)     { conditions.push(`al.user_id = $${idx++}`); params.push(user_id); }
    if (from_date)   { conditions.push(`al.created_at >= $${idx++}`); params.push(from_date); }
    if (to_date)     { conditions.push(`al.created_at <= $${idx++}`); params.push(to_date); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT al.*, u.first_name || ' ' || u.last_name AS user_name, u.role
       FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(`SELECT COUNT(*) FROM audit_logs al ${where}`, params);
    res.json({ success: true, data: result.rows, meta: { total: parseInt(total.rows[0].count) } });
  } catch (err) {
    console.error('GET /reports/audit error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/portfolio-at-risk — PAR report + Never Paid filter
router.get('/portfolio-at-risk', async (req, res) => {
  try {
    const { branch_id, staff_id, from_date, to_date, never_paid } = req.query;
    
    let conditions = ['l.tenant_id=$1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (branch_id) { conditions.push(`l.branch_id=$${idx++}`); params.push(branch_id); }
    if (staff_id)  { conditions.push(`l.staff_id=$${idx++}`); params.push(staff_id); }
    if (from_date) { conditions.push(`l.disbursement_date >= $${idx++}`); params.push(from_date); }
    if (to_date)   { conditions.push(`l.disbursement_date <= $${idx++}`); params.push(to_date); }
    
    if (never_paid === 'true') {
      conditions.push('l.total_paid = 0');
    } else {
      conditions.push(`(l.arrears_days > 0 OR (l.status NOT IN ('draft', 'closed', 'written_off') AND l.total_paid > COALESCE((SELECT SUM(total_due) FROM repayment_schedules WHERE loan_id = l.id AND due_date <= CURRENT_DATE), 0)))`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT l.id, l.loan_number, l.status, l.arrears_days, l.arrears_amount,
              l.outstanding_balance, l.disbursement_date, l.total_paid,
              CASE WHEN l.status IN ('draft', 'closed', 'written_off') THEN 0 ELSE GREATEST(0, l.total_paid - COALESCE((SELECT SUM(total_due) FROM repayment_schedules WHERE loan_id = l.id AND due_date <= CURRENT_DATE), 0)) END AS advance_amount,
              c.first_name || ' ' || c.last_name AS client_name, c.phone_primary,
              u.first_name || ' ' || u.last_name AS staff_name,
              b.name AS branch_name,
              (SELECT g.full_name FROM loan_guarantors g WHERE g.loan_id = l.id LIMIT 1) AS guarantor_name,
              (SELECT g.phone FROM loan_guarantors g WHERE g.loan_id = l.id LIMIT 1) AS guarantor_phone
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       JOIN users u ON l.staff_id = u.id
       JOIN branches b ON l.branch_id = b.id
       ${where}
       ORDER BY l.arrears_days DESC, l.disbursement_date DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reports/portfolio-at-risk error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/staff-periodic-performance — Real metrics for a period
router.get('/staff-periodic-performance', async (req, res) => {
  try {
    const { staff_id, from_date, to_date } = req.query;
    if (!from_date || !to_date) return res.status(400).json({ error: 'from_date and to_date are required' });

    const tenantId = req.user.tenant_id;
    let staffFilter = 'AND u.tenant_id = $1';
    const params = [tenantId, from_date, to_date];
    if (staff_id && staff_id !== 'all') {
      staffFilter += ' AND u.id = $4';
      params.push(staff_id);
    }

    const result = await db.query(`
      SELECT 
        u.id AS staff_id,
        u.first_name || ' ' || u.last_name AS staff_name,
        u.role,
        -- Disbursements in period
        (SELECT COALESCE(SUM(principal_amount), 0) FROM loans WHERE staff_id = u.id AND disbursement_date BETWEEN $2 AND $3) AS total_disbursed,
        (SELECT COUNT(*) FROM loans WHERE staff_id = u.id AND disbursement_date BETWEEN $2 AND $3) AS loans_count,
        -- Expenses in period
        (SELECT COALESCE(SUM(amount), 0) FROM staff_expenses WHERE staff_id = u.id AND expense_date BETWEEN $2 AND $3 AND is_reversed = false AND category NOT IN ('operational', 'other')) AS total_expenses,
        -- Collections and Interest Earned in period
        (SELECT COALESCE(SUM(amount_paid), 0) FROM repayments WHERE collected_by = u.id AND payment_date BETWEEN $2 AND $3 AND is_reversed = false) AS total_collected,
        (SELECT COALESCE(SUM(r.amount_paid * (l.interest_amount / NULLIF(l.total_repayable, 0))), 0)
         FROM repayments r 
         JOIN loans l ON r.loan_id = l.id 
         WHERE r.collected_by = u.id AND r.payment_date BETWEEN $2 AND $3 AND r.is_reversed = false) AS interest_earned
      FROM users u
      WHERE 1=1 ${staffFilter}
      ORDER BY interest_earned DESC
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reports/staff-periodic-performance error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/collection-efficiency — Expected vs Collected + Missed amounts
router.get('/collection-efficiency', async (req, res) => {
  try {
    const { staff_id, from_date, to_date } = req.query;
    if (!from_date || !to_date) return res.status(400).json({ error: 'from_date and to_date are required' });

    const tenantId = req.user.tenant_id;
    let staffFilter = 'AND u.tenant_id = $1';
    const params = [tenantId, from_date, to_date];
    if (staff_id && staff_id !== 'all') {
      staffFilter += ' AND u.id = $4';
      params.push(staff_id);
    }

    const result = await db.query(`
      SELECT 
        u.id AS staff_id,
        u.first_name || ' ' || u.last_name AS staff_name,
        COUNT(DISTINCT l.id) AS total_clients,
        -- How much was supposed to be paid in this period
        (SELECT COALESCE(SUM(rs.total_due), 0) 
         FROM repayment_schedules rs 
         JOIN loans l2 ON rs.loan_id = l2.id 
         WHERE l2.staff_id = u.id AND rs.due_date BETWEEN $2 AND $3) AS expected_amount,
        -- How much was actually paid towards those specific installments
        (SELECT COALESCE(SUM(rs.total_paid), 0) 
         FROM repayment_schedules rs 
         JOIN loans l2 ON rs.loan_id = l2.id 
         WHERE l2.staff_id = u.id AND rs.due_date BETWEEN $2 AND $3) AS actual_collected,
        -- Number of missed installments
        (SELECT COUNT(*) 
         FROM repayment_schedules rs 
         JOIN loans l2 ON rs.loan_id = l2.id 
         WHERE l2.staff_id = u.id AND rs.due_date BETWEEN $2 AND $3 AND rs.is_paid = false) AS missed_count
      FROM users u
      LEFT JOIN loans l ON l.staff_id = u.id
      WHERE 1=1 ${staffFilter}
      GROUP BY u.id
      ORDER BY expected_amount DESC
    `, params);

    const formattedData = result.rows.map(r => ({
      ...r,
      missed_amount: parseFloat(r.expected_amount) - parseFloat(r.actual_collected),
      efficiency_rate: r.expected_amount > 0 ? (r.actual_collected / r.expected_amount) * 100 : 100
    }));

    res.json({ success: true, data: formattedData });
  } catch (err) {
    console.error('GET /reports/collection-efficiency error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/daily/financial-summary — for cashier cashflow report
router.get('/daily/financial-summary', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;

    const [collections, expenses, disbursements, fees, misc, openingBal, staffPerf, expenseDetails, loanDetails] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(amount_paid), 0) as total FROM repayments WHERE payment_date = $1 AND branch_id = $2 AND is_reversed = false`, [date, branchId]),
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM staff_expenses WHERE expense_date = $1 AND branch_id = $2 AND is_reversed = false`, [date, branchId]),
      db.query(`SELECT COALESCE(SUM(principal_amount), 0) as total FROM loans WHERE disbursement_date = $1 AND branch_id = $2 AND status != 'draft'`, [date, branchId]),
      db.query(`SELECT COALESCE(SUM(processing_fee), 0) as total FROM loans WHERE application_date = $1 AND branch_id = $2`, [date, branchId]),
      db.query(`SELECT type, category, SUM(amount) as total FROM misc_transactions WHERE transaction_date = $1 AND branch_id = $2 AND is_reversed = false GROUP BY type, category`, [date, branchId]),
      
      // Opening Balance (Sum of all transactions before this date)
      db.query(`
        SELECT 
          (SELECT COALESCE(SUM(amount_paid), 0) FROM repayments WHERE payment_date < $1 AND branch_id = $2 AND is_reversed = false) +
          (SELECT COALESCE(SUM(processing_fee), 0) FROM loans WHERE application_date < $1 AND branch_id = $2) +
          (SELECT COALESCE(SUM(amount) FILTER (WHERE category='cash_in'), 0) FROM misc_transactions WHERE transaction_date < $1 AND branch_id = $2 AND is_reversed = false) -
          (SELECT COALESCE(SUM(amount), 0) FROM staff_expenses WHERE expense_date < $1 AND branch_id = $2 AND is_reversed = false) -
          (SELECT COALESCE(SUM(principal_amount), 0) FROM loans WHERE disbursement_date < $1 AND branch_id = $2 AND status != 'draft') -
          (SELECT COALESCE(SUM(amount) FILTER (WHERE category='cash_out'), 0) FROM misc_transactions WHERE transaction_date < $1 AND branch_id = $2 AND is_reversed = false)
        AS total
      `, [date, branchId]),

      // Staff Performance Table
      db.query(`
        SELECT 
          u.first_name || ' ' || u.last_name as staff_name,
          COUNT(DISTINCT l.id) as total_clients,
          COUNT(DISTINCT r.loan_id) as paid_clients,
          COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'defaulted') as defaulters,
          COALESCE((SELECT SUM(total_due) FROM repayment_schedules rs JOIN loans l2 ON rs.loan_id = l2.id WHERE l2.staff_id = u.id AND rs.due_date = $1), 0) as expected_today,
          COALESCE(SUM(r.amount_paid), 0) as collected_today
        FROM users u
        LEFT JOIN loans l ON l.staff_id = u.id AND l.status IN ('active', 'at_risk', 'delinquent', 'defaulted')
        LEFT JOIN repayments r ON r.loan_id = l.id AND r.payment_date = $1 AND r.is_reversed = false
        WHERE u.branch_id = $2
        GROUP BY u.id, u.first_name, u.last_name
      `, [date, branchId]),

      // Expense Details
      db.query(`SELECT description, amount, expense_date FROM staff_expenses WHERE expense_date = $1 AND branch_id = $2 AND is_reversed = false`, [date, branchId]),
      
      // Loan Details
      db.query(`SELECT l.loan_number, c.first_name || ' ' || c.last_name as client_name, l.principal_amount, l.processing_fee 
                FROM loans l JOIN clients c ON l.client_id = c.id 
                WHERE l.disbursement_date = $1 AND l.branch_id = $2`, [date, branchId]),
    ]);

    res.json({
      success: true,
      data: {
        opening_balance: parseFloat(openingBal.rows[0].total),
        collections: parseFloat(collections.rows[0].total),
        expenses: parseFloat(expenses.rows[0].total),
        disbursements: parseFloat(disbursements.rows[0].total),
        processing_fees: parseFloat(fees.rows[0].total),
        misc: misc.rows,
        staff_performance: staffPerf.rows,
        expense_details: expenseDetails.rows,
        loan_details: loanDetails.rows
      }
    });
  } catch (err) {
    console.error('GET /reports/daily/financial-summary error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/maturing — Loans maturing on a specific date
router.get('/maturing', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;

    const result = await db.query(`
      SELECT l.*, c.first_name || ' ' || c.last_name as client_name, c.phone_primary
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.expected_closure_date = $1 AND l.branch_id = $2 AND l.tenant_id = $3
        AND l.status IN ('active', 'at_risk', 'delinquent')
    `, [date, branchId, req.user.tenant_id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reports/maturing error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/missed-installments — Clients who missed more than X installments
router.get('/missed-installments', async (req, res) => {
  try {
    const { min_missed = 4, branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;

    const result = await db.query(`
      SELECT 
        l.id, l.loan_number, l.outstanding_balance,
        c.first_name || ' ' || c.last_name as client_name, c.phone_primary,
        u.first_name || ' ' || u.last_name as staff_name,
        (SELECT COUNT(*) FROM repayment_schedules rs WHERE rs.loan_id = l.id AND rs.due_date < CURRENT_DATE AND rs.is_paid = false) as missed_count
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      JOIN users u ON l.staff_id = u.id
      WHERE l.branch_id = $1 AND l.tenant_id = $3 AND l.status IN ('active', 'at_risk', 'delinquent')
      AND (SELECT COUNT(*) FROM repayment_schedules rs WHERE rs.loan_id = l.id AND rs.due_date < CURRENT_DATE AND rs.is_paid = false) >= $2
      ORDER BY missed_count DESC
    `, [branchId, min_missed, req.user.tenant_id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reports/missed-installments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/dormant — Loans with no payments for more than 30 days
router.get('/dormant', async (req, res) => {
  try {
    const { branch_id, days = 30 } = req.query;
    const branchId = branch_id || req.user.branch_id;

    const result = await db.query(`
      SELECT l.*, c.first_name || ' ' || c.last_name as client_name, c.phone_primary,
             (SELECT MAX(payment_date) FROM repayments WHERE loan_id = l.id) as last_payment_date
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.branch_id = $1 AND l.tenant_id = $3 AND l.status IN ('active', 'at_risk', 'delinquent')
      AND (
        SELECT MAX(payment_date) FROM repayments WHERE loan_id = l.id
      ) < CURRENT_DATE - INTERVAL '1 day' * $2
      OR (
        NOT EXISTS (SELECT 1 FROM repayments WHERE loan_id = l.id)
        AND l.disbursement_date < CURRENT_DATE - INTERVAL '1 day' * $2
      )
    `, [branchId, days, req.user.tenant_id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reports/dormant error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/staff-arrears-ranking — Staff ranked by arrears amount and count
router.get('/staff-arrears-ranking', async (req, res) => {
  try {
    const { branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;

    const result = await db.query(`
      SELECT 
        u.id as staff_id, u.first_name || ' ' || u.last_name as staff_name,
        COUNT(l.id) as total_loans,
        COUNT(l.id) FILTER (WHERE l.arrears_days > 0) as loans_in_arrears,
        COUNT(l.id) FILTER (WHERE l.status IN ('defaulted', 'non_performing')) as default_count,
        COALESCE(SUM(l.outstanding_balance), 0) as total_portfolio,
        COALESCE(SUM(l.arrears_amount), 0) as total_arrears_amount,
        CASE WHEN SUM(l.outstanding_balance) > 0 
             THEN (SUM(l.arrears_amount) / SUM(l.outstanding_balance) * 100) 
             ELSE 0 END as arrears_rate_pct
      FROM users u
      LEFT JOIN loans l ON l.staff_id = u.id
      WHERE u.branch_id = $1 AND u.tenant_id = $2
      GROUP BY u.id
      ORDER BY arrears_rate_pct DESC
    `, [branchId, req.user.tenant_id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reports/staff-arrears-ranking error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/daily/ledger — Full running-balance transaction ledger ───────
router.get('/daily/ledger', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;

    // Get opening balance (everything before this date)
    const openingRes = await db.query(`
      SELECT
        COALESCE((
          SELECT SUM(amount_paid) FROM repayments
          WHERE payment_date < $1 AND branch_id = $2 AND is_reversed = false
        ), 0) +
        COALESCE((
          SELECT SUM(processing_fee) FROM loans
          WHERE application_date < $1 AND branch_id = $2
        ), 0) +
        COALESCE((
          SELECT SUM(amount) FROM misc_transactions
          WHERE transaction_date < $1 AND branch_id = $2 AND category = 'cash_in' AND is_reversed = false
        ), 0) -
        COALESCE((
          SELECT SUM(amount) FROM staff_expenses
          WHERE expense_date < $1 AND branch_id = $2 AND is_reversed = false
        ), 0) -
        COALESCE((
          SELECT SUM(principal_amount) FROM loans
          WHERE disbursement_date < $1 AND branch_id = $2 AND status != 'draft'
        ), 0) -
        COALESCE((
          SELECT SUM(amount) FROM misc_transactions
          WHERE transaction_date < $1 AND branch_id = $2 AND category = 'cash_out' AND is_reversed = false
        ), 0)
      AS opening_balance
    `, [date, branchId]);

    const openingBalance = parseFloat(openingRes.rows[0].opening_balance) || 0;

    // Collect all transactions for the day with timestamps
    const [repayments, expenses, loans, misc] = await Promise.all([
      db.query(`
        SELECT
          r.id, r.created_at AS tx_time,
          c.first_name || ' ' || c.last_name AS name,
          r.amount_paid AS cash_in, 0 AS cash_out,
          'repayment' AS tx_type
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN clients c ON l.client_id = c.id
        WHERE r.payment_date = $1 AND r.branch_id = $2 AND r.is_reversed = false
      `, [date, branchId]),

      db.query(`
        SELECT
          se.id, se.created_at AS tx_time,
          se.description AS name,
          0 AS cash_in, se.amount AS cash_out,
          'expense' AS tx_type
        FROM staff_expenses se
        WHERE se.expense_date = $1 AND se.branch_id = $2 AND se.is_reversed = false
      `, [date, branchId]),

      db.query(`
        SELECT
          lo.id, lo.created_at AS tx_time,
          'LOAN: ' || c.first_name || ' ' || c.last_name AS name,
          0 AS cash_in, lo.principal_amount AS cash_out,
          'loan_disbursed' AS tx_type
        FROM loans lo
        JOIN clients c ON lo.client_id = c.id
        WHERE lo.disbursement_date = $1 AND lo.branch_id = $2 AND lo.status != 'draft'
      `, [date, branchId]),

      db.query(`
        SELECT
          mt.id, mt.created_at AS tx_time,
          mt.description AS name,
          CASE WHEN mt.category = 'cash_in' THEN mt.amount ELSE 0 END AS cash_in,
          CASE WHEN mt.category = 'cash_out' THEN mt.amount ELSE 0 END AS cash_out,
          'misc' AS tx_type
        FROM misc_transactions mt
        WHERE mt.transaction_date = $1 AND mt.branch_id = $2 AND mt.is_reversed = false
      `, [date, branchId]),
    ]);

    // Merge and sort all transactions by time
    const allTx = [
      ...repayments.rows,
      ...expenses.rows,
      ...loans.rows,
      ...misc.rows,
    ].sort((a, b) => new Date(a.tx_time).getTime() - new Date(b.tx_time).getTime());

    // Calculate running balance
    let runningBalance = openingBalance;
    const rows = allTx.map((tx, i) => {
      const cashIn = parseFloat(tx.cash_in) || 0;
      const cashOut = parseFloat(tx.cash_out) || 0;
      runningBalance += cashIn - cashOut;
      return {
        no: i + 1,
        name: tx.name,
        cash_in: cashIn > 0 ? cashIn : null,
        cash_out: cashOut > 0 ? cashOut : null,
        balance: runningBalance,
        tx_type: tx.tx_type,
      };
    });

    // Summary metrics
    const totalCashIn = allTx.reduce((s, t) => s + (parseFloat(t.cash_in) || 0), 0);
    const totalCashOut = allTx.reduce((s, t) => s + (parseFloat(t.cash_out) || 0), 0);

    // Count loans given and fees
    const loansGiven = loans.rows.length;
    const totalLoansGiven = loans.rows.reduce((s, l) => s + (parseFloat(l.cash_out) || 0), 0);
    const feesRes = await db.query(
      `SELECT COALESCE(SUM(processing_fee), 0) AS total FROM loans WHERE application_date = $1 AND branch_id = $2`,
      [date, branchId]
    );
    const processingFees = parseFloat(feesRes.rows[0].total) || 0;

    // Client counts
    const paidCountRes = await db.query(
      `SELECT COUNT(DISTINCT loan_id) AS paid FROM repayments WHERE payment_date = $1 AND branch_id = $2 AND is_reversed = false`,
      [date, branchId]
    );

    res.json({
      success: true,
      data: {
        opening_balance: openingBalance,
        rows,
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        closing_balance: runningBalance,
        loans_given: loansGiven,
        total_loans_given: totalLoansGiven,
        processing_fees: processingFees,
        clients_paid: parseInt(paidCountRes.rows[0].paid) || 0,
        total_collections: repayments.rows.reduce((s, r) => s + (parseFloat(r.cash_in) || 0), 0),
      }
    });
  } catch (err) {
    console.error('GET /reports/daily/ledger error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/unpaid-per-officer — Clients not paid on a date ─────────────
router.get('/unpaid-per-officer', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], staff_id, branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;
    const tenantId = req.user.tenant_id;

    let conditions = ['l.branch_id = $1', 'l.tenant_id = $2', "l.status IN ('active','at_risk','delinquent','defaulted')"];
    const params = [branchId, tenantId];
    let idx = 3;

    if (staff_id && staff_id !== 'all') {
      conditions.push(`l.staff_id = $${idx++}`);
      params.push(staff_id);
    }

    // Clients that had a scheduled installment on this date but did NOT pay
    const result = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY c.first_name) AS no,
        c.first_name || ' ' || c.last_name AS names,
        c.phone_primary AS phone,
        c.home_address AS location,
        l.principal_amount AS loan_given,
        l.disbursement_date AS date_given,
        (SELECT MAX(r.payment_date) FROM repayments r WHERE r.loan_id = l.id AND r.is_reversed = false) AS last_date_paid,
        (SELECT r.amount_paid FROM repayments r WHERE r.loan_id = l.id AND r.is_reversed = false ORDER BY r.payment_date DESC LIMIT 1) AS last_amount_paid,
        l.outstanding_balance AS debt,
        u.first_name || ' ' || u.last_name AS officer_name
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      JOIN users u ON l.staff_id = u.id
      WHERE ${conditions.join(' AND ')}
      AND l.id NOT IN (
        SELECT DISTINCT loan_id FROM repayments
        WHERE payment_date = $${idx++} AND is_reversed = false
      )
      ORDER BY c.first_name
    `, [...params, date]);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      date,
    });
  } catch (err) {
    console.error('GET /reports/unpaid-per-officer error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/loan-aging — Aging analysis with guarantor ──────────────────
router.get('/loan-aging', async (req, res) => {
  try {
    const { staff_id, branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;
    const tenantId = req.user.tenant_id;

    let conditions = ['l.branch_id = $1', 'l.tenant_id = $2', "l.status IN ('active','at_risk','delinquent','defaulted','non_performing')"];
    const params = [branchId, tenantId];
    let idx = 3;

    if (staff_id && staff_id !== 'all') {
      conditions.push(`l.staff_id = $${idx++}`);
      params.push(staff_id);
    }

    const result = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY l.disbursement_date) AS no,
        c.first_name || ' ' || c.last_name AS client_name,
        c.phone_primary AS client_phone,
        COALESCE(
          (SELECT g.full_name FROM loan_guarantors g WHERE g.loan_id = l.id LIMIT 1),
          'N/A'
        ) AS guarantor_name,
        COALESCE(
          (SELECT g.phone FROM loan_guarantors g WHERE g.loan_id = l.id LIMIT 1),
          'N/A'
        ) AS guarantor_phone,
        l.disbursement_date AS date_given,
        l.expected_closure_date AS due_date,
        l.principal_amount AS amount_given,
        l.interest_amount AS interest,
        l.outstanding_balance AS balance,
        l.arrears_amount AS total_arrears,
        l.arrears_days AS days_missed,
        EXTRACT(YEAR FROM l.disbursement_date) AS loan_year
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.disbursement_date
    `, params);

    // Group by year for summary
    const yearGroups = {};
    result.rows.forEach(row => {
      const yr = row.loan_year;
      if (!yearGroups[yr]) yearGroups[yr] = { year: yr, count: 0, total_balance: 0, total_arrears: 0 };
      yearGroups[yr].count++;
      yearGroups[yr].total_balance += parseFloat(row.balance) || 0;
      yearGroups[yr].total_arrears += parseFloat(row.total_arrears) || 0;
    });

    res.json({
      success: true,
      data: result.rows,
      year_summary: Object.values(yearGroups).sort((a, b) => a.year - b.year),
      total_loans: result.rows.length,
    });
  } catch (err) {
    console.error('GET /reports/loan-aging error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/loans-issued — All loans in a date range ────────────────────
router.get('/loans-issued', async (req, res) => {
  try {
    const { from_date, to_date, branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;
    const tenantId = req.user.tenant_id;

    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }

    const result = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY l.disbursement_date, l.created_at) AS no,
        l.disbursement_date AS date,
        c.first_name || ' ' || c.last_name AS client_name,
        l.principal_amount AS amount_given,
        l.interest_amount AS interest,
        l.total_repayable AS total_amount,
        l.status
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.branch_id = $1
        AND l.tenant_id = $2
        AND l.disbursement_date BETWEEN $3 AND $4
        AND l.status != 'draft'
      ORDER BY l.disbursement_date, l.created_at
    `, [branchId, tenantId, from_date, to_date]);

    const totals = result.rows.reduce((acc, row) => {
      acc.total_amount_given += parseFloat(row.amount_given) || 0;
      acc.total_interest += parseFloat(row.interest) || 0;
      acc.total_repayable += parseFloat(row.total_amount) || 0;
      return acc;
    }, { total_amount_given: 0, total_interest: 0, total_repayable: 0 });

    res.json({
      success: true,
      data: result.rows,
      totals,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('GET /reports/loans-issued error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/income-statement — P&L with real data ──────────────────────
router.get('/income-statement', async (req, res) => {
  try {
    const { from_date, to_date, branch_id } = req.query;
    const branchId = branch_id || req.user.branch_id;
    const tenantId = req.user.tenant_id;

    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }

    const [income, expenseBreakdown, cashAtHand, circulation] = await Promise.all([
      // Revenue: interest collected + processing fees from repayments in period
      db.query(`
        SELECT
          COALESCE(
            SUM(r.amount_paid * (l.interest_amount / NULLIF(l.total_repayable, 0))), 0
          ) AS gross_interest_income,
          COALESCE(
            (SELECT SUM(processing_fee) FROM loans WHERE application_date BETWEEN $1 AND $2 AND branch_id = $3), 0
          ) AS processing_fees
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        WHERE r.payment_date BETWEEN $1 AND $2
          AND r.branch_id = $3
          AND r.is_reversed = false
      `, [from_date, to_date, branchId]),

      // Expenses grouped by description
      db.query(`
        SELECT description, SUM(amount) AS total
        FROM staff_expenses
        WHERE expense_date BETWEEN $1 AND $2
          AND branch_id = $3
          AND is_reversed = false
        GROUP BY description
        ORDER BY total DESC
      `, [from_date, to_date, branchId]),

      // Cash at hand (current closing balance)
      db.query(`
        SELECT
          COALESCE((
            SELECT SUM(amount_paid) FROM repayments WHERE branch_id = $1 AND is_reversed = false
          ), 0) +
          COALESCE((
            SELECT SUM(processing_fee) FROM loans WHERE branch_id = $1
          ), 0) -
          COALESCE((
            SELECT SUM(amount) FROM staff_expenses WHERE branch_id = $1 AND is_reversed = false
          ), 0) -
          COALESCE((
            SELECT SUM(principal_amount) FROM loans WHERE branch_id = $1 AND status != 'draft'
          ), 0)
        AS cash_at_hand
      `, [branchId]),

      // Money in circulation (outstanding portfolio)
      db.query(`
        SELECT COALESCE(SUM(outstanding_balance), 0) AS circulation
        FROM loans
        WHERE branch_id = $1 AND tenant_id = $2
          AND status NOT IN ('draft', 'closed', 'written_off')
      `, [branchId, tenantId]),
    ]);

    const grossInterest = parseFloat(income.rows[0].gross_interest_income) || 0;
    const processingFees = parseFloat(income.rows[0].processing_fees) || 0;
    const totalIncome = grossInterest + processingFees;

    const expenseRows = expenseBreakdown.rows.map(e => ({
      description: e.description,
      amount: parseFloat(e.total) || 0,
    }));
    const totalExpenses = expenseRows.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        gross_interest_income: grossInterest,
        processing_fees: processingFees,
        total_income: totalIncome,
        expense_rows: expenseRows,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        money_in_circulation: parseFloat(circulation.rows[0].circulation) || 0,
        cash_at_hand: parseFloat(cashAtHand.rows[0].cash_at_hand) || 0,
      }
    });
  } catch (err) {
    console.error('GET /reports/income-statement error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/loan-requests — Loan requests awaiting cashier approval ──────────
router.get('/loan-requests', async (req, res) => {
  try {
    const { branch_id, staff_id } = req.query;
    const tenantId = req.user.tenant_id;
    let conditions = ['l.tenant_id = $1', "l.status = 'pending_approval'"];
    const params = [tenantId];
    let idx = 2;

    if (req.user.role === 'loan_officer') {
      conditions.push(`l.staff_id = $${idx++}`);
      params.push(req.user.id);
    } else {
      const branchId = branch_id || req.user.branch_id;
      if (branchId && branchId !== 'all') {
        conditions.push(`l.branch_id = $${idx++}`);
        params.push(branchId);
      }
      if (staff_id && staff_id !== 'all') {
        conditions.push(`l.staff_id = $${idx++}`);
        params.push(staff_id);
      }
    }

    const result = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY l.application_date DESC, l.created_at DESC) AS no,
        l.id,
        l.loan_number,
        l.application_date AS date,
        c.first_name || ' ' || c.last_name AS client_name,
        c.phone_primary AS client_phone,
        u.first_name || ' ' || u.last_name AS officer_name,
        l.principal_amount AS amount,
        l.loan_purpose AS purpose,
        l.status
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      JOIN users u ON l.staff_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.application_date DESC, l.created_at DESC
    `, params);

    const totals = result.rows.reduce((acc, row) => {
      acc.total_amount += parseFloat(row.amount) || 0;
      return acc;
    }, { total_amount: 0 });

    res.json({
      success: true,
      data: result.rows,
      totals,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('GET /reports/loan-requests error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /reports/demand — Demand report (loans with active arrears) ──────────────────
router.get('/demand', async (req, res) => {
  try {
    const { branch_id, staff_id } = req.query;
    const tenantId = req.user.tenant_id;
    let conditions = ['l.tenant_id = $1', 'l.arrears_amount > 0', "l.status IN ('active', 'dormant', 'at_risk', 'delinquent')"];
    const params = [tenantId];
    let idx = 2;

    if (req.user.role === 'loan_officer') {
      conditions.push(`l.staff_id = $${idx++}`);
      params.push(req.user.id);
    } else {
      const branchId = branch_id || req.user.branch_id;
      if (branchId && branchId !== 'all') {
        conditions.push(`l.branch_id = $${idx++}`);
        params.push(branchId);
      }
      if (staff_id && staff_id !== 'all') {
        conditions.push(`l.staff_id = $${idx++}`);
        params.push(staff_id);
      }
    }

    const result = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY l.arrears_days DESC, l.arrears_amount DESC) AS no,
        l.id,
        l.loan_number,
        c.first_name || ' ' || c.last_name AS client_name,
        c.phone_primary AS client_phone,
        u.first_name || ' ' || u.last_name AS officer_name,
        COALESCE(
          (SELECT MIN(due_date) FROM repayment_schedules WHERE loan_id = l.id AND balance > 0),
          CURRENT_DATE
        ) AS due_date,
        l.arrears_amount AS amount_due,
        l.outstanding_balance
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      JOIN users u ON l.staff_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.arrears_days DESC, l.arrears_amount DESC
    `, params);

    const totals = result.rows.reduce((acc, row) => {
      acc.total_amount_due += parseFloat(row.amount_due) || 0;
      acc.total_outstanding += parseFloat(row.outstanding_balance) || 0;
      return acc;
    }, { total_amount_due: 0, total_outstanding: 0 });

    res.json({
      success: true,
      data: result.rows,
      totals,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('GET /reports/demand error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
