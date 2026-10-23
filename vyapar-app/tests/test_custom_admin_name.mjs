import assert from 'assert';

async function testCustomAdminName() {
  console.log('Testing custom Admin Name at login...');

  // 1. Existing account login with custom Admin name (e.g. "Rohit Gupta")
  const sharmaLoginRes = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'sharma@sharmatraders.in',
      pin: '1234',
      name: 'Rohit Gupta'
    })
  });

  const sharmaData = await sharmaLoginRes.json();
  console.log('Login Response Status:', sharmaLoginRes.status);
  console.log('User name in response:', sharmaData.user && sharmaData.user.name);
  assert.strictEqual(sharmaLoginRes.status, 200);
  assert.strictEqual(sharmaData.user.name, 'Rohit Gupta', 'Admin name must be Rohit Gupta');

  // 2. Verify with /api/v1/auth/me
  const meRes = await fetch('http://127.0.0.1:3000/api/v1/auth/me', {
    headers: { 'Authorization': `Bearer ${sharmaData.token}` }
  });
  const meData = await meRes.json();
  console.log('/auth/me name:', meData.user && meData.user.name);
  assert.strictEqual(meData.user.name, 'Rohit Gupta', 'Active session name must be Rohit Gupta');

  // 3. Test updating name to Priyanka Gupta
  const updateRes = await fetch('http://127.0.0.1:3000/api/v1/auth/user/update-name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sharmaData.token}`
    },
    body: JSON.stringify({ name: 'Priyanka Gupta' })
  });
  const updateData = await updateRes.json();
  console.log('Update name status:', updateRes.status);
  console.log('Updated name:', updateData.user && updateData.user.name);
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateData.user.name, 'Priyanka Gupta');

  // 4. Test OTP login with custom name for a phone number
  const sendRes = await fetch('http://127.0.0.1:3000/api/v1/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9899112233' })
  });
  const sendData = await sendRes.json();
  assert.strictEqual(sendRes.status, 200);

  const verifyRes = await fetch('http://127.0.0.1:3000/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9899112233',
      otp: sendData.testOtp,
      name: 'Priyanka Gupta',
      businessName: 'Gupta Enterprises'
    })
  });
  const verifyData = await verifyRes.json();
  console.log('OTP verify status:', verifyRes.status);
  console.log('OTP user name:', verifyData.user && verifyData.user.name);
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyData.user.name, 'Priyanka Gupta');

  console.log('\nALL CUSTOM ADMIN NAME VERIFICATION CHECKS PASSED 100%!');
}

testCustomAdminName().catch(err => {
  console.error(err);
  process.exit(1);
});
