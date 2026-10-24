import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const desktop = path.join(userHome, 'Desktop');
const startMenu = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
const commonStartMenu = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs';

console.log('Desktop shortcuts:');
if (fs.existsSync(desktop)) {
  console.log(fs.readdirSync(desktop).filter(f => f.endsWith('.lnk') || f.toLowerCase().includes('bluestacks') || f.toLowerCase().includes('android')));
}

console.log('Start Menu shortcuts:');
[startMenu, commonStartMenu].forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      console.log(fs.readdirSync(dir).filter(f => f.toLowerCase().includes('bluestacks') || f.toLowerCase().includes('android')));
    } catch (e) {}
  }
});
