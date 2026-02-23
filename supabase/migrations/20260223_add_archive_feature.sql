-- Add archived_at column to vendors and tenants tables
-- Archived entities are hidden from active lists but preserved for history.
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_vendors_archived_at ON vendors (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_archived_at ON tenants (archived_at) WHERE archived_at IS NOT NULL;
