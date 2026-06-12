-- Migration 002: businesses (waste collection clients)
-- Requires 001_auth.sql and PostGIS extension.
-- Run with: psql -U ecoroute_user -d ecoroute_db -f db/migrations/002_businesses.sql

SET search_path TO public;

BEGIN;

CREATE TABLE IF NOT EXISTS businesses (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT          NOT NULL,
  contact_email   TEXT,
  contact_phone   TEXT,
  address         TEXT          NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  -- PostGIS geography column: longitude first per PostGIS convention (SRID 4326)
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  waste_categories TEXT[]       NOT NULL DEFAULT '{}',
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_organization_id ON businesses(organization_id);
CREATE INDEX IF NOT EXISTS idx_businesses_location        ON businesses USING GIST(location);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_businesses_latitude_range'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT chk_businesses_latitude_range CHECK (latitude BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_businesses_longitude_range'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT chk_businesses_longitude_range CHECK (longitude BETWEEN -180 AND 180);
  END IF;
END $$;

COMMIT;
