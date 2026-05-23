const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /clients
router.get('/', async (req, res) => {
  try {
    const { branch_id, staff_id, search, filter, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['c.tenant_id = $1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (req.user.role === 'loan_officer') {
      conditions.push(`c.assigned_staff_id = $${idx++}`);
      params.push(req.user.id);
    } else if (req.user.role === 'branch_manager' || req.user.role === 'supervisor' || req.user.role === 'cashier') {
      conditions.push(`c.branch_id = $${idx++}`);
      params.push(req.user.branch_id);
    }

    if (staff_id) { conditions.push(`c.assigned_staff_id = $${idx++}`); params.push(staff_id); }
    if (branch_id) { conditions.push(`c.branch_id = $${idx++}`); params.push(branch_id); }
    if (search) {
      conditions.push(
        `(c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx} OR c.phone_primary ILIKE $${idx} OR c.national_id ILIKE $${idx})`
      );
      params.push(`%${search}%`);
      idx++;
    }

    if (filter === 'did_not_pay') {
      conditions.push(`EXISTS (
        SELECT 1 FROM loans l2 
        WHERE l2.client_id = c.id 
          AND l2.status IN ('active', 'at_risk', 'delinquent', 'defaulted', 'dormant') 
          AND l2.arrears_amount > 0
      )`);
    } else if (filter === 'paid') {
      conditions.push(`EXISTS (
        SELECT 1 FROM loans l2 
        WHERE l2.client_id = c.id 
          AND l2.status = 'closed'
      ) AND NOT EXISTS (
        SELECT 1 FROM loans l2 
        WHERE l2.client_id = c.id 
          AND l2.status IN ('active', 'at_risk', 'delinquent', 'defaulted', 'dormant')
      )`);
    } else if (filter === 'no_loans') {
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM loans l2 
        WHERE l2.client_id = c.id
      )`);
    } else if (filter === 'paid_today') {
      conditions.push(`EXISTS (
        SELECT 1 FROM loans l2 
        JOIN repayments r ON r.loan_id = l2.id
        WHERE l2.client_id = c.id 
          AND r.payment_date = CURRENT_DATE
          AND r.is_reversed = false
      )`);
    } else if (filter === 'did_not_pay_today') {
      conditions.push(`EXISTS (
        SELECT 1 FROM loans l2 
        JOIN repayment_schedules rs ON rs.loan_id = l2.id
        WHERE l2.client_id = c.id 
          AND l2.status NOT IN ('draft', 'pending_approval', 'approved', 'closed', 'written_off')
          AND rs.due_date = CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM repayments r 
            WHERE r.loan_id = l2.id 
              AND r.payment_date = CURRENT_DATE 
              AND r.is_reversed = false
          )
      )`);
    } else if (filter === 'paid_in_advance') {
      conditions.push(`EXISTS (
        SELECT 1 FROM loans l2 
        WHERE l2.client_id = c.id 
          AND l2.status NOT IN ('draft', 'closed', 'written_off')
          AND GREATEST(0, l2.total_paid - COALESCE((SELECT SUM(total_due) FROM repayment_schedules WHERE loan_id = l2.id AND due_date <= CURRENT_DATE), 0)) > 0
      )`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await db.query(
      `SELECT c.*,
              u.first_name || ' ' || u.last_name AS staff_name,
              b.name AS branch_name,
              cs.score AS credit_score, cs.grade AS credit_grade,
              COUNT(DISTINCT l.id) AS total_loans,
              COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('active','at_risk','delinquent')) AS active_loans
       FROM clients c
       JOIN users u ON c.assigned_staff_id = u.id
       JOIN branches b ON c.branch_id = b.id
       LEFT JOIN credit_scores cs ON cs.client_id = c.id
       LEFT JOIN loans l ON l.client_id = c.id
       ${where}
       GROUP BY c.id, u.first_name, u.last_name, b.name, cs.score, cs.grade
       ORDER BY c.first_name
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = await db.query(
      `SELECT COUNT(*) FROM clients c ${where}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      meta: { total: parseInt(total.rows[0].count), page: +page, limit: +limit },
    });
  } catch (err) {
    console.error('GET /clients error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /clients/map — GPS data for map
router.get('/meta/map', async (req, res) => {
  try {
    const { branch_id } = req.query;
    const tenantId = req.user.tenant_id;

    let query = `
      SELECT c.id, c.first_name, c.last_name, c.phone_primary,
             c.home_latitude, c.home_longitude, c.home_address,
             c.business_latitude, c.business_longitude, c.business_address,
             cs.score AS credit_score, cs.grade,
             u.first_name || ' ' || u.last_name AS staff_name,
             b.name AS branch_name,
             COUNT(l.id) FILTER (WHERE l.status IN ('active','at_risk','delinquent')) AS active_loans
      FROM clients c
      LEFT JOIN credit_scores cs ON cs.client_id = c.id
      LEFT JOIN users u ON c.assigned_staff_id = u.id
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN loans l ON l.client_id = c.id
      WHERE c.tenant_id = $1 AND c.home_latitude IS NOT NULL
    `;
    const params = [tenantId];
    if (branch_id) { query += ' AND c.branch_id = $2'; params.push(branch_id); }
    query += ' GROUP BY c.id, cs.score, cs.grade, u.first_name, u.last_name, b.name';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /clients/meta/map error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /clients/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*,
              u.first_name || ' ' || u.last_name AS staff_name,
              u.phone_primary AS staff_phone,
              b.name AS branch_name,
              cs.score AS credit_score, cs.grade AS credit_grade,
              cs.repayment_consistency_score, cs.arrears_frequency_score,
              cs.loan_history_score, cs.repayment_speed_score,
              cs.guarantor_strength_score, cs.staff_portfolio_risk_score,
              cs.computed_at AS score_date
       FROM clients c
       JOIN users u ON c.assigned_staff_id = u.id
       JOIN branches b ON c.branch_id = b.id
       LEFT JOIN credit_scores cs ON cs.client_id = c.id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, req.user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const nok = await db.query('SELECT * FROM client_next_of_kin WHERE client_id = $1', [req.params.id]);
    const guarantors = await db.query('SELECT * FROM client_guarantors WHERE client_id = $1 ORDER BY created_at ASC', [req.params.id]);
    const loans = await db.query(
      `SELECT l.*, u.first_name || ' ' || u.last_name AS officer_name
       FROM loans l LEFT JOIN users u ON l.staff_id = u.id
       WHERE l.client_id = $1 ORDER BY l.created_at DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...result.rows[0], next_of_kin: nok.rows, loans: loans.rows, guarantors: guarantors.rows },
    });
  } catch (err) {
    console.error('GET /clients/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /clients
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, national_id, gender, date_of_birth,
      phone_primary, phone_secondary, email, education_level, marital_status, dependants,
      business_type, business_name, monthly_income_estimate,
      home_latitude, home_longitude, home_address, home_district,
      business_latitude, business_longitude, business_address, business_district,
      assigned_staff_id, branch_id, photo_url,
      next_of_kin = [],
      guarantors = [],
    } = req.body;

    if (!home_latitude || !home_longitude)
      return res.status(400).json({ error: 'GPS location is mandatory (anti-ghost rule)' });
    if (!photo_url)
      return res.status(400).json({ error: 'Client photo is mandatory (anti-ghost rule)' });

    const branchId = branch_id || req.user.branch_id;
    const staffId = assigned_staff_id || req.user.id;

    // Track initial GPS
    const gps_history = [];
    if (home_latitude && home_longitude) {
      gps_history.push({
        timestamp: new Date().toISOString(),
        user: req.user.email,
        type: 'home',
        latitude: home_latitude,
        longitude: home_longitude,
        action: 'Initial Home GPS Capture'
      });
    }
    if (business_latitude && business_longitude) {
      gps_history.push({
        timestamp: new Date().toISOString(),
        user: req.user.email,
        type: 'business',
        latitude: business_latitude,
        longitude: business_longitude,
        action: 'Initial Business GPS Capture'
      });
    }

    const result = await db.query(
      `INSERT INTO clients (
        tenant_id, branch_id, assigned_staff_id, registered_by_id,
        first_name, last_name, middle_name, national_id, gender, date_of_birth,
        phone_primary, phone_secondary, email, education_level, marital_status, dependants,
        business_type, business_name, monthly_income_estimate,
        home_latitude, home_longitude, home_address, home_district,
        business_latitude, business_longitude, business_address, business_district,
        photo_url, gps_captured, photo_verified, gps_history
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
                $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,true,true,$29)
      RETURNING *`,
      [
        req.user.tenant_id, branchId, staffId, req.user.id,
        first_name, last_name, middle_name, national_id, gender, date_of_birth,
        phone_primary, phone_secondary, email, education_level, marital_status, dependants || 0,
        business_type, business_name, monthly_income_estimate,
        home_latitude, home_longitude, home_address, home_district,
        business_latitude, business_longitude, business_address, business_district,
        photo_url, JSON.stringify(gps_history)
      ]
    );

    const newClient = result.rows[0];

    for (const k of next_of_kin) {
      await db.query(
        `INSERT INTO client_next_of_kin (client_id, full_name, relationship, phone, address, national_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [newClient.id, k.full_name, k.relationship, k.phone, k.address, k.national_id]
      );
    }

    for (const g of guarantors) {
      await db.query(
        `INSERT INTO client_guarantors (client_id, full_name, phone, relationship, national_id, address)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [newClient.id, g.full_name, g.phone, g.relationship, g.national_id, g.address]
      );
    }

    // Initialize credit score
    await db.query(
      `INSERT INTO credit_scores (client_id, tenant_id, score, grade,
        repayment_consistency_score, arrears_frequency_score, loan_history_score,
        repayment_speed_score, guarantor_strength_score, staff_portfolio_risk_score)
       VALUES ($1,$2,500,'C',50,50,50,50,50,50)`,
      [newClient.id, req.user.tenant_id]
    );

    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    console.error('POST /clients error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /clients/:id
router.put('/:id', authorize('cashier', 'loan_officer', 'branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, phone_primary, phone_secondary,
      business_type, business_name, monthly_income_estimate,
      home_latitude, home_longitude, home_address, home_district,
      business_latitude, business_longitude, business_address, business_district,
      assigned_staff_id, is_active,
      guarantors = [],
    } = req.body;

    // Fetch existing client to validate GPS update rules and compute profile modifications log
    const existingRes = await db.query(
      `SELECT first_name, last_name, middle_name, phone_primary, phone_secondary,
              business_type, business_name, monthly_income_estimate,
              home_address, home_district, business_address, business_district,
              assigned_staff_id, is_active, home_latitude, home_longitude,
              business_latitude, business_longitude, gps_history, profile_history 
       FROM clients WHERE id=$1 AND tenant_id=$2`,
      [req.params.id, req.user.tenant_id]
    );
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    const existing = existingRes.rows[0];

    // Compute profile field changes
    const fieldsToCheck = [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'middle_name', label: 'Middle Name' },
      { key: 'phone_primary', label: 'Primary Phone' },
      { key: 'phone_secondary', label: 'Secondary Phone' },
      { key: 'business_type', label: 'Business Type' },
      { key: 'business_name', label: 'Business Name' },
      { key: 'monthly_income_estimate', label: 'Monthly Income' },
      { key: 'home_address', label: 'Home Address' },
      { key: 'home_district', label: 'Home District' },
      { key: 'business_address', label: 'Business Address' },
      { key: 'business_district', label: 'Business District' },
      { key: 'assigned_staff_id', label: 'Assigned Staff' }
    ];

    const changes = [];
    fieldsToCheck.forEach(f => {
      const oldVal = existing[f.key] !== undefined && existing[f.key] !== null ? String(existing[f.key]).trim() : '';
      const newVal = req.body[f.key] !== undefined && req.body[f.key] !== null ? String(req.body[f.key]).trim() : '';
      if (oldVal !== newVal) {
        changes.push({
          field: f.label,
          old_value: oldVal,
          new_value: newVal
        });
      }
    });

    let profile_history = existing.profile_history || [];
    if (!Array.isArray(profile_history)) {
      try {
        profile_history = typeof profile_history === 'string' ? JSON.parse(profile_history) : [];
      } catch (e) {
        profile_history = [];
      }
    }

    if (changes.length > 0) {
      profile_history.push({
        timestamp: new Date().toISOString(),
        user: `${req.user.first_name || ''} ${req.user.last_name || ''} (${req.user.role})`.trim() || req.user.email,
        changes
      });
    }

    let final_home_lat = home_latitude;
    let final_home_lng = home_longitude;
    let final_bus_lat = business_latitude;
    let final_bus_lng = business_longitude;
    
    let history = existing.gps_history || [];
    if (!Array.isArray(history)) {
      try {
        history = typeof history === 'string' ? JSON.parse(history) : [];
      } catch (e) {
        history = [];
      }
    }

    const isOfficer = req.user.role === 'loan_officer';

    if (isOfficer) {
      // Validate Home GPS: if existing coordinates are set and non-zero
      if (existing.home_latitude && Number(existing.home_latitude) !== 0) {
        // Enforce they cannot be replaced or deleted
        if (home_latitude && (String(home_latitude) !== String(existing.home_latitude) || String(home_longitude) !== String(existing.home_longitude))) {
          return res.status(400).json({ error: 'Permission denied: Loan officers cannot replace existing Home GPS coordinates.' });
        }
        if (!home_latitude || !home_longitude) {
          return res.status(400).json({ error: 'Permission denied: Loan officers cannot clear existing Home GPS coordinates.' });
        }
        final_home_lat = existing.home_latitude;
        final_home_lng = existing.home_longitude;
      } else if (home_latitude && home_longitude) {
        // Capture new coordinates
        history.push({
          timestamp: new Date().toISOString(),
          user: req.user.email,
          type: 'home',
          latitude: home_latitude,
          longitude: home_longitude,
          action: 'Home GPS Updated'
        });
      }

      // Validate Business GPS: if existing coordinates are set and non-zero
      if (existing.business_latitude && Number(existing.business_latitude) !== 0) {
        if (business_latitude && (String(business_latitude) !== String(existing.business_latitude) || String(business_longitude) !== String(existing.business_longitude))) {
          return res.status(400).json({ error: 'Permission denied: Loan officers cannot replace existing Business GPS coordinates.' });
        }
        if (!business_latitude || !business_longitude) {
          return res.status(400).json({ error: 'Permission denied: Loan officers cannot clear existing Business GPS coordinates.' });
        }
        final_bus_lat = existing.business_latitude;
        final_bus_lng = existing.business_longitude;
      } else if (business_latitude && business_longitude) {
        // Capture new coordinates
        history.push({
          timestamp: new Date().toISOString(),
          user: req.user.email,
          type: 'business',
          latitude: business_latitude,
          longitude: business_longitude,
          action: 'Business GPS Updated'
        });
      }
    } else {
      // Admin / Manager / Cashier can update, let's log the change in gps_history if it changed
      if ((home_latitude && String(home_latitude) !== String(existing.home_latitude)) || (home_longitude && String(home_longitude) !== String(existing.home_longitude))) {
        history.push({
          timestamp: new Date().toISOString(),
          user: req.user.email,
          type: 'home',
          latitude: home_latitude,
          longitude: home_longitude,
          action: `Home GPS Modified by ${req.user.role}`
        });
      }
      if ((business_latitude && String(business_latitude) !== String(existing.business_latitude)) || (business_longitude && String(business_longitude) !== String(existing.business_longitude))) {
        history.push({
          timestamp: new Date().toISOString(),
          user: req.user.email,
          type: 'business',
          latitude: business_latitude,
          longitude: business_longitude,
          action: `Business GPS Modified by ${req.user.role}`
        });
      }
    }

    const result = await db.query(
      `UPDATE clients SET
        first_name=$1, last_name=$2, middle_name=$3,
        phone_primary=$4, phone_secondary=$5,
        business_type=$6, business_name=$7, monthly_income_estimate=$8,
        home_latitude=$9, home_longitude=$10, home_address=$11, home_district=$12,
        business_latitude=$13, business_longitude=$14, business_address=$15, business_district=$16,
        assigned_staff_id=$17, is_active=$18, gps_history=$19, profile_history=$20
       WHERE id=$21 AND tenant_id=$22 RETURNING *`,
      [
        first_name, last_name, middle_name,
        phone_primary, phone_secondary,
        business_type, business_name, monthly_income_estimate,
        final_home_lat, final_home_lng, home_address, home_district,
        final_bus_lat, final_bus_lng, business_address, business_district,
        assigned_staff_id, is_active, JSON.stringify(history), JSON.stringify(profile_history),
        req.params.id, req.user.tenant_id,
      ]
    );

    // Sync client guarantors
    await db.query('DELETE FROM client_guarantors WHERE client_id = $1', [req.params.id]);
    for (const g of guarantors) {
      await db.query(
        `INSERT INTO client_guarantors (client_id, full_name, phone, relationship, national_id, address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.params.id, g.full_name, g.phone, g.relationship, g.national_id, g.address]
      );
    }

    const updatedGuarantors = await db.query('SELECT * FROM client_guarantors WHERE client_id = $1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ success: true, data: { ...result.rows[0], guarantors: updatedGuarantors.rows } });
  } catch (err) {
    console.error('PUT /clients/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /clients/:id/approve — supervisor approval
router.post('/:id/approve', authorize('supervisor', 'branch_manager', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    await db.query(
      `UPDATE clients SET supervisor_approved=true, supervisor_approved_by=$1, supervisor_approved_at=NOW()
       WHERE id=$2 AND tenant_id=$3`,
      [req.user.id, req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, message: 'Client approved' });
  } catch (err) {
    console.error('POST /clients/:id/approve error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
