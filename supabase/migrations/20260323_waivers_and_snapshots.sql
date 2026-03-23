-- ============================================================================
-- SmartCOI — Compliance Waivers & Snapshots Migration
-- Run via Supabase SQL Editor
-- ============================================================================

-- Compliance Waivers: track temporary compliance requirement waivers
CREATE TABLE IF NOT EXISTS compliance_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  vendor_id UUID REFERENCES vendors(id),
  tenant_id UUID REFERENCES tenants(id),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT waiver_entity_check CHECK (
    (vendor_id IS NOT NULL AND tenant_id IS NULL) OR
    (vendor_id IS NULL AND tenant_id IS NOT NULL)
  )
);

-- RLS for compliance_waivers
ALTER TABLE compliance_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org waivers"
  ON compliance_waivers FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create waivers in their org"
  ON compliance_waivers FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update waivers in their org"
  ON compliance_waivers FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Indexes for waivers
CREATE INDEX IF NOT EXISTS idx_waivers_vendor ON compliance_waivers(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waivers_tenant ON compliance_waivers(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waivers_org ON compliance_waivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_waivers_active ON compliance_waivers(expires_at) WHERE revoked_at IS NULL;

-- Compliance Snapshots: daily compliance tracking for trend charts
CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  snapshot_date DATE NOT NULL,
  compliance_rate INTEGER NOT NULL DEFAULT 0,
  total_entities INTEGER NOT NULL DEFAULT 0,
  compliant_count INTEGER NOT NULL DEFAULT 0,
  non_compliant_count INTEGER NOT NULL DEFAULT 0,
  expired_count INTEGER NOT NULL DEFAULT 0,
  expiring_soon_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_date UNIQUE (organization_id, snapshot_date)
);

-- RLS for compliance_snapshots
ALTER TABLE compliance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org snapshots"
  ON compliance_snapshots FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Service role needs INSERT access (runs from cron)
CREATE POLICY "Service role can insert snapshots"
  ON compliance_snapshots FOR INSERT
  WITH CHECK (true);

-- Index for snapshot queries
CREATE INDEX IF NOT EXISTS idx_snapshots_org_date ON compliance_snapshots(organization_id, snapshot_date DESC);
