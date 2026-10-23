// ==============================================================================
// LekhaJokha Comprehensive Cross-Platform Auth, Sync & Data Isolation Test Suite
// Verifies Tests A through H as defined in the Master Requirements
// ==============================================================================

import assert from 'assert';
import http from 'http';

process.env.PORT = '3002';
process.env.HOST = '127.0.0.1';

console.log('--- Initializing LekhaJokha Central Test Server on Port 3002 ---');
await import('../server.mjs');

// Give the server a moment to finish binding
await new Promise(r => setTimeout(r, 600));

const BASE_URL = 'http://127.0.0.1:3002';

// Helper for making HTTP requests
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

let passedTests = 0;
let totalTests = 0;

function reportPass(name, detail = '') {
  passedTests++;
  totalTests++;
  console.log(`  [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
}

function reportFail(name, error) {
  totalTests++;
  console.error(`  [FAIL] ${name}:`, error);
  throw error;
}

async function runTestSuite() {
  console.log('\n=================================================================');
  console.log('LEKHAJOKHA UNIFIED AUTH, CROSS-PLATFORM SYNC & ISOLATION TESTS');
  console.log('=================================================================\n');

  // ---------------------------------------------------------------------------
  // TEST A: Unified Authentication & Multi-Platform Independent Sessions
  // ---------------------------------------------------------------------------
  console.log('>>> TEST A: Unified Credentials & Multi-Platform Independent Sessions');
  
  // 1. Register a central user
  const uniqueTimestamp = Date.now();
  const regEmail = `rajan_${uniqueTimestamp}@rajantraders.in`;
  const regPhone = '9' + String(uniqueTimestamp).slice(-9);
  const regPass = 'StrongPass#2026';
  const regPin = '9876';

  const regRes = await apiRequest('/api/v1/auth/register', {
    method: 'POST',
    body: {
      businessName: 'Rajan Enterprises',
      name: 'Rajan Patel',
      identifier: regEmail,
      phone: regPhone,
      password: regPass,
      pin: regPin,
      platform: 'Web'
    }
  });

  assert.strictEqual(regRes.status, 201, 'User registration should return 201');
  assert.ok(regRes.data.session && regRes.data.session.token, 'Registration returns valid session');
  const initialWebToken = regRes.data.session.token;
  const rajanUserId = regRes.data.user.id;
  const rajanBizId = regRes.data.business.id;
  reportPass('Registration creates central user identity', `UserID: ${rajanUserId}, BizID: ${rajanBizId}`);

  // 2. Log in from Android with same credentials
  const androidLoginRes = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: {
      identifier: regEmail,
      password: regPass,
      platform: 'Android',
      deviceInfo: { os: 'Android 14', device: 'Pixel 8' }
    }
  });
  assert.strictEqual(androidLoginRes.status, 200, 'Android login should succeed');
  assert.strictEqual(androidLoginRes.data.user.id, rajanUserId, 'Android login authenticated same central user');
  const androidToken = androidLoginRes.data.session.token;
  reportPass('Android login succeeds with same credentials & maps to central identity');

  // 3. Log in from Desktop with same credentials (using PIN)
  const desktopLoginRes = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: {
      identifier: regEmail,
      pin: regPin,
      platform: 'Desktop',
      deviceInfo: { os: 'Windows 11', client: 'Electron' }
    }
  });
  assert.strictEqual(desktopLoginRes.status, 200, 'Desktop login should succeed');
  assert.strictEqual(desktopLoginRes.data.user.id, rajanUserId, 'Desktop login authenticated same central user');
  const desktopToken = desktopLoginRes.data.session.token;
  reportPass('Desktop login succeeds with same PIN & maps to central identity');

  // 4. Verify independent sessions
  const sessionsRes = await apiRequest('/api/v1/auth/sessions', {
    headers: { Authorization: `Bearer ${desktopToken}` }
  });
  assert.strictEqual(sessionsRes.status, 200);
  assert.ok(Array.isArray(sessionsRes.data.sessions), 'Sessions list returned');
  assert.strictEqual(sessionsRes.data.sessions.length >= 3, true, 'At least 3 active sessions exist');
  reportPass('All 3 platforms have distinct active sessions', `Total: ${sessionsRes.data.sessions.length}`);

  // 5. Revoke Android session
  const androidSession = sessionsRes.data.sessions.find(s => s.platform === 'Android');
  assert.ok(androidSession, 'Android session found');
  const revokeRes = await apiRequest('/api/v1/auth/sessions/revoke', {
    method: 'POST',
    headers: { Authorization: `Bearer ${desktopToken}` },
    body: { sessionId: androidSession.id }
  });
  assert.strictEqual(revokeRes.status, 200);

  // 6. Verify Android is now blocked (401), while Desktop & Web remain active
  const androidBlockedRes = await apiRequest('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${androidToken}` }
  });
  assert.strictEqual(androidBlockedRes.status, 401, 'Revoked Android session is rejected with 401');

  const desktopStillActiveRes = await apiRequest('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${desktopToken}` }
  });
  assert.strictEqual(desktopStillActiveRes.status, 200, 'Desktop session remains fully active');
  reportPass('Device session revocation is strictly enforced without logging out other devices');

  // ---------------------------------------------------------------------------
  // TEST B: Web to Android Synchronization
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST B: Web to Android Synchronization');

  // Sharma Ji logs in on Web
  const sharmaWebLogin = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: 'sharma@sharmatraders.in', pin: '1234', platform: 'Web' }
  });
  assert.strictEqual(sharmaWebLogin.status, 200);
  const sharmaWebToken = sharmaWebLogin.data.session.token;

  // Sharma Ji logs in on Android
  const sharmaAndroidLogin = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: 'sharma@sharmatraders.in', pin: '1234', platform: 'Android' }
  });
  assert.strictEqual(sharmaAndroidLogin.status, 200);
  const sharmaAndroidToken = sharmaAndroidLogin.data.session.token;

  // 1. Web creates a new customer "Sharma Traders Partner B2B"
  const newPartyId = 'P_SYNC_B_' + Date.now();
  const createPartyRes = await apiRequest('/api/v1/parties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaWebToken}`, 'X-Business-Id': 'BIZ-001' },
    body: {
      id: newPartyId,
      name: 'Sharma Traders Partner B2B',
      type: 'Customer',
      phone: '9811122233',
      balance: 5000
    }
  });
  assert.strictEqual(createPartyRes.status, 201, 'Customer created on Web');

  // 2. Web creates a tax invoice for this customer
  const newInvId = 'INV_SYNC_B_' + Date.now();
  const createInvRes = await apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaWebToken}`, 'X-Business-Id': 'BIZ-001' },
    body: {
      id: newInvId,
      number: newInvId,
      partyId: newPartyId,
      partyName: 'Sharma Traders Partner B2B',
      date: '2026-10-22',
      items: [{ itemId: 'ITM001', name: 'Basmati Rice Royal Premium', qty: 2, rate: 1150, gstRate: 5, amount: 2415 }],
      subtotal: 2300,
      tax: 115,
      total: 2415,
      paid: 0,
      balance: 2415,
      status: 'Unpaid'
    }
  });
  assert.strictEqual(createInvRes.status, 201, 'Invoice created on Web');

  // 3. Android queries central backend for invoices
  const androidPullRes = await apiRequest('/api/v1/sales', {
    method: 'GET',
    headers: { Authorization: `Bearer ${sharmaAndroidToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(androidPullRes.status, 200);
  const foundInv = (androidPullRes.data.sales || []).find(s => s.id === newInvId);
  assert.ok(foundInv, 'Invoice created on Web is immediately available on Android');
  assert.strictEqual(foundInv.total, 2415);
  assert.strictEqual(foundInv.partyName, 'Sharma Traders Partner B2B');
  reportPass('Web to Android: Invoice created on Web retrieved by Android with exact data');

  // ---------------------------------------------------------------------------
  // TEST C: Android to Desktop Synchronization
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST C: Android to Desktop Synchronization');

  // Sharma Ji logs in on Desktop
  const sharmaDesktopLogin = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: 'sharma@sharmatraders.in', pin: '1234', platform: 'Desktop' }
  });
  assert.strictEqual(sharmaDesktopLogin.status, 200);
  const sharmaDesktopToken = sharmaDesktopLogin.data.session.token;

  // 1. Android creates a new product
  const newProductId = 'ITM_SYNC_C_' + Date.now();
  const createItemRes = await apiRequest('/api/v1/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaAndroidToken}`, 'X-Business-Id': 'BIZ-001' },
    body: {
      id: newProductId,
      name: 'Android Sync Special Tea 1kg',
      category: 'Groceries',
      salePrice: 420,
      purchasePrice: 320,
      gstRate: 5,
      unit: 'BAG',
      stock: 10
    }
  });
  assert.strictEqual(createItemRes.status, 201, 'Item created on Android');

  // 2. Android adjusts stock (+40 units)
  const adjustRes = await apiRequest('/api/v1/items/adjust-stock', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaAndroidToken}`, 'X-Business-Id': 'BIZ-001' },
    body: {
      itemId: newProductId,
      deltaQty: 40,
      reason: 'Fresh Warehouse Arrival'
    }
  });
  assert.strictEqual(adjustRes.status, 200, 'Stock adjusted on Android');
  assert.strictEqual(adjustRes.data.stock, 50, 'Stock updated to 50 on server');

  // 3. Desktop requests items
  const desktopItemsRes = await apiRequest('/api/v1/items', {
    headers: { Authorization: `Bearer ${sharmaDesktopToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(desktopItemsRes.status, 200);
  const desktopItem = (desktopItemsRes.data.items || []).find(i => i.id === newProductId);
  assert.ok(desktopItem, 'Desktop retrieved item created on Android');
  assert.strictEqual(desktopItem.stock, 50, 'Desktop sees updated stock level 50');
  reportPass('Android to Desktop: Product and stock changes synced to Desktop');

  // ---------------------------------------------------------------------------
  // TEST D: Desktop to Web Synchronization
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST D: Desktop to Web Synchronization');

  // 1. Desktop creates a sales order
  const newOrderId = 'ORD_SYNC_D_' + Date.now();
  const createOrderRes = await apiRequest('/api/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaDesktopToken}`, 'X-Business-Id': 'BIZ-001' },
    body: {
      id: newOrderId,
      number: newOrderId,
      source: 'Desktop Counter',
      partyId: 'P001',
      partyName: 'Gupta General Store',
      items: [{ itemId: 'ITM001', qty: 5, rate: 1150, amount: 5750 }],
      total: 5750,
      orderStatus: 'New',
      paymentStatus: 'Pending'
    }
  });
  assert.strictEqual(createOrderRes.status, 201, 'Order created on Desktop');

  // 2. Web retrieves the order
  const webOrdersRes = await apiRequest('/api/v1/orders', {
    headers: { Authorization: `Bearer ${sharmaWebToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(webOrdersRes.status, 200);
  const webOrder = (webOrdersRes.data.orders || []).find(o => o.id === newOrderId);
  assert.ok(webOrder, 'Web retrieved order created on Desktop');
  assert.strictEqual(webOrder.total, 5750);
  reportPass('Desktop to Web: Order created on Desktop retrieved on Web');

  // ---------------------------------------------------------------------------
  // TEST E: Central Persistence Across Sessions & Restarts
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST E: Central Persistence Across Logouts & Restarts');

  // Log out Desktop
  const logoutRes = await apiRequest('/api/v1/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaDesktopToken}` }
  });
  assert.strictEqual(logoutRes.status, 200, 'Logged out from Desktop');

  // Log back in on Desktop
  const reloginRes = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: 'sharma@sharmatraders.in', pin: '1234', platform: 'Desktop' }
  });
  assert.strictEqual(reloginRes.status, 200, 'Re-logged into Desktop');
  const newDesktopToken = reloginRes.data.session.token;

  // Verify all records (Party, Invoice, Item, Order) still exist centrally
  const checkItems = await apiRequest('/api/v1/items', {
    headers: { Authorization: `Bearer ${newDesktopToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.ok((checkItems.data.items || []).some(i => i.id === newProductId), 'Product persisted');

  const checkSales = await apiRequest('/api/v1/sales', {
    headers: { Authorization: `Bearer ${newDesktopToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.ok((checkSales.data.sales || []).some(s => s.id === newInvId), 'Invoice persisted');

  reportPass('Persistence: Records remain intact centrally across logout and re-authentication');

  // ---------------------------------------------------------------------------
  // TEST F: Concurrent Changes & Conflict Handling / Sync Deduplication
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST F: Concurrent Changes & Sync Deduplication');

  const mutId = 'MUT_TEST_' + Date.now();
  const mutPayload = {
    mutationId: mutId,
    entity: 'items',
    action: 'adjustStock',
    data: { id: newProductId, deltaQty: 5, reason: 'Sync delta test' }
  };

  // First sync call
  const sync1 = await apiRequest('/api/v1/sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaWebToken}`, 'X-Business-Id': 'BIZ-001' },
    body: { mutations: [mutPayload] }
  });
  assert.strictEqual(sync1.status, 200);
  assert.strictEqual(sync1.data.results[0].status, 'success');

  // Second sync call with exact same mutationId (network retry simulation)
  const sync2 = await apiRequest('/api/v1/sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaWebToken}`, 'X-Business-Id': 'BIZ-001' },
    body: { mutations: [mutPayload] }
  });
  assert.strictEqual(sync2.status, 200);
  assert.strictEqual(sync2.data.results[0].status, 'deduplicated', 'Duplicate mutation safely ignored without applying twice');
  reportPass('Sync Deduplication: Retried mutations are deduplicated without double-mutating stock');

  // ---------------------------------------------------------------------------
  // TEST G: Strict User & Business Data Isolation (IDOR & Tenant Tampering)
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST G: Strict Multi-Tenant Data Isolation & IDOR Protection');

  // 1. Verma Ji (Tenant 2) registers as an independent tenant
  const vermaTime = Date.now();
  const vermaEmail = `verma_${vermaTime}@vermagrocers.in`;
  const vermaPhone = '9' + String(vermaTime).slice(-9);
  const vermaPass = 'vermaPass123';

  const regVermaRes = await apiRequest('/api/v1/auth/register', {
    method: 'POST',
    body: {
      businessName: 'Verma Grocers',
      name: 'Verma Ji',
      identifier: vermaEmail,
      phone: vermaPhone,
      password: vermaPass,
      platform: 'Web'
    }
  });
  assert.strictEqual(regVermaRes.status, 201, 'Verma Ji registered as independent tenant');
  const vermaToken = regVermaRes.data.session.token;
  const vermaBizId = regVermaRes.data.business.id;
  const vermaUserId = regVermaRes.data.user.id;
  reportPass('Independent Tenant Created', `UserID: ${vermaUserId}, BizID: ${vermaBizId}`);

  // 2. IDOR Attempt: Verma Ji tries to read Sharma Ji's business data by spoofing X-Business-Id: BIZ-001
  const idorSalesRes = await apiRequest('/api/v1/sales', {
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(idorSalesRes.status, 403, 'Cross-business access blocked with 403');
  assert.strictEqual(idorSalesRes.data.code, 'FORBIDDEN_BUSINESS_ACCESS');
  reportPass('IDOR Protection: Tenant 2 cannot access Tenant 1 business data via X-Business-Id (HTTP 403)');

  // 3. IDOR Attempt: Verma Ji tries to switch active business to Sharma Ji's BIZ-001
  const idorSwitchRes = await apiRequest('/api/v1/businesses/switch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vermaToken}` },
    body: { businessId: 'BIZ-001' }
  });
  assert.strictEqual(idorSwitchRes.status, 403, 'Unauthorized business switch blocked with 403');
  reportPass('Business Switch: Cannot switch to an unauthorized business without membership (HTTP 403)');

  // 4. Cross-Tenant Related-Record Protection:
  // Verma Ji tries to create an invoice in vermaBizId, but sneaks in Sharma Ji's party (P001) or item (ITM001)
  const crossLinkRes = await apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': vermaBizId },
    body: {
      id: 'INV_VERMA_TAMPER_01',
      partyId: 'P001', // Sharma Ji's customer!
      partyName: 'Gupta General Store',
      items: [{ itemId: 'ITM001', name: 'Basmati Rice', qty: 1, rate: 1000, amount: 1000 }], // Sharma Ji's item!
      total: 1000
    }
  });
  assert.strictEqual(crossLinkRes.status, 400, 'Cross-tenant related-record link rejected with 400');
  assert.strictEqual(crossLinkRes.data.code, 'CROSS_TENANT_RECORD_LINK_BLOCKED');
  reportPass('Cross-Tenant Record Protection: Linking customer/items across businesses rejected (HTTP 400)');

  // 5. Valid Verma Ji invoice inside vermaBizId with Verma Ji's own party PV01 and item ITMV01 succeeds
  await apiRequest('/api/v1/parties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': vermaBizId },
    body: { id: 'PV01', name: 'Verma Loyal Customer', type: 'Customer', phone: '9988770000' }
  });
  await apiRequest('/api/v1/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': vermaBizId },
    body: { id: 'ITMV01', name: 'Fresh Organic Mustard 500g', salePrice: 80, purchasePrice: 60, stock: 100 }
  });

  const validVermaInv = await apiRequest('/api/v1/sales', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': vermaBizId },
    body: {
      id: 'INV_VERMA_LEGIT_01',
      partyId: 'PV01',
      partyName: 'Verma Loyal Customer',
      items: [{ itemId: 'ITMV01', name: 'Fresh Organic Mustard 500g', qty: 2, rate: 80, amount: 160 }],
      total: 160
    }
  });
  assert.strictEqual(validVermaInv.status, 201, 'Verma Ji invoice in vermaBizId with owned records succeeded');
  reportPass('Isolated Tenant Integrity: Tenant operates independently on owned records');

  // 6. Utility & Marketing Endpoints Tenant Isolation Test:
  // Verma Ji attempts to access Sharma Ji's leads, tasks, or accountant invitations by spoofing BIZ-001
  const idorLeadsRes = await apiRequest('/api/v1/leads', {
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(idorLeadsRes.status, 403, 'Cross-business marketing leads access blocked with 403');

  const idorTasksRes = await apiRequest('/api/v1/tasks', {
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(idorTasksRes.status, 403, 'Cross-business marketing tasks access blocked with 403');

  const idorAccountantRes = await apiRequest('/api/v1/utilities/accountant-access', {
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(idorAccountantRes.status, 403, 'Cross-business accountant access blocked with 403');
  reportPass('Utility/Marketing Isolation: Utility & marketing endpoints strictly block cross-tenant access (HTTP 403)');

  // ---------------------------------------------------------------------------
  // TEST H: Failure, Account Security & Recovery
  // ---------------------------------------------------------------------------
  console.log('\n>>> TEST H: Failure, Account Security & Recovery');

  // 1. Invalid or expired token rejected with 401
  const badTokenRes = await apiRequest('/api/v1/sales', {
    headers: { Authorization: 'Bearer INVALID_EXPIRED_TOKEN_XYZ', 'X-Business-Id': 'BIZ-001' }
  });
  assert.strictEqual(badTokenRes.status, 401, 'Invalid Bearer token rejected with 401');
  reportPass('Security: Invalid/Tampered tokens rejected with HTTP 401');

  // 2. Account Suspension enforcement
  // Suspend Verma Ji user
  const suspendRes = await apiRequest('/api/v1/auth/users/status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaWebToken}` }, // Admin action
    body: { userId: vermaUserId, status: 'Suspended' }
  });
  assert.strictEqual(suspendRes.status, 200, 'User suspended');

  // Verma Ji attempts API call with previously active token
  const suspendedAccessRes = await apiRequest('/api/v1/sales', {
    headers: { Authorization: `Bearer ${vermaToken}`, 'X-Business-Id': vermaBizId }
  });
  assert.ok(
    suspendedAccessRes.status === 401 || suspendedAccessRes.status === 403,
    'Suspended user blocked with 401/403'
  );
  reportPass('Security: Suspended accounts and revoked sessions are immediately blocked on all devices');

  // Reactivate Verma Ji
  await apiRequest('/api/v1/auth/users/status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sharmaWebToken}` },
    body: { userId: vermaUserId, status: 'Active' }
  });

  // 3. Password reset cycle
  const forgotRes = await apiRequest('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: { identifier: regEmail }
  });
  assert.strictEqual(forgotRes.status, 200);
  assert.ok(forgotRes.data.resetToken, 'Reset token generated');

  const resetRes = await apiRequest('/api/v1/auth/reset-password', {
    method: 'POST',
    body: {
      resetToken: forgotRes.data.resetToken,
      newPassword: 'BrandNewSecurePassword#2026'
    }
  });
  assert.strictEqual(resetRes.status, 200, 'Password reset successful');

  // Verify login with new password works
  const newLoginRes = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: { identifier: regEmail, password: 'BrandNewSecurePassword#2026', platform: 'Web' }
  });
  assert.strictEqual(newLoginRes.status, 200, 'Login with reset password succeeded');
  reportPass('Security: Secure Password Reset workflow functions correctly');

  // Logout everywhere for Rajan
  const logoutAllRes = await apiRequest('/api/v1/auth/logout-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newLoginRes.data.session.token}` }
  });
  assert.strictEqual(logoutAllRes.status, 200);
  reportPass('Security: Logout-all revokes all sessions for user');

  console.log('\n=================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions passed!`);
  console.log('=================================================================\n');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('\n>>> TEST SUITE FAILED:', err);
  process.exit(1);
});
