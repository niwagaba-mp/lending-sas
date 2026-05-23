const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');
const { calculateArrears, classifyLoanStatus } = require('../loans/loan.engine');

const router = express.Router();
router.use(authenticate);

// POST /misc — record shortage, excess, fine, etc.
router.post('/', authorize('cashier', 'loan_officer', 'branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      type, amount, staff_id, client_id, loan_id, notes, reference, transaction_date
    } = req.body;

    if (!type || !amount) {
      client.release();
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    // Determine category based on type
    let category = 'cash_in';
    if (['shortage', 'loan_return'].includes(type)) {
      category = 'cash_out';
    }

    await client.query('BEGIN');

    let miscTx;

    if (type === 'shortage' && loan_id) {
      // 1. Fetch and lock loan
      const loanCheck = await client.query(
        'SELECT * FROM loans WHERE id=$1 AND tenant_id=$2 FOR UPDATE',
        [loan_id, req.user.tenant_id]
      );
      if (loanCheck.rows.length === 0) {
        throw new Error('Loan not found');
      }
      const l = loanCheck.rows[0];
      if (['closed', 'written_off', 'draft'].includes(l.status)) {
        throw new Error(`Cannot accept shortage repayment on a ${l.status} loan`);
      }

      // 2. Find earliest unpaid schedule
      const scheduleRes = await client.query(
        `SELECT * FROM repayment_schedules WHERE loan_id=$1 AND is_paid=false ORDER BY due_date LIMIT 1 FOR UPDATE`,
        [loan_id]
      );
      const scheduleId = scheduleRes.rows.length > 0 ? scheduleRes.rows[0].id : null;

      // 3. Insert repayment record
      const repaymentDate = transaction_date || new Date().toISOString().split('T')[0];
      await client.query(
        `INSERT INTO repayments (
          loan_id, schedule_id, collected_by, branch_id, amount_paid,
          payment_date, payment_method, reference_number, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          loan_id, scheduleId, staff_id || req.user.id, req.user.branch_id,
          amount, repaymentDate, 'shortage', reference, notes || 'Staff Shortage Repayment'
        ]
      );

      // 4. Update loan totals
      const newTotalPaid = parseFloat(l.total_paid) + parseFloat(amount);
      const newBalance = Math.max(0, parseFloat(l.total_repayable) - newTotalPaid);

      // 5. Mark schedule installments as paid (greedy fill)
      let remaining = parseFloat(amount);
      const pendingSchedule = await client.query(
        `SELECT * FROM repayment_schedules WHERE loan_id=$1 AND is_paid=false ORDER BY due_date FOR UPDATE`,
        [loan_id]
      );
      for (const inst of pendingSchedule.rows) {
        if (remaining <= 0) break;
        const instDue = parseFloat(inst.total_due) - parseFloat(inst.total_paid);
        if (remaining >= instDue) {
          await client.query(
            `UPDATE repayment_schedules SET is_paid=true, paid_date=$1, total_paid=total_due, balance=0 WHERE id=$2`,
            [repaymentDate, inst.id]
          );
          remaining -= instDue;
        } else {
          await client.query(
            `UPDATE repayment_schedules SET total_paid=total_paid+$1, balance=balance-$1 WHERE id=$2`,
            [remaining, inst.id]
          );
          remaining = 0;
        }
      }

      // 6. Re-calculate arrears
      const allSchedule = await client.query(
        'SELECT * FROM repayment_schedules WHERE loan_id=$1 ORDER BY due_date',
        [loan_id]
      );
      const { arrearsAmount, arrearsDays } = calculateArrears(allSchedule.rows, newTotalPaid);
      const newStatus = newBalance <= 0 ? 'closed' : classifyLoanStatus(arrearsDays, newBalance, l.expected_closure_date);

      await client.query(
        `UPDATE loans SET total_paid=$1, outstanding_balance=$2, arrears_amount=$3, arrears_days=$4, status=$5
         WHERE id=$6`,
        [newTotalPaid, newBalance, arrearsAmount, arrearsDays, newStatus, loan_id]
      );
    }

    // Insert misc transaction
    const result = await client.query(
      `INSERT INTO misc_transactions (
        tenant_id, branch_id, user_id, client_id, loan_id,
        type, category, amount, reference, notes, transaction_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        req.user.tenant_id, req.user.branch_id, staff_id || req.user.id,
        client_id || null, loan_id || null, type, category, amount, reference, notes,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    miscTx = result.rows[0];

    // If it's a loan fine, update the loan balance
    if (type === 'loan_fine' && loan_id) {
      await client.query(
        `UPDATE loans SET 
          total_repayable = total_repayable + $1,
          outstanding_balance = outstanding_balance + $1
         WHERE id = $2`,
        [amount, loan_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: miscTx });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /misc error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
