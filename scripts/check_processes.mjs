import { execSync } from 'child_process';

try {
  const tasklist = execSync('tasklist', { encoding: 'utf-8' });
  const lines = tasklist.split('\n');
  const emuKeywords = ['emulator', 'qemu', 'bluestacks', 'nox', 'ldplayer', 'hd-player', 'mumu', 'wsa', 'adb', 'genymotion'];
  const matches = lines.filter(l => emuKeywords.some(k => l.toLowerCase().includes(k)));
  console.log('Matching emulator processes:');
  console.log(matches.join('\n'));
} catch (e) {
  console.error('Error running tasklist:', e.message);
}
