-- Migration 009: Add business_id foreign key and phone to users table
SET search_path TO public;

BEGIN;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);

COMMIT;
