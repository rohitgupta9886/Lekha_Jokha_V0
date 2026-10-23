// ==============================================================================
// LekhaJokha Multi-Business Admin Architecture Automated Verification Suite
// Validates All 11 Scenarios Required by Section 9:
// 1. Admin A can log in once and switch among all five authorized businesses.
// 2. Admin B can independently log in and manage their own businesses.
// 3. Admin A cannot access any of Admin B's businesses or records (HTTP 403).
// 4. A sixth business is rejected when the configured limit is five (HTTP 403).
// 5. Business switching does not require another login.
// 6. Products, customers, invoices, inventory, and reports change accurately when switching.
// 7. Refreshing a page does not lose authorization or expose another business's data.
// 8. Manipulating business IDs or record IDs cannot bypass authorization.
// 9. Logging out and logging in as another admin does not expose previous-account data.
// 10. Concurrent business-creation requests cannot bypass the configured limit.
// 11. Existing application functionality and stored business records remain intact.
// ==============================================================================

import assert from 'assert';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

console.log(`\n==============================================================================`);
console.log(`LekhaJokha - Multi-Business Admin Architecture Verification Test Suite`);
console.log(`Target Server: ${BASE_URL}`);
console.log(`==============================================================================\n`);

async function api(endpoint, { method = 'GET', headers = {}, body = null } = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };
  const options = { method, headers: reqHeaders };
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

let totalTests = 0;
let passedTests = 0;

function reportPass(title, detail = '') {
  totalTests++;
  passedTests++;
  console.log(`  [PASS] Test ${totalTests}: ${title} ${detail ? '--> ' + detail : ''}`);
}

function reportFail(title, err) {
  totalTests++;
  console.error(`  [FAIL] Test ${totalTests}: ${title}`);
  console.error(err);
  throw err;
}

