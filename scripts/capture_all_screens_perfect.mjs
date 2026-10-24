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
  console.log('Ensuring ADB reverse and fresh start...');
  runAdb('reverse tcp:3000 tcp:3000');
  runAdb('shell am start -n in.lekhajokha.app/.MainActivity');
  await sleep(2500);

  // 1. Home tab (x: 108, y: 2280)
  runAdb('shell input tap 108 2280');
  await sleep(1000);
  // Tap AI Copilot Banner on Home screen (x: 540, y: 190)
  console.log('Opening AI Copilot Screen...');
  runAdb('shell input tap 540 190');
  await sleep(1500);
  capture('screen_ai_copilot_fixed.png');
  // Close via top-left back arrow button (x: 75, y: 145)
  runAdb('shell input tap 75 145');
  await sleep(1000);

  // 2. Switch to Main Menu tab (x: 972, y: 2280)
  console.log('Switching to Main Menu tab...');
  runAdb('shell input tap 972 2280');
  await sleep(1200);

  // Scroll to absolute top
  runAdb('shell input swipe 540 600 540 1900 250');
  await sleep(800);
  runAdb('shell input swipe 540 600 540 1900 250');
  await sleep(800);
  capture('screen_main_menu_fixed.png');

  // Open e-Way Bill (Card 2, y ~ 530)
  console.log('Opening e-Way Bill Screen...');
  runAdb('shell input tap 540 530');
  await sleep(1500);
  capture('screen_eway_fixed.png');
  runAdb('shell input tap 75 145'); // Close
  await sleep(1000);

  // Open Cash & Bank Accounts (Card 3, y ~ 720)
  console.log('Opening Cash & Bank Screen...');
  runAdb('shell input tap 540 720');
  await sleep(1500);
  capture('screen_cashbank_fixed.png');
  runAdb('shell input tap 75 145'); // Close
  await sleep(1000);

  // Open Quotations & Estimates (Card 4, y ~ 910)
  console.log('Opening Quotations & Estimates Screen...');
  runAdb('shell input tap 540 910');
  await sleep(1500);
  capture('screen_estimates_fixed.png');
  runAdb('shell input tap 75 145'); // Close
  await sleep(1000);

  // Open Staff & RBAC (Card 5, y ~ 1100)
  console.log('Opening Staff & RBAC Screen...');
  runAdb('shell input tap 540 1100');
  await sleep(1500);
  capture('screen_staff_rbac_fixed.png');
  runAdb('shell input tap 75 145'); // Close
  await sleep(1000);

  console.log('ALL MODULE SCREENSHOTS RECORDED PERFECTLY!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
