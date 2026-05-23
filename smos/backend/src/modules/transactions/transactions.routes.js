const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');
const { calculateArrears, classifyLoanStatus } = require('../loans/loan.engine');

const router = express.Router();
router.use(authenticate);

/**
 * Log action to audit_logs
 */
async function logAudit(req, action, entityType, entityId, oldValues, newValues) {
  try {
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, branch_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.user.tenant_id, req.user.id, req.user.branch_id,
        action, entityType, entityId,
        JSON.stringify(oldValues), JSON.stringify(newValues),
        req.ip, req.headers['user-agent']
      ]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

/**
 * Re-apply all valid repayments to a loan's schedule to ensure consistency
 */
async function syncLoanRepaymentState(loanId) {
  // 1. Reset schedule
  await db.query(
    `UPDATE repayment_schedules SET is_paid=false, paid_date=NULL, total_paid=0, balance=total_due WHERE loan_id=$1`,
    [loanId]
  );

  // 2. Get all valid repayments
  const reps = await db.query(
    `SELECT * FROM repayments WHERE loan_id=$1 AND is_reversed=false ORDER BY payment_date ASC, payment_time ASC`,
    [loanId]
  );

  let totalCollected = 0;

  // 3. Re-apply each repayment
  for (const r of reps.rows) {
    const amount = parseFloat(r.amount_paid);
    totalCollected += amount;
    let remaining = amount;

    const pending = await db.query(
      `SELECT * FROM repayment_schedules WHERE loan_id=$1 AND is_paid=false ORDER BY due_date ASC`,
      [loanId]
    );

    for (const inst of pending.rows) {
      if (remaining <= 0) break;
      const instDue = parseFloat(inst.total_due) - parseFloat(inst.total_paid);
      
      if (remaining >= instDue) {
        await db.query(
          `UPDATE repayment_schedules SET is_paid=true, paid_date=$1, total_paid=total_due, balance=0 WHERE id=$2`,
          [r.payment_date, inst.id]
        );
        remaining -= instDue;
      } else {
        await db.query(
          `UPDATE repayment_schedules SET total_paid=total_paid+$1, balance=balance-$1 WHERE id=$2`,
          [remaining, inst.id]
        );
        remaining = 0;
      }
    }
  }

  // 4. Update loan balances and status
  const loan = await db.query('SELECT * FROM loans WHERE id=$1', [loanId]);
  const l = loan.rows[0];
  const newBalance = Math.max(0, parseFloat(l.total_repayable) - totalCollected);

  const allSchedule = await db.query(
    'SELECT * FROM repayment_schedules WHERE loan_id=$1 ORDER BY due_date',
    [loanId]
  );
  const { arrearsAmount, arrearsDays } = calculateArrears(allSchedule.rows, totalCollected);
  const newStatus = newBalance <= 0 ? 'closed' : classifyLoanStatus(arrearsDays, newBalance, l.expected_closure_date);

  await db.query(
    `UPDATE loans SET total_paid=$1, outstanding_balance=$2, arrears_amount=$3, arrears_days=$4, status=$5 WHERE id=$6`,
    [totalCollected, newBalance, arrearsAmount, arrearsDays, newStatus, loanId]
  );

  return { totalCollected, newBalance, newStatus };
}

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { type, category, branch_id, staff_id, from_date, to_date, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['branch_id IN (SELECT id FROM branches WHERE tenant_id = $1)'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (type)      { conditions.push(`type = $${idx++}`); params.push(type); }
    if (category)  { conditions.push(`category = $${idx++}`); params.push(category); }
    if (branch_id) { conditions.push(`branch_id = $${idx++}`); params.push(branch_id); }
    if (staff_id)  { conditions.push(`user_id = $${idx++}`); params.push(staff_id); }
    if (from_date) { conditions.push(`date >= $${idx++}`); params.push(from_date); }
    if (to_date)   { conditions.push(`date <= $${idx++}`); params.push(to_date); }
    if (status)    { conditions.push(`status = $${idx++}`); params.push(status); }
    
    if (search) {
      conditions.push(`(reference ILIKE $${idx} OR notes ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT vt.*, 
              u.first_name || ' ' || u.last_name AS staff_name,
              b.name AS branch_name,
              CASE 
                WHEN vt.type = 'repayment' THEN (SELECT c.first_name || ' ' || c.last_name FROM loans l JOIN clients c ON l.client_id = c.id WHERE l.id = vt.loan_id)
                WHEN vt.type = 'disbursement' THEN (SELECT c.first_name || ' ' || c.last_name FROM loans l JOIN clients c ON l.client_id = c.id WHERE l.id = vt.id)
                ELSE 'N/A'
              END AS client_name
       FROM v_transactions vt
       JOIN users u ON vt.user_id = u.id
       JOIN branches b ON vt.branch_id = b.id
       ${where}
       ORDER BY vt.timestamp DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(`SELECT COUNT(*) FROM v_transactions ${where}`, params);

    res.json({
      success: true,
      data: result.rows,
      meta: { total: parseInt(total.rows[0].count), page: +page, limit: +limit }
    });
  } catch (err) {
    console.error('GET /transactions error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/transactions/:id/reverse
const ALLOWED_TX_TYPES = ['repayment', 'expense'];
const TX_TABLE_MAP = { repayment: 'repayments', expense: 'staff_expenses' };
const TX_AMOUNT_COL = { repayment: 'amount_paid', expense: 'amount' };
const TX_DATE_COL = { repayment: 'payment_date', expense: 'expense_date' };

router.post('/:id/reverse', authorize('branch_manager', 'tenant_admin', 'super_admin'), async (req, res) => {
  const { id } = req.params;
  const { reason, type } = req.body;

  if (!reason) return res.status(400).json({ error: 'Reversal reason is required' });
  if (!ALLOWED_TX_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid transaction type' });

  try {
    const tableName = TX_TABLE_MAP[type];
    
    // 1. Get original record
    const original = await db.query(`SELECT * FROM ${tableName} WHERE id=$1`, [id]);
    if (original.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    const oldVal = original.rows[0];
    if (oldVal.is_reversed) return res.status(400).json({ error: 'Transaction already reversed' });

    // 2. Perform reversal
    await db.query(
      `UPDATE ${tableName} SET is_reversed=true, reversal_reason=$1, reversed_by=$2, reversed_at=NOW() WHERE id=$3`,
      [reason, req.user.id, id]
    );

    // 3. If it's a repayment, sync loan state
    if (type === 'repayment') {
      await syncLoanRepaymentState(oldVal.loan_id);
    }

    // 4. Audit log
    await logAudit(req, `${type}.reversed`, type, id, oldVal, { ...oldVal, is_reversed: true, reversal_reason: reason });

    res.json({ success: true, message: 'Transaction reversed successfully' });
  } catch (err) {
    console.error('POST /transactions/:id/reverse error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', authorize('branch_manager', 'tenant_admin', 'super_admin'), async (req, res) => {
  const { id } = req.params;
  const { amount, date, notes, type } = req.body;

  if (!ALLOWED_TX_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid transaction type' });

  try {
    const tableName = TX_TABLE_MAP[type];
    const amountCol = TX_AMOUNT_COL[type];
    const dateCol = TX_DATE_COL[type];

    // 1. Get original record
    const original = await db.query(`SELECT * FROM ${tableName} WHERE id=$1`, [id]);
    if (original.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    const oldVal = original.rows[0];

    // 2. Update record
    const result = await db.query(
      `UPDATE ${tableName} SET ${amountCol}=$1, ${dateCol}=$2, notes=$3 WHERE id=$4 RETURNING *`,
      [amount || oldVal[amountCol], date || oldVal[dateCol], notes || oldVal.notes, id]
    );

    // 3. If it's a repayment, sync loan state
    if (type === 'repayment') {
      await syncLoanRepaymentState(oldVal.loan_id);
    }

    // 4. Audit log
    await logAudit(req, `${type}.edited`, type, id, oldVal, result.rows[0]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PATCH /transactions/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
