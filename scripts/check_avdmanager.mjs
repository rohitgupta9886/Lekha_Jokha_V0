import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');

// Look for avdmanager in cmdline-tools
const cmdlineToolsDir = path.join(sdkPath, 'cmdline-tools');
console.log('cmdline-tools dir exists:', fs.existsSync(cmdlineToolsDir));

let avdmanagerPath = null;
let sdkmanagerPath = null;

if (fs.existsSync(cmdlineToolsDir)) {
  const versions = fs.readdirSync(cmdlineToolsDir);
  console.log('cmdline-tools versions:', versions);
  for (const v of versions) {
    const avdCandidate = path.join(cmdlineToolsDir, v, 'bin', 'avdmanager.bat');
    const sdkCandidate = path.join(cmdlineToolsDir, v, 'bin', 'sdkmanager.bat');
    if (fs.existsSync(avdCandidate)) avdmanagerPath = avdCandidate;
    if (fs.existsSync(sdkCandidate)) sdkmanagerPath = sdkCandidate;
  }
}

console.log('avdmanager path:', avdmanagerPath);
console.log('sdkmanager path:', sdkmanagerPath);

// Check system-images directory
const sysImgDir = path.join(sdkPath, 'system-images');
console.log('system-images dir exists:', fs.existsSync(sysImgDir));
if (fs.existsSync(sysImgDir)) {
  console.log('system-images contents:', fs.readdirSync(sysImgDir));
}

// Check .android/avd in user directory
const userAvdDir = path.join(userHome, '.android', 'avd');
console.log('.android/avd exists:', fs.existsSync(userAvdDir));
if (fs.existsSync(userAvdDir)) {
  console.log('.android/avd contents:', fs.readdirSync(userAvdDir));
}

if (avdmanagerPath) {
  try {
    const listTargets = execSync(`"${avdmanagerPath}" list target`, { encoding: 'utf-8' });
    console.log('avdmanager list target:\n', listTargets);
  } catch (e) {
    console.log('avdmanager list target error:', e.message);
  }
  try {
    const listDevice = execSync(`"${avdmanagerPath}" list device`, { encoding: 'utf-8' });
    console.log('avdmanager list device (first 500 chars):\n', listDevice.slice(0, 500));
  } catch (e) {
    console.log('avdmanager list device error:', e.message);
  }
}
