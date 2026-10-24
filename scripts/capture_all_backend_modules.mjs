import { execSync } from 'child_process';
import path from 'path';

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
  console.log(`Captured: ${filename}`);
  return dest;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Ensuring reverse...');
  runAdb('reverse tcp:3000 tcp:3000');

  // Go to Main Menu tab (x: 972, y: 2280)
  console.log('Switching to Main Menu...');
  runAdb('shell input tap 972 2280');
  await sleep(1000);

  // Scroll to top of Main Menu
  runAdb('shell input swipe 540 500 540 1800 300');
  await sleep(1000);
  capture('main_menu_top.png');

  // Module 1: AI Copilot is the first card at y ~ 350
  console.log('Opening AI Copilot...');
  runAdb('shell input tap 540 350');
  await sleep(1500);
  capture('screen_ai_copilot_live.png');
  runAdb('shell input keyevent 4'); // Back
  await sleep(1000);

  // Module 2: e-Way Bills is the second card at y ~ 530
  console.log('Opening e-Way Bills...');
  runAdb('shell input tap 540 530');
  await sleep(1500);
  capture('screen_eway_live.png');
  runAdb('shell input keyevent 4'); // Back
  await sleep(1000);

  // Module 3: Cash & Bank Accounts is card at y ~ 710
  console.log('Opening Cash & Bank Accounts...');
  runAdb('shell input tap 540 710');
  await sleep(1500);
  capture('screen_cashbank_live.png');
  runAdb('shell input keyevent 4'); // Back
  await sleep(1000);

  // Module 4: Quotations & Estimates is card at y ~ 890
  console.log('Opening Quotations & Estimates...');
  runAdb('shell input tap 540 890');
  await sleep(1500);
  capture('screen_estimates_live.png');
  runAdb('shell input keyevent 4'); // Back
  await sleep(1000);

  // Scroll down to see remaining modules: Server Telemetry, Cloud Sync, Quotas
  runAdb('shell input swipe 540 1600 540 400 300');
  await sleep(1000);
  capture('main_menu_bottom.png');

  console.log('ALL SCREENSHOTS CAPTURED!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
