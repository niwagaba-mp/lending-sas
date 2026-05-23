const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');
const { generateRepaymentSchedule } = require('./loan.engine');

const router = express.Router();
router.use(authenticate);

// GET /loans
router.get('/', async (req, res) => {
  try {
    const { branch_id, staff_id, client_id, status, gender, district, business_type, age_range, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['l.tenant_id = $1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (req.user.role === 'loan_officer') {
      conditions.push(`l.staff_id = $${idx++}`); params.push(req.user.id);
    } else if (req.user.role === 'branch_manager' || req.user.role === 'supervisor') {
      conditions.push(`l.branch_id = $${idx++}`); params.push(req.user.branch_id);
    }

    if (branch_id) { conditions.push(`l.branch_id = $${idx++}`); params.push(branch_id); }
    if (staff_id)  { conditions.push(`l.staff_id = $${idx++}`); params.push(staff_id); }
    if (client_id) { conditions.push(`l.client_id = $${idx++}`); params.push(client_id); }
    if (status) {
      if (status === 'paid_today') {
        conditions.push(`EXISTS (
          SELECT 1 FROM repayments r 
          WHERE r.loan_id = l.id 
            AND r.payment_date = CURRENT_DATE 
            AND r.is_reversed = false
        )`);
      } else if (status === 'did_not_pay_today') {
        conditions.push(`EXISTS (
          SELECT 1 FROM repayment_schedules rs 
          WHERE rs.loan_id = l.id 
            AND rs.due_date = CURRENT_DATE
        ) AND NOT EXISTS (
          SELECT 1 FROM repayments r 
          WHERE r.loan_id = l.id 
            AND r.payment_date = CURRENT_DATE 
            AND r.is_reversed = false
        )`);
      } else if (status === 'paid_in_advance') {
        conditions.push(`l.status NOT IN ('draft', 'closed', 'written_off') AND GREATEST(0, l.total_paid - COALESCE((SELECT SUM(total_due) FROM repayment_schedules WHERE loan_id = l.id AND due_date <= CURRENT_DATE), 0)) > 0`);
      } else {
        conditions.push(`l.status = $${idx++}`);
        params.push(status);
      }
    }
    if (gender)    { conditions.push(`c.gender = $${idx++}`); params.push(gender); }
    if (district)  { conditions.push(`c.home_district = $${idx++}`); params.push(district); }
    if (business_type) { conditions.push(`c.business_type = $${idx++}`); params.push(business_type); }
    if (age_range) {
      if (age_range === 'under_25') {
        conditions.push(`EXTRACT(YEAR FROM AGE(c.date_of_birth)) < 25`);
      } else if (age_range === '25_40') {
        conditions.push(`EXTRACT(YEAR FROM AGE(c.date_of_birth)) BETWEEN 25 AND 40`);
      } else if (age_range === 'over_40') {
        conditions.push(`EXTRACT(YEAR FROM AGE(c.date_of_birth)) > 40`);
      }
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT l.*,
              CASE WHEN l.status IN ('draft', 'closed', 'written_off') THEN 0 ELSE GREATEST(0, l.total_paid - COALESCE((SELECT SUM(total_due) FROM repayment_schedules WHERE loan_id = l.id AND due_date <= CURRENT_DATE), 0)) END AS advance_amount,
              c.first_name || ' ' || c.last_name AS client_name, c.phone_primary AS client_phone,
              u.first_name || ' ' || u.last_name AS staff_name,
              b.name AS branch_name
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       JOIN users u ON l.staff_id = u.id
       JOIN branches b ON l.branch_id = b.id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(`SELECT COUNT(*) FROM loans l ${where}`, params);

    res.json({
      success: true,
      data: result.rows,
      meta: { total: parseInt(total.rows[0].count), page: +page, limit: +limit },
    });
  } catch (err) {
    console.error('GET /loans error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /loans/:id — full loan detail
router.get('/:id', async (req, res) => {
  try {
    const loan = await db.query(
      `SELECT l.*,
              CASE WHEN l.status IN ('draft', 'closed', 'written_off') THEN 0 ELSE GREATEST(0, l.total_paid - COALESCE((SELECT SUM(total_due) FROM repayment_schedules WHERE loan_id = l.id AND due_date <= CURRENT_DATE), 0)) END AS advance_amount,
              c.first_name || ' ' || c.last_name AS client_name,
              c.phone_primary AS client_phone,
              c.home_latitude, c.home_longitude, c.business_latitude, c.business_longitude,
              u.first_name || ' ' || u.last_name AS staff_name, u.phone_primary AS staff_phone,
              b.name AS branch_name,
              ab.first_name || ' ' || ab.last_name AS approved_by_name
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       JOIN users u ON l.staff_id = u.id
       JOIN branches b ON l.branch_id = b.id
       LEFT JOIN users ab ON l.approved_by = ab.id
       WHERE l.id = $1 AND l.tenant_id = $2`,
      [req.params.id, req.user.tenant_id]
    );
    if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

    const schedule = await db.query(
      'SELECT * FROM repayment_schedules WHERE loan_id=$1 ORDER BY installment_number',
      [req.params.id]
    );
    const payments = await db.query(
      `SELECT r.*, u.first_name || ' ' || u.last_name AS collected_by_name
       FROM repayments r JOIN users u ON r.collected_by = u.id
       WHERE r.loan_id=$1 ORDER BY r.payment_date DESC`,
      [req.params.id]
    );
    const guarantors = await db.query(
      'SELECT * FROM loan_guarantors WHERE loan_id=$1',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...loan.rows[0],
        schedule: schedule.rows,
        payments: payments.rows,
        guarantors: guarantors.rows,
      },
    });
  } catch (err) {
    console.error('GET /loans/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans — create draft loan
router.post('/', authorize('loan_officer', 'branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      client_id, principal_amount, processing_fee, interest_rate = 20, repayment_frequency,
      duration_days, loan_purpose, notes, guarantors = [], staff_id,
    } = req.body;

    const cleanProcessingFee = (processing_fee === '' || processing_fee === null || processing_fee === undefined) ? 0 : parseFloat(processing_fee);

    if (!guarantors || guarantors.length === 0) {
      return res.status(400).json({ error: 'At least one guarantor is required' });
    }
    
    // Validate guarantor details
    for (const g of guarantors) {
      if (!g.full_name || !g.phone || !g.national_id || !g.relationship) {
        return res.status(400).json({ error: 'Guarantor is missing mandatory fields (Name, Phone, ID, Relationship)' });
      }
    }

    // Validate client exists and has GPS + approval
    const client = await db.query(
      'SELECT * FROM clients WHERE id=$1 AND tenant_id=$2',
      [client_id, req.user.tenant_id]
    );
    if (client.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const c = client.rows[0];
    if (!c.gps_captured) return res.status(400).json({ error: 'Anti-ghost: Client GPS not captured' });
    if (!c.photo_verified) return res.status(400).json({ error: 'Anti-ghost: Client photo not verified' });
    if (!c.supervisor_approved) return res.status(400).json({ error: 'Anti-ghost: Client not supervisor-approved' });

    // Check for existing active/pending loans
    const activeLoans = await db.query(
      `SELECT id FROM loans WHERE client_id=$1 AND tenant_id=$2 AND status NOT IN ('closed', 'written_off', 'defaulted')`,
      [client_id, req.user.tenant_id]
    );
    if (activeLoans.rows.length > 0) {
      return res.status(400).json({ error: 'Client already has an active or pending loan. Previous loan must be paid first.' });
    }

    const freq = repayment_frequency;
    let installmentCount;
    if (freq === 'daily') installmentCount = duration_days;
    else if (freq === 'weekly') installmentCount = Math.ceil(duration_days / 7);
    else installmentCount = Math.ceil(duration_days / 30);

    const interestAmount = (principal_amount * (interest_rate / 100));
    const totalRepayable = parseFloat(principal_amount) + interestAmount;
    const installmentAmount = totalRepayable / installmentCount;

    const loanNumber = `LN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const initialStatus = req.user.role === 'loan_officer' ? 'pending_approval' : 'draft';

    const result = await db.query(
      `INSERT INTO loans (
        loan_number, tenant_id, branch_id, client_id, staff_id,
        principal_amount, processing_fee, interest_rate, interest_amount, total_repayable,
        repayment_frequency, duration_days, installment_count, installment_amount,
        application_date, outstanding_balance, loan_purpose, notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_DATE,$15,$16,$17,$18)
      RETURNING *`,
      [
        loanNumber, req.user.tenant_id, c.branch_id,
        client_id, staff_id || req.user.id,
        principal_amount, cleanProcessingFee, interest_rate, interestAmount, totalRepayable,
        freq, duration_days, installmentCount, installmentAmount,
        totalRepayable, loan_purpose, notes, initialStatus
      ]
    );

    const loan = result.rows[0];

    // Insert guarantors
    for (const g of guarantors) {
      await db.query(
        `INSERT INTO loan_guarantors (loan_id, full_name, national_id, phone, photo_url, relationship, address, latitude, longitude)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [loan.id, g.full_name, g.national_id, g.phone, g.photo_url, g.relationship, g.address, g.latitude, g.longitude]
      );
    }

    res.status(201).json({ success: true, data: loan });
  } catch (err) {
    console.error('POST /loans error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/:id/approve
router.post('/:id/approve', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin', 'cashier'), async (req, res) => {
  try {
    await db.query(
      `UPDATE loans SET status='approved', approved_by=$1, approval_date=CURRENT_DATE
       WHERE id=$2 AND tenant_id=$3 AND status IN ('draft', 'pending_approval')`,
      [req.user.id, req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, message: 'Loan approved' });
  } catch (err) {
    console.error('POST /loans/:id/approve error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/:id/disburse — Anti-ghost check + schedule generation
router.post('/:id/disburse', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin', 'cashier'), async (req, res) => {
  try {
    const { gps_verified = false, photo_verified = false, disbursement_date } = req.body;

    if (!gps_verified) return res.status(400).json({ error: 'Anti-ghost: GPS verification required for disbursement' });
    if (!photo_verified) return res.status(400).json({ error: 'Anti-ghost: Photo verification required for disbursement' });

    const loan = await db.query(
      'SELECT * FROM loans WHERE id=$1 AND tenant_id=$2 AND status=\'approved\'',
      [req.params.id, req.user.tenant_id]
    );
    if (loan.rows.length === 0) return res.status(400).json({ error: 'Loan not found or not approved' });

    const l = loan.rows[0];
    const disbDate = disbursement_date || new Date().toISOString().split('T')[0];
    const expectedClosure = new Date(disbDate);
    expectedClosure.setDate(expectedClosure.getDate() + l.duration_days);

    await db.query(
      `UPDATE loans SET status='active', disbursement_date=$1, expected_closure_date=$2,
       disbursed_by=$3, gps_verified=$4, photo_verified=$5, supervisor_approved=true
       WHERE id=$6`,
      [disbDate, expectedClosure.toISOString().split('T')[0], req.user.id, true, true, l.id]
    );

    // Generate repayment schedule
    const schedule = generateRepaymentSchedule(l, disbDate);
    for (const s of schedule) {
      await db.query(
        `INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_due, interest_due, total_due, balance)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [l.id, s.installment_number, s.due_date, s.principal_due, s.interest_due, s.total_due, s.total_due]
      );
    }

    // Automatically clean up other pending/draft applications for this client to prevent double entries
    await db.query(
      `DELETE FROM loan_guarantors WHERE loan_id IN (
        SELECT id FROM loans WHERE client_id = $1 AND id <> $2 AND status IN ('draft', 'pending_approval')
      )`,
      [l.client_id, l.id]
    );
    await db.query(
      `DELETE FROM loans WHERE client_id = $1 AND id <> $2 AND status IN ('draft', 'pending_approval')`,
      [l.client_id, l.id]
    );

    res.json({ success: true, message: 'Loan disbursed and schedule generated', data: { schedule } });
  } catch (err) {
    console.error('POST /loans/:id/disburse error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/:id/writeoff
router.post('/:id/writeoff', authorize('tenant_admin', 'super_admin'), async (req, res) => {
  try {
    await db.query(
      `UPDATE loans SET status='written_off' WHERE id=$1 AND tenant_id=$2`,
      [req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, message: 'Loan written off' });
  } catch (err) {
    console.error('POST /loans/:id/writeoff error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /loans/:id — Delete / withdraw draft or pending approval loans
router.delete('/:id', async (req, res) => {
  try {
    const loan = await db.query(
      'SELECT id, status FROM loans WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.user.tenant_id]
    );
    if (loan.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    const status = loan.rows[0].status;
    if (status !== 'draft' && status !== 'pending_approval') {
      return res.status(400).json({ error: 'Only draft or pending loans can be deleted or withdrawn' });
    }

    // Delete guarantors first to maintain referential integrity
    await db.query('DELETE FROM loan_guarantors WHERE loan_id = $1', [req.params.id]);

    // Delete the loan
    await db.query('DELETE FROM loans WHERE id = $1 AND tenant_id = $2', [req.params.id, req.user.tenant_id]);

    res.json({ success: true, message: 'Loan application withdrawn and deleted successfully' });
  } catch (err) {
    console.error('DELETE /loans/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
