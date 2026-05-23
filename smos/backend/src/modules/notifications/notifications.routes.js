const express = require('express');
const db = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Live SMS Gateway Integration (e.g., Africa's Talking, Twilio, etc.)
async function sendLiveSMS(recipient, message) {
  try {
    if (!process.env.SMS_API_KEY) {
      console.warn(`[SMS WARNING] SMS_API_KEY not set. Mocking SMS to ${recipient}`);
      return { sent: true, mocked: true, recipient, message };
    }

    // Example payload for a generic SMS Provider
    const payload = {
      to: recipient,
      message: message,
      sender_id: process.env.SMS_SENDER_ID || 'SMOS'
    };

    const response = await fetch(process.env.SMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gateway returned status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[SMS SUCCESS] Sent to ${recipient}`);
    return { sent: true, data };
  } catch (err) {
    console.error(`[SMS FAILED] Could not send to ${recipient}:`, err.message);
    throw new Error('SMS Gateway Failure');
  }
}

// POST /notifications/send
router.post('/send', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { channel, recipient_phone, recipient_email, subject, message, loan_id, client_id } = req.body;

    const result = await db.query(
      `INSERT INTO notifications (tenant_id, loan_id, client_id, channel, recipient_phone,
         recipient_email, subject, message, status, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'sent',NOW()) RETURNING *`,
      [req.user.tenant_id, loan_id || null, client_id || null, channel,
       recipient_phone, recipient_email, subject, message]
    );

    const smsResult = await sendLiveSMS(recipient_phone || recipient_email, message);
    res.json({ success: true, data: result.rows[0], gateway_result: smsResult });
  } catch (err) {
    console.error('POST /notifications/send error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notifications/send-reminders — batch overdue reminders
router.post('/send-reminders', authorize('branch_manager', 'supervisor', 'tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const overdueLoans = await db.query(
      `SELECT l.id, l.loan_number, l.arrears_days, l.arrears_amount,
              c.first_name || ' ' || c.last_name AS client_name, c.phone_primary,
              u.first_name || ' ' || u.last_name AS staff_name
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       JOIN users u ON l.staff_id = u.id
       WHERE l.tenant_id=$1 AND l.arrears_days > 0
         AND l.status IN ('at_risk','delinquent','defaulted')
       ORDER BY l.arrears_days DESC LIMIT 100`,
      [req.user.tenant_id]
    );

    const sent = [];
    for (const loan of overdueLoans.rows) {
      const msg = `Dear ${loan.client_name}, your loan ${loan.loan_number} is overdue by ${loan.arrears_days} days. Outstanding arrears: UGX ${Number(loan.arrears_amount).toLocaleString()}. Please pay immediately or contact ${loan.staff_name}. SMOS`;

      await db.query(
        `INSERT INTO notifications (tenant_id, loan_id, channel, recipient_phone, message, status, sent_at)
         VALUES ($1,$2,'sms',$3,$4,'sent',NOW())`,
        [req.user.tenant_id, loan.id, loan.phone_primary, msg]
      );

      const smsResult = await sendLiveSMS(loan.phone_primary, msg);
      sent.push(smsResult);
    }

    res.json({ success: true, sent_count: sent.length, data: sent });
  } catch (err) {
    console.error('POST /notifications/send-reminders error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notifications
router.get('/', async (req, res) => {
  try {
    const { loan_id, client_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['tenant_id=$1'];
    const params = [req.user.tenant_id];
    let idx = 2;

    if (loan_id)   { conditions.push(`loan_id=$${idx++}`); params.push(loan_id); }
    if (client_id) { conditions.push(`client_id=$${idx++}`); params.push(client_id); }

    const where = 'WHERE ' + conditions.join(' AND ');
    const result = await db.query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /notifications error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
