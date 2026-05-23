const db = require('../config/db');

const auditLogger = (action, entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    // Log after successful responses
    if (res.statusCode < 400 && req.user) {
      try {
        await db.query(
          `INSERT INTO audit_logs
            (tenant_id, user_id, branch_id, action, entity_type, entity_id,
             new_values, ip_address, user_agent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            req.user.tenant_id,
            req.user.id,
            req.user.branch_id,
            action,
            entityType,
            body?.data?.id || req.params.id || null,
            JSON.stringify(body?.data || {}),
            req.ip,
            req.headers['user-agent'],
          ]
        );
      } catch (e) {
        // Don't break response on audit failure
        console.error('Audit log error:', e.message);
      }
    }
    return originalJson(body);
  };
  next();
};

module.exports = { auditLogger };
