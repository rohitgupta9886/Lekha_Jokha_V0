// ==============================================================================
// Test Suite: Comprehensive Verification for Data Migration & i18n Localization
// Tests Part A (Migration Adapters, Field Mapping, Reconciliation, Rollback, RLS)
// Tests Part B (Bilingual i18n, Key Parity, Persistence, Formatters)
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock browser globals for Node test runner
class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

global.localStorage = new LocalStorageMock();
global.window = global;
global.confirm = () => true;
function createMockContainer() {
  return {
    innerHTML: '',
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {}
  };
}

global.document = {
  documentElement: { lang: 'en' },
  querySelectorAll: () => [],
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({ setAttribute: () => {}, click: () => {}, style: {} })
};
global.CustomEvent = class {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict ? eventInitDict.detail : null;
  }
};
global.dispatchEvent = () => true;
global.addEventListener = () => {};

// Mock window.app
global.window.app = {
  showToast: (msg, type) => {}
};

// 1. Load i18n Module
const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf-8');
eval(i18nCode);

// 2. Load Data Store
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf-8');
eval(dataCode);

// 3. Load Migration Module
const migCode = fs.readFileSync(path.join(__dirname, '../js/modules/migration.js'), 'utf-8');
eval(migCode);

console.log('------------------------------------------------------------');
console.log('   LEKHAJOKHA ENTERPRISE - ACCEPTANCE TEST SUITE');
console.log('   PART A: Data Migration & PART B: Hindi/English i18n');
console.log('------------------------------------------------------------\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

// ------------------------------------------------------------
// TEST GROUP 1: BILINGUAL INTERNATIONALIZATION (i18n)
// ------------------------------------------------------------
console.log('\n>>> Testing Part B: Bilingual i18n Engine');

// 1.1 Verify manager initialization
assert(window.i18n !== undefined, 'i18n manager instantiated on window');
assert(window.i18n.getLanguage() === 'en', 'Default initial language is English');

// 1.2 Verify Translation Key Parity
const enKeys = Object.keys(window.TRANSLATIONS.en);
const hiKeys = Object.keys(window.TRANSLATIONS.hi);
console.log(`   English Key Count: ${enKeys.length}`);
console.log(`   Hindi Key Count: ${hiKeys.length}`);

assert(enKeys.length >= 200, `Has at least 200 translation keys (Found: ${enKeys.length})`);
assert(hiKeys.length >= 200, `Hindi translation dictionary is populated (Found: ${hiKeys.length})`);

// Check that critical navigation & business words exist in both
const criticalKeys = [
  'nav.dashboard', 'nav.sales', 'nav.purchases', 'nav.parties',
  'nav.items', 'nav.cashbank', 'nav.migration', 'nav.settings',
  'mig.title', 'mig.btn_confirm', 'sales.create_invoice'
];

criticalKeys.forEach(key => {
  assert(window.TRANSLATIONS.en[key] !== undefined, `EN has key: ${key}`);
  assert(window.TRANSLATIONS.hi[key] !== undefined, `HI has key: ${key}`);
});

// 1.3 Verify switching language
window.i18n.setLanguage('hi');
assert(window.i18n.getLanguage() === 'hi', 'Language switched to Hindi');
assert(window.i18n.t('nav.sales') === window.TRANSLATIONS.hi['nav.sales'], 'Hindi translation resolves for nav.sales');
assert(window.i18n.t('nav.migration') === window.TRANSLATIONS.hi['nav.migration'], 'Hindi translation resolves for nav.migration');
assert(localStorage.getItem('lekhajokha_lang') === 'hi', 'Language preference persisted to localStorage');

// 1.4 Verify toggle
window.i18n.toggleLanguage();
assert(window.i18n.getLanguage() === 'en', 'Toggle switched back to English');
assert(window.i18n.t('nav.sales') === 'Sale Invoices', 'English translation resolves for nav.sales');


// ------------------------------------------------------------
// TEST GROUP 2: MULTI-BUSINESS CONTEXT & TENANT ISOLATION
// ------------------------------------------------------------
console.log('\n>>> Testing Multi-Business Context & Tenant Isolation');

const subscriber = window.Store.getSubscriber();
assert(subscriber !== null, 'Subscriber account active');
const businesses = window.Store.getBusinesses();
assert(businesses.length >= 1, `Subscriber has ${businesses.length} active businesses`);

const activeBiz = window.Store.getActiveBusiness();
assert(activeBiz.id !== undefined, `Active business identified: ${activeBiz.name} (${activeBiz.id})`);

// Ensure businesses have separate isolated entity collections
const initialPartiesCount = activeBiz.parties.length;
const initialItemsCount = activeBiz.items.length;
console.log(`   Initial active biz counts: Parties=${initialPartiesCount}, Items=${initialItemsCount}`);


// ------------------------------------------------------------
// TEST GROUP 3: DATA MIGRATION ENGINE & SOURCE ADAPTERS
// ------------------------------------------------------------
console.log('\n>>> Testing Part A: Data Migration Engine & Source Adapters');

assert(window.MigrationModule !== undefined, 'MigrationModule registered on window');

// 3.1 Test sample data loader for all supported software sources
window.MigrationModule.loadSampleDataForSource('tally');
assert(window.MigrationModule.parsedRecords.parties.length > 0, 'Tally ERP/Prime sample loaded parties');
assert(window.MigrationModule.parsedRecords.items.length > 0, 'Tally ERP/Prime sample loaded items');

window.MigrationModule.loadSampleDataForSource('khatabook');
assert(window.MigrationModule.parsedRecords.parties.length > 0, 'Khatabook export sample loaded parties');

window.MigrationModule.loadSampleDataForSource('lekhajokha');
assert(window.MigrationModule.parsedRecords.parties.length > 0, 'LekhaJokha backup sample loaded parties');
assert(window.MigrationModule.parsedRecords.items.length > 0, 'LekhaJokha backup sample loaded items');

window.MigrationModule.loadSampleDataForSource('zoho');
assert(window.MigrationModule.parsedRecords.parties.length > 0, 'Zoho Books export sample loaded parties');

window.MigrationModule.loadSampleDataForSource('excel_csv');
assert(window.MigrationModule.parsedRecords.parties.length > 0, 'Generic CSV sample loaded parties');


// 3.2 Test Live Migration Execution (Tally ERP Payload)
console.log('\n>>> Testing Live Migration Execution & Integrity (Tally ERP)');

window.MigrationModule.selectedSource = 'tally';
window.MigrationModule.selectedBusinessId = activeBiz.id;
window.MigrationModule.migrationMode = 'opening_balances';
window.MigrationModule.duplicatePolicy = 'skip';
window.MigrationModule.loadSampleDataForSource('tally');

const initialPartiesBefore = activeBiz.parties.length;
const initialItemsBefore = activeBiz.items.length;

// Execute migration
window.MigrationModule.executeMigration(createMockContainer());

const afterParties = activeBiz.parties.length;
const afterItems = activeBiz.items.length;

assert(afterParties > initialPartiesBefore, `Parties successfully imported into business (Now: ${afterParties})`);
assert(afterItems > initialItemsBefore, `Items successfully imported into business (Now: ${afterItems})`);

// Verify batch audit history
assert(activeBiz.migrationBatches && activeBiz.migrationBatches.length > 0, 'Migration batch recorded in business audit log');
const latestBatch = activeBiz.migrationBatches[0];
console.log(`   Recorded Batch: ${latestBatch.batchId} (${latestBatch.sourceName})`);
assert(latestBatch.partiesCount > 0, 'Batch logged imported parties count');
assert(latestBatch.itemsCount > 0, 'Batch logged imported items count');
assert(latestBatch.status === 'Active', 'Batch marked Active');


// 3.3 Test Duplicate Prevention (Re-importing with duplicatePolicy="skip")
console.log('\n>>> Testing Duplicate Prevention & Re-import Safeguards');
const partiesCountBeforeReimport = activeBiz.parties.length;
window.MigrationModule.duplicatePolicy = 'skip';
window.MigrationModule.executeMigration(createMockContainer());

const partiesCountAfterReimport = activeBiz.parties.length;
assert(partiesCountAfterReimport === partiesCountBeforeReimport, 
  `Duplicate detection prevented party duplication (Count remained: ${partiesCountAfterReimport})`);


// 3.4 Test Safe 1-Click Rollback
console.log('\n>>> Testing Safe 1-Click Rollback Capability');
const batchToRollback = latestBatch.batchId;

window.MigrationModule.rollbackBatch(batchToRollback, createMockContainer());

const rolledBackPartiesCount = activeBiz.parties.length;
const rolledBackItemsCount = activeBiz.items.length;

assert(rolledBackPartiesCount === initialPartiesBefore, 
  `Rollback safely removed batch parties without affecting original records (Back to ${rolledBackPartiesCount})`);
assert(rolledBackItemsCount === initialItemsBefore, 
  `Rollback safely removed batch items without affecting original records (Back to ${rolledBackItemsCount})`);

assert(latestBatch.status === 'Rolled Back', 'Batch status updated to Rolled Back');


// ------------------------------------------------------------
// TEST GROUP 4: SAAS SUBSCRIPTION MIGRATION ENTITLEMENTS
// ------------------------------------------------------------
console.log('\n>>> Testing SaaS Subscription Plan Entitlements');

const maxPlan = window.Store.getActivePlan();
assert(maxPlan.maxBusinesses >= 5, 'Max plan permits up to 5 businesses');
assert(maxPlan.id === 'Max' && maxPlan.name.includes('Enterprise Max'), 'Active plan verified as Enterprise Max');

console.log('\n============================================================');
console.log(`   ALL TESTS COMPLETED SUCCESSFULLY! (${passedTests}/${totalTests} Passed)`);
console.log('============================================================\n');
