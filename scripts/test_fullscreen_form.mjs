import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const adbPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const targetDevice = '10BD1U0KYR0004S';

function tap(x, y) {
  execSync(`"${adbPath}" -s ${targetDevice} shell input tap ${x} ${y}`);
}

function capture(filename) {
  const remotePath = '/sdcard/tmp_screen.png';
  const localDist = path.join(process.cwd(), 'dist', filename);
  const localArt = path.join('C:\\Users\\Priyanka Gupta\\.gemini\\antigravity-ide\\brain\\4012453f-9fc6-469b-949e-c30e3c83c2cb', filename);
  execSync(`"${adbPath}" -s ${targetDevice} shell screencap -p ${remotePath}`);
  execSync(`"${adbPath}" -s ${targetDevice} pull ${remotePath} "${localDist}"`);
  fs.copyFileSync(localDist, localArt);
  console.log('Saved and synced:', filename);
}

function sleep(ms) {
  execSync(`node -e "setTimeout(() => {}, ${ms})"`);
}

console.log('--- TESTING FULLSCREEN FORM WORKFLOW (ZERO POPUPS) ---');

// 1. Ensure on Home tab (tap Home tab: 108, 2240)
tap(108, 2240);
sleep(1000);

// 2. Click + SALE button (x: 160, y: 400)
console.log('Clicking + SALE quick action button...');
tap(160, 400);
sleep(1500);

// 3. Capture fullscreen form (Invoice Creation)
capture('sale_fullscreen_form.png');

// 4. Tap the close/back button at top left (x: 80, y: 150)
console.log('Tapping Back button on fullscreen form...');
tap(80, 150);
sleep(1000);

// 5. Capture returned Home screen
capture('after_form_closed.png');

// 6. Go to Sales Tab (x: 324, y: 2240)
console.log('Opening Sales Tab...');
tap(324, 2240);
sleep(1200);

// 7. Click on first invoice card (x: 500, y: 800)
console.log('Clicking on Invoice card...');
tap(500, 800);
sleep(1500);

// 8. Capture fullscreen invoice detail screen
capture('invoice_fullscreen_detail.png');

// 9. Tap "Back" button at the bottom (x: 300, y: 2320)
console.log('Closing invoice detail screen...');
tap(300, 2320);
sleep(1000);

// 10. Open Main Menu Tab (x: 972, y: 2240)
console.log('Opening Main Menu Tab...');
tap(972, 2240);
sleep(1200);

// 11. Click on "Indian GSTIN Verification Tool" (x: 500, y: 820)
console.log('Opening GSTIN Verification...');
tap(500, 820);
sleep(1500);

// 12. Capture fullscreen GSTIN screen
capture('gstin_fullscreen_screen.png');

console.log('All fullscreen verification screens captured successfully!');
