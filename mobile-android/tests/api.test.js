// ==============================================================================
// Lekha Jokha Mobile Frontend - Backend API Integration Tests
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://127.0.0.1:3000';

test('1. Backend Health & Service Liveness', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'UP');
  assert.equal(data.service, 'vyapar-pro-core');
});

test('2. User Authentication Login API', async () => {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '1234', userId: 'U001' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token, 'Token must be returned');
  assert.equal(typeof data.token, 'string');
});

test('3. Multi-Business Listing & Switching API', async () => {
  const listRes = await fetch(`${API_BASE}/api/v1/businesses`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.businesses));
  assert.ok(listData.businesses.length >= 1);

  // Switch business
  const targetId = listData.businesses[0].id;
  const switchRes = await fetch(`${API_BASE}/api/v1/businesses/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId: targetId })
  });
  assert.equal(switchRes.status, 200);
  const switchData = await switchRes.json();
  assert.equal(switchData.success, true);
  assert.equal(switchData.activeBusinessId, targetId);
});

test('4. Dashboard Summary KPI Endpoint', async () => {
  const res = await fetch(`${API_BASE}/api/v1/dashboard/summary`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.totalSales === 'number');
  assert.ok(typeof data.totalPurchases === 'number');
  assert.ok(typeof data.totalReceivable === 'number');
  assert.ok(typeof data.totalPayable === 'number');
  assert.ok(typeof data.stockValuation === 'number');
  assert.ok(Array.isArray(data.recentSales));
});

test('5. Official Indian GSTIN Verification Tool API', async () => {
  // Valid Delhi GSTIN
  const validRes = await fetch(`${API_BASE}/api/v1/gst/verify/07AAAAA0000A1Z5`);
  assert.equal(validRes.status, 200);
  const validData = await validRes.json();
  assert.equal(validData.valid, true);
  assert.equal(validData.stateCode, '07');
  assert.equal(validData.stateName, 'Delhi');

  // Invalid GSTIN format
  const invalidRes = await fetch(`${API_BASE}/api/v1/gst/verify/INVALID123`);
  assert.equal(invalidRes.status, 200);
  const invalidData = await invalidRes.json();
  assert.equal(invalidData.valid, false);
});

test('6. Items Inventory API (Listing & Adding)', async () => {
  const listRes = await fetch(`${API_BASE}/api/v1/items`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.items));

  // Add Item
  const newName = `Mobile Test Item ${Date.now()}`;
  const addRes = await fetch(`${API_BASE}/api/v1/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      category: 'Electronics',
      salePrice: 499,
      purchasePrice: 350,
      gstRate: 18,
      stock: 50,
      unit: 'PCS'
    })
  });
  assert.equal(addRes.status, 201);
  const addData = await addRes.json();
  assert.equal(addData.success, true);
  assert.equal(addData.item.name, newName);
});

test('7. Sales Invoicing API (Listing & Recording)', async () => {
  const listRes = await fetch(`${API_BASE}/api/v1/sales`);
  assert.equal(listRes.status, 200);

  const addRes = await fetch(`${API_BASE}/api/v1/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partyName: 'Mobile App Customer',
      paymentMode: 'Cash',
      items: [{ itemId: 'ITM001', name: 'Basmati Rice', qty: 2, rate: 1000, gstRate: 5, amount: 2100 }],
      subtotal: 2000,
      tax: 100,
      total: 2100,
      paid: 2100,
      balance: 0
    })
  });
  assert.equal(addRes.status, 201);
  const addData = await addRes.json();
  assert.equal(addData.success, true);
  assert.equal(addData.sale.status, 'Paid');
});
