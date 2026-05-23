const http = require('http');

// Test login and print full raw response
const loginBody = JSON.stringify({ email: 'officer@kilimomf.co.ug', password: 'password123' });

const req = http.request({
  hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
}, (res) => {
  let data = '';
  console.log('HTTP Status:', res.statusCode);
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Response Body:', data);
    
    // Also test with another known user
    const loginBody2 = JSON.stringify({ email: 'admin@kilimomf.co.ug', password: 'Smos@2024' });
    const req2 = http.request({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody2) }
    }, (res2) => {
      let data2 = '';
      console.log('\nAdmin Login HTTP Status:', res2.statusCode);
      res2.on('data', c => data2 += c);
      res2.on('end', () => {
        const parsed = JSON.parse(data2);
        console.log('Admin Login Success:', !!parsed?.data?.accessToken);
        process.exit(0);
      });
    });
    req2.write(loginBody2);
    req2.end();
  });
});

req.on('error', e => { console.error('Connection error:', e.message); process.exit(1); });
req.write(loginBody);
req.end();
