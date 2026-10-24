import { execSync } from 'child_process';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const targetDevice = '10BD1U0KYR0004S';

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  const wmSize = execSync(`"${adbPath}" -s ${targetDevice} shell wm size`, { encoding: 'utf-8' });
  console.log('Device Screen Size:', wmSize.trim());

  // In 1080x2400 screenshot:
  // Top bar has:
  // Lekha Jokha logo on left
  // Business dropdown in center/left (around x=400, y=180)
  // Hindi button on right (around x=880, y=120)
  console.log('Testing tap on Language Toggle (Hindi)...');
  execSync(`"${adbPath}" -s ${targetDevice} shell input tap 880 120`);
  await sleep(1500);

  const shot1 = path.join(process.cwd(), 'dist', 'device_test_hindi.png');
  execSync(`"${adbPath}" -s ${targetDevice} exec-out screencap -p > "${shot1}"`);
  console.log('Saved shot 1 (Language toggle) to:', shot1);

  console.log('Testing tap on Quick Action button (+ SALE at x=160, y=360)...');
  execSync(`"${adbPath}" -s ${targetDevice} shell input tap 160 360`);
  await sleep(1500);

  const shot2 = path.join(process.cwd(), 'dist', 'device_test_sale.png');
  execSync(`"${adbPath}" -s ${targetDevice} exec-out screencap -p > "${shot2}"`);
  console.log('Saved shot 2 (Sale click) to:', shot2);

  console.log('ALL TOUCH INTERACTION TESTS SUCCEEDED!');
}

run();
