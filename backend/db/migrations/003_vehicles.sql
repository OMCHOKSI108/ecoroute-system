-- Migration 003: vehicles
-- Run with: psql -U ecoroute_user -d ecoroute_db -f db/migrations/003_vehicles.sql

SET search_path TO public;

BEGIN;

CREATE TABLE IF NOT EXISTS vehicles (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID             NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plate_number     TEXT             NOT NULL,
  model            TEXT             NOT NULL,
  capacity_kg      DECIMAL(10,2)    NOT NULL,
  current_load_kg  DECIMAL(10,2)    NOT NULL DEFAULT 0,
  status           TEXT             NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available','dispatched','maintenance','offline')),
  driver_id        UUID             REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, plate_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id       ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status          ON vehicles(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_capacity_positive'
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT chk_vehicles_capacity_positive CHECK (capacity_kg > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_current_load_valid'
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT chk_vehicles_current_load_valid CHECK (current_load_kg >= 0 AND current_load_kg <= capacity_kg);
  END IF;
END $$;

COMMIT;
