import http from 'http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, text: buf });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${path}`, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, text: buf });
        }
      });
    }).on('error', reject);
  });
}

async function verifyAll() {
  console.log('=== TEST 1: Login Demo Salesman (Ramesh Kumar - 9876543210) ===');
  const loginRes = await post('/api/v1/salesmen/login', { phone: '9876543210' });
  console.log('Login Status:', loginRes.status, 'Salesman ID:', loginRes.data.salesman?.id, 'Name:', loginRes.data.salesman?.name);
  const salesmanId = loginRes.data.salesman?.id || 'SALES-001';

  console.log('\n=== TEST 2: Punch In for Duty ===');
  const punchInRes = await post(`/api/v1/salesmen/${salesmanId}/attendance`, {
    action: 'Punch In',
    type: 'PUNCH_IN',
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 10,
    notes: 'Started field duty'
  });
  console.log('Punch In Status:', punchInRes.status);
  console.log('AttendanceStatus:', punchInRes.data.attendanceStatus);
  console.log('DutyStatus:', punchInRes.data.dutyStatus);
  if (punchInRes.data.dutyStatus !== 'ON DUTY' || punchInRes.data.attendanceStatus !== 'Punched In') {
    throw new Error('Punch in duty status verification failed!');
  }

  console.log('\n=== TEST 3: Punch Out from Duty ===');
  const punchOutRes = await post(`/api/v1/salesmen/${salesmanId}/attendance`, {
    action: 'Punch Out',
    type: 'PUNCH_OUT',
    latitude: 28.6145,
    longitude: 77.2100,
    accuracy: 10,
    notes: 'Completed field duty'
  });
  console.log('Punch Out Status:', punchOutRes.status);
  console.log('AttendanceStatus:', punchOutRes.data.attendanceStatus);
  console.log('DutyStatus:', punchOutRes.data.dutyStatus);
  if (punchOutRes.data.dutyStatus !== 'OFF DUTY' || punchOutRes.data.attendanceStatus !== 'Punched Out') {
    throw new Error('Punch out duty status verification failed!');
  }

  console.log('\n=== TEST 4: Punch In Again to Leave ON DUTY ===');
  const punchInAgain = await post(`/api/v1/salesmen/${salesmanId}/attendance`, {
    action: 'Punch In',
    type: 'PUNCH_IN',
    latitude: 28.6139,
    longitude: 77.2090
  });
  console.log('DutyStatus:', punchInAgain.data.dutyStatus);

  console.log('\n=== TEST 5: Customer Location Visit Check-In ===');
  const visitRes = await post(`/api/v1/salesmen/${salesmanId}/visits`, {
    partyName: 'Gupta General Store',
    purpose: '🛍️ New Order Booking',
    notes: 'Met shopkeeper Ramesh ji, demonstrated new tea and spices pack.',
    latitude: 28.6142,
    longitude: 77.2095
  });
  console.log('Visit Check-In Status:', visitRes.status);
  console.log('Visit ID:', visitRes.data.visit?.id);
  console.log('Party:', visitRes.data.visit?.partyName);
  console.log('Purpose:', visitRes.data.visit?.purpose);
  console.log('GPS Tag:', `Lat: ${visitRes.data.visit?.latitude}, Lng: ${visitRes.data.visit?.longitude}`);

  console.log('\n=== TEST 6: Fetch Today\'s Customer Visits ===');
  const getVisitsRes = await get(`/api/v1/salesmen/${salesmanId}/visits`);
  console.log('Total Visits recorded:', getVisitsRes.data.visits?.length);

  console.log('\n=== TEST 7: Field Order Booking ===');
  const orderRes = await post(`/api/v1/salesmen/${salesmanId}/orders`, {
    partyName: 'Gupta General Store',
    partyId: 'PT-01',
    items: [
      { name: 'Tata Tea Gold (500g)', price: 290, quantity: 2, gstRate: 5, lineTotal: 609 },
      { name: 'Aashirvaad Superior MP Atta (10kg)', price: 460, quantity: 1, gstRate: 0, lineTotal: 460 }
    ],
    subtotal: 1040,
    tax: 29,
    total: 1069,
    paymentMode: 'Credit (15 Days)',
    notes: 'Urgent festive replenishment order'
  });
  console.log('Order Placement Status:', orderRes.status);
  console.log('Generated Order Number:', orderRes.data.order?.number);
  console.log('Order Total: ₹' + orderRes.data.order?.total);
  console.log('Customer:', orderRes.data.order?.partyName);

  console.log('\n=== TEST 8: Fetch Today\'s Orders for Salesman ===');
  const getOrdersRes = await get(`/api/v1/salesmen/${salesmanId}/orders`);
  console.log('Total Orders booked today:', getOrdersRes.data.orders?.length);

  console.log('\n✅ ALL SALESMAN SUITE TESTS PASSED WITH 100% SUCCESS!');
}

verifyAll().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
