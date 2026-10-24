import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');

const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const emulatorPath = path.join(sdkPath, 'emulator', 'emulator.exe');

console.log('SDK Path:', sdkPath);
console.log('ADB exists:', fs.existsSync(adbPath) ? adbPath : 'NO');
console.log('Emulator exists:', fs.existsSync(emulatorPath) ? emulatorPath : 'NO');

if (fs.existsSync(adbPath)) {
  try {
    const devices = execSync(`"${adbPath}" devices`, { encoding: 'utf-8' });
    console.log('Connected devices:\n', devices);
  } catch (e) {
    console.error('Error running adb devices:', e.message);
  }
}

if (fs.existsSync(emulatorPath)) {
  try {
    const avds = execSync(`"${emulatorPath}" -list-avds`, { encoding: 'utf-8' });
    console.log('Available AVDs:\n', avds);
  } catch (e) {
    console.error('Error running emulator -list-avds:', e.message);
  }
}
