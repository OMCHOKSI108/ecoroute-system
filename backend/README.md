# EcoRoute Engine Backend

## Local Database Setup

Run this one-time PostgreSQL admin setup before running app migrations:

```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ecoroute_db WITH (FORCE);"
sudo -u postgres psql -c "DROP USER IF EXISTS ecoroute_user;"
sudo -u postgres psql -c "CREATE USER ecoroute_user WITH PASSWORD 'ecoroute_password';"
sudo -u postgres psql -c "CREATE DATABASE ecoroute_db OWNER ecoroute_user;"
sudo -u postgres psql -d ecoroute_db -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE SCHEMA IF NOT EXISTS public; ALTER SCHEMA public OWNER TO ecoroute_user; GRANT ALL ON SCHEMA public TO ecoroute_user; GRANT CREATE, USAGE ON SCHEMA public TO ecoroute_user; ALTER DATABASE ecoroute_db SET search_path TO public; ALTER USER ecoroute_user SET search_path TO public;"
```

Equivalent script:

```bash
sudo -u postgres psql -f scripts/setup-db-admin.sql
```

Then reset and apply app migrations:

```bash
cd backend
node migrations.js
```

Start the backend:

```bash
npm run dev
```

Notes:

- `migrations.js` uses the normal app user and only resets EcoRoute application tables inside the existing database.
- The app user must not create/drop the PostgreSQL database in normal local migration flow.
- Do not make `ecoroute_user` a superuser.
- Running `sudo su` changes the Linux user, not PostgreSQL role permissions.
