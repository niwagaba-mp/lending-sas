const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

// ─── GET /tenants — List all tenants (SuperAdmin only) ────────────────
router.get('/', authenticate, authorize('super_admin'), async (req, res) => {
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
    console.error('GET /tenants error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /tenants — Public Onboarding (no auth required) ─────────────
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      name,
      slug,
      email,
      admin_password,
      plan_name,
      billing_amount,
      country,
      payment_status,
      sub_status,
    } = req.body;

    if (!name || !slug || !email || !admin_password) {
      return res.status(400).json({ error: 'Name, slug, email, and admin password are required' });
    }

    // Check if tenant slug already exists
    const existingTenant = await client.query('SELECT id FROM tenants WHERE slug = $1', [slug.toLowerCase().trim()]);
    if (existingTenant.rows.length > 0) {
      return res.status(400).json({ error: 'A tenant workspace with this slug already exists.' });
    }

    // Check if user email already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    await client.query('BEGIN');

    // 1. Create Tenant (set is_active = false initially until approved)
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, slug, country, is_active, settings) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        name,
        slug.toLowerCase().trim(),
        country || 'Uganda',
        sub_status === 'active',
        JSON.stringify({ base_billing: billing_amount || 0, addons: [] }),
      ]
    );
    const tenant = tenantRes.rows[0];

    // 2. Create Default Branch (HQ)
    const branchRes = await client.query(
      `INSERT INTO branches (tenant_id, name, code, is_active)
       VALUES ($1, 'Head Office', 'HQ', true) RETURNING *`,
      [tenant.id]
    );
    const branch = branchRes.rows[0];

    // 3. Hash Admin Password & Create User (role: tenant_admin)
    const passwordHash = await bcrypt.hash(admin_password, 12);
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, branch_id, role, first_name, last_name, email, password_hash, is_active)
       VALUES ($1, $2, 'tenant_admin', $3, $4, $5, $6, true) RETURNING *`,
      [tenant.id, branch.id, firstName, lastName, email.toLowerCase().trim(), passwordHash]
    );

    // 4. Initialize System Subscription (status defaults to sub_status or pending_approval)
    await client.query(
      `INSERT INTO system_subscriptions (tenant_id, plan_name, billing_amount, status, next_billing_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '30 days')`,
      [tenant.id, plan_name || 'Enterprise', billing_amount || 0, sub_status || 'pending_approval']
    );

    // 5. Store payment if marked as paid
    if (payment_status === 'paid') {
      await client.query(
        `INSERT INTO system_payments (tenant_id, amount, payment_method, status, notes)
         VALUES ($1, $2, 'card', 'completed', 'Initial subscription checkout payment')`,
        [tenant.id, billing_amount || 0]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /tenants onboarding error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ─── PUT /tenants/:id — Approve/Lock/Edit Tenant (SuperAdmin only) ────
router.put('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const tenantId = req.params.id;
    const { sub_status, base_billing, billing_amount, addons } = req.body;

    await client.query('BEGIN');

    // Fetch current tenant to merge settings
    const tenantRes = await client.query('SELECT settings FROM tenants WHERE id = $1', [tenantId]);
    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // 1. Handle status update (active/locked/rejected)
    if (sub_status !== undefined) {
      await client.query(
        `UPDATE system_subscriptions SET status = $1, is_locked_manually = $2 WHERE tenant_id = $3`,
        [sub_status, sub_status === 'locked', tenantId]
      );

      await client.query(
        `UPDATE tenants SET is_active = $1 WHERE id = $2`,
        [sub_status === 'active', tenantId]
      );
    }

    // 2. Handle billing & addons settings update
    if (base_billing !== undefined || billing_amount !== undefined || addons !== undefined) {
      if (billing_amount !== undefined) {
        await client.query(
          `UPDATE system_subscriptions SET billing_amount = $1 WHERE tenant_id = $2`,
          [billing_amount, tenantId]
        );
      }

      let settings = tenantRes.rows[0].settings || {};
      if (base_billing !== undefined) settings.base_billing = base_billing;
      if (addons !== undefined) settings.addons = addons;

      await client.query(
        `UPDATE tenants SET settings = $1 WHERE id = $2`,
        [JSON.stringify(settings), tenantId]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Tenant subscription and settings updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /tenants/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
