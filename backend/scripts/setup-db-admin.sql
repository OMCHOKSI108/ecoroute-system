-- EcoRoute Engine local development database setup.
-- Run as the PostgreSQL admin user:
--   sudo -u postgres psql -f scripts/setup-db-admin.sql
--
-- This is for local development only. Do not use this against production.
-- Running sudo su changes the Linux user, not PostgreSQL role permissions.

DROP DATABASE IF EXISTS ecoroute_db WITH (FORCE);
DROP USER IF EXISTS ecoroute_user;

CREATE USER ecoroute_user WITH PASSWORD 'ecoroute_password';
CREATE DATABASE ecoroute_db OWNER ecoroute_user;

\connect ecoroute_db

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS public;
ALTER SCHEMA public OWNER TO ecoroute_user;
GRANT ALL ON SCHEMA public TO ecoroute_user;
GRANT CREATE, USAGE ON SCHEMA public TO ecoroute_user;
ALTER DATABASE ecoroute_db SET search_path TO public;
ALTER USER ecoroute_user SET search_path TO public;
