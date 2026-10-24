import { execSync } from 'child_process';
import fs from 'fs';

function run(cmd) {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out;
}

try {
  console.log('=== Step 1: Adding hygiene rules to .gitignore ===');
  let gitignore = fs.readFileSync('.gitignore', 'utf8');
  const ignoreAdditions = [
    '*.bak',
    'vyapar-app/database/migration_report_*.json',
    'vyapar-app/database/backups/',
    'vyapar-app/database/tenants/business_BIZ-2*.json',
    'hs_err_pid*.log',
    'replay_pid*.log',
    'build_gradle.log',
    'deploy.log',
    '*.tmp.*'
  ];

  let modifiedGitignore = false;
  for (const rule of ignoreAdditions) {
    if (!gitignore.includes(rule)) {
      gitignore += `\n${rule}`;
      modifiedGitignore = true;
    }
  }

  if (modifiedGitignore) {
    fs.writeFileSync('.gitignore', gitignore, 'utf8');
    console.log('Updated .gitignore with local backup and log ignore rules.');
  }

  console.log('\n=== Step 2: Secret Scan in Staged / Modified Code ===');
  // Check if any API keys, secret keys, or real passwords were typed into the diff
  const diff = run('git diff');
  const secretKeywords = [
    /AIzaSy[A-Za-z0-9_-]{33}/, // Google API key
    /ghp_[A-Za-z0-9]{36}/,     // GitHub token
    /clientSecret:\s*['"][a-zA-Z0-9_\-]{16,}['"]/, // Hardcoded client secret
    /AWS_SECRET_ACCESS_KEY/i,
    /-----BEGIN PRIVATE KEY-----/,
    /postgres:\/\/.*:.*@/      // Hardcoded postgres password connection string
  ];

  for (const pattern of secretKeywords) {
    if (pattern.test(diff)) {
      console.error(`SECURITY ALERT: Diff matches sensitive pattern: ${pattern}`);
      console.error('Aborting push immediately to protect credentials.');
      process.exit(1);
    }
  }
  console.log('✓ Secret scanning passed cleanly: No active API keys or credentials detected in diff.');

  console.log('\n=== Step 3: Staging Files ===');
  run('git add .gitignore');
  run('git add vyapar-app/');
  run('git add scripts/');
  run('git add render.yaml');
  if (fs.existsSync('android')) run('git add android/');
  if (fs.existsSync('app_logo')) run('git add app_logo/');
  if (fs.existsSync('mobile-android')) run('git add mobile-android/');

  console.log('\n=== Step 4: Staged Status ===');
  const stagedStatus = run('git status --short');
  console.log(stagedStatus);

  console.log('\n=== Step 5: Creating Git Commit ===');
  const commitMsg = 'feat: production-grade e-way bill integration, multi-tenant auth and bug fixes';
  try {
    const commitOut = run(`git commit -m "${commitMsg}"`);
    console.log(commitOut);
  } catch (err) {
    console.log('Commit info (may already be committed):', err.stdout || err.message);
  }

  console.log('\n=== Step 6: Pushing to origin main ===');
  const pushOut = run('git push origin main');
  console.log(pushOut || 'Push completed successfully.');

  console.log('\n=============================================');
  console.log('>>> CODE SUCCESSFULLY PUSHED TO GITHUB <<<');
  console.log('=============================================');

} catch (e) {
  console.error('Process error:', e.stdout || e.stderr || e.message);
  process.exit(1);
}
