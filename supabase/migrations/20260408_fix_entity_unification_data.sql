-- ============================================================================
-- DATA FIX: Sync entity unification gaps (Apr 2026)
-- Run via Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================================

-- ============================================================================
-- 1. Create entities records for vendors that don't have one
-- ============================================================================
INSERT INTO entities (id, organization_id, property_id, name, entity_type, entity_category,
  contact_name, contact_email, contact_phone, template_id, compliance_status,
  archived_at, deleted_at, created_at)
SELECT
  v.id, v.organization_id, v.property_id, v.company_name, 'vendor', v.vendor_type,
  v.contact_name, v.contact_email, v.contact_phone, v.template_id, v.compliance_status,
  v.archived_at, v.deleted_at, v.created_at
FROM vendors v
WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = v.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Create entities records for tenants that don't have one
-- ============================================================================
INSERT INTO entities (id, organization_id, property_id, name, entity_type, entity_category,
  contact_name, contact_email, contact_phone, unit_suite, template_id, compliance_status,
  archived_at, deleted_at, created_at)
SELECT
  t.id, t.organization_id, t.property_id, t.company_name, 'tenant', t.tenant_type,
  t.contact_name, t.contact_email, t.contact_phone, t.unit_suite, t.template_id, t.compliance_status,
  t.archived_at, t.deleted_at, t.created_at
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = t.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Create vendor records for entities of type 'vendor' that don't have one
-- ============================================================================
INSERT INTO vendors (id, organization_id, property_id, company_name, vendor_type,
  contact_name, contact_email, contact_phone, template_id, compliance_status,
  archived_at, deleted_at, created_at)
SELECT
  e.id, e.organization_id, e.property_id, e.name, e.entity_category,
  e.contact_name, e.contact_email, e.contact_phone, e.template_id, e.compliance_status,
  e.archived_at, e.deleted_at, e.created_at
FROM entities e
WHERE e.entity_type IN ('vendor', 'subcontractor', 'carrier', 'supplier', 'contractor', 'provider', 'partner')
  AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id = e.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Create tenant records for entities of type 'tenant' that don't have one
-- ============================================================================
INSERT INTO tenants (id, organization_id, property_id, company_name, tenant_type,
  contact_name, contact_email, contact_phone, unit_suite, template_id, compliance_status,
  archived_at, deleted_at, created_at)
SELECT
  e.id, e.organization_id, e.property_id, e.name, e.entity_category,
  e.contact_name, e.contact_email, e.contact_phone, e.unit_suite, e.template_id, e.compliance_status,
  e.archived_at, e.deleted_at, e.created_at
FROM entities e
WHERE e.entity_type = 'tenant'
  AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = e.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. Sync template_id from legacy to entities where entities has NULL
-- ============================================================================
UPDATE entities e
SET template_id = COALESCE(
  (SELECT v.template_id FROM vendors v WHERE v.id = e.id AND v.template_id IS NOT NULL),
  (SELECT t.template_id FROM tenants t WHERE t.id = e.id AND t.template_id IS NOT NULL)
)
WHERE e.template_id IS NULL
  AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = e.id AND v.template_id IS NOT NULL
    UNION ALL
    SELECT 1 FROM tenants t WHERE t.id = e.id AND t.template_id IS NOT NULL
  );

-- ============================================================================
-- 6. Sync template_id from entities to legacy where legacy has NULL
-- ============================================================================
UPDATE vendors v
SET template_id = e.template_id
FROM entities e
WHERE e.id = v.id
  AND v.template_id IS NULL
  AND e.template_id IS NOT NULL;

UPDATE tenants t
SET template_id = e.template_id
FROM entities e
WHERE e.id = t.id
  AND t.template_id IS NULL
  AND e.template_id IS NOT NULL;

-- ============================================================================
-- 7. Sync compliance_status between entities and legacy tables
--    (take the more specific status — anything beats 'pending' and 'under_review')
-- ============================================================================
UPDATE entities e
SET compliance_status = COALESCE(
  (SELECT v.compliance_status FROM vendors v WHERE v.id = e.id AND v.compliance_status NOT IN ('pending', 'under_review')),
  (SELECT t.compliance_status FROM tenants t WHERE t.id = e.id AND t.compliance_status NOT IN ('pending', 'under_review')),
  e.compliance_status
)
WHERE e.compliance_status IN ('pending', 'under_review')
  AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = e.id AND v.compliance_status NOT IN ('pending', 'under_review')
    UNION ALL
    SELECT 1 FROM tenants t WHERE t.id = e.id AND t.compliance_status NOT IN ('pending', 'under_review')
  );

UPDATE vendors v
SET compliance_status = e.compliance_status
FROM entities e
WHERE e.id = v.id
  AND v.compliance_status IN ('pending', 'under_review')
  AND e.compliance_status NOT IN ('pending', 'under_review');

UPDATE tenants t
SET compliance_status = e.compliance_status
FROM entities e
WHERE e.id = t.id
  AND t.compliance_status IN ('pending', 'under_review')
  AND e.compliance_status NOT IN ('pending', 'under_review');

-- ============================================================================
-- 8. Set entity_id on certificates that only have vendor_id or tenant_id
-- ============================================================================
UPDATE certificates c
SET entity_id = COALESCE(c.vendor_id, c.tenant_id)
WHERE c.entity_id IS NULL
  AND (c.vendor_id IS NOT NULL OR c.tenant_id IS NOT NULL);

-- ============================================================================
-- 9. Set vendor_id/tenant_id on certificates that only have entity_id
-- ============================================================================
UPDATE certificates c
SET vendor_id = c.entity_id
FROM entities e
WHERE e.id = c.entity_id
  AND c.vendor_id IS NULL
  AND c.tenant_id IS NULL
  AND e.entity_type != 'tenant';

UPDATE certificates c
SET tenant_id = c.entity_id
FROM entities e
WHERE e.id = c.entity_id
  AND c.tenant_id IS NULL
  AND e.entity_type = 'tenant';

-- ============================================================================
-- 10. Verify: count orphaned records (should all be 0 after running above)
-- ============================================================================
SELECT 'vendors_without_entity' AS check_type, COUNT(*) AS cnt
FROM vendors v WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = v.id)
UNION ALL
SELECT 'tenants_without_entity', COUNT(*)
FROM tenants t WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = t.id)
UNION ALL
SELECT 'entities_without_legacy', COUNT(*)
FROM entities e WHERE NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id = e.id)
  AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = e.id)
UNION ALL
SELECT 'certs_without_entity_id', COUNT(*)
FROM certificates c WHERE c.entity_id IS NULL AND (c.vendor_id IS NOT NULL OR c.tenant_id IS NOT NULL)
UNION ALL
SELECT 'certs_with_entity_id_but_no_legacy', COUNT(*)
FROM certificates c WHERE c.entity_id IS NOT NULL AND c.vendor_id IS NULL AND c.tenant_id IS NULL;
