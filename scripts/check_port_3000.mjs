import { execSync } from 'child_process';

try {
  const output = execSync('netstat -ano', { encoding: 'utf-8' });
  const lines = output.split('\n').filter(line => line.includes(':3000 ') && line.includes('LISTENING'));
  console.log('PORT 3000 LISTENING LINES:');
  console.log(lines.join('\n'));
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      console.log(`Found PID on 3000: ${pid}`);
      try {
        const procInfo = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf-8' });
        console.log(`Process Info:\n${procInfo}`);
      } catch (err) {
        console.log(`Error getting process info: ${err.message}`);
      }
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
