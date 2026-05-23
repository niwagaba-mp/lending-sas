const express = require('express');
const db = require('../../config/db');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * Credit Scoring Engine (0–1000)
 *
 * Factor weights:
 *   repayment_consistency  → 25%
 *   arrears_frequency      → 20%
 *   loan_history           → 15%
 *   repayment_speed        → 15%
 *   guarantor_strength     → 15%
 *   staff_portfolio_risk   → 10%
 */
async function computeCreditScore(clientId, tenantId) {
  // 1. Repayment consistency: % of installments paid on or before due date
  const consistency = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE is_paid = true AND paid_date <= due_date) AS on_time,
       COUNT(*) FILTER (WHERE is_paid = true) AS total_paid
     FROM repayment_schedules rs
     JOIN loans l ON rs.loan_id = l.id
     WHERE l.client_id = $1 AND l.tenant_id = $2`,
    [clientId, tenantId]
  );
  const onTime = parseInt(consistency.rows[0].on_time || 0);
  const totalPaid = parseInt(consistency.rows[0].total_paid || 1);
  const consistencyScore = Math.min(100, Math.round((onTime / totalPaid) * 100));

  // 2. Arrears frequency: how often loans went into arrears (lower = better)
  const arrearsFreq = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE arrears_days > 0) AS arrears_count,
       COUNT(*) AS total_loans
     FROM loans WHERE client_id=$1 AND tenant_id=$2 AND status NOT IN ('draft','pending_approval')`,
    [clientId, tenantId]
  );
  const arrCount = parseInt(arrearsFreq.rows[0].arrears_count || 0);
  const totalLoans = parseInt(arrearsFreq.rows[0].total_loans || 1);
  const arrearsScore = Math.max(0, 100 - Math.round((arrCount / totalLoans) * 100));

  // 3. Loan history: number of closed loans (completed) relative to issued
  const history = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status='closed') AS closed,
       COUNT(*) AS total
     FROM loans WHERE client_id=$1 AND tenant_id=$2`,
    [clientId, tenantId]
  );
  const closed = parseInt(history.rows[0].closed || 0);
  const total = parseInt(history.rows[0].total || 1);
  const historyScore = Math.min(100, Math.round((closed / total) * 100) + Math.min(30, closed * 10));

  // 4. Repayment speed: avg days before due date payment is made (earlier = better)
  const speed = await db.query(
    `SELECT AVG(due_date - paid_date) AS avg_days_early
     FROM repayment_schedules rs
     JOIN loans l ON rs.loan_id = l.id
     WHERE l.client_id=$1 AND rs.is_paid=true`,
    [clientId]
  );
  const avgEarly = parseFloat(speed.rows[0].avg_days_early || 0);
  const speedScore = Math.min(100, Math.max(0, 50 + avgEarly * 5));

  // 5. Guarantor strength: guarantors provided per loan (1–3)
  const guarantors = await db.query(
    `SELECT AVG(g_count) AS avg_guarantors FROM (
       SELECT l.id, COUNT(lg.id) AS g_count
       FROM loans l LEFT JOIN loan_guarantors lg ON lg.loan_id = l.id
       WHERE l.client_id=$1
       GROUP BY l.id
     ) t`,
    [clientId]
  );
  const avgGuarantors = parseFloat(guarantors.rows[0].avg_guarantors || 0);
  const guarantorScore = Math.min(100, Math.round((avgGuarantors / 3) * 100));

  // 6. Staff portfolio risk: defaulted amount vs total under staff
  const staffRisk = await db.query(
    `SELECT
       COALESCE(SUM(l2.outstanding_balance) FILTER (WHERE l2.status IN ('defaulted','written_off','non_performing')),0) AS defaults,
       COALESCE(SUM(l2.principal_amount),1) AS total
     FROM loans l
     JOIN loans l2 ON l2.staff_id = l.staff_id
     WHERE l.client_id=$1 AND l.tenant_id=$2`,
    [clientId, tenantId]
  );
  const defaults = parseFloat(staffRisk.rows[0].defaults || 0);
  const totalPortfolio = parseFloat(staffRisk.rows[0].total || 1);
  const defaultRate = defaults / totalPortfolio;
  const staffRiskScore = Math.max(0, 100 - Math.round(defaultRate * 200));

  // Weighted score
  const raw =
    consistencyScore * 0.25 +
    arrearsScore     * 0.20 +
    historyScore     * 0.15 +
    speedScore       * 0.15 +
    guarantorScore   * 0.15 +
    staffRiskScore   * 0.10;

  const score = Math.round(raw * 10); // scale to 0-1000

  let grade;
  if (score >= 800) grade = 'A';
  else if (score >= 650) grade = 'B';
  else if (score >= 500) grade = 'C';
  else if (score >= 350) grade = 'D';
  else grade = 'E';

  return {
    score,
    grade,
    repayment_consistency_score: consistencyScore,
    arrears_frequency_score: arrearsScore,
    loan_history_score: historyScore,
    repayment_speed_score: Math.round(speedScore),
    guarantor_strength_score: guarantorScore,
    staff_portfolio_risk_score: staffRiskScore,
  };
}

// GET /credit/:client_id — get or compute credit score
router.get('/:client_id', async (req, res) => {
  try {
    const existing = await db.query(
      `SELECT * FROM credit_scores WHERE client_id=$1 AND tenant_id=$2
       ORDER BY computed_at DESC LIMIT 1`,
      [req.params.client_id, req.user.tenant_id]
    );
    res.json({ success: true, data: existing.rows[0] || null });
  } catch (err) {
    console.error('GET /credit/:client_id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /credit/:client_id/compute — recompute score
router.post('/:client_id/compute', async (req, res) => {
  try {
    const scored = await computeCreditScore(req.params.client_id, req.user.tenant_id);

    // Upsert score
    await db.query('DELETE FROM credit_scores WHERE client_id=$1', [req.params.client_id]);
    const result = await db.query(
      `INSERT INTO credit_scores (client_id, tenant_id, score, grade,
         repayment_consistency_score, arrears_frequency_score, loan_history_score,
         repayment_speed_score, guarantor_strength_score, staff_portfolio_risk_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.params.client_id, req.user.tenant_id,
        scored.score, scored.grade,
        scored.repayment_consistency_score, scored.arrears_frequency_score,
        scored.loan_history_score, scored.repayment_speed_score,
        scored.guarantor_strength_score, scored.staff_portfolio_risk_score,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /credit/:client_id/compute error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /credit/branch/:branch_id — risk distribution for a branch
router.get('/branch/:branch_id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cs.grade, COUNT(*) AS count, AVG(cs.score) AS avg_score
       FROM credit_scores cs
       JOIN clients c ON cs.client_id = c.id
       WHERE c.branch_id=$1 AND cs.tenant_id=$2
       GROUP BY cs.grade ORDER BY cs.grade`,
      [req.params.branch_id, req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /credit/branch/:branch_id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
module.exports.computeCreditScore = computeCreditScore;
