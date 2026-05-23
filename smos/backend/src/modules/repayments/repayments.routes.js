const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');
const { calculateArrears, classifyLoanStatus } = require('../loans/loan.engine');

const router = express.Router();
router.use(authenticate);

// POST /repayments — record a payment
router.post('/', authorize('cashier', 'branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      loan_id, amount_paid, payment_date, payment_method = 'cash',
      reference_number, notes, collection_latitude, collection_longitude,
    } = req.body;

    if (!loan_id || !amount_paid) return res.status(400).json({ error: 'loan_id and amount_paid required' });

    const loan = await db.query(
      'SELECT * FROM loans WHERE id=$1 AND tenant_id=$2',
      [loan_id, req.user.tenant_id]
    );
    if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

    const l = loan.rows[0];
    if (['closed', 'written_off', 'draft'].includes(l.status)) {
      return res.status(400).json({ error: `Cannot accept payment on a ${l.status} loan` });
    }

    // Anti-double payment check
    const payDate = payment_date || new Date().toISOString().split('T')[0];
    const existing = await db.query(
      'SELECT id FROM repayments WHERE loan_id=$1 AND payment_date=$2 AND is_reversed=false',
      [loan_id, payDate]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: `A payment for this loan has already been recorded for ${payDate}. Please verify to avoid double payment.` 
      });
    }

    // Find earliest unpaid schedule
    const schedule = await db.query(
      `SELECT * FROM repayment_schedules WHERE loan_id=$1 AND is_paid=false ORDER BY due_date LIMIT 1`,
      [loan_id]
    );

    let scheduleId = schedule.rows.length > 0 ? schedule.rows[0].id : null;

    // Insert repayment record
    const rep = await db.query(
      `INSERT INTO repayments (loan_id, schedule_id, collected_by, branch_id, amount_paid,
         payment_date, collection_latitude, collection_longitude, payment_method, reference_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        loan_id, scheduleId, req.user.id, req.user.branch_id,
        amount_paid, payment_date || new Date().toISOString().split('T')[0],
        collection_latitude, collection_longitude,
        payment_method, reference_number, notes,
      ]
    );

    // Update loan totals
    const newTotalPaid = parseFloat(l.total_paid) + parseFloat(amount_paid);
    const newBalance = Math.max(0, parseFloat(l.total_repayable) - newTotalPaid);

    // Mark schedule installments as paid (greedy fill)
    let remaining = parseFloat(amount_paid);
    const pendingSchedule = await db.query(
      `SELECT * FROM repayment_schedules WHERE loan_id=$1 AND is_paid=false ORDER BY due_date`,
      [loan_id]
    );
    for (const inst of pendingSchedule.rows) {
      if (remaining <= 0) break;
      const instDue = parseFloat(inst.total_due) - parseFloat(inst.total_paid);
      if (remaining >= instDue) {
        await db.query(
          `UPDATE repayment_schedules SET is_paid=true, paid_date=$1, total_paid=total_due, balance=0 WHERE id=$2`,
          [payment_date || new Date().toISOString().split('T')[0], inst.id]
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

    // Re-calculate arrears
    const allSchedule = await db.query(
      'SELECT * FROM repayment_schedules WHERE loan_id=$1 ORDER BY due_date',
      [loan_id]
    );
    const { arrearsAmount, arrearsDays } = calculateArrears(allSchedule.rows, newTotalPaid);
    const newStatus = newBalance <= 0 ? 'closed' : classifyLoanStatus(arrearsDays, newBalance, l.expected_closure_date);

    await db.query(
      `UPDATE loans SET total_paid=$1, outstanding_balance=$2, arrears_amount=$3, arrears_days=$4, status=$5
       WHERE id=$6`,
      [newTotalPaid, newBalance, arrearsAmount, arrearsDays, newStatus, loan_id]
    );

    res.status(201).json({
      success: true,
      data: rep.rows[0],
      loan_status: newStatus,
      outstanding_balance: newBalance,
      arrears_amount: arrearsAmount,
      arrears_days: arrearsDays,
    });
  } catch (err) {
    console.error('POST /repayments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /repayments?loan_id=...
router.get('/', async (req, res) => {
  try {
    const { loan_id, client_id, staff_id, branch_id, from_date, to_date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['r.branch_id IN (SELECT id FROM branches WHERE tenant_id = $1)'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (loan_id)  { conditions.push(`r.loan_id = $${idx++}`); params.push(loan_id); }
    if (client_id){ conditions.push(`l.client_id = $${idx++}`); params.push(client_id); }
    if (staff_id) { conditions.push(`r.collected_by = $${idx++}`); params.push(staff_id); }
    if (branch_id){ conditions.push(`r.branch_id = $${idx++}`); params.push(branch_id); }
    if (from_date){ conditions.push(`r.payment_date >= $${idx++}`); params.push(from_date); }
    if (to_date)  { conditions.push(`r.payment_date <= $${idx++}`); params.push(to_date); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT r.*,
              l.loan_number, c.first_name || ' ' || c.last_name AS client_name,
              u.first_name || ' ' || u.last_name AS collected_by_name
       FROM repayments r
       JOIN loans l ON r.loan_id = l.id
       JOIN clients c ON l.client_id = c.id
       JOIN users u ON r.collected_by = u.id
       ${where}
       ORDER BY r.payment_date DESC, r.payment_time DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(`SELECT COUNT(*), SUM(amount_paid) AS total_amount FROM repayments r ${where}`, params);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: parseInt(total.rows[0].count),
        total_amount: parseFloat(total.rows[0].total_amount || 0),
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    console.error('GET /repayments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /repayments/schedule/:loan_id — full schedule with status
router.get('/schedule/:loan_id', async (req, res) => {
  try {
    // Verify loan belongs to user's tenant
    const loanCheck = await db.query('SELECT id FROM loans WHERE id = $1 AND tenant_id = $2', [req.params.loan_id, req.user.tenant_id]);
    if (loanCheck.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

    const result = await db.query(
      `SELECT rs.*,
              CASE WHEN rs.due_date < CURRENT_DATE AND NOT rs.is_paid THEN true ELSE false END AS is_overdue,
              CURRENT_DATE - rs.due_date AS days_overdue
       FROM repayment_schedules rs
       WHERE rs.loan_id = $1
       ORDER BY rs.installment_number`,
      [req.params.loan_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /repayments/schedule/:loan_id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /repayments/webhook/mobile-money — Webhook for Live Digital Collections
router.post('/webhook/mobile-money', async (req, res) => {
  try {
    // Basic auth or signature validation would go here depending on the provider
    const { transaction_id, amount, msisdn, reference, status, timestamp } = req.body;

    if (status !== 'SUCCESS') {
      return res.status(200).json({ received: true, status: 'ignored' });
    }

    // Find loan by reference (assuming reference = loan_number)
    const loanQuery = await db.query('SELECT * FROM loans WHERE loan_number=$1 AND status IN (\'active\', \'at_risk\', \'delinquent\')', [reference]);
    
    if (loanQuery.rows.length === 0) {
      console.warn(`[WEBHOOK] Received payment for unknown/closed loan: ${reference}`);
      return res.status(200).json({ received: true, error: 'Loan not found' });
    }

    const l = loanQuery.rows[0];

    // Check anti-double payment by transaction_id
    const existing = await db.query('SELECT id FROM repayments WHERE reference_number=$1 AND is_reversed=false', [transaction_id]);
    if (existing.rows.length > 0) {
      return res.status(200).json({ received: true, status: 'duplicate' });
    }

    // Insert repayment (we assign it to the staff who owns the loan, or a system generic ID)
    const paymentDate = new Date(timestamp || Date.now()).toISOString().split('T')[0];

    const rep = await db.query(
      `INSERT INTO repayments (loan_id, collected_by, branch_id, amount_paid,
         payment_date, payment_method, reference_number, notes)
       VALUES ($1,$2,$3,$4,$5,'mobile_money',$6,'Automated Mobile Money Webhook') RETURNING *`,
      [l.id, l.staff_id, l.branch_id, amount, paymentDate, transaction_id]
    );

    // Apply waterfall logic to schedule
    const newTotalPaid = parseFloat(l.total_paid) + parseFloat(amount);
    const newBalance = Math.max(0, parseFloat(l.total_repayable) - newTotalPaid);

    let remaining = parseFloat(amount);
    const pendingSchedule = await db.query(
      `SELECT * FROM repayment_schedules WHERE loan_id=$1 AND is_paid=false ORDER BY due_date`,
      [l.id]
    );

    for (const inst of pendingSchedule.rows) {
      if (remaining <= 0) break;
      const instDue = parseFloat(inst.total_due) - parseFloat(inst.total_paid);
      if (remaining >= instDue) {
        await db.query(
          `UPDATE repayment_schedules SET is_paid=true, paid_date=$1, total_paid=total_due, balance=0 WHERE id=$2`,
          [paymentDate, inst.id]
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

    // Re-calculate arrears
    const allSchedule = await db.query('SELECT * FROM repayment_schedules WHERE loan_id=$1 ORDER BY due_date', [l.id]);
    const { arrearsAmount, arrearsDays } = calculateArrears(allSchedule.rows, newTotalPaid);
    const newStatus = newBalance <= 0 ? 'closed' : classifyLoanStatus(arrearsDays, newBalance, l.expected_closure_date);

    await db.query(
      `UPDATE loans SET total_paid=$1, outstanding_balance=$2, arrears_amount=$3, arrears_days=$4, status=$5 WHERE id=$6`,
      [newTotalPaid, newBalance, arrearsAmount, arrearsDays, newStatus, l.id]
    );

    console.log(`[WEBHOOK SUCCESS] Applied ${amount} to Loan ${reference}`);
    res.status(200).json({ received: true, success: true });
  } catch (err) {
    console.error('POST /repayments/webhook/mobile-money error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
