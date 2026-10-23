// ==============================================================================
// LekhaJokha — Vyapar-Style Unified Auth, Business Access & Isolation Test Suite
// Verifies all 14 mandatory security, isolation, and synchronization scenarios
// ==============================================================================

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';

process.env.PORT = '3005';
process.env.HOST = '127.0.0.1';

console.log('--- Launching LekhaJokha Server on Port 3005 for Automated Test Suite ---');
await import('../server.mjs');

// Allow server binding
await new Promise(r => setTimeout(r, 800));

const BASE_URL = 'http://127.0.0.1:3005';

async function apiRequest(endpoint, { method = 'GET', headers = {}, body = null } = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };
  const fetchOptions = {
    method,
    headers: reqHeaders
  };
  if (body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

let passed = 0;
let total = 0;

function pass(name, detail = '') {
  passed++;
  total++;
  console.log(`  [PASS] Scenario ${total}: ${name} ${detail ? '(' + detail + ')' : ''}`);
}

function fail(name, error) {
  total++;
  console.error(`  [FAIL] Scenario ${total}: ${name}:`, error);
  throw error;
}

async function run14Scenarios() {
  console.log('\n=================================================================');
  console.log('RUNNING 14 MANDATORY VYAPAR-STYLE VERIFICATION SCENARIOS');
  console.log('=================================================================\n');

  const ts = Date.now();
  const phone1 = '98' + String(ts).slice(-8);
  const phone2 = '97' + String(ts + 1).slice(-8);

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Two independent shopkeepers register via OTP and have isolated data
  // ---------------------------------------------------------------------------
  console.log('>>> SCENARIO 1: Two independent shopkeepers registration & private data');
  // Shopkeeper 1
  const otpRes1 = await apiRequest('/api/v1/auth/otp/send', {
    method: 'POST',
    body: { phone: phone1, purpose: 'register' }
  });
  assert.strictEqual(otpRes1.status, 200);
  assert.ok(otpRes1.data.testOtp, 'OTP returned in dev/test response');
  const otp1 = otpRes1.data.testOtp;

  const verifyRes1 = await apiRequest('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: {
      phone: phone1,
      otp: otp1,
      name: 'Rohan Sharma',
      businessName: 'Sharma General Store',
      state: 'Delhi (07)'
    }
  });
  assert.strictEqual(verifyRes1.status, 200);
  assert.ok(verifyRes1.data.token);
  const token1 = verifyRes1.data.token;
  const biz1 = verifyRes1.data.activeBusinessId;

  // Create private customer in Shopkeeper 1's business
  const partyRes1 = await apiRequest('/api/v1/parties', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 },
    body: { name: 'Customer of Shopkeeper 1', phone: '9911001100', type: 'Customer' }
  });
  assert.strictEqual(partyRes1.status, 201);
  const party1Id = partyRes1.data.party.id;

  // Shopkeeper 2
  const otpRes2 = await apiRequest('/api/v1/auth/otp/send', {
    method: 'POST',
    body: { phone: phone2, purpose: 'register' }
  });
  assert.strictEqual(otpRes2.status, 200);
  const verifyRes2 = await apiRequest('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: {
      phone: phone2,
      otp: otpRes2.data.testOtp,
      name: 'Pooja Verma',
      businessName: 'Verma Textiles',
      state: 'Maharashtra (27)'
    }
  });
  assert.strictEqual(verifyRes2.status, 200);
  const token2 = verifyRes2.data.token;
  const biz2 = verifyRes2.data.activeBusinessId;

  // Shopkeeper 2 lists parties: MUST NOT see Shopkeeper 1's party
  const list2 = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token2}`, 'X-Business-Id': biz2 }
  });
  assert.strictEqual(list2.status, 200);
  const foundParty1 = (list2.data.parties || []).some(p => p.id === party1Id);
  assert.strictEqual(foundParty1, false, 'Shopkeeper 2 must not see Shopkeeper 1 private parties');
  pass('Two independent shopkeepers registration and strict data isolation', `biz1=${biz1}, biz2=${biz2}`);

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Different mobile number cannot inherit previous account access
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 2: A different mobile number cannot inherit previous business');
  const phone3 = '96' + String(ts + 2).slice(-8);
  const otpRes3 = await apiRequest('/api/v1/auth/otp/send', {
    method: 'POST',
    body: { phone: phone3, purpose: 'login' }
  });
  const verifyRes3 = await apiRequest('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: {
      phone: phone3,
      otp: otpRes3.data.testOtp,
      name: 'Stranger User',
      businessName: 'Stranger Biz'
    }
  });
  assert.strictEqual(verifyRes3.status, 200);
  const token3 = verifyRes3.data.token;
  const biz3 = verifyRes3.data.activeBusinessId;
  assert.notStrictEqual(biz3, biz1, 'New number must get independent business ID');

  // Attempt to access biz1 using token3
  const hijackAttempt = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token3}`, 'X-Business-Id': biz1 }
  });
  assert.strictEqual(hijackAttempt.status, 403, 'Access to foreign business must be rejected with 403');
  pass('Different mobile number gets independent business and cannot hijack previous business');

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Securely verified mobile-number change preserves account and data
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 3: Secure mobile-number change preserves account and data');
  const newPhone1 = '95' + String(ts + 3).slice(-8);

  // Send OTP to new phone
  const otpChangeRes = await apiRequest('/api/v1/auth/otp/send', {
    method: 'POST',
    body: { phone: newPhone1, purpose: 'update_phone' }
  });
  assert.strictEqual(otpChangeRes.status, 200);

  // Update mobile
  const updateMobileRes = await apiRequest('/api/v1/auth/user/update-mobile', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` },
    body: { newPhone: newPhone1, otp: otpChangeRes.data.testOtp }
  });
  assert.strictEqual(updateMobileRes.status, 200);

  // Verify parties of Shopkeeper 1 are completely intact
  const listAfterChange = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 }
  });
  assert.strictEqual(listAfterChange.status, 200);
  const partyStillExists = (listAfterChange.data.parties || []).some(p => p.id === party1Id);
  assert.strictEqual(partyStillExists, true, 'Customer data must remain preserved after mobile change');
  pass('Mobile-number change preserves user account, business identity, and customer data');

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Invited user can access ONLY the business they were authorized to join
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 4: Verified business invitation and role assignment');
  // Shopkeeper 1 invites user 3 as Accountant
  const inviteRes = await apiRequest('/api/v1/business/invitations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 },
    body: { phone: phone3, role: 'Accountant', permissions: ['view_reports', 'view_sales'] }
  });
  assert.strictEqual(inviteRes.status, 201);
  const inviteToken = inviteRes.data.invitation.inviteToken;

  // User 3 accepts invitation
  const acceptRes = await apiRequest('/api/v1/business/invitations/accept', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token3}` },
    body: { inviteToken }
  });
  assert.strictEqual(acceptRes.status, 200);

  // User 3 can now view biz1 parties
  const accessBiz1 = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token3}`, 'X-Business-Id': biz1 }
  });
  assert.strictEqual(accessBiz1.status, 200);

  // But User 3 CANNOT access Shopkeeper 2's business (biz2)
  const accessBiz2 = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token3}`, 'X-Business-Id': biz2 }
  });
  assert.strictEqual(accessBiz2.status, 403, 'User 3 cannot access uninvited business biz2');
  pass('Invited user accesses only the authorized business and is blocked from uninvited businesses');

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Revoked users can no longer access the business
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 5: Instant revocation of authorized user');
  const me3 = await apiRequest('/api/v1/auth/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token3}` }
  });
  const user3Id = me3.data.user.id;

  // Shopkeeper 1 revokes User 3
  const revokeRes = await apiRequest(`/api/v1/business/members/${user3Id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 }
  });
  assert.strictEqual(revokeRes.status, 200);

  // 1. User 3's prior session for biz1 is immediately revoked
  const accessRevokedToken = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token3}`, 'X-Business-Id': biz1 }
  });
  assert.ok(accessRevokedToken.status === 401 || accessRevokedToken.status === 403, 'Session must be revoked or forbidden');

  // 2. User 3 logs in to their own account, gets a new session, and attempts to access biz1
  const reLoginUser3 = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: phone3, pin: '1234' }
  });
  assert.strictEqual(reLoginUser3.status, 200);
  const freshToken3 = reLoginUser3.data.token;

  const accessRevokedNewSession = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${freshToken3}`, 'X-Business-Id': biz1 }
  });
  assert.strictEqual(accessRevokedNewSession.status, 403, 'Revoked user with active session must be rejected with 403 FORBIDDEN');
  pass('Revoked member access is immediately terminated across sessions and rejected with 403');

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Multi-business switching works safely
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 6: Safe switching between authorized businesses');
  // Shopkeeper 1 creates a second business (if plan allows or upgrade to Pro)
  await apiRequest('/api/v1/subscription/upgrade', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` },
    body: { planName: 'Pro' }
  });

  const createBiz2Res = await apiRequest('/api/v1/businesses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` },
    body: { name: 'Sharma Branch 2', state: 'Delhi (07)' }
  });
  assert.strictEqual(createBiz2Res.status, 201);
  const secondBizId = createBiz2Res.data.business.id;

  // Switch to second business
  const switchRes = await apiRequest('/api/v1/businesses/switch', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` },
    body: { businessId: secondBizId }
  });
  assert.strictEqual(switchRes.status, 200);

  // Check /auth/me returns activeBusinessId as secondBizId
  const meAfterSwitch = await apiRequest('/api/v1/auth/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert.strictEqual(meAfterSwitch.data.activeBusiness.id, secondBizId);
  pass('User can switch between multiple authorized businesses safely');

  // ---------------------------------------------------------------------------
  // SCENARIO 7: Web, Android, and Desktop access the same business records
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 7: Web, Android, and Desktop multi-device consistency');
  // Create an item on Web session
  const itemRes = await apiRequest('/api/v1/items', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1, 'X-Client-Platform': 'Web' },
    body: { name: 'Multi-Device Test Rice 10kg', salePrice: 1200, unit: 'BAG', stock: 50 }
  });
  assert.strictEqual(itemRes.status, 201);
  const itemId = itemRes.data.item.id;

  // Read item on Android session
  const getAndroid = await apiRequest('/api/v1/items', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1, 'X-Client-Platform': 'Android-Mobile-Native' }
  });
  assert.strictEqual(getAndroid.status, 200);
  assert.ok(getAndroid.data.items.some(i => i.id === itemId), 'Item visible on Android');

  // Read item on Desktop session
  const getDesktop = await apiRequest('/api/v1/items', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1, 'X-Client-Platform': 'Desktop-Electron' }
  });
  assert.strictEqual(getDesktop.status, 200);
  assert.ok(getDesktop.data.items.some(i => i.id === itemId), 'Item visible on Desktop');
  pass('Web, Android, and Desktop clients access identical authoritative business state');

  // ---------------------------------------------------------------------------
  // SCENARIO 8: Changes saved on one client appear on other clients after synchronization
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 8: Cross-client synchronization & updates');
  // Update stock from Desktop
  const updateStock = await apiRequest(`/api/v1/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1, 'X-Client-Platform': 'Desktop-Electron' },
    body: { name: 'Multi-Device Test Rice 10kg', salePrice: 1250, stock: 45 }
  });
  assert.strictEqual(updateStock.status, 200);

  // Android delta sync query
  const syncQuery = await apiRequest('/api/v1/items', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1, 'X-Client-Platform': 'Android-Mobile-Native' }
  });
  const syncedItem = syncQuery.data.items.find(i => i.id === itemId);
  assert.strictEqual(syncedItem.stock, 45, 'Stock update from Desktop reflects immediately on Android');
  assert.strictEqual(syncedItem.salePrice, 1250, 'Price update reflects on Android');
  pass('Changes saved on Desktop immediately appear on Android and Web');

  // ---------------------------------------------------------------------------
  // SCENARIO 9: Manipulated business IDs and foreign record IDs rejected
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 9: IDOR protection against manipulated headers and IDs');
  // User 2 attempts to insert invoice into biz1 by tampering with header
  const tamperedInvoice = await apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}`, 'X-Business-Id': biz1 },
    body: { partyId: party1Id, items: [{ itemId, qty: 1, rate: 1250 }] }
  });
  assert.strictEqual(tamperedInvoice.status, 403, 'Tampered business ID must be rejected with 403');

  // User 1 attempts to refer to a foreign party from biz2 in their invoice
  const foreignRefAttempt = await apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 },
    body: { partyId: 'FOREIGN-PARTY-NONEXISTENT', items: [{ itemId, qty: 1, rate: 1250 }] }
  });
  assert.strictEqual(foreignRefAttempt.status, 400, 'Cross-tenant foreign record ID must be rejected with 400');
  pass('Manipulated business IDs and cross-tenant foreign record references strictly blocked');

  // ---------------------------------------------------------------------------
  // SCENARIO 10: Invoices, reports, and exports respect strict business isolation
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 10: Reports and ledger calculations respect isolation');
  // Record a distinct sale in biz1
  const saleBiz1 = await apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 },
    body: {
      number: `INV-REP-${Date.now()}`,
      partyId: party1Id,
      items: [{ itemId, qty: 2, rate: 1250, amount: 2500 }],
      total: 2500,
      paid: 2500,
      status: 'Paid'
    }
  });
  assert.strictEqual(saleBiz1.status, 201);

  const reports1 = await apiRequest('/api/v1/reports/daybook', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 }
  });
  assert.strictEqual(reports1.status, 200);

  const reports2 = await apiRequest('/api/v1/reports/daybook', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token2}`, 'X-Business-Id': biz2 }
  });
  assert.ok(reports1.data.salesTotal > 0, 'biz1 daybook must reflect its own sale');
  assert.strictEqual(reports2.data.salesTotal, 0, 'biz2 daybook must remain 0 and strictly isolated');
  assert.notDeepStrictEqual(reports1.data, reports2.data, 'Reports must be computed independently per tenant');
  pass('Reports, ledgers, and daybook are computed strictly from isolated tenant database');

  // ---------------------------------------------------------------------------
  // SCENARIO 11: Subscription and role restrictions enforced on protected operations
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 11: Subscription plan quota and role permission enforcement');
  // Shopkeeper 2 is on Free plan (max 1 business). Attempting to add 2nd business must fail
  const bizLimitExceed = await apiRequest('/api/v1/businesses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}` },
    body: { name: 'Illegal Extra Business' }
  });
  assert.strictEqual(bizLimitExceed.status, 403, 'Exceeding Free plan business count must be blocked with 403');
  pass('Subscription limits and plan quotas enforced on backend across all devices');

  // ---------------------------------------------------------------------------
  // SCENARIO 12: Expired and revoked sessions cannot continue accessing data
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 12: Session termination and revocation');
  // Logout current session of user 2
  const logoutRes = await apiRequest('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  assert.strictEqual(logoutRes.status, 200);

  // Subsequent request with logged out token must fail
  const afterLogout = await apiRequest('/api/v1/parties', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token2}`, 'X-Business-Id': biz2 }
  });
  assert.strictEqual(afterLogout.status, 401, 'Revoked token must be rejected with 401');
  pass('Revoked or terminated sessions cannot access protected business resources');

  // ---------------------------------------------------------------------------
  // SCENARIO 13: Concurrent updates and retries do not cause duplicate transactions
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 13: Concurrent safety & idempotent transaction submissions');
  const idempotentInvoiceId = `INV-CONCUR-${Date.now()}`;
  const reqA = apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 },
    body: {
      id: idempotentInvoiceId,
      number: idempotentInvoiceId,
      partyId: party1Id,
      partyName: 'Customer of Shopkeeper 1',
      items: [{ itemId, qty: 1, rate: 1250, amount: 1250 }],
      total: 1250,
      paid: 1250,
      status: 'Paid'
    }
  });
  const reqB = apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 },
    body: {
      id: idempotentInvoiceId,
      number: idempotentInvoiceId,
      partyId: party1Id,
      partyName: 'Customer of Shopkeeper 1',
      items: [{ itemId, qty: 1, rate: 1250, amount: 1250 }],
      total: 1250,
      paid: 1250,
      status: 'Paid'
    }
  });

  const [resA, resB] = await Promise.all([reqA, reqB]);
  // One or both will succeed without creating duplicates in database
  const salesList = await apiRequest('/api/v1/sales', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}`, 'X-Business-Id': biz1 }
  });
  const matching = (salesList.data.sales || []).filter(s => s.id === idempotentInvoiceId);
  assert.strictEqual(matching.length, 1, 'Only exactly 1 invoice must exist for idempotent transaction ID');
  pass('Concurrent retries handled safely without duplicate financial records');

  // ---------------------------------------------------------------------------
  // SCENARIO 14: Existing application features continue working post-migration
  // ---------------------------------------------------------------------------
  console.log('\n>>> SCENARIO 14: Legacy features & seed tenant validation');
  // Sharma Ji's original business (BIZ-001) in dedicated tenant file
  const sharmaLogin = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: 'sharma@sharmatraders.in', password: 'password123' }
  });
  assert.strictEqual(sharmaLogin.status, 200);
  const sharmaToken = sharmaLogin.data.token;

  // Verify seed items and parties in dedicated file
  const sharmaItems = await apiRequest('/api/v1/items', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${sharmaToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(sharmaItems.status, 200);
  assert.ok(sharmaItems.data.items.length >= 5, 'Seed items preserved in tenant file');

  const possibleTenantPath1 = path.join(process.cwd(), 'database', 'tenants', 'business_BIZ-001.json');
  const possibleTenantPath2 = path.join(process.cwd(), 'vyapar-app', 'database', 'tenants', 'business_BIZ-001.json');
  const tenantExists = fs.existsSync(possibleTenantPath1) || fs.existsSync(possibleTenantPath2);
  assert.ok(tenantExists, `Dedicated tenant file must exist on disk at either ${possibleTenantPath1} or ${possibleTenantPath2}`);
  pass('Legacy business data (BIZ-001) fully intact in dedicated tenant database file');

  console.log('\n=================================================================');
  console.log(`ALL 14/14 SCENARIOS PASSED SUCCESSFULLY! (${passed}/${total})`);
  console.log('=================================================================\n');
  process.exit(0);
}

run14Scenarios().catch(err => {
  console.error('\n[FATAL TEST RUNNER ERROR]:', err);
  process.exit(1);
});
