import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup minimal DOM mock
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.innerText = '';
    this.value = '';
    this.style = {};
    this.classList = {
      add: () => {},
      remove: () => {},
      contains: () => false,
      toggle: () => {}
    };
    this.children = [];
  }
  getAttribute(attr) { return null; }
  setAttribute(attr, val) { this[attr] = val; }
  removeAttribute(attr) { delete this[attr]; }
  addEventListener(event, fn) {}
  removeEventListener(event, fn) {}
  querySelector(sel) { return new MockElement(); }
  querySelectorAll(sel) { return [new MockElement()]; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) {}
  remove() {}
  click() {}
  dispatchEvent() { return true; }
}

global.window = global;
global.window.location = { hash: '#orders' };
global.document = {
  documentElement: { lang: 'en' },
  body: new MockElement('body'),
  createElement: (tag) => new MockElement(tag),
  getElementById: (id) => new MockElement('div'),
  querySelector: (sel) => new MockElement('div'),
  querySelectorAll: (sel) => [new MockElement('div')],
  addEventListener: () => {}
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

let dispatchedEvents = [];
global.CustomEvent = class {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
  }
};
global.dispatchEvent = (evt) => {
  dispatchedEvents.push(evt);
  return true;
};
global.addEventListener = () => {};

// Load i18n, indexed_db, pagination, data.js
const scriptsToLoad = [
  'js/i18n.js',
  'js/storage/indexed_db.js',
  'js/utils/pagination.js',
  'js/data.js',
  'js/modules/orders.js',
  'js/modules/salesmen_management.js',
  'js/modules/salesman_app.js'
];

for (const s of scriptsToLoad) {
  const code = fs.readFileSync(path.join(__dirname, '..', s), 'utf8');
  eval(code);
}

