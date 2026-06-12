-- Migration 007: New tables and schema extensions for full API set
-- Run with: psql -U ecoroute_user -d ecoroute_db -f db/migrations/007_extensions.sql

SET search_path TO public;

BEGIN;

-- Extend role check constraint to include business_user
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'dispatcher', 'driver', 'business_user'));

-- Add driver_status column (nullable, only relevant for role='driver')
ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_status TEXT
  CHECK (driver_status IN ('available', 'assigned', 'off_duty', 'inactive'));

-- Pickup locations — multiple locations per business
CREATE TABLE IF NOT EXISTS pickup_locations (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID             NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id     UUID             NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name            TEXT             NOT NULL,
  address         TEXT,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  is_active       BOOLEAN          NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_organization_id ON pickup_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_business_id     ON pickup_locations(business_id);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_location        ON pickup_locations USING GIST(location);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pickup_locations_latitude_range'
  ) THEN
    ALTER TABLE pickup_locations
      ADD CONSTRAINT chk_pickup_locations_latitude_range CHECK (latitude BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pickup_locations_longitude_range'
  ) THEN
    ALTER TABLE pickup_locations
      ADD CONSTRAINT chk_pickup_locations_longitude_range CHECK (longitude BETWEEN -180 AND 180);
  END IF;
END $$;

-- Waste categories
CREATE TABLE IF NOT EXISTS waste_categories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_waste_categories_organization_id ON waste_categories(organization_id);

-- Add pickup_location_id to pickup_requests
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_location_id UUID
  REFERENCES pickup_locations(id) ON DELETE SET NULL;
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS waste_category_id UUID
  REFERENCES waste_categories(id) ON DELETE SET NULL;

-- Route stops — ordered stops within a route
CREATE TABLE IF NOT EXISTS route_stops (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id        UUID        NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  pickup_id       UUID        REFERENCES pickup_requests(id) ON DELETE SET NULL,
  stop_order      INTEGER     NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'arrived', 'completed', 'skipped', 'failed')),
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  address         TEXT,
  planned_distance_m NUMERIC(12, 2),
  planned_duration_s NUMERIC(12, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_id  ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_pickup_id ON route_stops(pickup_id);

-- Vehicle location tracking
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID             NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  organization_id UUID             NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  recorded_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id      ON vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_organization_id ON vehicle_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_location        ON vehicle_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_recorded_at     ON vehicle_locations(recorded_at DESC);

-- Latest vehicle location per vehicle (for fast lookups)
CREATE TABLE IF NOT EXISTS vehicle_location_latest (
  vehicle_id      UUID             PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  organization_id UUID             NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  recorded_at     TIMESTAMPTZ      NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_location_latest_organization_id ON vehicle_location_latest(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_location_latest_location        ON vehicle_location_latest USING GIST(location);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  body            TEXT,
  type            TEXT        NOT NULL,
  is_read         BOOLEAN     NOT NULL DEFAULT false,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id         ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read         ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at      ON notifications(created_at DESC);

COMMIT;
