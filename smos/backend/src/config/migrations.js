const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  // Wait for database connection to be ready
  let retries = 5;
  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      break;
    } catch (err) {
      console.log(`⏳ Waiting for database connection... (${retries} retries left): ${err.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error('❌ Failed to connect to the database after multiple attempts.');
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Create schema_migrations table if not exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      migrated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Baseline auto-registration for already initialized databases
  const checkTableExists = async (tableName) => {
    const res = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      );`,
      [tableName]
    );
    return res.rows[0].exists;
  };

  const checkColumnExists = async (tableName, columnName) => {
    const res = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      );`,
      [tableName, columnName]
    );
    return res.rows[0].exists;
  };

  // If tables/columns already exist, register them as completed migrations
  if (await checkTableExists('tenants')) {
    await db.query("INSERT INTO schema_migrations (version) VALUES ('001_schema.sql') ON CONFLICT (version) DO NOTHING;");
  }
  if (await checkTableExists('client_guarantors')) {
    await db.query("INSERT INTO schema_migrations (version) VALUES ('003_add_client_guarantors_and_gps_history.sql') ON CONFLICT (version) DO NOTHING;");
  }
  if (await checkTableExists('misc_transactions')) {
    await db.query("INSERT INTO schema_migrations (version) VALUES ('003_cashier_updates.sql') ON CONFLICT (version) DO NOTHING;");
  }
  if (await checkTableExists('system_subscriptions')) {
    await db.query("INSERT INTO schema_migrations (version) VALUES ('004_superadmin_saas.sql') ON CONFLICT (version) DO NOTHING;");
  }
  if (await checkColumnExists('clients', 'profile_history')) {
    await db.query("INSERT INTO schema_migrations (version) VALUES ('005_add_client_profile_history.sql') ON CONFLICT (version) DO NOTHING;");
  }

  const migrationsDir = path.join(__dirname, '../../../database');
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found at ${migrationsDir}`);
    process.exit(1);
  }

  // Read and sort migration files (001, 003, etc.)
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.includes('seed'))
    .sort();

  for (const file of files) {
    // Check if migration has already run
    const result = await db.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
    if (result.rows.length > 0) {
      console.log(`- Migration ${file} is already applied.`);
      continue;
    }

    console.log(`- Applying migration ${file}...`);
    const sqlPath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Safe mode scanner: remove SQL comments and scan for forbidden keywords
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

    const forbiddenPatterns = [
      /\bDROP\s+TABLE\b/i,
      /\bDROP\s+DATABASE\b/i,
      /\bTRUNCATE\b/i,
      /\bDELETE\s+FROM\b/i,
      /\bDROP\s+COLUMN\b/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(cleanSql)) {
        console.error(`\n❌ [SECURITY VIOLATION] Migration file "${file}" contains a forbidden destructive command matching ${pattern}.`);
        console.error('Safe-mode is active. Build and startup aborted to prevent data loss.\n');
        process.exit(1);
      }
    }

    // Execute migration inside a transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(cleanSql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ Migration ${file} applied successfully.`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to apply migration ${file}:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log('✅ All migrations check complete.');
}

module.exports = { runMigrations };
