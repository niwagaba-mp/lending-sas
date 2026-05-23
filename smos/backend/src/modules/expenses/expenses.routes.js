const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /expenses
router.get('/', async (req, res) => {
  try {
    const { staff_id, branch_id, category, from_date, to_date, is_approved, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['se.tenant_id = $1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (req.user.role === 'loan_officer') {
      conditions.push(`se.staff_id = $${idx++}`); params.push(req.user.id);
    } else if (req.user.role === 'branch_manager') {
      conditions.push(`se.branch_id = $${idx++}`); params.push(req.user.branch_id);
    }

    if (staff_id)    { conditions.push(`se.staff_id = $${idx++}`); params.push(staff_id); }
    if (branch_id)   { conditions.push(`se.branch_id = $${idx++}`); params.push(branch_id); }
    if (category)    { conditions.push(`se.category = $${idx++}`); params.push(category); }
    if (from_date)   { conditions.push(`se.expense_date >= $${idx++}`); params.push(from_date); }
    if (to_date)     { conditions.push(`se.expense_date <= $${idx++}`); params.push(to_date); }
    if (is_approved !== undefined) { conditions.push(`se.is_approved = $${idx++}`); params.push(is_approved === 'true'); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT se.*,
              u.first_name || ' ' || u.last_name AS staff_name,
              b.name AS branch_name,
              ab.first_name || ' ' || ab.last_name AS approved_by_name
       FROM staff_expenses se
       JOIN users u ON se.staff_id = u.id
       JOIN branches b ON se.branch_id = b.id
       LEFT JOIN users ab ON se.approved_by = ab.id
       ${where}
       ORDER BY se.expense_date DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const totals = await db.query(
      `SELECT SUM(amount) AS total, COUNT(*) AS count FROM staff_expenses se ${where}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: parseInt(totals.rows[0].count),
        total_amount: parseFloat(totals.rows[0].total || 0),
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    console.error('GET /expenses error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /expenses
router.post('/', authorize('loan_officer', 'cashier', 'branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { category, amount, description, expense_date, loan_id, client_id, receipt_url, staff_id } = req.body;
    const assignedStaffId = staff_id || req.user.id;
    const result = await db.query(
      `INSERT INTO staff_expenses (staff_id, branch_id, tenant_id, category, amount,
         description, expense_date, loan_id, client_id, receipt_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        assignedStaffId, req.user.branch_id, req.user.tenant_id,
        category, amount, description,
        expense_date || new Date().toISOString().split('T')[0],
        loan_id || null, client_id || null, receipt_url || null,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /expenses error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /expenses/:id/approve
router.post('/:id/approve', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE staff_expenses SET is_approved=true, approved_by=$1 WHERE id=$2 AND tenant_id=$3 RETURNING *`,
      [req.user.id, req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /expenses/:id/approve error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /expenses/:id (pending only)
router.delete('/:id', async (req, res) => {
  try {
    await db.query(
      `DELETE FROM staff_expenses WHERE id=$1 AND staff_id=$2 AND is_approved=false`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error('DELETE /expenses/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /expenses/summary/:staff_id — expense summary by category
router.get('/summary/:staff_id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT category, SUM(amount) AS total, COUNT(*) AS count
       FROM staff_expenses WHERE staff_id=$1 AND tenant_id=$2
       GROUP BY category ORDER BY total DESC`,
      [req.params.staff_id, req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /expenses/summary/:staff_id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
