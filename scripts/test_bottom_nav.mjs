import { execSync } from 'child_process';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const targetDevice = '10BD1U0KYR0004S';

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log('Tapping Sales tab (x=320, y=2300)...');
  execSync(`"${adbPath}" -s ${targetDevice} shell input tap 320 2300`);
  await sleep(1500);

  const shotSales = path.join(process.cwd(), 'dist', 'device_test_tab_sales.png');
  execSync(`"${adbPath}" -s ${targetDevice} exec-out screencap -p > "${shotSales}"`);
  console.log('Saved Sales tab screenshot to:', shotSales);

  console.log('Tapping Settings tab (x=970, y=2300)...');
  execSync(`"${adbPath}" -s ${targetDevice} shell input tap 970 2300`);
  await sleep(1500);

  const shotSettings = path.join(process.cwd(), 'dist', 'device_test_tab_settings.png');
  execSync(`"${adbPath}" -s ${targetDevice} exec-out screencap -p > "${shotSettings}"`);
  console.log('Saved Settings tab screenshot to:', shotSettings);
}

run();
