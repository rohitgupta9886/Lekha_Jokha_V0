import { execSync } from 'child_process';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const targetDevice = '10BD1U0KYR0004S';
const shotPath = path.join(process.cwd(), 'dist', 'app_live_screen.png');

console.log('Bringing Lekha Jokha to foreground...');
execSync(`"${adbPath}" -s ${targetDevice} shell am start -n in.lekhajokha.app/.MainActivity`);

setTimeout(() => {
  execSync(`"${adbPath}" -s ${targetDevice} exec-out screencap -p > "${shotPath}"`);
  console.log('Captured screenshot to:', shotPath);
  process.exit(0);
}, 2000);
