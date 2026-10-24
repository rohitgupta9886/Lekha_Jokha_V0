// ==============================================================================
// Lekha Jokha - Production Idempotent Database Migration Runner
// Safely executes versioned SQL migrations in order with transaction protection
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresDb } from '../postgres_db_manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations(targetDb = postgresDb) {
  console.log('[Migration Runner] Checking PostgreSQL connectivity & pending migrations...');

  if (!targetDb.isConfigured()) {
    throw new Error('MIGRATION_ABORTED: DATABASE_URL is not set. Please configure DATABASE_URL in environment variables.');
  }

  const client = await targetDb.getClient();
  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Read already applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations ORDER BY id ASC;');
    const appliedVersions = new Set(appliedRes.rows.map(r => r.version));

    // 3. Discover migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log('[Migration Runner] No migrations directory found at', MIGRATIONS_DIR);
      return { appliedCount: 0, totalCount: 0 };
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const version = file.replace(/\.sql$/, '');
      if (appliedVersions.has(version)) {
        console.log(`[Migration Runner] Skipping already applied migration: ${version}`);
        continue;
      }

      console.log(`[Migration Runner] Applying migration: ${version} ...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (version, description) VALUES ($1, $2);',
          [version, `Executed from file ${file}`]
        );
        await client.query('COMMIT');
        console.log(`[Migration Runner] Successfully applied: ${version}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration Runner] FATAL: Error executing migration ${version}:`, err.message);
        throw err;
      }
    }

    console.log(`[Migration Runner] Migration check complete. ${appliedCount} new migrations applied. Total: ${files.length}`);
    return { appliedCount, totalCount: files.length };
  } finally {
    client.release();
  }
}

// Allow direct execution from CLI: node database/migration_runner.mjs
if (process.argv[1] && process.argv[1].endsWith('migration_runner.mjs')) {
  runMigrations()
    .then((result) => {
      console.log('[Migration Runner] Finished successfully:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration Runner] Migration failed with error:', err.message);
      process.exit(1);
    });
}
