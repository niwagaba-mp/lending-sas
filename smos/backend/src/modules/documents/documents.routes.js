const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// Custom optional authentication middleware for uploads
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      `SELECT u.*, b.name AS branch_name, t.name AS tenant_name, t.currency
       FROM users u
       JOIN branches b ON u.branch_id = b.id
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1 AND u.is_active = true`,
      [decoded.userId]
    );
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  } catch (err) {
    // Ignore verification failure and continue as unauthenticated
  }
  next();
};

// GET /documents — List all documents for current user's tenant or all for superadmin
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, search, entity_id } = req.query;
    let queryText = 'SELECT * FROM system_documents WHERE 1=1';
    const params = [];

    // Tenant isolation restriction
    if (req.user.role !== 'super_admin') {
      params.push(req.user.tenant_id);
      queryText += ` AND (tenant_id = $${params.length} OR entity_id = $${params.length})`;
    } else {
      // Super admin optional tenant filtering
      if (req.query.tenant_id) {
        params.push(req.query.tenant_id);
        queryText += ` AND tenant_id = $${params.length}`;
      }
    }

    if (category && category !== 'all') {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (entity_id) {
      params.push(entity_id);
      queryText += ` AND entity_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      queryText += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(entity_name) LIKE $${params.length} OR LOWER(notes) LIKE $${params.length})`;
    }

    queryText += ' ORDER BY uploaded_at DESC';

    const result = await db.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /documents error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /documents — Upload document (public for onboarding, private for normal system usage)
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const {
      name,
      category,
      subcategory,
      entity_id,
      entity_name,
      file_type,
      file_size,
      file_data,
      notes,
    } = req.body;

    if (!name || !category || !file_data) {
      return res.status(400).json({ error: 'Name, category, and file_data are required' });
    }

    const tenantId = req.user ? req.user.tenant_id : entity_id;
    const uploadedBy = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Onboarding Portal';

    const result = await db.query(
      `INSERT INTO system_documents (tenant_id, name, category, subcategory, entity_id, entity_name, file_type, file_size, file_data, notes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        tenantId,
        name,
        category,
        subcategory || null,
        entity_id || null,
        entity_name || null,
        file_type || null,
        file_size || null,
        file_data,
        notes || null,
        uploadedBy,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /documents error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /documents/:id — Delete a document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const docId = req.params.id;

    // First fetch the document to check ownership
    const docRes = await db.query('SELECT * FROM system_documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docRes.rows[0];

    // Enforce tenant boundary
    if (req.user.role !== 'super_admin' && doc.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied: cannot delete other tenant documents' });
    }

    await db.query('DELETE FROM system_documents WHERE id = $1', [docId]);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('DELETE /documents/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
