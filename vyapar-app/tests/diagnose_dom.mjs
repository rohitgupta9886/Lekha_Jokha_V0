import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const jsFiles = [
  'js/app.js',
  'js/i18n.js',
  'js/data.js',
  'js/modules/dashboard.js',
  'js/modules/sales.js',
  'js/modules/purchases.js',
  'js/modules/parties.js',
  'js/modules/items.js',
  'js/modules/cashbank.js',
  'js/modules/expenses.js',
  'js/modules/reports.js',
  'js/modules/migration.js',
  'js/modules/settings.js',
  'js/modules/subscription.js',
  'js/modules/users.js',
  'js/modules/ai_copilot.js',
  'js/modules/barcode.js',
  'js/modules/eway.js',
  'js/modules/invoice_print.js'
];

console.log('Scanning JS files for document.getElementById calls...\n');

let totalMissing = 0;

for (const rel of jsFiles) {
  const filePath = path.join(__dirname, '..', rel);
  if (!fs.existsSync(filePath)) {
    console.log(`[FILE MISSING] ${rel}`);
    continue;
  }
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Find getElementById calls
  const matches = [...code.matchAll(/document\.getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)/g)].map(m => m[1]);
  
  const missingInFile = [];
  for (const id of matches) {
    const pattern = new RegExp(`id=["']${id}["']`);
    if (!pattern.test(html) && !code.includes(`id="${id}"`) && !code.includes(`id='${id}'`)) {
      missingInFile.push(id);
    }
  }
  
  if (missingInFile.length > 0) {
    console.log(`File: ${rel}`);
    console.log('   Missing element IDs:', [...new Set(missingInFile)]);
    totalMissing += missingInFile.length;
  }
}

console.log(`\nScan complete. Total missing element IDs: ${totalMissing}`);
