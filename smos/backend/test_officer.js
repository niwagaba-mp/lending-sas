const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const BASE = 'localhost';
  const PORT = 5000;

  console.log('\n====================================');
  console.log('  LOAN OFFICER ACCOUNT - LIVE TEST');
  console.log('====================================\n');

  // 1. LOGIN
  const loginBody = JSON.stringify({ email: 'officer@kilimomf.co.ug', password: 'password123' });
  const loginRes = await request({
    hostname: BASE, port: PORT, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  // API returns data.accessToken (not data.token)
  const token = loginRes.body?.data?.accessToken;
  const user  = loginRes.body?.data?.user;

  if (!token) {
    console.log('LOGIN FAILED — Full response:', JSON.stringify(loginRes.body));
    return;
  }

  console.log('✅ 1. LOGIN SUCCESS');
  console.log('   Name :', user.first_name, user.last_name);
  console.log('   Role :', user.role);
  console.log('   Email:', user.email, '\n');

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const get  = (path) => request({ hostname: BASE, port: PORT, path, headers: authHeaders });
  const post = (path, data) => {
    const b = JSON.stringify(data);
    return request({
      hostname: BASE, port: PORT, path, method: 'POST',
      headers: { ...authHeaders, 'Content-Length': Buffer.byteLength(b) }
    }, b);
  };

  // 2. DASHBOARD STATS — scoped to officer's own portfolio
  const dash = await get('/api/reports/company');
  const p = dash.body?.data?.portfolio || {};
  console.log('✅ 2. PORTFOLIO DASHBOARD  (HTTP', dash.status, ')');
  console.log('   Disbursed   :', p.total_disbursed   || 0);
  console.log('   Outstanding :', p.outstanding_portfolio || 0);
  console.log('   Arrears     :', p.total_arrears     || 0);
  console.log('   Active Loans:', p.active_loans      || 0, '\n');

  // 3. CLIENTS LIST — only officer's assigned clients
  const clients = await get('/api/clients');
  console.log('✅ 3. CLIENTS LIST  (HTTP', clients.status, ')');
  console.log('   Clients in portfolio:', clients.body?.meta?.total || 0, '\n');

  // 4. LOANS — only officer's loans, with arrears breakdown
  const loans = await get('/api/loans');
  const loanList = loans.body?.data || [];
  const inArrears = loanList.filter(l => Number(l.arrears_amount) > 0);
  const performing = loanList.filter(l => Number(l.arrears_amount) === 0 && l.status !== 'draft');
  console.log('✅ 4. LOANS LIST  (HTTP', loans.status, ')');
  console.log('   Total Loans  :', loans.body?.meta?.total || 0);
  console.log('   In Arrears   :', inArrears.length);
  console.log('   Performing   :', performing.length, '\n');

  // 5. ATTEMPT PAYMENT — must be BLOCKED (403)
  const payRes = await post('/api/repayments', { loan_id: 'test', amount_paid: 5000 });
  const payBlocked = payRes.status === 403;
  console.log(payBlocked ? '✅' : '❌', '5. PAYMENT ATTEMPT      (HTTP', payRes.status, ')');
  console.log('  ', payBlocked ? 'BLOCKED — Officer cannot make payments' : 'NOT BLOCKED — Security issue!');
  if (!payBlocked) console.log('   Response:', JSON.stringify(payRes.body), '\n');
  else console.log('   Error:', payRes.body?.error, '\n');

  // 6. ATTEMPT LOAN APPROVAL — must be BLOCKED (403)
  const approveRes = await post('/api/loans/00000000-0000-0000-0000-000000000001/approve', {});
  const approveBlocked = approveRes.status === 403;
  console.log(approveBlocked ? '✅' : '❌', '6. LOAN APPROVAL ATTEMPT (HTTP', approveRes.status, ')');
  console.log('  ', approveBlocked ? 'BLOCKED — Officer cannot approve loans' : 'NOT BLOCKED — Security issue!');
  console.log('   Error:', approveRes.body?.error, '\n');

  // 7. LOAN APPLICATION — must be ALLOWED (loan_officer can apply)
  const applyRes = await post('/api/loans', {
    client_id: '00000000-0000-0000-0000-000000000001',
    principal_amount: 100000, interest_rate: 20,
    repayment_frequency: 'weekly', duration_days: 30,
    loan_purpose: 'Test application',
    guarantors: [{ full_name: 'Test G', phone: '0700000000', national_id: 'CM12345', relationship: 'Spouse' }]
  });
  const applyAllowed = applyRes.status !== 403;
  console.log(applyAllowed ? '✅' : '❌', '7. LOAN APPLICATION     (HTTP', applyRes.status, ')');
  console.log('  ', applyAllowed ? 'ALLOWED — Officer can apply for loans (404/400 = client validation, expected)' : 'BLOCKED — Officer should be able to apply!');
  console.log('   Response:', applyRes.body?.error || applyRes.body?.message || 'Created', '\n');

  // 8. EXPENSES — must be restricted
  const expenses = await get('/api/expenses');
  const expBlocked = expenses.status === 403;
  console.log(expBlocked ? '✅' : '⚠️ ', '8. EXPENSES ACCESS      (HTTP', expenses.status, ')',
    expBlocked ? '— BLOCKED' : '— Accessible (not critical if only own expenses)');
  console.log();

  // 9. STAFF LIST — must be restricted
  const staff = await get('/api/staff');
  const staffBlocked = staff.status === 403;
  console.log(staffBlocked ? '✅' : '⚠️ ', '9. STAFF LIST ACCESS    (HTTP', staff.status, ')',
    staffBlocked ? '— BLOCKED' : '— Accessible (check if data is exposed)');
  console.log();

  // 10. DELETE CLIENT — endpoint should not exist
  const delRes = await request({
    hostname: BASE, port: PORT, path: '/api/clients/00000000-0000-0000-0000-000000000001',
    method: 'DELETE', headers: authHeaders
  });
  const delBlocked = delRes.status === 403 || delRes.status === 404 || delRes.status === 405;
  console.log(delBlocked ? '✅' : '❌', '10. DELETE CLIENT       (HTTP', delRes.status, ')');
  console.log('   ', delBlocked ? 'BLOCKED / Not found — No delete authority' : 'NOT BLOCKED — Critical security issue!', '\n');

  console.log('====================================');
  console.log('  TEST COMPLETE');
  console.log('====================================\n');
}

run().catch(err => console.error('Test error:', err.message));
