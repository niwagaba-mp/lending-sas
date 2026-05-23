const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

const migrations = [
  '../database/003_add_client_guarantors_and_gps_history.sql',
  '../database/003_cashier_updates.sql',
  '../database/004_superadmin_saas.sql',
  '../database/005_add_client_profile_history.sql',
  '../database/006_exclude_admin_expenses_from_staff.sql'
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('Starting sequential database migrations...');
    await client.query('BEGIN');

    for (const mig of migrations) {
      const sqlPath = path.join(__dirname, mig);
      console.log(`Running migration: ${path.basename(mig)}...`);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('✅ All migrations executed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed and was rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
