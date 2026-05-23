const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

const ALLOWED_ROLES = ['super_admin', 'tenant_admin', 'branch_manager', 'supervisor'];

// GET /staff — list staff
router.get('/', async (req, res) => {
  try {
    const { branch_id, role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['u.tenant_id = $1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (req.user.role === 'branch_manager') {
      conditions.push(`u.branch_id = $${idx++}`);
      params.push(req.user.branch_id);
    } else if (branch_id) {
      conditions.push(`u.branch_id = $${idx++}`);
      params.push(branch_id);
    }

    if (role) { conditions.push(`u.role = $${idx++}`); params.push(role); }
    if (search) {
      conditions.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone_primary ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone_primary, u.role,
              u.national_id, u.gender, u.photo_url, u.is_active, u.employment_date,
              u.has_fraud_case, u.has_absconded, u.audit_failures,
              b.name AS branch_name,
              COUNT(DISTINCT c.id) AS client_count,
              COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('active','at_risk','delinquent')) AS active_loans,
              COALESCE(SUM(l.principal_amount) FILTER (WHERE l.status NOT IN ('draft','closed')), 0) AS portfolio_value
       FROM users u
       JOIN branches b ON u.branch_id = b.id
       LEFT JOIN clients c ON c.assigned_staff_id = u.id
       LEFT JOIN loans l ON l.staff_id = u.id
       ${where}
       GROUP BY u.id, b.name
       ORDER BY u.first_name, u.last_name
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(
      `SELECT COUNT(*) FROM users u ${where}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      meta: { total: parseInt(total.rows[0].count), page: +page, limit: +limit },
    });
  } catch (err) {
    console.error('GET /staff error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /staff/:id — full profile
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.*, b.name AS branch_name
       FROM users u JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1 AND u.tenant_id = $2`,
      [req.params.id, req.user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });

    const staff = result.rows[0];
    delete staff.password_hash;

    // Get referees
    const referees = await db.query(
      `SELECT ur.*, u.first_name || ' ' || u.last_name AS name, u.role, u.phone_primary AS phone
       FROM user_referees ur JOIN users u ON ur.referee_user_id = u.id
       WHERE ur.user_id = $1`,
      [req.params.id]
    );

    // Get guarantors
    const guarantors = await db.query(
      'SELECT * FROM user_guarantors WHERE user_id = $1',
      [req.params.id]
    );

    // P&L summary
    const pnl = await db.query(
      'SELECT * FROM v_staff_pnl WHERE staff_id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...staff, referees: referees.rows, guarantors: guarantors.rows, pnl: pnl.rows[0] || null },
    });
  } catch (err) {
    console.error('GET /staff/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /staff
router.post('/', authorize(...ALLOWED_ROLES), async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, national_id, gender, date_of_birth,
      phone_primary, phone_secondary, email, role, branch_id,
      password,
      recommender_name, recommender_phone, recommender_relationship,
      village_name, village_latitude, village_longitude, village_district,
      urban_address, urban_latitude, urban_longitude, urban_district,
      lc1_name, lc1_phone, lc1_address,
      employment_date, photo_url,
      guarantors = [], referees = [],
    } = req.body;

    const actualPassword = password || crypto.randomBytes(6).toString('hex');
    const password_hash = await bcrypt.hash(actualPassword, 12);
    const branchId = branch_id || req.user.branch_id;

    const result = await db.query(
      `INSERT INTO users (
        tenant_id, branch_id, role,
        first_name, last_name, middle_name, national_id, gender, date_of_birth,
        phone_primary, phone_secondary, email, password_hash, photo_url,
        recommender_name, recommender_phone, recommender_relationship,
        village_name, village_latitude, village_longitude, village_district,
        urban_address, urban_latitude, urban_longitude, urban_district,
        lc1_name, lc1_phone, lc1_address, employment_date
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      ) RETURNING *`,
      [
        req.user.tenant_id, branchId, role,
        first_name, last_name, middle_name, national_id, gender, date_of_birth,
        phone_primary, phone_secondary, email?.toLowerCase(), password_hash, photo_url,
        recommender_name, recommender_phone, recommender_relationship,
        village_name, village_latitude, village_longitude, village_district,
        urban_address, urban_latitude, urban_longitude, urban_district,
        lc1_name, lc1_phone, lc1_address, employment_date,
      ]
    );

    const newUser = result.rows[0];

    // Insert guarantors
    for (const g of guarantors) {
      await db.query(
        `INSERT INTO user_guarantors (user_id, full_name, national_id, phone, relationship, address, latitude, longitude, photo_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newUser.id, g.full_name, g.national_id, g.phone, g.relationship, g.address, g.latitude, g.longitude, g.photo_url]
      );
    }

    // Insert internal referees
    for (const r of referees) {
      await db.query(
        'INSERT INTO user_referees (user_id, referee_user_id) VALUES ($1,$2)',
        [newUser.id, r.referee_user_id]
      );
    }

    delete newUser.password_hash;
    res.status(201).json({ success: true, data: newUser, initial_password: actualPassword });
  } catch (err) {
    console.error('POST /staff error:', err.message);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /staff/:id
router.put('/:id', authorize(...ALLOWED_ROLES), async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, national_id, gender, date_of_birth,
      phone_primary, phone_secondary, role, branch_id, is_active, photo_url,
      village_name, village_latitude, village_longitude, village_district,
      urban_address, urban_latitude, urban_longitude, urban_district,
      lc1_name, lc1_phone, lc1_address,
      has_fraud_case, has_absconded, audit_failures, discrepancy_count,
    } = req.body;

    const result = await db.query(
      `UPDATE users SET
        first_name=$1, last_name=$2, middle_name=$3, national_id=$4, gender=$5,
        date_of_birth=$6, phone_primary=$7, phone_secondary=$8, role=$9,
        branch_id=$10, is_active=$11, photo_url=$12,
        village_name=$13, village_latitude=$14, village_longitude=$15, village_district=$16,
        urban_address=$17, urban_latitude=$18, urban_longitude=$19, urban_district=$20,
        lc1_name=$21, lc1_phone=$22, lc1_address=$23,
        has_fraud_case=$24, has_absconded=$25, audit_failures=$26, discrepancy_count=$27
       WHERE id=$28 AND tenant_id=$29 RETURNING *`,
      [
        first_name, last_name, middle_name, national_id, gender, date_of_birth,
        phone_primary, phone_secondary, role, branch_id, is_active, photo_url,
        village_name, village_latitude, village_longitude, village_district,
        urban_address, urban_latitude, urban_longitude, urban_district,
        lc1_name, lc1_phone, lc1_address,
        has_fraud_case, has_absconded, audit_failures, discrepancy_count,
        req.params.id, req.user.tenant_id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    delete result.rows[0].password_hash;
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /staff/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /staff/:id/pnl — Staff P&L
router.get('/:id/pnl', async (req, res) => {
  try {
    // Verify staff belongs to requesting user's tenant
    const staffCheck = await db.query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [req.params.id, req.user.tenant_id]);
    if (staffCheck.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });

    const pnl = await db.query('SELECT * FROM v_staff_pnl WHERE staff_id = $1', [req.params.id]);
    const expenses = await db.query(
      `SELECT category, SUM(amount) AS total
       FROM staff_expenses WHERE staff_id=$1 AND tenant_id=$2 GROUP BY category`,
      [req.params.id, req.user.tenant_id]
    );
    const loans = await db.query(
      `SELECT status, COUNT(*) AS count, SUM(principal_amount) AS total
       FROM loans WHERE staff_id=$1 AND tenant_id=$2 GROUP BY status`,
      [req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, data: { pnl: pnl.rows[0], expenses: expenses.rows, loans: loans.rows } });
  } catch (err) {
    console.error('GET /staff/:id/pnl error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /staff/:id/clients
router.get('/:id/clients', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, cs.score, cs.grade
       FROM clients c LEFT JOIN credit_scores cs ON cs.client_id = c.id
       WHERE c.assigned_staff_id = $1 AND c.tenant_id = $2
       ORDER BY c.first_name`,
      [req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /staff/:id/clients error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /staff/leaderboard
router.get('/meta/leaderboard', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM v_staff_pnl WHERE tenant_id=$1 ORDER BY net_profit DESC LIMIT 20`,
      [req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /staff/meta/leaderboard error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
