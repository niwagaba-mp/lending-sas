require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const db = require('./config/db');
const { classifyLoanStatus, calculateArrears } = require('./modules/loans/loan.engine');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

// ─── Security Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    // Allow local development origins in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // Check configured allowed origins
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Allow mobile app origins
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://') || origin.startsWith('file://')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api', rateLimit({ windowMs: 1 * 60 * 1000, max: 300 }));

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          require('./modules/auth/auth.routes'));
app.use('/api/branches',      require('./modules/branches/branches.routes'));
app.use('/api/staff',         require('./modules/staff/staff.routes'));
app.use('/api/clients',       require('./modules/clients/clients.routes'));
app.use('/api/loans',         require('./modules/loans/loans.routes'));
app.use('/api/repayments',    require('./modules/repayments/repayments.routes'));
app.use('/api/credit',        require('./modules/credit/credit.routes'));
app.use('/api/expenses',      require('./modules/expenses/expenses.routes'));
app.use('/api/legal',         require('./modules/legal/legal.routes'));
app.use('/api/legal-recovery', require('./modules/legal_recovery/legal_recovery.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/reports',       require('./modules/reports/reports.routes'));
app.use('/api/transactions',  require('./modules/transactions/transactions.routes'));
app.use('/api/misc',          require('./modules/transactions/misc_transactions.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', system: 'SMOS', version: '1.0.0', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Nightly Arrears & Classification Cron ─────────────────────
// Runs every day at 02:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running nightly arrears classification...');
  try {
    const activeLoans = await db.query(
      `SELECT * FROM loans WHERE status NOT IN ('draft','closed','written_off','pending_approval')
       ORDER BY id`
    );

    for (const loan of activeLoans.rows) {
      const schedule = await db.query(
        'SELECT * FROM repayment_schedules WHERE loan_id=$1 ORDER BY due_date',
        [loan.id]
      );
      if (schedule.rows.length === 0) continue;

      const { arrearsAmount, arrearsDays } = calculateArrears(schedule.rows, loan.total_paid);
      const newStatus = classifyLoanStatus(arrearsDays, loan.outstanding_balance, loan.expected_closure_date);

      await db.query(
        `UPDATE loans SET arrears_amount=$1, arrears_days=$2, status=$3 WHERE id=$4`,
        [arrearsAmount, arrearsDays, newStatus, loan.id]
      );
    }

    console.log(`[CRON] Processed ${activeLoans.rows.length} loans`);
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
});

// ─── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const { runMigrations } = require('./config/migrations');

async function startServer() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   SMART MICROFINANCE OPERATING SYSTEM (SMOS)    ║
  ║   Backend API running on port ${PORT}              ║
  ║   Environment: ${process.env.NODE_ENV}                   ║
  ╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server during DB migrations:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
