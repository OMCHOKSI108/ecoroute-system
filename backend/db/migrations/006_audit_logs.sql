-- Migration 006: audit_logs
-- Run with: psql -U ecoroute_user -d ecoroute_db -f db/migrations/006_audit_logs.sql

SET search_path TO public;

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        UUID,
  actor_role      TEXT,
  action          TEXT        NOT NULL,
  entity_type     TEXT        NOT NULL,
  entity_id       TEXT        NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id       ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action          ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at      ON audit_logs(created_at DESC);

COMMIT;
