import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const srcApk = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const distDir = path.join(rootDir, 'dist');
const targetApk = path.join(distDir, 'LekhaJokha-Android-v2.0.0.apk');
const oldApk = path.join(distDir, 'LekhaJokha-v1.0.0-release.apk');

if (!fs.existsSync(srcApk)) {
  console.error('Source APK not found at:', srcApk);
  process.exit(1);
}

const srcStat = fs.statSync(srcApk);
console.log(`Source APK found: ${srcApk} (${srcStat.size} bytes)`);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(srcApk, targetApk);
const targetStat = fs.statSync(targetApk);
console.log(`New APK copied to dist: ${targetApk} (${targetStat.size} bytes)`);

if (targetStat.size > 0) {
  if (fs.existsSync(oldApk)) {
    fs.unlinkSync(oldApk);
    console.log(`Obsolete APK removed: ${oldApk}`);
  } else {
    console.log('No old APK found to remove.');
  }

  const distFiles = fs.readdirSync(distDir);
  console.log('Current dist contents:', distFiles);
  console.log('VERIFICATION: SUCCESS');
} else {
  console.error('ERROR: Copied APK has 0 bytes!');
  process.exit(1);
}
