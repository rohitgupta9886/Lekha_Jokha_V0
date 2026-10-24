import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const localApp = path.join(userHome, 'AppData', 'Local');

function findAvd(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const full = path.join(dir, e.name);
        if (e.name.toLowerCase().endsWith('.avd') || e.name.toLowerCase() === 'system-images') {
          console.log('Found:', full);
        } else if (!e.name.startsWith('.') && e.name !== 'node_modules') {
          findAvd(full, depth + 1);
        }
      }
    }
  } catch (err) {}
}

console.log('Searching for AVDs in Local AppData Android...');
findAvd(path.join(localApp, 'Android'));

console.log('Searching in .android...');
findAvd(path.join(userHome, '.android'));
console.log('Done.');
