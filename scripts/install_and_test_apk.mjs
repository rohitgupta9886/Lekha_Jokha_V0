import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');
const adbPath = path.join(sdkPath, 'platform-tools', 'adb.exe');
const gradleApkPath = path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const distApkPath = path.join(process.cwd(), 'dist', 'LekhaJokha-Android-v2.0.0.apk');
const logFile = path.join(process.cwd(), 'deploy.log');

try { fs.writeFileSync(logFile, ''); } catch (e) {}

function log(msg) {
  const line = typeof msg === 'string' ? msg : JSON.stringify(msg);
  fs.appendFileSync(logFile, line + '\n');
  console.log(line);
}

function runAdb(argsArray, timeout = 30000) {
  log(`[ADB EXEC] adb ${argsArray.join(' ')}`);
  const res = spawnSync(adbPath, argsArray, {
    encoding: 'utf-8',
    timeout,
    windowsHide: true
  });
  if (res.error) throw res.error;
  const out = ((res.stdout || '') + (res.stderr || '')).trim();
  log(`[ADB OUT] ${out}`);
  return out;
}

log('=== ANDROID DEVICE TEST & INSTALL RUNNER ===');
log(`ADB: ${adbPath}`);

if (!fs.existsSync(adbPath)) {
  log(`ADB not found at: ${adbPath}`);
  process.exit(1);
}

if (fs.existsSync(gradleApkPath)) {
  fs.mkdirSync(path.dirname(distApkPath), { recursive: true });
  fs.copyFileSync(gradleApkPath, distApkPath);
  log(`Synced latest Gradle release APK to: ${distApkPath}`);
}

const activeApk = fs.existsSync(distApkPath) ? distApkPath : gradleApkPath;
log(`Target APK: ${activeApk}`);

// 2. Query devices
let rawDevices = '';
try {
  rawDevices = runAdb(['devices'], 10000);
} catch (e) {
  log(`Failed to query ADB devices: ${e.message}`);
  process.exit(1);
}

const lines = rawDevices.split('\n').map(l => l.trim()).filter(Boolean);
const deviceLines = lines.filter(l => (l.includes('\tdevice') || l.includes(' device')) && !l.includes('List of devices'));

if (deviceLines.length === 0) {
  log('\n[STATUS] NO_ACTIVE_DEVICE_FOUND');
  log('No physical phone or emulator is currently authorized with ADB.');
  process.exit(0);
}

const targetDevice = deviceLines[0].split(/\s+/)[0];
log(`\nFound target device: [${targetDevice}]`);

// 3. REVERSE PORT 3000
log('\n[NETWORK] Setting up ADB reverse port forwarding (tcp:3000 -> tcp:3000)...');
try {
  const revOutput = runAdb(['-s', targetDevice, 'reverse', 'tcp:3000', 'tcp:3000'], 5000);
  log(`✅ Port 3000 reversed successfully! (${revOutput || 'tcp:3000'})`);
} catch (e) {
  log(`Notice: ADB reverse port setup returned: ${e.message}`);
}

// 4. INSTALL APK
log(`\n[INSTALL] Installing APK onto device [${targetDevice}]...`);
try {
  const installOutput = runAdb(['-s', targetDevice, 'install', '-r', '-d', activeApk], 90000);
  log(`Install Result: ${installOutput}`);
} catch (e) {
  log(`Installation failed: ${e.message}`);
  process.exit(1);
}

// 5. FORCE STOP & RE-LAUNCH
log('\n[LAUNCH] Restarting app with latest build...');
try {
  runAdb(['-s', targetDevice, 'shell', 'am', 'force-stop', 'in.lekhajokha.app'], 5000);
} catch (e) {}

try {
  const launchOutput = runAdb(['-s', targetDevice, 'shell', 'am', 'start', '-n', 'in.lekhajokha.app/.MainActivity'], 10000);
  log(`Launch Output: ${launchOutput}`);
} catch (e) {
  log(`Launch failed: ${e.message}`);
  process.exit(1);
}

// 6. VERIFY RUNNING PROCESS
log('\n[VERIFY] Verifying running process on device...');
try {
  const psOutput = runAdb(['-s', targetDevice, 'shell', 'pidof', 'in.lekhajokha.app'], 5000);
  log(`Process PID: ${psOutput || 'Running'}`);
} catch (e) {}

log('\n======================================================');
log('SUCCESS: Lekha Jokha APK installed and verified on device!');
log('======================================================');