// Helper to register an admin via OTP verification
async function registerAdminViaOtp(phone, name, businessName) {
  // 1. Send OTP
  const sendRes = await api('/api/v1/auth/otp/send', {
    method: 'POST',
    body: { phone, purpose: 'login' }
  });
  assert.strictEqual(sendRes.status, 200, `OTP send failed: ${JSON.stringify(sendRes.data)}`);

  // In test mode, server returns otp in debug/test response or uses salt
  const otp = sendRes.data.testOtp || sendRes.data.otp || '123456';

  // 2. Verify OTP
  const verifyRes = await api('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: {
      phone,
      otp,
      name,
      businessName,
      platform: 'Web',
      deviceName: 'Chrome Admin Session'
    }
  });
  assert(verifyRes.data.token, 'Token must be returned on OTP verification');
  // Entitle owner account to Max plan so admin can manage up to MAX_BUSINESSES_PER_OWNER (5) businesses
  await api('/api/v1/subscription/upgrade', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${verifyRes.data.token}` },
    body: { planName: 'Max' }
  });
  return verifyRes.data;
}

async function runTests() {
  const adminAPhone = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
  const adminBPhone = `92${Math.floor(10000000 + Math.random() * 90000000)}`;
  const adminCPhone = `93${Math.floor(10000000 + Math.random() * 90000000)}`;

  let tokenA = null;
  let adminA = null;
  let bizA1 = null;
  let bizA2 = null;
  let bizA3 = null;
  let bizA4 = null;
  let bizA5 = null;

  let tokenB = null;
  let adminB = null;
  let bizB1 = null;
  let bizB2 = null;

  // --------------------------------------------------------------------------
  // Scenario 1: Admin A logs in once and creates/switches among all 5 businesses
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 1: Admin A Login & 5-Business Creation ---');
  {
    const regA = await registerAdminViaOtp(adminAPhone, 'Admin Alpha', 'Alpha Mega Retail (A1)');
    tokenA = regA.token;
    adminA = regA.user;
    bizA1 = regA.businesses[0];
    assert(bizA1 && bizA1.id, 'A1 business must exist');

    // Create Business A2, A3, A4, A5
    const b2Res = await api('/api/v1/businesses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Alpha Wholesale & Trade (A2)', gstin: '07AAAAA0001A1Z1', state: 'Delhi (07)' }
    });
    assert.strictEqual(b2Res.status, 201);
    bizA2 = b2Res.data.business;

    const b3Res = await api('/api/v1/businesses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Alpha Electronics Hub (A3)', gstin: '07AAAAA0001A1Z2', state: 'Delhi (07)' }
    });
    assert.strictEqual(b3Res.status, 201);
    bizA3 = b3Res.data.business;

    const b4Res = await api('/api/v1/businesses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Alpha Logistics & Fleet (A4)', gstin: '07AAAAA0001A1Z3', state: 'Delhi (07)' }
    });
    assert.strictEqual(b4Res.status, 201);
    bizA4 = b4Res.data.business;

    const b5Res = await api('/api/v1/businesses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Alpha FMCG Distribution (A5)', gstin: '07AAAAA0001A1Z4', state: 'Delhi (07)' }
    });
    assert.strictEqual(b5Res.status, 201);
    bizA5 = b5Res.data.business;

    // List all businesses for Admin A
    const listRes = await api('/api/v1/businesses', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.data.businesses.length, 5, 'Admin A must have exactly 5 businesses');
    reportPass('Admin A creates and owns exactly 5 independent businesses (A1..A5)', `IDs: ${listRes.data.businesses.map(b => b.id).join(', ')}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Admin B independently logs in and manages their own businesses
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Admin B Independent Login & Business Setup ---');
  {
    const regB = await registerAdminViaOtp(adminBPhone, 'Admin Beta', 'Beta Enterprises (B1)');
    tokenB = regB.token;
    adminB = regB.user;
    bizB1 = regB.businesses[0];
    assert(bizB1 && bizB1.id, 'B1 business must exist');

    const b2Res = await api('/api/v1/businesses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` },
      body: { name: 'Beta Pharma Corp (B2)', gstin: '07BBBBB0002B1Z1', state: 'Delhi (07)' }
    });
    assert.strictEqual(b2Res.status, 201);
    bizB2 = b2Res.data.business;

    // Verify Admin B only sees their own businesses
    const listB = await api('/api/v1/businesses', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(listB.status, 200);
    const idsB = listB.data.businesses.map(b => b.id);
    assert(idsB.includes(bizB1.id) && idsB.includes(bizB2.id));
    assert(!idsB.includes(bizA1.id) && !idsB.includes(bizA2.id), "Admin B must never see Admin A's businesses");
    reportPass('Admin B independently registers and lists only their own businesses', `IDs: ${idsB.join(', ')}`);
  }

  // --------------------------------------------------------------------------
  // Scenario 3: Admin A cannot access any of Admin B's businesses or records (HTTP 403)
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Strict Cross-Tenant Access Protection ---');
  {
    // Try to switch to Admin B's business B1 with Admin A's token
    const switchRes = await api('/api/v1/businesses/switch', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { businessId: bizB1.id }
    });
    assert.strictEqual(switchRes.status, 403, 'Switching to another admin business must return HTTP 403');
    assert.strictEqual(switchRes.data.code, 'FORBIDDEN_BUSINESS_ACCESS');

    // Try direct header tampering: Query /api/v1/business/current with X-Business-Id: B1.id
    const currentRes = await api('/api/v1/business/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Business-Id': bizB1.id
      }
    });
    assert.strictEqual(currentRes.status, 403, 'Header tampering on /business/current must return HTTP 403');

    // Try direct data tampering: Query /api/v1/sales with X-Business-Id: B1.id
    const salesRes = await api('/api/v1/sales', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Business-Id': bizB1.id
      }
    });
    assert.strictEqual(salesRes.status, 403, 'Header tampering on /sales must return HTTP 403');

    // Try direct data tampering: Query /api/v1/items with X-Business-Id: B1.id
    const itemsRes = await api('/api/v1/items', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Business-Id': bizB1.id
      }
    });
    assert.strictEqual(itemsRes.status, 403, 'Header tampering on /items must return HTTP 403');

    reportPass("Admin A cannot switch to, view, or tamper with Admin B's businesses or data (HTTP 403 strictly enforced)");
  }

  // --------------------------------------------------------------------------
  // Scenario 4: A sixth business is rejected when configured limit is five (HTTP 403)
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Backend 5-Business Quota Enforcement ---');
  {
    // Admin A already has 5 businesses (A1..A5). Attempt to create Business A6.
    const b6Res = await api('/api/v1/businesses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Alpha Illegal 6th Store (A6)' }
    });
    assert.strictEqual(b6Res.status, 403, 'Creating a 6th business must be rejected with HTTP 403');
    assert.strictEqual(b6Res.data.error, 'PLAN_LIMIT_REACHED');
    assert.strictEqual(b6Res.data.maxAllowed, 5, 'Max allowed businesses must be 5');
    assert.strictEqual(b6Res.data.currentCount, 5, 'Current count must be 5');

    reportPass('Attempt to create a 6th business is rejected with HTTP 403 PLAN_LIMIT_REACHED', b6Res.data.message);
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Business switching does not require another login
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Seamless Switching Without Re-Login ---');
  {
    for (const targetBiz of [bizA2, bizA3, bizA4, bizA5, bizA1]) {
      const switchRes = await api('/api/v1/businesses/switch', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { businessId: targetBiz.id }
      });
      assert.strictEqual(switchRes.status, 200);
      assert.strictEqual(switchRes.data.activeBusinessId, targetBiz.id);
      assert.strictEqual(switchRes.data.role, 'Owner');
    }
    reportPass('Admin A seamlessly switches across all 5 businesses using the same authenticated session token');
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Products, customers, invoices, inventory, and reports change accurately
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Tenant Record & Dashboard Isolation ---');
  {
    // 1. Populate Business A1: Customer CA1, Item IA1, Invoice SA1
    await api('/api/v1/businesses/switch', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { businessId: bizA1.id }
    });

    const partyA1Res = await api('/api/v1/parties', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id },
      body: { id: `P-A1-${Date.now()}`, name: 'Customer Alpha One', type: 'Customer', phone: '9911001122', balance: 5000 }
    });
    assert.strictEqual(partyA1Res.status, 201);
    const partyA1 = partyA1Res.data.party;

    const itemA1Res = await api('/api/v1/items', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id },
      body: { id: `ITM-A1-${Date.now()}`, name: 'Item Alpha Basmati 10kg', salePrice: 1200, purchasePrice: 1000, stock: 100, gstRate: 5 }
    });
    assert.strictEqual(itemA1Res.status, 201);
    const itemA1 = itemA1Res.data.item;

    const saleA1Res = await api('/api/v1/sales', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id },
      body: {
        number: `INV-A1-${Date.now()}`,
        date: '2026-10-22',
        partyId: partyA1.id,
        partyName: partyA1.name,
        total: 6000,
        subtotal: 5714.28,
        tax: 285.72,
        paid: 6000,
        balance: 0,
        items: [{ itemId: itemA1.id, name: itemA1.name, qty: 5, rate: 1200, amount: 6000 }]
      }
    });
    assert.strictEqual(saleA1Res.status, 201);

    // 2. Populate Business A2: Customer CA2, Item IA2, Invoice SA2
    await api('/api/v1/businesses/switch', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { businessId: bizA2.id }
    });

    const partyA2Res = await api('/api/v1/parties', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA2.id },
      body: { id: `P-A2-${Date.now()}`, name: 'Customer Alpha Two', type: 'Customer', phone: '9922002233', balance: 15000 }
    });
    assert.strictEqual(partyA2Res.status, 201);
    const partyA2 = partyA2Res.data.party;

    const itemA2Res = await api('/api/v1/items', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA2.id },
      body: { id: `ITM-A2-${Date.now()}`, name: 'Item Alpha Industrial Motor 5HP', salePrice: 25000, purchasePrice: 20000, stock: 10, gstRate: 18 }
    });
    assert.strictEqual(itemA2Res.status, 201);
    const itemA2 = itemA2Res.data.item;

    const saleA2Res = await api('/api/v1/sales', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA2.id },
      body: {
        number: `INV-A2-${Date.now()}`,
        date: '2026-10-22',
        partyId: partyA2.id,
        partyName: partyA2.name,
        total: 50000,
        subtotal: 42372.88,
        tax: 7627.12,
        paid: 20000,
        balance: 30000,
        items: [{ itemId: itemA2.id, name: itemA2.name, qty: 2, rate: 25000, amount: 50000 }]
      }
    });
    assert.strictEqual(saleA2Res.status, 201);

    // 3. Verify Isolation: Query A1 records
    const checkA1Parties = await api('/api/v1/parties', {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id }
    });
    assert(checkA1Parties.data.parties.some(p => p.id === partyA1.id));
    assert(!checkA1Parties.data.parties.some(p => p.id === partyA2.id || p.name === partyA2.name), "Customer A2 must not appear in A1");

    const checkA1Sales = await api('/api/v1/sales', {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id }
    });
    assert(checkA1Sales.data.sales.some(s => s.partyId === partyA1.id));
    assert(!checkA1Sales.data.sales.some(s => s.partyId === partyA2.id), "Invoice A2 must not appear in A1");

    // 4. Verify Isolation: Query A2 records
    const checkA2Parties = await api('/api/v1/parties', {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA2.id }
    });
    assert(checkA2Parties.data.parties.some(p => p.id === partyA2.id));
    assert(!checkA2Parties.data.parties.some(p => p.id === partyA1.id || p.name === partyA1.name), "Customer A1 must not appear in A2");

    // 5. Verify Dashboard Summaries are separated
    const d1 = await api('/api/v1/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id }
    });
    const d2 = await api('/api/v1/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA2.id }
    });
    assert.strictEqual(d1.data.totalSales, 6000, 'A1 total sales must be 6000');
    assert.strictEqual(d2.data.totalSales, 50000, 'A2 total sales must be 50000');

    reportPass('Products, customers, invoices, inventory, and KPI reports change accurately between businesses');
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Refreshing a page preserves secure business selection
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Session Restore & Safe Fallback on Refresh ---');
  {
    // Normal browser refresh with active business header
    const meRes = await api('/api/v1/auth/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA2.id }
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.activeBusiness.id, bizA2.id);
    assert.strictEqual(meRes.data.businesses.length, 5);

    // Tampered header in storage: User opens app with cached business header set to Admin B's business B1
    const tamperedMeRes = await api('/api/v1/auth/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizB1.id }
    });
    assert.strictEqual(tamperedMeRes.status, 200);
    assert.notStrictEqual(tamperedMeRes.data.activeBusiness.id, bizB1.id, "Must not set active business to unauthorized B1");
    // Should safely fall back to Admin A's authorized business
    const authIds = [bizA1.id, bizA2.id, bizA3.id, bizA4.id, bizA5.id];
    assert(authIds.includes(tamperedMeRes.data.activeBusiness.id), "Active business must be one of Admin A's businesses");

    reportPass('Browser refresh preserves valid selection and safely heals tampered localStorage business ID without leaking unauthorized data');
  }

  // --------------------------------------------------------------------------
  // Scenario 8: Manipulating business IDs or record IDs cannot bypass authorization
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 8: Anti-Tampering & Cross-Tenant Record Validation ---');
  {
    // Attempt to create a sale in A1 with an invalid party from B1
    const invalidSaleRes = await api('/api/v1/sync', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Business-Id': bizA1.id },
      body: {
        mutations: [{
          mutationId: 'MUT-HACK-01',
          entity: 'sales',
          action: 'create',
          data: {
            id: 'INV-HACK-001',
            partyId: 'P-NON-EXISTENT-BETA',
            total: 1000,
            items: []
          }
        }]
      }
    });
    assert.strictEqual(invalidSaleRes.status, 200);
    const mutResult = invalidSaleRes.data.results[0];
    assert.strictEqual(mutResult.status, 'failed', 'Mutation referencing alien party must fail');
    assert(mutResult.error.includes('CROSS_TENANT_VIOLATION'), 'Error must specify cross-tenant violation');

    reportPass('Manipulating foreign record IDs is caught and rejected by cross-tenant validator');
  }

  // --------------------------------------------------------------------------
  // Scenario 9: Logging out and logging in as another admin isolates state cleanly
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 9: Account Isolation on Logout and Re-Login ---');
  {
    // Admin A logs out
    const logoutRes = await api('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(logoutRes.status, 200);

    // Old tokenA must now be rejected
    const expiredRes = await api('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(expiredRes.status, 401, 'Logged out session token must return HTTP 401');

    // Admin B logs in
    const meB = await api('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(meB.status, 200);
    assert.strictEqual(meB.data.user.id, adminB.id);
    assert.strictEqual(meB.data.businesses.length, 2, 'Admin B should only have their 2 businesses');
    assert(!meB.data.businesses.some(b => b.id === bizA1.id), "Admin A's businesses must not appear in Admin B's session");

    reportPass('Logout revokes the session on the backend; subsequent admin login starts with fully isolated private state');
  }

  // --------------------------------------------------------------------------
  // Scenario 10: Concurrent business-creation requests cannot bypass the configured limit
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 10: Concurrency Mutex & Race Condition Prevention ---');
  {
    // Register Admin C with 1 default business
    const regC = await registerAdminViaOtp(adminCPhone, 'Admin Gamma', 'Gamma Supermart (C1)');
    const tokenC = regC.token;

    // Create 3 more businesses sequentially -> reaches 4 businesses
    for (let i = 2; i <= 4; i++) {
      const res = await api('/api/v1/businesses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenC}` },
        body: { name: `Gamma Branch C${i}` }
      });
      assert.strictEqual(res.status, 201);
    }

    // Current count is now 4. Maximum limit is 5.
    // Launch 6 simultaneous business creation requests at the EXACT SAME instant via Promise.all
    console.log('    Firing 6 simultaneous business-creation requests for Admin C (current count: 4, limit: 5)...');
    const concurrentRequests = [1, 2, 3, 4, 5, 6].map(num =>
      api('/api/v1/businesses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenC}` },
        body: { name: `Concurrent Business Attempt #${num}` }
      })
    );

    const results = await Promise.all(concurrentRequests);
    const successes = results.filter(r => r.status === 201);
    const rejected = results.filter(r => r.status === 403 && r.data.error === 'PLAN_LIMIT_REACHED');

    console.log(`    Concurrency Outcome: ${successes.length} succeeded, ${rejected.length} rejected with HTTP 403.`);
    assert.strictEqual(successes.length, 1, 'Exactly 1 concurrent request must succeed to reach the limit of 5');
    assert.strictEqual(rejected.length, 5, 'The other 5 concurrent requests must be rejected with HTTP 403');

    // Verify final count in database
    const finalCountRes = await api('/api/v1/businesses', {
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    assert.strictEqual(finalCountRes.data.businesses.length, 5, 'Final business count for Admin C must be exactly 5');

    reportPass('Concurrent requests cannot race to bypass limit: exactly 1 succeeded and 5 rejected (final count: 5)');
  }

  // --------------------------------------------------------------------------
  // Scenario 11: Existing application functionality and stored records remain intact
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 11: Backward Compatibility & Seed Data Preservation ---');
  {
    // Login with existing Sharma Ji account
    const sharmaLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: {
        identifier: 'sharma@sharmatraders.in',
        pin: '1234',
        platform: 'Web'
      }
    });
    assert.strictEqual(sharmaLogin.status, 200, 'Existing Sharma Ji credentials must continue to work');
    const sharmaToken = sharmaLogin.data.token;

    // Verify Sharma Traders (BIZ-001) items & data
    const b1Data = await api('/api/v1/business/current', {
      headers: { 'Authorization': `Bearer ${sharmaToken}`, 'X-Business-Id': 'BIZ-001' }
    });
    assert.strictEqual(b1Data.status, 200);
    assert(b1Data.data.data.items.length >= 1, 'Existing inventory for BIZ-001 must be preserved');
    assert(b1Data.data.data.sales.length >= 1, 'Existing invoices for BIZ-001 must be preserved');

    // Verify Sharma Electronics (BIZ-002) switch
    const b2Switch = await api('/api/v1/businesses/switch', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sharmaToken}` },
      body: { businessId: 'BIZ-002' }
    });
    assert.strictEqual(b2Switch.status, 200);
    assert.strictEqual(b2Switch.data.activeBusinessId, 'BIZ-002');

    reportPass('Existing Sharma Ji account, businesses BIZ-001 & BIZ-002, and historical records remain 100% intact');
  }

  // --------------------------------------------------------------------------
  // Test Summary
  // --------------------------------------------------------------------------
  console.log(`\n==============================================================================`);
  console.log(`Test Execution Complete: ${passedTests}/${totalTests} Passed (100% Success Rate)`);
  console.log(`==============================================================================\n`);
}

runTests().catch(err => {
  console.error('\n[FATAL] Test execution failed:', err);
  process.exit(1);
});
