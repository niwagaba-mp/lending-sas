const { Pool } = require('pg');
const db = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_fbhiHz4aIj3p@ep-rapid-rice-aqegpnr3.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
  connectionTimeoutMillis: 10000,
});

async function run() {
  try {
    // Try the exact same query as auth.routes.js login
    const result = await db.query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.branch_id, u.tenant_id,
              b.name AS branch_name, t.name AS tenant_name
       FROM users u
       JOIN branches b ON u.branch_id = b.id
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.is_active = true`,
      ['officer@kilimomf.co.ug']
    );
    
    if (result.rows.length === 0) {
      console.log('JOIN FAILS — Checking raw user data...');
      const uRes = await db.query('SELECT id, email, branch_id, tenant_id FROM users WHERE email=$1', ['officer@kilimomf.co.ug']);
      if (uRes.rows.length > 0) {
        const u = uRes.rows[0];
        console.log('branch_id:', u.branch_id, '| tenant_id:', u.tenant_id);
        
        // Check branch
        const bRes = await db.query('SELECT id, name FROM branches WHERE id=$1', [u.branch_id]);
        console.log('Branch exists:', bRes.rows.length > 0 ? 'YES - ' + bRes.rows[0].name : 'NO');
        
        if (bRes.rows.length === 0) {
          // Fix: assign to first valid branch
          const anyBranch = await db.query('SELECT id, name FROM branches WHERE tenant_id=$1 LIMIT 1', [u.tenant_id]);
          if (anyBranch.rows.length > 0) {
            await db.query('UPDATE users SET branch_id=$1 WHERE id=$2', [anyBranch.rows[0].id, u.id]);
            console.log('FIXED: Officer assigned to branch:', anyBranch.rows[0].name);
          }
        }
      }
    } else {
      console.log('LOGIN QUERY OK — Officer can log in:', result.rows[0].first_name, result.rows[0].last_name);
      console.log('Branch:', result.rows[0].branch_name, '| Tenant:', result.rows[0].tenant_name);
    }
  } catch(e) {
    console.error('Query error:', e.message);
  } finally {
    await db.end();
  }
}

run();
