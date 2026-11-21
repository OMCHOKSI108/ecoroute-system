#!/bin/sh
set -e

echo "[EcoRoute Backend] Waiting for database at ${DATABASE_HOST:-db}:${DATABASE_PORT:-5432}..."
node -e '
const { Client } = require("pg");
const host = process.env.DATABASE_HOST || "db";
const port = parseInt(process.env.DATABASE_PORT || "5432", 10);
const user = process.env.DATABASE_USER || "ecoroute_user";
const password = process.env.DATABASE_PASSWORD || "ecoroute_password";
const database = process.env.DATABASE_NAME || "ecoroute_db";

async function waitForDb() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    const client = new Client({ host, port, user, password, database });
    try {
      await client.connect();
      console.log("[EcoRoute Backend] ✓ Database connection established successfully.");
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`[EcoRoute Backend] Waiting for database (${attempt}/30)...`);
      try { await client.end(); } catch (_) {}
      await new Promise(res => setTimeout(res, 1500));
    }
  }
  console.error("[EcoRoute Backend] ✗ Timed out waiting for database connection.");
  process.exit(1);
}
waitForDb();
'

echo "[EcoRoute Backend] Running database migrations..."
node migrations.js || echo "[EcoRoute Backend] Migrations check completed."

echo "[EcoRoute Backend] Starting application server on port ${PORT:-5000}..."
exec node dist/server.js
