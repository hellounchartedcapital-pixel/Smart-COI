-- ============================================================================
-- Performance indexes for frequently queried columns
-- Safe to re-run (all use IF NOT EXISTS)
-- ============================================================================

-- Vendors: property_id is used on every property detail page and properties list
CREATE INDEX IF NOT EXISTS idx_vendors_property_id
  ON vendors (property_id)
  WHERE deleted_at IS NULL;

-- Tenants: property_id is used on every property detail page and properties list
CREATE INDEX IF NOT EXISTS idx_tenants_property_id
  ON tenants (property_id)
  WHERE deleted_at IS NULL;

-- Vendors: template_id is used on template usage counts and compliance
CREATE INDEX IF NOT EXISTS idx_vendors_template_id
  ON vendors (template_id)
  WHERE deleted_at IS NULL AND archived_at IS NULL;

-- Tenants: template_id is used on template usage counts and compliance
CREATE INDEX IF NOT EXISTS idx_tenants_template_id
  ON tenants (template_id)
  WHERE deleted_at IS NULL AND archived_at IS NULL;

-- Vendors: compliance_status is used for dashboard stats and property summaries
CREATE INDEX IF NOT EXISTS idx_vendors_compliance_status
  ON vendors (organization_id, compliance_status)
  WHERE deleted_at IS NULL AND archived_at IS NULL;

-- Tenants: compliance_status is used for dashboard stats and property summaries
CREATE INDEX IF NOT EXISTS idx_tenants_compliance_status
  ON tenants (organization_id, compliance_status)
  WHERE deleted_at IS NULL AND archived_at IS NULL;

-- Certificates: vendor_id for latest cert lookup (ordered by uploaded_at desc)
CREATE INDEX IF NOT EXISTS idx_certificates_vendor_id
  ON certificates (vendor_id, uploaded_at DESC)
  WHERE vendor_id IS NOT NULL;

-- Certificates: tenant_id for latest cert lookup (ordered by uploaded_at desc)
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_id
  ON certificates (tenant_id, uploaded_at DESC)
  WHERE tenant_id IS NOT NULL;

-- Certificates: processing_status for filtering confirmed/extracted certs
CREATE INDEX IF NOT EXISTS idx_certificates_processing_status
  ON certificates (organization_id, processing_status);

-- Extracted coverages: certificate_id for compliance checking
CREATE INDEX IF NOT EXISTS idx_extracted_coverages_certificate_id
  ON extracted_coverages (certificate_id);

-- Extracted entities: certificate_id for compliance checking
CREATE INDEX IF NOT EXISTS idx_extracted_entities_certificate_id
  ON extracted_entities (certificate_id);

-- Compliance results: certificate_id for review page and gap lookups
CREATE INDEX IF NOT EXISTS idx_compliance_results_certificate_id
  ON compliance_results (certificate_id);

-- Entity compliance results: certificate_id for review page
CREATE INDEX IF NOT EXISTS idx_entity_compliance_results_certificate_id
  ON entity_compliance_results (certificate_id);

-- Notifications: organization_id + status for scheduled notification processing
CREATE INDEX IF NOT EXISTS idx_notifications_org_status
  ON notifications (organization_id, status, scheduled_date DESC);

-- Activity log: organization_id for dashboard feed
CREATE INDEX IF NOT EXISTS idx_activity_log_org_id
  ON activity_log (organization_id, created_at DESC);

-- Property entities: property_id for detail pages
CREATE INDEX IF NOT EXISTS idx_property_entities_property_id
  ON property_entities (property_id);
