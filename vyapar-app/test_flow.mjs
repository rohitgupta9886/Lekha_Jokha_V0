async function run() {
  try {
    console.log('--- 1. Testing GET /api/v1/salesmen ---');
    const res1 = await fetch('http://127.0.0.1:3000/api/v1/salesmen?businessId=BIZ-001');
    const data1 = await res1.json();
    console.log('GET status:', res1.status, 'Count:', data1.salesmen ? data1.salesmen.length : 0);
    console.log('Salesmen:', (data1.salesmen || []).map(s => `${s.name} (${s.phone})`));

    console.log('\n--- 2. Testing POST /api/v1/salesmen/login (Demo: 9876543210) ---');
    const res2 = await fetch('http://127.0.0.1:3000/api/v1/salesmen/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' })
    });
    const data2 = await res2.json();
    console.log('LOGIN status:', res2.status, 'Salesman:', data2.salesman?.name, 'Biz:', data2.business?.name);

    console.log('\n--- 3. Testing POST /api/v1/salesmen (Create New Salesman) ---');
    const res3 = await fetch('http://127.0.0.1:3000/api/v1/salesmen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Raina',
        phone: '9845012345',
        businessId: 'BIZ-001',
        role: 'Field Executive',
        territory: 'Indiranagar'
      })
    });
    const data3 = await res3.json();
    console.log('CREATE status:', res3.status, 'Salesman:', data3.salesman?.name, 'InviteUrl:', !!data3.whatsAppInviteUrl);

    console.log('\n--- 4. Testing POST /api/v1/salesmen/login with newly created salesman ---');
    const res4 = await fetch('http://127.0.0.1:3000/api/v1/salesmen/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9845012345' })
    });
    const data4 = await res4.json();
    console.log('LOGIN NEW status:', res4.status, 'Salesman:', data4.salesman?.name);

    console.log('\n--- 5. Testing GET /api/v1/salesmen after create ---');
    const res5 = await fetch('http://127.0.0.1:3000/api/v1/salesmen?businessId=BIZ-001');
    const data5 = await res5.json();
    console.log('GET status:', res5.status, 'Count:', data5.salesmen ? data5.salesmen.length : 0);
    console.log('Salesmen list:', (data5.salesmen || []).map(s => s.name));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run();
