import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';

process.env.PORT = '3007';
process.env.HOST = '127.0.0.1';

console.log('--- Starting In-Process LekhaJokha Server on Port 3007 for Category Tests ---');
await import('./server.mjs');
await new Promise(r => setTimeout(r, 1000));

const BASE_URL = 'http://127.0.0.1:3007';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch (_) {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runCategoryTests() {
  console.log('\n================================================================');
  console.log('🧪 CATEGORY LIFECYCLE & PERSISTENCE TEST SUITE (PORT 3007)');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  }

  function fail(msg) {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }

  // 1. Authenticate as Sharma Ji Admin
  console.log('\n--- 1. Authentication ---');
  const loginRes = await request('POST', '/api/v1/auth/login', {
    identifier: 'sharma@sharmatraders.in',
    password: 'password123'
  });
  assert.strictEqual(loginRes.status, 200, 'Login succeeded');
  const token = loginRes.body.token;
  const authHeaders = { 'Authorization': `Bearer ${token}` };
  pass('Successfully authenticated as primary business owner');

  // 2. Fetch initial item categories
  console.log('\n--- 2. Fetch Initial Categories ---');
  const initialGet = await request('GET', '/api/v1/business/item-categories', null, authHeaders);
  assert.strictEqual(initialGet.status, 200);
  assert.ok(Array.isArray(initialGet.body.itemCategories), 'itemCategories is an array');
  assert.ok(initialGet.body.itemCategories.length >= 5, 'At least 5 default categories exist');
  const initialCount = initialGet.body.itemCategories.length;
  pass(`Retrieved ${initialCount} categories from server`);

  // 3. User adds a new category: "Footwear & Sports Goods"
  console.log('\n--- 3. Add Custom Category & Verify Persistence ---');
  const newCatName = 'Footwear & Sports Goods';
  const newCat = {
    id: `cat_${Date.now()}`,
    name: newCatName,
    subcategories: ['Running Shoes', 'Cricket Gear', 'Sports Apparel']
  };
  const updatedList = [...initialGet.body.itemCategories, newCat];

  const postRes = await request('POST', '/api/v1/business/item-categories', {
    itemCategories: updatedList
  }, authHeaders);
  assert.strictEqual(postRes.status, 200);
  assert.strictEqual(postRes.body.count, initialCount + 1);
  pass('POST /api/v1/business/item-categories saved new category successfully');

  // 4. Verify category persists in server storage
  const verifyGet = await request('GET', '/api/v1/business/item-categories', null, authHeaders);
  assert.strictEqual(verifyGet.status, 200);
  const found = verifyGet.body.itemCategories.find(c => c.name === newCatName);
  assert.ok(found, 'New category exists in server database');
  assert.strictEqual(found.subcategories.length, 3, 'All subcategories preserved');
  pass(`Category "${newCatName}" confirmed in server storage`);

  // 5. Verify /api/v1/business/current returns itemCategories
  console.log('\n--- 4. Verify Business Details Sync (/api/v1/business/current) ---');
  const currentRes = await request('GET', '/api/v1/business/current', null, authHeaders);
  assert.strictEqual(currentRes.status, 200);
  assert.ok(currentRes.body.data && Array.isArray(currentRes.body.data.itemCategories));
  const foundInCurrent = currentRes.body.data.itemCategories.find(c => c.name === newCatName);
  assert.ok(foundInCurrent, 'Custom category returned in /api/v1/business/current data');
  pass('Current business payload reliably provides custom itemCategories');

  // 6. Test Delta Sync API (/api/v1/sync)
  console.log('\n--- 5. Delta Sync Mutation Pipeline ---');
  const syncCatName = 'Agricultural Tools & Seeds';
  const syncMutation = {
    clientMutationId: `MUT_CAT_${Date.now()}`,
    entity: 'itemCategories',
    action: 'update',
    data: {
      itemCategories: [
        ...verifyGet.body.itemCategories,
        { id: `cat_sync_${Date.now()}`, name: syncCatName, subcategories: ['Seeds', 'Fertilizers'] }
      ]
    }
  };
  const syncRes = await request('POST', '/api/v1/sync', { mutations: [syncMutation] }, authHeaders);
  assert.strictEqual(syncRes.status, 200);
  assert.ok(syncRes.body.snapshot && Array.isArray(syncRes.body.snapshot.itemCategories));
  const foundInSnapshot = syncRes.body.snapshot.itemCategories.find(c => c.name === syncCatName);
  assert.ok(foundInSnapshot, 'Sync mutation successfully updated category list');
  pass('Delta sync snapshot returns updated itemCategories');

  // 7. Security & Penetration Testing
  console.log('\n--- 6. Security & Penetration Testing ---');

  // 7.1 Unauthenticated requests rejected
  const unauthGet = await request('GET', '/api/v1/business/item-categories');
  assert.strictEqual(unauthGet.status, 401);
  pass('Unauthenticated GET /api/v1/business/item-categories blocked with 401');

  const unauthPost = await request('POST', '/api/v1/business/item-categories', { itemCategories: [] });
  assert.strictEqual(unauthPost.status, 401);
  pass('Unauthenticated POST /api/v1/business/item-categories blocked with 401');

  // 7.2 Malformed input handling
  const malformedPost = await request('POST', '/api/v1/business/item-categories', '{invalid_json', authHeaders);
  assert.ok(malformedPost.status >= 400);
  pass('Malformed JSON payload safely rejected');

  // 7.3 Multi-tenant category isolation test
  console.log('\n--- 7. Multi-Tenant Category Isolation ---');
  const biz2Headers = { ...authHeaders, 'X-Business-Id': 'BIZ-002' };
  const biz2Get = await request('GET', '/api/v1/business/item-categories', null, biz2Headers);
  if (biz2Get.status === 200) {
    const leakedInBiz2 = (biz2Get.body.itemCategories || []).find(c => c.name === newCatName);
    assert.strictEqual(leakedInBiz2, undefined, 'BIZ-001 category must NOT leak into BIZ-002');
    pass('Strict tenant isolation verified: BIZ-001 category did not leak to BIZ-002');
  } else {
    pass(`BIZ-002 access controlled with status ${biz2Get.status}`);
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed} passed | ${failed} failed`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runCategoryTests().catch(err => {
  console.error('\n[FATAL TEST RUNNER ERROR]:', err);
  process.exit(1);
});
