const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /legal
router.get('/', async (req, res) => {
  try {
    const { branch_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['lc.tenant_id = $1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (branch_id) { conditions.push(`lc.branch_id = $${idx++}`); params.push(branch_id); }
    if (status)    { conditions.push(`lc.status = $${idx++}`); params.push(status); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT lc.*,
              l.loan_number, l.principal_amount, l.interest_amount, l.total_repayable,
              l.disbursement_date, l.repayment_frequency,
              c.first_name || ' ' || c.last_name AS client_name,
              c.phone_primary AS client_phone, c.national_id AS client_national_id,
              c.home_address, c.home_latitude, c.home_longitude,
              c.business_address, c.business_latitude, c.business_longitude,
              u.first_name || ' ' || u.last_name AS staff_name,
              u.phone_primary AS staff_phone,
              b.name AS branch_name,
              fb.first_name || ' ' || fb.last_name AS filed_by_name
       FROM legal_cases lc
       JOIN loans l ON lc.loan_id = l.id
       JOIN clients c ON lc.client_id = c.id
       JOIN users u ON lc.staff_id = u.id
       JOIN branches b ON lc.branch_id = b.id
       JOIN users fb ON lc.filed_by = fb.id
       ${where}
       ORDER BY lc.filed_date DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(`SELECT COUNT(*) FROM legal_cases lc ${where}`, params);
    res.json({ success: true, data: result.rows, meta: { total: parseInt(total.rows[0].count) } });
  } catch (err) {
    console.error('GET /legal error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /legal/:id — full case file
router.get('/:id', async (req, res) => {
  try {
    const lc = await db.query(
      `SELECT lc.*,
              l.loan_number, l.principal_amount, l.interest_amount, l.total_repayable,
              l.total_paid, l.outstanding_balance, l.arrears_amount, l.arrears_days,
              l.disbursement_date, l.repayment_frequency, l.duration_days,
              l.expected_closure_date, l.loan_purpose,
              c.first_name || ' ' || c.last_name AS client_name,
              c.national_id AS client_national_id, c.phone_primary AS client_phone,
              c.home_address, c.home_latitude, c.home_longitude,
              c.business_address, c.business_latitude, c.business_longitude,
              u.first_name || ' ' || u.last_name AS staff_name,
              u.phone_primary AS staff_phone, u.national_id AS staff_national_id,
              u.village_name, u.village_latitude, u.village_longitude,
              b.name AS branch_name
       FROM legal_cases lc
       JOIN loans l ON lc.loan_id = l.id
       JOIN clients c ON lc.client_id = c.id
       JOIN users u ON lc.staff_id = u.id
       JOIN branches b ON lc.branch_id = b.id
       WHERE lc.id=$1 AND lc.tenant_id=$2`,
      [req.params.id, req.user.tenant_id]
    );
    if (lc.rows.length === 0) return res.status(404).json({ error: 'Case not found' });

    // Repayment history
    const payments = await db.query(
      `SELECT r.*, u.first_name || ' ' || u.last_name AS collected_by_name
       FROM repayments r JOIN users u ON r.collected_by = u.id
       WHERE r.loan_id=$1 ORDER BY r.payment_date`,
      [lc.rows[0].loan_id]
    );

    // Guarantors
    const guarantors = await db.query(
      'SELECT * FROM loan_guarantors WHERE loan_id=$1',
      [lc.rows[0].loan_id]
    );

    // Client next of kin
    const nok = await db.query(
      'SELECT * FROM client_next_of_kin WHERE client_id=$1',
      [lc.rows[0].client_id]
    );

    res.json({
      success: true,
      data: {
        case: lc.rows[0],
        repayment_history: payments.rows,
        guarantors: guarantors.rows,
        next_of_kin: nok.rows,
      },
    });
  } catch (err) {
    console.error('GET /legal/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /legal — open case for a defaulted loan
router.post('/', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { loan_id, case_notes, court_name, hearing_date } = req.body;

    const loan = await db.query(
      `SELECT l.*, c.id AS cid, u.id AS uid
       FROM loans l JOIN clients c ON l.client_id=c.id JOIN users u ON l.staff_id=u.id
       WHERE l.id=$1 AND l.tenant_id=$2`,
      [loan_id, req.user.tenant_id]
    );
    if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

    const l = loan.rows[0];
    const caseNum = `LC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const result = await db.query(
      `INSERT INTO legal_cases (case_number, loan_id, client_id, staff_id, branch_id, tenant_id,
         filed_by, total_outstanding, total_arrears, case_notes, court_name, hearing_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        caseNum, loan_id, l.client_id, l.staff_id, l.branch_id, req.user.tenant_id,
        req.user.id, l.outstanding_balance, l.arrears_amount,
        case_notes, court_name || null, hearing_date || null,
      ]
    );

    // Mark loan as non-performing if not already
    if (!['non_performing', 'written_off'].includes(l.status)) {
      await db.query(`UPDATE loans SET status='non_performing' WHERE id=$1`, [loan_id]);
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /legal error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /legal/:id — update case
router.put('/:id', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { status, court_name, court_reference, hearing_date, resolution_date, resolution_notes, case_notes } = req.body;
    const result = await db.query(
      `UPDATE legal_cases SET status=$1, court_name=$2, court_reference=$3,
       hearing_date=$4, resolution_date=$5, resolution_notes=$6, case_notes=$7
       WHERE id=$8 AND tenant_id=$9 RETURNING *`,
      [status, court_name, court_reference, hearing_date, resolution_date, resolution_notes, case_notes,
       req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /legal/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
