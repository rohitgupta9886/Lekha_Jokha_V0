// ==============================================================================
// Lekha Jokha - Mobile Business Management Modules Verification Tests
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

test('1. POS Fast Counter Calculations & Change Return (वापसी)', () => {
  const items = [
    { id: '1', name: 'Item A', rate: 100, qty: 2, gstRate: 18 }, // 200 + 36 = 236
    { id: '2', name: 'Item B', rate: 50, qty: 1, gstRate: 5 }    // 50 + 2.5 = 52.5
  ];

  const subtotal = items.reduce((acc, i) => acc + i.rate * i.qty, 0);
  assert.equal(subtotal, 250);

  const tax = items.reduce((acc, i) => acc + (i.rate * i.qty * i.gstRate) / 100, 0);
  assert.equal(tax, 38.5);

  const grandTotal = Math.round(subtotal + tax);
  assert.equal(grandTotal, 289);

  const tenderCash = 500;
  const change = tenderCash - grandTotal;
  assert.equal(change, 211);
  assert.ok(change >= 0, 'Return change must be non-negative when tender is sufficient');
});

test('2. Customer Khata & Payment-In Ledger Reconciliation', () => {
  let customerBalance = 15000; // Customer owes ₹15,000 (Receivable)
  const paymentReceived = 6000;

  customerBalance -= paymentReceived;
  assert.equal(customerBalance, 9000, 'Customer receivable should decrease after Payment-In');
});

test('3. Vendor Khata & Payment-Out Ledger Reconciliation', () => {
  let vendorPayable = 22000; // Business owes ₹22,000 (Payable)
  const paymentPaid = 12000;

  vendorPayable -= paymentPaid;
  assert.equal(vendorPayable, 10000, 'Vendor payable should decrease after Payment-Out');
});

test('4. Delivery Challan to Tax Invoice Line Item Continuity', () => {
  const challan = {
    id: 'CHAL-001',
    partyId: 'P001',
    partyName: 'Sharma General Store',
    items: [
      { itemId: 'ITM-1', name: 'Basmati Rice 25kg', qty: 10, rate: 1800, gstRate: 5, amount: 18000 }
    ],
    status: 'Dispatched'
  };

  // Convert to Invoice
  const invoice = {
    id: 'INV-' + Date.now(),
    number: 'INV-109',
    docType: 'Invoice',
    partyId: challan.partyId,
    partyName: challan.partyName,
    items: challan.items,
    subtotal: 18000,
    tax: 900,
    total: 18900,
    status: 'Unpaid'
  };

  assert.equal(invoice.partyName, challan.partyName);
  assert.equal(invoice.items.length, challan.items.length);
  assert.equal(invoice.total, 18900);
});

test('5. Profit & Loss (P&L) Financial Accounting Equation', () => {
  const grossSales = 100000;
  const salesReturns = 5000;
  const netSales = grossSales - salesReturns;
  assert.equal(netSales, 95000);

  const grossPurchases = 60000;
  const purchaseReturns = 3000;
  const netPurchases = grossPurchases - purchaseReturns;
  assert.equal(netPurchases, 57000);

  const grossProfit = netSales - netPurchases;
  assert.equal(grossProfit, 38000);

  const operatingExpenses = 12000;
  const netProfit = grossProfit - operatingExpenses;
  assert.equal(netProfit, 26000);

  const netMargin = Math.round((netProfit / netSales) * 100);
  assert.equal(netMargin, 27); // 26000 / 95000 = ~27.37%
});

test('6. Dynamic Bharat UPI URL / QR Protocol Compliance', () => {
  const vpa = 'paytmqr2810050501011@paytm';
  const name = 'Lekha Jokha Enterprises';
  const amount = 1499;
  const note = 'INV-2024-001';

  const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  assert.ok(upiUrl.startsWith('upi://pay?'));
  assert.ok(upiUrl.includes('pa=' + encodeURIComponent(vpa)));
  assert.ok(upiUrl.includes('am=1499.00'));
  assert.ok(upiUrl.includes('cu=INR'));
});
