// ==============================================================================
// Lekha Jokha - SaaS Plan Limits & Multi-Business Quota Unit Tests
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

const SAAS_PLANS = {
  Free: { id: 'Free', maxBusinesses: 1, maxUsers: 1, maxInvoicesMonthly: 50 },
  Pro: { id: 'Pro', maxBusinesses: 2, maxUsers: 5, maxInvoicesMonthly: 999999 },
  Max: { id: 'Max', maxBusinesses: 5, maxUsers: 999999, maxInvoicesMonthly: 999999 }
};

function canCreateBusiness(currentCount, planName) {
  const plan = SAAS_PLANS[planName] || SAAS_PLANS.Free;
  return currentCount < plan.maxBusinesses;
}

test('SaaS Quota: Free plan allows exactly 1 business', () => {
  assert.equal(canCreateBusiness(0, 'Free'), true);
  assert.equal(canCreateBusiness(1, 'Free'), false);
  assert.equal(canCreateBusiness(2, 'Free'), false);
});

test('SaaS Quota: Pro plan allows up to 2 businesses', () => {
  assert.equal(canCreateBusiness(1, 'Pro'), true);
  assert.equal(canCreateBusiness(2, 'Pro'), false);
});

test('SaaS Quota: Enterprise Max allows up to 5 businesses', () => {
  assert.equal(canCreateBusiness(1, 'Max'), true);
  assert.equal(canCreateBusiness(4, 'Max'), true);
  assert.equal(canCreateBusiness(5, 'Max'), false);
});
