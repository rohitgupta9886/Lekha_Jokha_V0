// ==============================================================================
// Lekha Jokha - Financial & Tax Calculations Unit Tests
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

function calculateInvoice(items, paid = 0, discount = 0) {
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const lineSubtotal = item.qty * item.rate;
    const lineTax = (lineSubtotal * item.gstRate) / 100;
    subtotal += lineSubtotal;
    tax += lineTax;
  }
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100);
  const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
  return { subtotal, tax, total, balance, status };
}

test('GST Calculation: 5% FMCG goods', () => {
  const items = [{ qty: 10, rate: 1000, gstRate: 5 }];
  const res = calculateInvoice(items, 10500);
  assert.equal(res.subtotal, 10000);
  assert.equal(res.tax, 500);
  assert.equal(res.total, 10500);
  assert.equal(res.balance, 0);
  assert.equal(res.status, 'Paid');
});

test('GST Calculation: 18% Electronics with Partial Payment', () => {
  const items = [{ qty: 2, rate: 5000, gstRate: 18 }];
  const res = calculateInvoice(items, 6000);
  assert.equal(res.subtotal, 10000);
  assert.equal(res.tax, 1800);
  assert.equal(res.total, 11800);
  assert.equal(res.balance, 5800);
  assert.equal(res.status, 'Partial');
});

test('Zero-rated / Exempt Goods (0% GST)', () => {
  const items = [{ qty: 5, rate: 200, gstRate: 0 }];
  const res = calculateInvoice(items, 0);
  assert.equal(res.tax, 0);
  assert.equal(res.total, 1000);
  assert.equal(res.balance, 1000);
  assert.equal(res.status, 'Unpaid');
});
