import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup complete DOM mock
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
  hasAttribute(attr) { return false; }
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
global.window.location = { hash: '#dashboard' };
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
global.CustomEvent = class { constructor(t, d) { this.type = t; this.detail = d; } };
global.dispatchEvent = () => true;
global.addEventListener = () => {};
global.fetch = async (url) => {
  return {
    ok: true,
    status: 200,
    json: async () => {
      if (url.includes('/salesmen')) return { salesmen: [] };
      if (url.includes('/accountant-access')) return { accounts: [] };
      if (url.includes('/business-profile')) return { profile: {} };
      return { success: true };
    },
    blob: async () => ({ size: 0 })
  };
};

// Load scripts in exact order of index.html
const scripts = [
  'js/i18n.js',
  'js/storage/indexed_db.js',
  'js/utils/pagination.js',
  'js/data.js',
  'js/modules/invoice_print.js',
  'js/modules/barcode.js',
  'js/modules/eway.js',
  'js/modules/users.js',
  'js/utils/gemini_service.js',
  'js/utils/voice_transcription.js',
  'js/modules/ai_copilot.js',
  'js/modules/dashboard.js',
  'js/modules/sales.js',
  'js/modules/pos.js',
  'js/modules/purchases.js',
  'js/modules/parties.js',
  'js/modules/items.js',
  'js/modules/cashbank.js',
  'js/modules/expenses.js',
  'js/modules/reports.js',
  'js/modules/migration.js',
  'js/modules/settings.js',
  'js/modules/subscription.js',
  'js/modules/utilities.js',
  'js/modules/orders.js',
  'js/modules/salesmen_management.js',
  'js/app.js',
  'js/mobile/mobile_ui.js'
];

console.log('Loading all scripts in index.html order...');
for (const s of scripts) {
  const code = fs.readFileSync(path.join(__dirname, '..', s), 'utf8');
  try {
    eval(code);
    console.log(`  ✓ Loaded ${s}`);
  } catch (err) {
    console.error(`  ✗ Error in ${s}:`, err);
    process.exit(1);
  }
}

console.log('\nTesting module renders...');
const modules = [
  ['DashboardModule', window.DashboardModule],
  ['SalesModule', window.SalesModule],
  ['POSModule', window.POSModule],
  ['PurchasesModule', window.PurchasesModule],
  ['PartiesModule', window.PartiesModule],
  ['ItemsModule', window.ItemsModule],
  ['CashBankModule', window.CashBankModule],
  ['ExpensesModule', window.ExpensesModule],
  ['ReportsModule', window.ReportsModule],
  ['MigrationModule', window.MigrationModule],
  ['SettingsModule', window.SettingsModule],
  ['SubscriptionModule', window.SubscriptionModule],
  ['UsersModule', window.UsersModule],
  ['EwayModule', window.EwayModule],
  ['AICopilotModule', window.AICopilotModule],
  ['UtilitiesModule', window.UtilitiesModule],
  ['OrdersModule', window.OrdersModule],
  ['SalesmenModule', window.SalesmenModule]
];

for (const [name, mod] of modules) {
  if (!mod || typeof mod.render !== 'function') {
    console.error(`  ✗ ${name} missing or no render()!`);
    continue;
  }
  try {
    const c = new MockElement('div');
    mod.render(c);
    console.log(`  ✓ ${name}.render() executed cleanly`);
  } catch (e) {
    console.error(`  ✗ ${name}.render() crashed:`, e);
  }
}

console.log('\nTesting LekhaJokhaApp instantiation and handleRoute for all hashes...');
const app = new window.LekhaJokhaApp();
const views = [
  'dashboard', 'sales', 'pos', 'purchases', 'parties', 'items',
  'cashbank', 'expenses', 'eway', 'ai-copilot', 'users',
  'reports', 'migration', 'settings', 'subscription',
  'utilities', 'util-track-salesmen', 'util-import-items',
  'util-setup-business', 'util-accountant-access', 'util-barcode-generator',
  'util-bulk-update', 'util-import-tally', 'util-import-parties',
  'util-export-tally', 'util-export-items', 'orders', 'track-salesmen', 'salesmen'
];

for (const v of views) {
  try {
    window.location = { hash: '#' + v };
    app.handleRoute();
    console.log(`  ✓ handleRoute('${v}') executed cleanly`);
  } catch (e) {
    console.error(`  ✗ handleRoute('${v}') crashed:`, e);
  }
}

console.log('\nAll module render and routing tests completed!');
process.exit(0);
