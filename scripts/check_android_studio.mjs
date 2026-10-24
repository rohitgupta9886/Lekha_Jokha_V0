import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';

const asPaths = [
  path.join(progFiles, 'Android', 'Android Studio'),
  path.join(userHome, 'AppData', 'Local', 'Programs', 'Android Studio'),
  path.join(progFiles, 'Android', 'Android Studio', 'bin', 'studio64.exe')
];

for (const p of asPaths) {
  console.log(`Path ${p}: exists = ${fs.existsSync(p)}`);
}

// Check if there are any other AVD folders or virtual devices
const androidDir = path.join(userHome, '.android');
if (fs.existsSync(androidDir)) {
  console.log('.android contents:', fs.readdirSync(androidDir));
}
