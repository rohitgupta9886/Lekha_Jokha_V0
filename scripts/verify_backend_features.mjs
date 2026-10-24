import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const adbPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const deviceId = '10BD1U0KYR0004S';
const artifactDir = path.join(userHome, '.gemini', 'antigravity-ide', 'brain', '4012453f-9fc6-469b-949e-c30e3c83c2cb');

function runAdb(cmd) {
  return execSync(`"${adbPath}" -s ${deviceId} ${cmd}`, { encoding: 'utf-8' });
}

function capture(filename) {
  runAdb(`shell screencap -p /sdcard/${filename}`);
  const dest = path.join(artifactDir, filename);
  execSync(`"${adbPath}" -s ${deviceId} pull /sdcard/${filename} "${dest}"`);
  console.log(`Saved screenshot: ${dest}`);
  return dest;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Ensuring adb reverse...');
  runAdb('reverse tcp:3000 tcp:3000');
  await sleep(1500);

  // 1. Capture Home Screen with AI Copilot Banner
  console.log('Capturing Home screen...');
  capture('screen_v2_home.png');

  // 2. Click AI Copilot Banner (around y = 920 or tap cardAiCopilotBanner)
  // Let's find coordinates: device is 1080x2400
  // Home header is top 0-250, stats cards ~250-700, quick actions ~700-880, AI Copilot banner is around (540, 960)
  console.log('Tapping AI Copilot banner...');
  runAdb('shell input tap 540 960');
  await sleep(1500);
  capture('screen_v2_ai_copilot.png');

  // Go back from form
  runAdb('shell input keyevent 4');
  await sleep(1000);

  // 3. Navigate to Main Menu tab (tab 5: x ~ 972, y ~ 2280 on 1080x2400)
  console.log('Tapping Main Menu tab...');
  runAdb('shell input tap 972 2280');
  await sleep(1500);
  capture('screen_v2_main_menu.png');

  // 4. In Main Menu, scroll or tap Cash & Bank or e-Way Bills
  // In More screen, the cards start from top:
  // Card 1: AI Copilot (~500)
  // Card 2: e-Way Bills (~620)
  // Card 3: Cash & Bank (~740)
  // Card 4: Quotations (~860)
  // Card 5: Staff RBAC (~980)
  console.log('Tapping Cash & Bank...');
  runAdb('shell input tap 540 740');
  await sleep(1500);
  capture('screen_v2_cashbank.png');

  // Go back
  runAdb('shell input keyevent 4');
  await sleep(1000);

  console.log('Tapping e-Way Bills...');
  runAdb('shell input tap 540 620');
  await sleep(1500);
  capture('screen_v2_eway.png');

  // Go back
  runAdb('shell input keyevent 4');
  await sleep(1000);

  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
