-- Add endorsements JSONB column to vendors and tenants
-- Stores extracted endorsement data from COI for compliance checking

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS endorsements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS endorsements JSONB DEFAULT '[]'::jsonb;
