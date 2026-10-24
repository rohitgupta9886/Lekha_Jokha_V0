import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const vyaparDir = path.join(rootDir, 'vyapar-app');

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ occupied: true, data: data.slice(0, 300) });
      });
    });
    req.on('error', () => {
      resolve({ occupied: false });
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ occupied: false });
    });
  });
}

async function main() {
  console.log('[Lekha Jokha Launcher] Checking port 3000...');
  const status3000 = await checkPort(3000);
  let targetPort = 3000;

  if (status3000.occupied) {
    console.log('[Lekha Jokha Launcher] Port 3000 is occupied.');
    if (status3000.data.includes('GetMyBuddy')) {
      console.log('[Lekha Jokha Launcher] Port 3000 is currently running GetMyBuddy.');
      console.log('[Lekha Jokha Launcher] Freeing port 3000 by terminating GetMyBuddy python process...');
      try {
        execSync('powershell -Command "Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'inherit' });
        console.log('[Lekha Jokha Launcher] Terminated python process.');
      } catch (e) {
        console.log('[Lekha Jokha Launcher] Could not terminate python:', e.message);
      }
      
      // Wait a moment and recheck
      await new Promise(r => setTimeout(r, 1500));
      const recheck = await checkPort(3000);
      if (recheck.occupied) {
        console.log('[Lekha Jokha Launcher] Port 3000 still in use, switching to port 3001.');
        targetPort = 3001;
      } else {
        console.log('[Lekha Jokha Launcher] Port 3000 is now free!');
      }
    } else if (status3000.data.includes('Lekha Jokha')) {
      console.log('[Lekha Jokha Launcher] Lekha Jokha is already running on port 3000!');
      console.log('App URL: http://localhost:3000');
      return;
    } else {
      console.log('[Lekha Jokha Launcher] Using port 3001 to avoid port collision.');
      targetPort = 3001;
    }
  }

  console.log(`[Lekha Jokha Launcher] Starting Lekha Jokha server on port ${targetPort}...`);
  const serverPath = path.join(vyaparDir, 'server.mjs');
  
  const env = { ...process.env, PORT: String(targetPort) };
  const child = spawn(process.execPath, [serverPath], {
    cwd: vyaparDir,
    env,
    stdio: 'inherit',
    detached: false
  });

  child.on('error', (err) => {
    console.error('[Lekha Jokha Launcher] Failed to start server:', err);
  });
}

main();
