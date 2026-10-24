import http from 'http';

const req = http.get('http://127.0.0.1:3001/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`[Health Check] Status: ${res.statusCode}, Body: ${data}`);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error('[Health Check] Error connecting:', err.message);
  process.exit(1);
});