console.log('=== STARTING TEST SUITE: ORDERS & TRACK YOUR SALESMEN ===\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Orders Data Store & Multi-Source Orders
// -----------------------------------------------------------------------------
console.log('[TEST 1] Multi-Source Order Management in Business Owner App:');
const store = window.Store;
const initialOrders = store.getOrders();
assert(Array.isArray(initialOrders) && initialOrders.length >= 4, 'Orders seeded in store with multiple sources');

const sources = initialOrders.map(o => o.source);
assert(sources.includes('Direct Counter'), 'Direct Counter source orders exist');
assert(sources.includes('Salesman App'), 'Salesman App source orders exist');
assert(sources.includes('WhatsApp / Phone'), 'WhatsApp / Phone catalog orders exist');

// -----------------------------------------------------------------------------
// TEST 2: Real-time Order Creation from Salesman App
// -----------------------------------------------------------------------------
console.log('\n[TEST 2] Immediate Reflection of Salesman Orders in Business Owner App:');
dispatchedEvents = [];
const newFieldOrder = store.addOrder({
  source: 'Salesman App',
  salesmanId: 'SALES-001',
  salesmanName: 'Ramesh Kumar',
  partyId: 'P001',
  partyName: 'Gupta General Store',
  phone: '9810123456',
  items: [
    { itemId: 'ITM001', name: 'Basmati Rice Royal Premium (10 Kg)', qty: 5, rate: 1150, gstRate: 5, amount: 6037.5 }
  ],
  subtotal: 5750,
  tax: 287.5,
  total: 6037.5,
  paymentStatus: 'Pending',
  notes: 'Field order booked on route visit'
});

assert(newFieldOrder.id && newFieldOrder.number.startsWith('ORD-'), 'New order assigned unique ORD number');
assert(newFieldOrder.paymentStatus === 'Pending', 'New order initially marked as Payment Pending');
assert(dispatchedEvents.some(e => e.type === 'ordersUpdated'), 'Dispatched ordersUpdated event for real-time UI reflection');

// Verify order is now in owner's store list
const found = store.getOrder(newFieldOrder.id);
assert(found && found.total === 6037.5, 'Owner store immediately retrieved the salesman order');

// -----------------------------------------------------------------------------
// TEST 3: Pre-Billing Payment Prompt & 1-Click Bill Generation (PAID via UPI)
// -----------------------------------------------------------------------------
console.log('\n[TEST 3] Bill Generation with Payment Confirmed (Paid via UPI):');
const initialItemStock = store.getItem('ITM001').stock;
const initialBankBalance = store.getActiveBusiness().cashBank.bankAccounts[0].balance;

const billResultPaid = store.convertOrderToInvoice(newFieldOrder.id, {
  isPaid: true,
  paymentMode: 'UPI / QR',
  reference: 'UPI-TXN-998811',
  paidAmount: 6037.5
});

assert(billResultPaid.order.orderStatus === 'Billed', 'Order status updated to Billed');
assert(billResultPaid.order.paymentStatus === 'Paid', 'Order payment status set to Paid');
assert(billResultPaid.order.paymentMention.includes('PAID (via UPI / QR - Ref: UPI-TXN-998811)'), 'Bill explicitly mentions medium of payment (Paid via UPI)');
assert(billResultPaid.invoice.status === 'Paid', 'Tax invoice marked as Paid');
assert(billResultPaid.invoice.paid === 6037.5, 'Invoice records full paid amount');

// Check inventory stock deduction
const updatedItemStock = store.getItem('ITM001').stock;
assert(updatedItemStock === initialItemStock - 5, `Inventory stock deducted by 5 qty (${initialItemStock} -> ${updatedItemStock})`);

// -----------------------------------------------------------------------------
// TEST 4: Pre-Billing Payment Prompt & Bill Generation (PAYMENT PENDING)
// -----------------------------------------------------------------------------
console.log('\n[TEST 4] Bill Generation with Payment NOT Done (Payment Pending):');
const unpaidOrder = store.addOrder({
  source: 'Salesman App',
  salesmanId: 'SALES-002',
  salesmanName: 'Suresh Raina',
  partyId: 'P002',
  partyName: 'Metro Retail Mart',
  items: [
    { itemId: 'ITM002', name: 'Fortune Refined Mustard Oil (1 Ltr)', qty: 10, rate: 145, gstRate: 5, amount: 1522.5 }
  ],
  subtotal: 1450,
  tax: 72.5,
  total: 1522.5,
  paymentStatus: 'Pending'
});

const initialCustomerBalance = store.getParty('P002').balance;
const billResultPending = store.convertOrderToInvoice(unpaidOrder.id, {
  isPaid: false
});

assert(billResultPending.order.paymentStatus === 'Pending', 'Order payment status remains Pending');
assert(billResultPending.order.paymentMention === 'Payment Pending', 'Bill explicitly mentions "Payment Pending"');
assert(billResultPending.invoice.status === 'Payment Pending', 'Invoice status explicitly shows Payment Pending');
assert(billResultPending.invoice.balance === 1522.5, 'Invoice balance due equals total bill value');

const updatedCustomerBalance = store.getParty('P002').balance;
assert(updatedCustomerBalance === initialCustomerBalance + 1522.5, `Customer ledger balance increased for pending bill (${initialCustomerBalance} -> ${updatedCustomerBalance})`);

// -----------------------------------------------------------------------------
// TEST 5: Change Payment Status from Pending to Paid with Medium & Nearby Amount
// -----------------------------------------------------------------------------
console.log('\n[TEST 5] Updating Payment Status from Pending to Paid Later:');
const markPaidResult = store.markOrderPaymentPaid(unpaidOrder.id, {
  paymentMode: 'Net Banking / NEFT',
  reference: 'NEFT-440011',
  paidAmount: 1522.5
});

assert(markPaidResult.order.paymentStatus === 'Paid', 'Order payment status transitioned from Pending to Paid');
assert(markPaidResult.order.paidAmount === 1522.5, 'Paid amount recorded prominently on order');
assert(markPaidResult.order.balanceDue === 0, 'Balance due cleared to 0');
assert(markPaidResult.order.paymentMention.includes('PAID (via Net Banking / NEFT'), 'Payment mention updated with mode and reference');

// Verify linked invoice also updated
const linkedInvoice = store.getSale(unpaidOrder.invoiceId);
assert(linkedInvoice.status === 'Paid', 'Linked Tax Invoice status updated to Paid');
assert(linkedInvoice.paid === 1522.5, 'Linked Tax Invoice paid amount updated');

// Verify customer ledger balance adjusted
const settledCustomerBalance = store.getParty('P002').balance;
assert(settledCustomerBalance === initialCustomerBalance, `Customer ledger balance settled back to original balance (${initialCustomerBalance})`);

// -----------------------------------------------------------------------------
// TEST 5B: Mark as Paid & Move to Sale on Unbilled Order Immediately Moves to Sale
// -----------------------------------------------------------------------------
console.log('\n[TEST 5B] Mark as Paid & Move to Sale on Unbilled Order:');
const directOrder = store.addOrder({
  source: 'Direct Counter',
  partyId: 'P001',
  partyName: 'Sharma General Store',
  items: [{ itemId: 'ITM001', name: 'Basmati Rice', qty: 2, rate: 100, taxRate: 5, amount: 210 }],
  subtotal: 200,
  tax: 10,
  total: 210
});
assert(directOrder.orderStatus !== 'Billed', 'Direct order is initially unbilled');
const moveRes = store.markOrderPaymentPaid(directOrder.id, {
  paymentMode: 'UPI / QR',
  reference: 'UPI-MOVE-TO-SALE',
  paidAmount: 210
});
assert(moveRes.order.orderStatus === 'Billed', 'Order status moved immediately to Billed upon payment');
assert(moveRes.order.paymentStatus === 'Paid', 'Order payment status updated to Paid');
assert(moveRes.invoice && moveRes.invoice.id, 'Formal Sale invoice generated immediately');
assert(moveRes.invoice.status === 'Paid', 'Sale invoice status is Paid');
assert(store.getSale(moveRes.invoice.id), 'Sale invoice exists in Store.sales list');
console.log('  ✓ PASS: Order immediately converted to formal Sale invoice in sales list upon payment');

// -----------------------------------------------------------------------------
// TEST 6: Track Your Salesmen Tab - Directory & Owner CRUD Rights
// -----------------------------------------------------------------------------
console.log('\n[TEST 6] Track Your Salesmen - Directory & Full Owner CRUD:');
const salesmen = store.getSalesmen();
assert(Array.isArray(salesmen) && salesmen.length >= 4, 'Salesmen directory populated with team');

// CRUD: Add Salesman
const newStaff = store.addSalesman({
  name: 'Vikram Malhotra',
  phone: '9845012345',
  employeeId: 'EMP-005',
  role: 'Senior Field Sales Officer',
  territory: 'South Delhi / Saket',
  targetMonthly: 500000,
  commissionRate: 3.5
});
assert(newStaff.id.startsWith('SALES-'), 'New salesman created with unique SALES ID');
assert(newStaff.inviteToken && newStaff.whatsAppInviteUrl, 'Generated WhatsApp invite link and token');

// CRUD: Read Salesman
const readStaff = store.getSalesman(newStaff.id);
assert(readStaff.name === 'Vikram Malhotra', 'Read salesman details correctly');

// CRUD: Update Salesman
const updatedStaff = store.updateSalesman(newStaff.id, {
  territory: 'South Delhi & Gurugram DLF',
  role: 'Territory Sales Manager'
});
assert(updatedStaff.territory === 'South Delhi & Gurugram DLF', 'Salesman territory updated');
assert(updatedStaff.role === 'Territory Sales Manager', 'Salesman role updated');

// CRUD: Delete / Revoke Salesman
const deleteResult = store.deleteSalesman(newStaff.id);
assert(deleteResult === true, 'Salesman revoked/deleted by Business Owner');
const revokedStaff = store.getSalesman(newStaff.id);
assert(!revokedStaff || revokedStaff.status === 'Revoked', 'Salesman removed or marked Revoked');

// -----------------------------------------------------------------------------
// TEST 7: 360° Comprehensive Salesman Dossier & Telemetry Data Structure
// -----------------------------------------------------------------------------
console.log('\n[TEST 7] 360° Salesman Activity, GPS Telemetry & Performance Dossier:');
const ramesh = store.getSalesman('SALES-001');
assert(ramesh !== null, 'Ramesh Kumar salesman profile exists');

// Verify Sales Performance (Daily, Monthly, Annual)
assert(ramesh.stats && typeof ramesh.stats.dailySales === 'number', 'Daily sales volume tracked');
assert(typeof ramesh.stats.monthlySales === 'number', 'Monthly sales volume tracked');
assert(typeof ramesh.stats.annualSales === 'number', 'Annual sales volume tracked');
assert(typeof ramesh.stats.traveledDistanceKm === 'number', 'Total traveled distance in km tracked');

// Verify Punch In / Punch Out with GPS Coordinates & Street Addresses
assert(ramesh.punchInLocation && ramesh.punchInLocation.lat && ramesh.punchInLocation.lng, 'Punch-in GPS coordinates (Lat/Lng) captured');
assert(typeof ramesh.punchInLocation.address === 'string' && ramesh.punchInLocation.address.length > 5, 'Punch-in street address reverse-geocoded');
assert(ramesh.punchInLocation.time, 'Punch-in exact timestamp recorded');

// Verify Working Durations
assert(ramesh.stats.totalWorkingDuration, 'Total working duration tracked (e.g. 6 hrs 32 mins)');
assert(ramesh.stats.activeWorkingDuration, 'Active working duration tracked');
assert(ramesh.stats.breakDuration, 'Break duration tracked');

// Verify Telemetry Metadata
assert(ramesh.stats.firstActivity, 'First activity timestamp logged');
assert(ramesh.stats.lastActivity, 'Last activity timestamp logged');
assert(ramesh.attendanceStatus === 'Punched In', 'Attendance status tracked');
assert(ramesh.stats.syncStatus, 'Sync / offline telemetry recorded');
assert(ramesh.stats.missedPunches, 'Missed punch events tracked');

// Verify Today's Customer Visits Audit Log
assert(Array.isArray(ramesh.todayVisits) && ramesh.todayVisits.length > 0, 'Customer visits log with timestamps & notes present');
assert(ramesh.todayVisits[0].partyName && ramesh.todayVisits[0].purpose, 'Customer visit purpose and party name verified');

// -----------------------------------------------------------------------------
// TEST 8: UI Render Smoke Test (OrdersModule & SalesmenModule)
// -----------------------------------------------------------------------------
console.log('\n[TEST 8] UI Modules Render Cleanly:');
const ordersContainer = new MockElement('div');
window.OrdersModule.render(ordersContainer);
assert(ordersContainer.innerHTML.includes('Order Management Center'), 'OrdersModule renders Order Management Center');
assert(ordersContainer.innerHTML.includes('OMNI-CHANNEL ORDERS'), 'OrdersModule renders Omni-Channel banner');
assert(ordersContainer.innerHTML.includes('Generate Bill'), 'OrdersModule contains Generate Bill actions');

const salesmenContainer = new MockElement('div');
window.SalesmenModule.render(salesmenContainer);
assert(salesmenContainer.innerHTML.includes('Track Your Salesmen'), 'SalesmenModule renders Track Your Salesmen header');
assert(salesmenContainer.innerHTML.includes('FIELD FORCE COMMAND CENTER'), 'SalesmenModule renders Field Force Command Center');
assert(salesmenContainer.innerHTML.includes('Add New Salesman'), 'SalesmenModule renders Add Salesman button');
assert(salesmenContainer.innerHTML.includes('Live Fleet GPS Radar'), 'SalesmenModule renders GPS Radar subtab');

console.log('\n=== ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
