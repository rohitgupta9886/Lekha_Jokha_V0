process.env.PORT = process.env.PORT || '3001';
process.env.HOST = '0.0.0.0';

console.log(`[Launcher] Starting Lekha Jokha on port ${process.env.PORT}...`);
import('../vyapar-app/server.mjs');
