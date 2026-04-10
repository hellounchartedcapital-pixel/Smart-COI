-- ============================================================================
-- SmartCOI — Processing Batches Table
-- Tracks batch-level progress for background COI upload processing.
-- ============================================================================

-- Create the processing_batches table
CREATE TABLE IF NOT EXISTS processing_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  total_certs   INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count  INTEGER NOT NULL DEFAULT 0,
  -- certificate IDs in this batch (for the background processor)
  certificate_ids UUID[] NOT NULL DEFAULT '{}',
  -- property and entity type context for auto-assignment
  property_id   UUID REFERENCES properties(id) ON DELETE SET NULL,
  entity_type   TEXT CHECK (entity_type IN ('vendor', 'tenant', 'subcontractor', 'carrier', 'supplier')),
  -- client polling flag: true while client is actively polling for progress
  client_active BOOLEAN NOT NULL DEFAULT true,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_processing_batches_org_id ON processing_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_processing_batches_user_id ON processing_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_processing_batches_created_at ON processing_batches(created_at DESC);

-- Enable RLS
ALTER TABLE processing_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own org's batches
CREATE POLICY "Org members can view processing batches"
  ON processing_batches FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert processing batches"
  ON processing_batches FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update processing batches"
  ON processing_batches FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- Service role needs full access for background processing
GRANT ALL ON processing_batches TO authenticated;
GRANT ALL ON processing_batches TO service_role;
