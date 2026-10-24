import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

console.log('=== Step 1: Checking Git Status ===');
const status = run('git status -s');
console.log(status || '(Clean working directory)');

console.log('\n=== Step 2: Checking Git Remotes & Branch ===');
const branch = run('git branch --show-current').trim();
const remotes = run('git remote -v');
console.log(`Current branch: ${branch}`);
console.log(`Remotes:\n${remotes}`);

console.log('\n=== Step 3: Scanning for sensitive files ===');
const sensitivePatterns = [
  /\.env($|\.)/i,
  /id_rsa/i,
  /\.pem$/i,
  /secret/i,
  /credentials\.json/i,
  /service_account/i
];

const lines = status.split('\n').filter(Boolean);
const suspiciousFiles = [];
for (const line of lines) {
  const filePath = line.substring(3).trim();
  if (filePath.includes('.env.example')) continue;
  if (filePath.includes('crypto_helper.mjs')) continue; // helper implementation
  for (const pat of sensitivePatterns) {
    if (pat.test(filePath)) {
      suspiciousFiles.push(filePath);
      break;
    }
  }
}

if (suspiciousFiles.length > 0) {
  console.error('WARNING: Found potentially sensitive files in status:');
  suspiciousFiles.forEach(f => console.error('  - ' + f));
  console.error('Aborting git push for security safety.');
  process.exit(1);
} else {
  console.log('✓ No sensitive credential files detected in git status.');
}
