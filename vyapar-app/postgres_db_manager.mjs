// ==============================================================================
// Lekha Jokha - Centralized Production PostgreSQL Pool & Connection Manager
// Architecture: Connection Pooling, Transaction Safety, Render Cloud SSL & Health Probes
// ==============================================================================

import pg from 'pg';
const { Pool } = pg;

class PostgresDbManager {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
    this.connectionString = null;
  }

  getPoolConfig() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return null;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isRenderOrCloud = databaseUrl.includes('render.com') ||
      databaseUrl.includes('amazonaws.com') ||
      databaseUrl.includes('neon.tech') ||
      databaseUrl.includes('supabase.co') ||
      databaseUrl.includes('sslmode=require');

    const config = {
      connectionString: databaseUrl,
      max: parseInt(process.env.PG_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECT_TIMEOUT || '10000', 10),
      statement_timeout: parseInt(process.env.PG_STATEMENT_TIMEOUT || '20000', 10),
    };

    // Render & Cloud PostgreSQL SSL configuration
    if (isRenderOrCloud || isProduction) {
      config.ssl = {
        rejectUnauthorized: false
      };
    }

    return config;
  }

  initPool() {
    if (this.pool) return this.pool;

    const config = this.getPoolConfig();
    if (!config) {
      return null;
    }

    this.connectionString = config.connectionString;
    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error] Unexpected idle client error:', err.message);
    });

    this.pool.on('connect', () => {
      // Set session attributes for predictable parsing
    });

    this.isInitialized = true;
    return this.pool;
  }

  isConfigured() {
    return Boolean(process.env.DATABASE_URL);
  }

  async query(text, params = []) {
    const pool = this.initPool();
    if (!pool) {
      throw new Error('DATABASE_URL_NOT_CONFIGURED: PostgreSQL connection pool is not initialized because DATABASE_URL is missing.');
    }

    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log('[SQL]', text.slice(0, 100).replace(/\s+/g, ' '), `[${duration}ms] Rows: ${res.rowCount}`);
      }
      return res;
    } catch (err) {
      console.error('[SQL Error]', {
        query: text.slice(0, 200),
        params,
        error: err.message
      });
      throw err;
    }
  }

  async getClient() {
    const pool = this.initPool();
    if (!pool) {
      throw new Error('DATABASE_URL_NOT_CONFIGURED: Cannot acquire client without DATABASE_URL.');
    }
    return await pool.connect();
  }

  async withTransaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('[SQL Rollback Error]:', rbErr.message);
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async checkHealth() {
    if (!this.isConfigured()) {
      return {
        healthy: false,
        status: 'UNCONFIGURED',
        message: 'DATABASE_URL environment variable is not defined.'
      };
    }

    const start = Date.now();
    try {
      const res = await this.query('SELECT 1 AS alive, NOW() AS db_time, current_database() AS database_name;');
      const latencyMs = Date.now() - start;
      const row = res.rows[0];
      return {
        healthy: true,
        status: 'CONNECTED',
        database: row.database_name,
        dbTime: row.db_time,
        latencyMs,
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        }
      };
    } catch (err) {
      return {
        healthy: false,
        status: 'CONNECTION_FAILED',
        error: err.message,
        code: err.code
      };
    }
  }

  async closePool() {
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('[PostgreSQL Pool] Gracefully closed all active connections.');
      } catch (err) {
        console.error('[PostgreSQL Pool Error closing]:', err.message);
      } finally {
        this.pool = null;
        this.isInitialized = false;
      }
    }
  }
}

export const postgresDb = new PostgresDbManager();
export default postgresDb;
