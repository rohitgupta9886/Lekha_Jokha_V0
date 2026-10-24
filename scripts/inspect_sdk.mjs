import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || 'C:\\Users\\Priyanka Gupta';
const sdkPath = path.join(userHome, 'AppData', 'Local', 'Android', 'Sdk');

if (fs.existsSync(sdkPath)) {
  console.log('Sdk contents:', fs.readdirSync(sdkPath));
} else {
  console.log('Sdk does not exist');
}
