import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './env';

const sslRejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';
const isLocalHost = ['localhost', '127.0.0.1', 'db', 'postgres'].includes(config.db.host);
const sslConfig = process.env.DATABASE_SSL === 'true' || (config.nodeEnv === 'production' && process.env.DATABASE_SSL !== 'false' && !isLocalHost)
  ? { rejectUnauthorized: sslRejectUnauthorized }
  : false;

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error(
    JSON.stringify({ level: 'error', message: 'Unexpected pool client error', error: err.message }),
  );
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
