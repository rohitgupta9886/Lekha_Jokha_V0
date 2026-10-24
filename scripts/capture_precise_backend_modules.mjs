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
  console.log('Ensuring app is in foreground and reverse active...');
  runAdb('reverse tcp:3000 tcp:3000');
  runAdb('shell am start -n in.lekhajokha.app/.MainActivity');
  await sleep(2000);

  // Switch to Home tab (x: 108, y: 2280)
  runAdb('shell input tap 108 2280');
  await sleep(1200);
  capture('screen_verified_home.png');

  // On Home screen, scroll down to see AI Copilot Banner and quick actions
  runAdb('shell input swipe 540 1800 540 800 300');
  await sleep(1000);
  capture('screen_verified_home_scrolled.png');

  // Tap AI Copilot Banner (visible around y ~ 1000 after scroll, or tap from top)
  // Let's scroll back to top of Home
  runAdb('shell input swipe 540 500 540 1900 300');
  await sleep(800);
  // Tap cardAiCopilotBanner (y ~ 950 on 1080x2400)
  console.log('Opening AI Copilot banner from Home...');
  runAdb('shell input tap 540 950');
  await sleep(1500);
  capture('screen_verified_ai_copilot.png');

  // Close form by tapping top close button (x: 75, y: 145) or Cancel (x: 190, y: 2230)
  runAdb('shell input tap 190 2230');
  await sleep(1000);

  // Switch to Main Menu tab (x: 972, y: 2280)
  runAdb('shell input tap 972 2280');
  await sleep(1000);

  // Scroll to absolute top of Main Menu
  runAdb('shell input swipe 540 500 540 1900 300');
  await sleep(800);
  runAdb('shell input swipe 540 500 540 1900 300');
  await sleep(800);
  capture('screen_verified_main_menu.png');

  // Feature 2: e-Way Bill is second card (approx y ~ 530)
  console.log('Opening e-Way Bill from Main Menu...');
  runAdb('shell input tap 540 530');
  await sleep(1500);
  capture('screen_verified_eway.png');
  runAdb('shell input tap 190 2230'); // Tap CANCEL
  await sleep(1000);

  // Feature 3: Cash & Bank Accounts is third card (approx y ~ 720)
  console.log('Opening Cash & Bank Accounts from Main Menu...');
  runAdb('shell input tap 540 720');
  await sleep(1500);
  capture('screen_verified_cashbank.png');
  runAdb('shell input tap 190 2230'); // Tap CANCEL
  await sleep(1000);

  // Feature 4: Quotations & Estimates is fourth card (approx y ~ 910)
  console.log('Opening Quotations & Estimates from Main Menu...');
  runAdb('shell input tap 540 910');
  await sleep(1500);
  capture('screen_verified_estimates.png');
  runAdb('shell input tap 190 2230'); // Tap CANCEL
  await sleep(1000);

  console.log('SUCCESS: All screens captured cleanly!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
