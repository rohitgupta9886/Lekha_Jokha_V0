import { execSync } from 'child_process';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const adbPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const targetDevice = '10BD1U0KYR0004S';

function tap(x, y) {
  execSync(`"${adbPath}" -s ${targetDevice} shell input tap ${x} ${y}`);
}

function capture(filename) {
  const remotePath = '/sdcard/tmp_screen.png';
  const localPath = path.join(process.cwd(), 'dist', filename);
  execSync(`"${adbPath}" -s ${targetDevice} shell screencap -p ${remotePath}`);
  execSync(`"${adbPath}" -s ${targetDevice} pull ${remotePath} "${localPath}"`);
  console.log('Saved:', filename);
}

function sleep(ms) {
  execSync(`node -e "setTimeout(() => {}, ${ms})"`);
}

console.log('--- TESTING ALL TABS ON DEVICE ---');

// 1. Sales Tab (x: 324, y: 2240)
tap(324, 2240);
sleep(1200);
capture('tab_sales.png');

// 2. Inventory Tab (x: 540, y: 2240)
tap(540, 2240);
sleep(1200);
capture('tab_inventory.png');

// 3. Parties Tab (x: 756, y: 2240)
tap(756, 2240);
sleep(1200);
capture('tab_parties.png');

// 4. More Tab (x: 972, y: 2240)
tap(972, 2240);
sleep(1200);
capture('tab_more.png');

// 5. Back to Home Tab (x: 108, y: 2240)
tap(108, 2240);
sleep(1200);
capture('tab_home.png');

console.log('All tabs captured successfully!');
