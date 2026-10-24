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
  console.log('Ensuring ADB reverse...');
  runAdb('reverse tcp:3000 tcp:3000');

  // Go to Main Menu tab (x: 972, y: 2280)
  runAdb('shell input tap 972 2280');
  await sleep(1000);

  // Scroll to absolute top of Main Menu
  runAdb('shell input swipe 540 600 540 1900 250');
  await sleep(600);
  runAdb('shell input swipe 540 600 540 1900 250');
  await sleep(600);

  // 1. Open AI Business Copilot (Card 1: center 540, 560)
  console.log('Tapping AI Copilot Card...');
  runAdb('shell input tap 540 560');
  await sleep(1500);
  capture('screen_module_ai_copilot.png');
  runAdb('shell input tap 80 170'); // Close
  await sleep(1000);

  // 2. Open GST e-Way Bill Management (Card 2: center 540, 820)
  console.log('Tapping e-Way Bill Card...');
  runAdb('shell input tap 540 820');
  await sleep(1500);
  capture('screen_module_eway.png');
  runAdb('shell input tap 80 170'); // Close
  await sleep(1000);

  // 3. Open Cash & Bank Accounts (Card 3: center 540, 1080)
  console.log('Tapping Cash & Bank Card...');
  runAdb('shell input tap 540 1080');
  await sleep(1500);
  capture('screen_module_cashbank.png');
  runAdb('shell input tap 80 170'); // Close
  await sleep(1000);

  // 4. Open Quotations & Estimates (Card 4: center 540, 1340)
  console.log('Tapping Estimates Card...');
  runAdb('shell input tap 540 1340');
  await sleep(1500);
  capture('screen_module_estimates.png');
  runAdb('shell input tap 80 170'); // Close
  await sleep(1000);

  // 5. Open Staff & RBAC (Card 5: center 540, 1600)
  console.log('Tapping Staff & RBAC Card...');
  runAdb('shell input tap 540 1600');
  await sleep(1500);
  capture('screen_module_staff_rbac.png');
  runAdb('shell input tap 80 170'); // Close
  await sleep(1000);

  console.log('ALL 5 MODULE SCREENS CAPTURED!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
