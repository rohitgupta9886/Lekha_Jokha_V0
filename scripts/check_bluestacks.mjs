import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const adbPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe');

// Check BlueStacks installation paths
const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const progData = process.env['ProgramData'] || 'C:\\ProgramData';

console.log('BlueStacks in Program Files:', fs.existsSync(path.join(progFiles, 'BlueStacks_nxt')) ? path.join(progFiles, 'BlueStacks_nxt') : 'NO');
console.log('BlueStacks in ProgramData:', fs.existsSync(path.join(progData, 'BlueStacks_nxt')) ? path.join(progData, 'BlueStacks_nxt') : 'NO');

// Check common BlueStacks ADB ports
const ports = [5555, 5554, 5556, 5037];
for (const port of [5555, 5554, 5556]) {
  try {
    const res = execSync(`"${adbPath}" connect 127.0.0.1:${port}`, { encoding: 'utf-8' });
    console.log(`adb connect 127.0.0.1:${port}:`, res.trim());
  } catch (e) {
    console.log(`adb connect 127.0.0.1:${port} error:`, e.message);
  }
}

try {
  const devices = execSync(`"${adbPath}" devices`, { encoding: 'utf-8' });
  console.log('Devices after connect:\n', devices);
} catch (e) {
  console.log('adb devices error:', e.message);
}
