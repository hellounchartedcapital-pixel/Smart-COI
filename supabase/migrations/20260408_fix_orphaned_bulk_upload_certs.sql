-- ============================================================================
-- DATA FIX: Link orphaned bulk-upload certificates to entities (Apr 2026)
-- Run via Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Certificates uploaded during onboarding bulk upload were created without
-- entity_id/vendor_id/tenant_id. This script matches them to entities by
-- insured_name and links them.
-- ============================================================================

-- ============================================================================
-- 1. Show orphaned certificates (for audit before fixing)
-- ============================================================================
SELECT
  c.id AS certificate_id,
  c.insured_name,
  c.organization_id,
  c.processing_status,
  c.uploaded_at
FROM certificates c
WHERE c.entity_id IS NULL
  AND c.vendor_id IS NULL
  AND c.tenant_id IS NULL
  AND c.insured_name IS NOT NULL
  AND c.processing_status IN ('extracted', 'review_confirmed')
ORDER BY c.uploaded_at DESC;

-- ============================================================================
-- 2. Create entities for orphaned certs whose insured_name doesn't match
--    any existing entity in the org (insert as 'vendor' type by default)
-- ============================================================================
INSERT INTO entities (organization_id, name, entity_type, compliance_status)
SELECT DISTINCT
  c.organization_id,
  c.insured_name,
  'vendor',
  'under_review'
FROM certificates c
WHERE c.entity_id IS NULL
  AND c.vendor_id IS NULL
  AND c.tenant_id IS NULL
  AND c.insured_name IS NOT NULL
  AND c.processing_status IN ('extracted', 'review_confirmed')
  AND NOT EXISTS (
    SELECT 1 FROM entities e
    WHERE e.organization_id = c.organization_id
      AND LOWER(e.name) = LOWER(c.insured_name)
      AND e.deleted_at IS NULL
  )
ON CONFLICT DO NOTHING;

-- Also create matching vendor records for the new entities
INSERT INTO vendors (id, organization_id, company_name, compliance_status)
SELECT e.id, e.organization_id, e.name, e.compliance_status
FROM entities e
WHERE NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id = e.id)
  AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = e.id)
  AND e.entity_type = 'vendor'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Link orphaned certificates to matching entities by insured_name
--    Set entity_id AND vendor_id (assumes vendor type — most common)
-- ============================================================================
UPDATE certificates c
SET
  entity_id = matched.entity_id,
  vendor_id = matched.entity_id
FROM (
  SELECT DISTINCT ON (c2.id)
    c2.id AS cert_id,
    e.id AS entity_id
  FROM certificates c2
  JOIN entities e ON e.organization_id = c2.organization_id
    AND LOWER(e.name) = LOWER(c2.insured_name)
    AND e.deleted_at IS NULL
  WHERE c2.entity_id IS NULL
    AND c2.vendor_id IS NULL
    AND c2.tenant_id IS NULL
    AND c2.insured_name IS NOT NULL
    AND c2.processing_status IN ('extracted', 'review_confirmed')
  ORDER BY c2.id, e.created_at ASC
) matched
WHERE c.id = matched.cert_id;

-- For tenant-type entities, fix the vendor_id → tenant_id
UPDATE certificates c
SET
  vendor_id = NULL,
  tenant_id = c.entity_id
FROM entities e
WHERE e.id = c.entity_id
  AND e.entity_type = 'tenant'
  AND c.vendor_id = c.entity_id
  AND c.tenant_id IS NULL;

-- ============================================================================
-- 4. Update entity compliance status to under_review for newly linked entities
-- ============================================================================
UPDATE entities e
SET compliance_status = 'under_review'
WHERE e.compliance_status = 'pending'
  AND EXISTS (
    SELECT 1 FROM certificates c
    WHERE c.entity_id = e.id
      AND c.processing_status IN ('extracted', 'review_confirmed')
  );

UPDATE vendors v
SET compliance_status = 'under_review'
FROM entities e
WHERE e.id = v.id
  AND v.compliance_status = 'pending'
  AND e.compliance_status = 'under_review';

-- ============================================================================
-- 5. Verify: count remaining orphaned certificates (should be 0)
-- ============================================================================
SELECT 'orphaned_certs_with_insured_name' AS check_type, COUNT(*) AS cnt
FROM certificates c
WHERE c.entity_id IS NULL
  AND c.vendor_id IS NULL
  AND c.tenant_id IS NULL
  AND c.insured_name IS NOT NULL
  AND c.processing_status IN ('extracted', 'review_confirmed')
UNION ALL
SELECT 'orphaned_certs_total', COUNT(*)
FROM certificates c
WHERE c.entity_id IS NULL
  AND c.vendor_id IS NULL
  AND c.tenant_id IS NULL
  AND c.processing_status IN ('extracted', 'review_confirmed');
