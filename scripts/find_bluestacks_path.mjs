import { execSync } from 'child_process';

try {
  const output = execSync('powershell -Command "Get-Process | Where-Object {$_.ProcessName -match \'BlueStacks|HD-Player|emulator|qemu\'} | Select-Object Id, ProcessName, Path | Format-Table -AutoSize"', { encoding: 'utf-8' });
  console.log('Processes:\n', output);
} catch (e) {
  console.log('Error:', e.message);
}
