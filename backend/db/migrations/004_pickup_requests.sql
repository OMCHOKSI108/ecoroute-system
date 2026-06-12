-- Migration 004: pickup_requests
-- Run with: psql -U ecoroute_user -d ecoroute_db -f db/migrations/004_pickup_requests.sql

SET search_path TO public;

BEGIN;

CREATE TABLE IF NOT EXISTS pickup_requests (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id          UUID           NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assigned_vehicle_id  UUID           REFERENCES vehicles(id) ON DELETE SET NULL,
  requested_by         UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status               TEXT           NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','assigned','in_progress','completed','cancelled')),
  scheduled_at         TIMESTAMPTZ,
  notes                TEXT,
  waste_category       TEXT           NOT NULL,
  estimated_weight_kg  DECIMAL(10,2),
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_requests_organization_id     ON pickup_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_business_id         ON pickup_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_assigned_vehicle_id ON pickup_requests(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status              ON pickup_requests(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pickup_requests_estimated_weight_positive'
  ) THEN
    ALTER TABLE pickup_requests
      ADD CONSTRAINT chk_pickup_requests_estimated_weight_positive
      CHECK (estimated_weight_kg IS NULL OR estimated_weight_kg > 0);
  END IF;
END $$;

COMMIT;
