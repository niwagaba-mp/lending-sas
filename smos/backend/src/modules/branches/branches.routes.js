const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /branches — list branches for current tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.role === 'super_admin'
      ? req.query.tenant_id
      : req.user.tenant_id;

    let query = `
      SELECT b.*,
        u.first_name || ' ' || u.last_name AS manager_name,
        COUNT(DISTINCT c.id) AS client_count,
        COUNT(DISTINCT us.id) AS staff_count,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status NOT IN ('draft','closed','written_off')) AS active_loan_count,
        COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.status NOT IN ('draft','closed','written_off')), 0) AS portfolio_value
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      LEFT JOIN clients c ON c.branch_id = b.id
      LEFT JOIN users us ON us.branch_id = b.id
      LEFT JOIN loans l ON l.branch_id = b.id
    `;
    const params = [];
    if (tenantId) {
      query += ' WHERE b.tenant_id = $1';
      params.push(tenantId);
    }
    query += ' GROUP BY b.id, u.first_name, u.last_name ORDER BY b.name';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /branches error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /branches/:id
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.role === 'super_admin'
      ? req.query.tenant_id || req.user.tenant_id
      : req.user.tenant_id;

    const result = await db.query(
      `SELECT b.*, u.first_name || ' ' || u.last_name AS manager_name,
              (SELECT COUNT(*) FROM clients WHERE branch_id = b.id) AS client_count
       FROM branches b LEFT JOIN users u ON b.manager_id = u.id
       WHERE b.id = $1 AND b.tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('GET /branches/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /branches
router.post('/', authorize('super_admin', 'tenant_admin'), async (req, res) => {
  try {
    const {
      name, code, address, district, region,
      latitude, longitude, phone, email, tenant_id,
    } = req.body;
    const tId = req.user.role === 'super_admin' ? tenant_id : req.user.tenant_id;

    const result = await db.query(
      `INSERT INTO branches (tenant_id, name, code, address, district, region, latitude, longitude, phone, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tId, name, code, address, district, region, latitude, longitude, phone, email]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /branches error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /branches/:id
router.put('/:id', authorize('super_admin', 'tenant_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, code, address, district, region, latitude, longitude, phone, email, manager_id, is_active } = req.body;
    const tenantId = req.user.role === 'super_admin'
      ? req.query.tenant_id || req.user.tenant_id
      : req.user.tenant_id;

    const result = await db.query(
      `UPDATE branches SET name=$1, code=$2, address=$3, district=$4, region=$5,
       latitude=$6, longitude=$7, phone=$8, email=$9, manager_id=$10, is_active=$11
       WHERE id=$12 AND tenant_id=$13 RETURNING *`,
      [name, code, address, district, region, latitude, longitude, phone, email, manager_id, is_active, req.params.id, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /branches/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
