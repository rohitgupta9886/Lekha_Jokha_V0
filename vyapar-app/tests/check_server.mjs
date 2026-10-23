import http from 'http';

const req = http.get('http://localhost:3000/api/v1/subscription', (res) => {
  console.log('SERVER_ALIVE_STATUS:', res.statusCode);
  process.exit(0);
});

req.on('error', (e) => {
  console.log('SERVER_NOT_RUNNING:', e.message);
  process.exit(1);
});
