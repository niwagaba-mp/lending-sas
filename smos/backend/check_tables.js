const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_fbhiHz4aIj3p@ep-rapid-rice-aqegpnr3.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables found in database:');
    console.log(res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Error listing tables:', err.message);
  } finally {
    await pool.end();
  }
}

check();
