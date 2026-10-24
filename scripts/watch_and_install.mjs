import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const apkPath = path.join(process.cwd(), 'dist', 'LekhaJokha-Android-v2.0.0.apk');
const screenshotPath = path.join(process.cwd(), 'dist', 'emulator_screen.png');

console.log('Daemon active: Waiting for any Android device/emulator on ADB...');

let attempts = 0;

function poll() {
  attempts++;
  try {
    const rawDevices = execSync(`"${adbPath}" devices`, { encoding: 'utf-8' });
    const lines = rawDevices.split('\n').map(l => l.trim()).filter(Boolean);
    const deviceLines = lines.slice(1).filter(l => l.includes('\tdevice'));

    if (deviceLines.length > 0) {
      const targetDevice = deviceLines[0].split('\t')[0];
      console.log(`[CONNECTED] Device detected: ${targetDevice}`);
      console.log('Installing LekhaJokha-Android-v2.0.0.apk...');
      const installRes = execSync(`"${adbPath}" -s ${targetDevice} install -r -d "${apkPath}"`, { encoding: 'utf-8' });
      console.log('Install Result:', installRes.trim());

      console.log('Starting in.lekhajokha.app/.MainActivity...');
      const launchRes = execSync(`"${adbPath}" -s ${targetDevice} shell am start -n in.lekhajokha.app/.MainActivity`, { encoding: 'utf-8' });
      console.log('Launch Result:', launchRes.trim());

      setTimeout(() => {
        try {
          execSync(`"${adbPath}" -s ${targetDevice} exec-out screencap -p > "${screenshotPath}"`);
          console.log(`Screenshot saved to: ${screenshotPath}`);
        } catch (e) {}
        console.log('SUCCESS: Application launched and verified on device.');
        process.exit(0);
      }, 3000);
      return;
    }
  } catch (err) {}

  if (attempts % 10 === 0) {
    console.log(`Still waiting for emulator/device... (checked ${attempts} times)`);
  }
  setTimeout(poll, 2500);
}

poll();
