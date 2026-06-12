const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

/**
 * Load env from:
 * 1. backend/.env
 * 2. root .env
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, 'db/migrations');

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function connectionConfig(databaseName) {
  return {
    host: required('DATABASE_HOST'),
    port: Number(required('DATABASE_PORT')),
    user: required('DATABASE_USER'),
    password: required('DATABASE_PASSWORD'),
    database: databaseName,
  };
}

function isDatabaseMissing(error) {
  return error && error.code === '3D000';
}

function isPermissionError(error) {
  return error && (error.code === '42501' || /permission denied/i.test(error.message));
}

function oneTimeSetupMessage() {
  return [
    'Run the one-time PostgreSQL setup command as postgres admin first:',
    'sudo -u postgres psql -f scripts/setup-db-admin.sql',
    '',
    'Using sudo su only changes the Linux user. PostgreSQL permissions are controlled by database roles.',
  ].join('\n');
}

async function withClient(config, fn) {
  const client = new Client(config);

  try {
    await client.connect();
  } catch (error) {
    if (isDatabaseMissing(error)) {
      throw new Error(
        `Database ${required('DATABASE_NAME')} does not exist. Run the one-time PostgreSQL setup command as postgres admin first.\n\n${oneTimeSetupMessage()}`,
      );
    }
    throw error;
  }

  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function prepareSchemaAndExtensions() {
  const databaseName = required('DATABASE_NAME');

  await withClient(connectionConfig(databaseName), async (client) => {
    console.log('Preparing public schema, search_path, and PostGIS extension');

    await client.query('SET search_path TO public');

    try {
      await client.query('CREATE SCHEMA IF NOT EXISTS public');
    } catch (error) {
      if (isPermissionError(error)) {
        throw new Error(
          `${required('DATABASE_USER')} does not have permission on schema public. Run the one-time PostgreSQL setup command.\n\n${oneTimeSetupMessage()}`,
        );
      }
      throw error;
    }

    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
    } catch (error) {
      if (isPermissionError(error)) {
        throw new Error(
          `Could not create PostGIS extension in ${databaseName}. Run the one-time admin setup command with sudo -u postgres.\n\n${oneTimeSetupMessage()}`,
        );
      }
      throw error;
    }

    await client.query('SET search_path TO public');
  });
}

async function resetExistingDatabase() {
  const databaseName = required('DATABASE_NAME');

  const appTables = [
    'notifications',
    'vehicle_location_latest',
    'vehicle_locations',
    'route_stops',
    'audit_logs',
    'pickup_requests',
    'routes',
    'vehicles',
    'businesses',
    'pickup_locations',
    'waste_categories',
    'users',
    'organizations',
  ];

  await withClient(connectionConfig(databaseName), async (client) => {
    console.log(`Resetting EcoRoute tables inside existing database: ${databaseName}`);

    await client.query('BEGIN');

    try {
      await client.query('SET search_path TO public');

      await client.query(
        `DROP TABLE IF EXISTS ${appTables.map(quoteIdentifier).join(', ')} CASCADE`,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

async function runMigrations() {
  const databaseName = required('DATABASE_NAME');

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No SQL migrations found in ${MIGRATIONS_DIR}`);
  }

  await withClient(connectionConfig(databaseName), async (client) => {
    await client.query('SET search_path TO public');

    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      console.log(`Applying migration: ${file}`);

      try {
        await client.query('BEGIN');
        await client.query('SET search_path TO public');
        await client.query(sql);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed: ${file}\n${error.message}`);
      }
    }
  });
}

async function verifyDatabase() {
  const databaseName = required('DATABASE_NAME');
  const expectedTables = [
    'organizations',
    'users',
    'businesses',
    'vehicles',
    'pickup_requests',
    'routes',
    'audit_logs',
  ];

  await withClient(connectionConfig(databaseName), async (client) => {
    const searchPath = await client.query('SHOW search_path');

    const postgis = await client.query(`
      SELECT extname
      FROM pg_extension
      WHERE extname = 'postgis'
    `);

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nVerification');
    console.log('------------');
    console.log(`search_path: ${searchPath.rows[0].search_path}`);
    console.log(`postgis: ${postgis.rowCount > 0 ? 'enabled' : 'missing'}`);
    console.log(`tables: ${tables.rows.map((row) => row.table_name).join(', ') || 'none'}`);

    const tableNames = new Set(tables.rows.map((row) => row.table_name));
    const missing = expectedTables.filter((table) => !tableNames.has(table));
    if (postgis.rowCount === 0 || missing.length > 0) {
      throw new Error(
        `Database verification failed. Missing: ${[
          postgis.rowCount === 0 ? 'postgis extension' : null,
          ...missing,
        ].filter(Boolean).join(', ')}`,
      );
    }
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_RESET !== 'true') {
    throw new Error('Refusing to reset a production database without FORCE_RESET=true');
  }

  const databaseName = required('DATABASE_NAME');

  console.log('EcoRoute Database Migration Runner');
  console.log('==================================');
  console.log(`Database: ${databaseName}`);
  console.log(`Host: ${required('DATABASE_HOST')}:${required('DATABASE_PORT')}`);
  console.log(`User: ${required('DATABASE_USER')}`);
  console.log('');

  await prepareSchemaAndExtensions();
  await resetExistingDatabase();
  await runMigrations();
  await verifyDatabase();

  console.log('\nDatabase reset and migrations applied successfully.');
}
main().catch((error) => {
  console.error('\nMigration error');
  console.error('---------------');
  console.error(error.message);
  process.exit(1);
});
