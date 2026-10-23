import assert from 'node:assert';

async function testInvitationFlow() {
  console.log("=== Testing Business Invitation API Fix ===");

  // 1. Log in as Sharma Ji
  const loginRes = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'sharma@sharmatraders.in',
      pin: '1234'
    })
  });
  assert.strictEqual(loginRes.status, 200, "Login should succeed");
  const loginData = await loginRes.json();
  const token = loginData.token;
  const bizId = loginData.activeBusinessId || 'BIZ-001';
  console.log("✓ Logged in as Admin. Active Business:", bizId);

  // 2. Test sending invitation with the user's exact inputs:
  // Mobile: 9886266388, Name: Nana Patekar, Role: Cashier
  const inviteRes1 = await fetch('http://127.0.0.1:3000/api/v1/business/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Business-Id': bizId
    },
    body: JSON.stringify({
      phone: '9886266388',
      inviteePhone: '9886266388',
      name: 'Nana Patekar',
      fullName: 'Nana Patekar',
      role: 'Cashier'
    })
  });
  const inviteData1 = await inviteRes1.json();
  console.log("Invitation 1 response:", inviteRes1.status, inviteData1);
  assert.strictEqual(inviteRes1.status, 201, "Invitation should be created with HTTP 201");
  assert.ok(inviteData1.success, "success should be true");
  assert.strictEqual(inviteData1.invitation.role, 'Cashier', "Role should be Cashier");
  assert.strictEqual(inviteData1.invitation.recipientPhone, '9886266388');
  assert.strictEqual(inviteData1.invitation.recipientName, 'Nana Patekar');
  console.log("✓ Invitation created successfully for Nana Patekar (9886266388)");

  // 3. Test sending invitation with only inviteePhone (the legacy frontend format)
  const inviteRes2 = await fetch('http://127.0.0.1:3000/api/v1/business/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Business-Id': bizId
    },
    body: JSON.stringify({
      inviteePhone: '9876543210',
      role: 'Accountant'
    })
  });
  const inviteData2 = await inviteRes2.json();
  assert.strictEqual(inviteRes2.status, 201, "Legacy inviteePhone payload should succeed with HTTP 201");
  assert.strictEqual(inviteData2.invitation.recipientPhone, '9876543210');
  console.log("✓ Legacy payload with inviteePhone succeeded");

  // 4. Test missing recipient error returns clear message
  const inviteRes3 = await fetch('http://127.0.0.1:3000/api/v1/business/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Business-Id': bizId
    },
    body: JSON.stringify({
      role: 'Salesperson'
    })
  });
  assert.strictEqual(inviteRes3.status, 400);
  const inviteData3 = await inviteRes3.json();
  assert.strictEqual(inviteData3.error, 'MISSING_RECIPIENT');
  assert.strictEqual(inviteData3.message, 'Recipient mobile phone or email address is required.');
  console.log("✓ Empty recipient properly returns HTTP 400 with helpful message:", inviteData3.message);

  // 5. Test fetching pending invitations
  const listRes = await fetch('http://127.0.0.1:3000/api/v1/business/invitations', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Business-Id': bizId
    }
  });
  assert.strictEqual(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.invitations));
  const nanaInvite = listData.invitations.find(i => i.recipientPhone === '9886266388');
  assert.ok(nanaInvite, "Nana Patekar's invite should be in pending list");
  console.log("✓ Found Nana Patekar's invite in pending list with Token:", nanaInvite.inviteToken);

  console.log("\nALL INVITATION FIX VERIFICATION TESTS PASSED 100%!");
}

testInvitationFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
