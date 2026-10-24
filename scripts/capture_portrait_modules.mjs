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
  console.log('Ensuring reverse and bringing app to front...');
  runAdb('reverse tcp:3000 tcp:3000');
  runAdb('shell am start -n in.lekhajokha.app/.MainActivity');
  await sleep(2000);

  // 1. Home
  runAdb('shell input tap 108 2280');
  await sleep(1000);
  capture('screen_portrait_home.png');

  // AI Copilot via Banner
  runAdb('shell input tap 540 660');
  await sleep(1500);
  capture('screen_portrait_ai.png');
  runAdb('shell input tap 80 170'); // Back
  await sleep(1000);

  // 2. Main Menu
  runAdb('shell input tap 972 2280');
  await sleep(1000);
  // Scroll to top
  runAdb('shell input swipe 540 600 540 1900 200');
  await sleep(600);
  runAdb('shell input swipe 540 600 540 1900 200');
  await sleep(600);
  capture('screen_portrait_menu.png');

  // e-Way Bills (Card 2)
  runAdb('shell input tap 540 820');
  await sleep(1500);
  capture('screen_portrait_eway.png');
  runAdb('shell input tap 80 170');
  await sleep(1000);

  // Cash & Bank (Card 3)
  runAdb('shell input tap 540 1080');
  await sleep(1500);
  capture('screen_portrait_cashbank.png');
  runAdb('shell input tap 80 170');
  await sleep(1000);

  // Estimates (Card 4)
  runAdb('shell input tap 540 1340');
  await sleep(1500);
  capture('screen_portrait_estimates.png');
  runAdb('shell input tap 80 170');
  await sleep(1000);

  // Staff (Card 5)
  runAdb('shell input tap 540 1600');
  await sleep(1500);
  capture('screen_portrait_staff.png');
  runAdb('shell input tap 80 170');
  await sleep(1000);

  console.log('ALL PORTRAIT MODULE SCREENS CAPTURED!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
