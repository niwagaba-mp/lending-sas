const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

// Only SuperAdmin can access these routes
router.use(authenticate);
router.use(authorize('super_admin'));

// ─── TENANT MANAGEMENT ──────────────────────────────────────────

// GET /superadmin/tenants
router.get('/tenants', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, 
              s.plan_name, s.billing_amount, s.status as sub_status, s.next_billing_date,
              (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
              (SELECT COUNT(*) FROM loans l WHERE l.tenant_id = t.id) as loan_count
       FROM tenants t
       LEFT JOIN system_subscriptions s ON t.id = s.tenant_id
       ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /superadmin/tenants — Create new tenant
router.post('/tenants', async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { name, slug, email, phone, country, currency, billing_amount } = req.body;
    
    // 1. Create Tenant
    const tenant = await client.query(
      `INSERT INTO tenants (name, slug, email, phone, country, currency) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slug, email, phone, country, currency]
    );

    // 2. Initialize Subscription
    await client.query(
      `INSERT INTO system_subscriptions (tenant_id, billing_amount, currency, next_billing_date)
       VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '30 days')`,
      [tenant.rows[0].id, billing_amount, currency]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: tenant.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ─── BILLING & LOCKING ──────────────────────────────────────────

// PUT /superadmin/subscriptions/:id/lock
router.put('/subscriptions/:tenant_id/lock', async (req, res) => {
  try {
    const { is_locked } = req.body;
    await db.query(
      `UPDATE system_subscriptions SET is_locked_manually = $1, status = $2 WHERE tenant_id = $3`,
      [is_locked, is_locked ? 'locked' : 'active', req.params.tenant_id]
    );
    // Also update tenant is_active for redundant protection
    await db.query(`UPDATE tenants SET is_active = $1 WHERE id = $2`, [!is_locked, req.params.tenant_id]);
    
    res.json({ success: true, message: `Tenant ${is_locked ? 'Locked' : 'Unlocked'} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── FINANCIAL STATEMENTS & PROJECTIONS ──────────────────────────

// GET /superadmin/financials
router.get('/financials', async (req, res) => {
  try {
    const revenue = await db.query(`SELECT * FROM v_system_owner_financials ORDER BY year DESC, month DESC`);
    const overhead = await db.query(`SELECT * FROM system_owner_expenses ORDER BY expense_date DESC`);
    
    res.json({ success: true, data: { revenue: revenue.rows, overhead: overhead.rows } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GEO-TRACKING & LOGS ─────────────────────────────────────────

// GET /superadmin/login-logs
router.get('/login-logs', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, u.first_name || ' ' || u.last_name as user_name, t.name as tenant_name
       FROM system_login_logs l
       JOIN users u ON l.user_id = u.id
       JOIN tenants t ON l.tenant_id = t.id
       ORDER BY l.login_time DESC LIMIT 100`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
