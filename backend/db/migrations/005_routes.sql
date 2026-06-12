-- Migration 005: routes
-- Run with: psql -U ecoroute_user -d ecoroute_db -f db/migrations/005_routes.sql

SET search_path TO public;

BEGIN;

CREATE TABLE IF NOT EXISTS routes (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id       UUID           NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  status           TEXT           NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'completed', 'failed')),
  total_distance_m NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_duration_s NUMERIC(12, 2) NOT NULL DEFAULT 0,
  geometry         JSONB,
  waypoints        JSONB,
  pickup_count     INTEGER        NOT NULL DEFAULT 0,
  osrm_data        JSONB,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_organization_id ON routes(organization_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id      ON routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_status          ON routes(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_one_active_per_vehicle
  ON routes(vehicle_id)
  WHERE status = 'active';

-- Link pickup_requests to routes
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pickup_requests_route_id ON pickup_requests(route_id);

COMMIT;
