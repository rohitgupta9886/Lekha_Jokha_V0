import { execSync } from 'child_process';

try {
  const out = execSync('wmic process where "name like \'%BlueStacks%\'" get ExecutablePath, ProcessId', { encoding: 'utf-8' });
  console.log('WMIC output:\n', out);
} catch (e) {
  console.log('Error:', e.message);
}
