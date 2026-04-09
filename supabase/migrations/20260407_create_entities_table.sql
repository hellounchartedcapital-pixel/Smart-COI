-- ============================================================================
-- SmartCOI — Unified Entities Table Migration
-- Merges vendors + tenants into a single entities table.
--
-- ⚠️ ACTION REQUIRED: Run this in the Supabase SQL Editor manually.
-- Old vendors/tenants tables are NOT dropped — kept as backup.
-- Old vendor_id/tenant_id columns are NOT dropped — kept alongside entity_id.
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENTITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'vendor', 'tenant', 'subcontractor', 'carrier', 'supplier'
  )),
  entity_category TEXT,  -- was vendor_type / tenant_type (e.g., "HVAC", "Janitorial")
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  unit_suite TEXT,        -- was tenant-only, available for all
  template_id UUID REFERENCES requirement_templates(id) ON DELETE SET NULL,
  compliance_status TEXT DEFAULT 'pending'
    CHECK (compliance_status IN (
      'compliant', 'non_compliant', 'expiring_soon', 'expired', 'pending', 'under_review', 'needs_setup'
    )),
  notifications_paused BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_entities_organization_id ON entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_entities_property_id ON entities(property_id);
CREATE INDEX IF NOT EXISTS idx_entities_entity_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_template_id ON entities(template_id);
CREATE INDEX IF NOT EXISTS idx_entities_compliance_status ON entities(compliance_status);
CREATE INDEX IF NOT EXISTS idx_entities_org_compliance ON entities(organization_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_entities_org_type ON entities(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_archived_at ON entities(archived_at) WHERE archived_at IS NOT NULL;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view entities"
  ON entities FOR SELECT TO authenticated
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org members can insert entities"
  ON entities FOR INSERT TO authenticated
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org members can update entities"
  ON entities FOR UPDATE TO authenticated
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org members can delete entities"
  ON entities FOR DELETE TO authenticated
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- 4. MIGRATE DATA FROM VENDORS
-- ============================================================================

INSERT INTO entities (
  id, organization_id, property_id, name, entity_type, entity_category,
  contact_name, contact_email, contact_phone, unit_suite,
  template_id, compliance_status, notifications_paused,
  deleted_at, archived_at, created_at, updated_at
)
SELECT
  id, organization_id, property_id, company_name, 'vendor', vendor_type,
  contact_name, contact_email, contact_phone, NULL,
  template_id, compliance_status, COALESCE(notifications_paused, false),
  deleted_at, archived_at, created_at, updated_at
FROM vendors
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. MIGRATE DATA FROM TENANTS
-- ============================================================================

INSERT INTO entities (
  id, organization_id, property_id, name, entity_type, entity_category,
  contact_name, contact_email, contact_phone, unit_suite,
  template_id, compliance_status, notifications_paused,
  deleted_at, archived_at, created_at, updated_at
)
SELECT
  id, organization_id, property_id, company_name, 'tenant', tenant_type,
  contact_name, contact_email, contact_phone, unit_suite,
  template_id, compliance_status, COALESCE(notifications_paused, false),
  deleted_at, archived_at, created_at, updated_at
FROM tenants
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. ADD entity_id TO CERTIFICATES
-- ============================================================================

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_entity_id ON certificates(entity_id);

-- Populate from vendor_id or tenant_id
UPDATE certificates SET entity_id = vendor_id WHERE vendor_id IS NOT NULL AND entity_id IS NULL;
UPDATE certificates SET entity_id = tenant_id WHERE tenant_id IS NOT NULL AND entity_id IS NULL;

-- ============================================================================
-- 7. ADD entity_id TO NOTIFICATIONS
-- ============================================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_entity_id ON notifications(entity_id);

UPDATE notifications SET entity_id = vendor_id WHERE vendor_id IS NOT NULL AND entity_id IS NULL;
UPDATE notifications SET entity_id = tenant_id WHERE tenant_id IS NOT NULL AND entity_id IS NULL;

-- ============================================================================
-- 8. ADD entity_id TO UPLOAD_PORTAL_TOKENS
-- ============================================================================

ALTER TABLE upload_portal_tokens ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_portal_tokens_entity_id ON upload_portal_tokens(entity_id);

UPDATE upload_portal_tokens SET entity_id = vendor_id WHERE vendor_id IS NOT NULL AND entity_id IS NULL;
UPDATE upload_portal_tokens SET entity_id = tenant_id WHERE tenant_id IS NOT NULL AND entity_id IS NULL;

-- ============================================================================
-- 9. ADD entity_id TO ACTIVITY_LOG
-- ============================================================================

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON activity_log(entity_id);

UPDATE activity_log SET entity_id = vendor_id WHERE vendor_id IS NOT NULL AND entity_id IS NULL;
UPDATE activity_log SET entity_id = tenant_id WHERE tenant_id IS NOT NULL AND entity_id IS NULL;

-- ============================================================================
-- 10. ADD entity_id TO COMPLIANCE_WAIVERS
-- ============================================================================

ALTER TABLE compliance_waivers ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_waivers_entity_id ON compliance_waivers(entity_id);

UPDATE compliance_waivers SET entity_id = vendor_id WHERE vendor_id IS NOT NULL AND entity_id IS NULL;
UPDATE compliance_waivers SET entity_id = tenant_id WHERE tenant_id IS NOT NULL AND entity_id IS NULL;

-- ============================================================================
-- 11. UPDATE activity_log ACTION CHECK (add entity_created)
-- ============================================================================

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_action_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_check
  CHECK (action IN (
    'coi_uploaded', 'coi_processed', 'coi_review_confirmed', 'compliance_checked',
    'notification_sent', 'status_changed', 'template_updated',
    'vendor_created', 'tenant_created', 'entity_created', 'portal_upload_received'
  ));

-- ============================================================================
-- DONE — old vendors/tenants tables and vendor_id/tenant_id columns preserved
-- ============================================================================
