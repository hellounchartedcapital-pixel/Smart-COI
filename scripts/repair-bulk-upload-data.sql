-- ============================================================================
-- SmartCOI — Repair Bulk Upload Data
-- ============================================================================
-- Paste this into the Supabase SQL Editor and run.
-- It fixes two issues from the bulk upload feature:
--
-- 1. Vendors/tenants whose company_name contains ".pdf"
--    → Replaces with the insured_name from their latest certificate
--    → Falls back to stripping ".pdf" from the existing name
--
-- 2. Orphaned bulk-upload certificates (vendor_id IS NULL)
--    → Links them to matching vendors by insured_name
--
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- ============================================================================
-- FIX 1: Rename vendors with ".pdf" in company_name
-- ============================================================================

-- Use the certificate's insured_name if available, else strip .pdf
UPDATE vendors v
SET company_name = COALESCE(
  (
    SELECT c.insured_name
    FROM certificates c
    WHERE c.vendor_id = v.id
      AND c.insured_name IS NOT NULL
      AND c.insured_name != ''
    ORDER BY c.uploaded_at DESC
    LIMIT 1
  ),
  regexp_replace(v.company_name, '\.pdf$', '', 'i')
)
WHERE v.company_name LIKE '%.pdf%'
  AND v.deleted_at IS NULL;

-- Same for tenants
UPDATE tenants t
SET company_name = COALESCE(
  (
    SELECT c.insured_name
    FROM certificates c
    WHERE c.tenant_id = t.id
      AND c.insured_name IS NOT NULL
      AND c.insured_name != ''
    ORDER BY c.uploaded_at DESC
    LIMIT 1
  ),
  regexp_replace(t.company_name, '\.pdf$', '', 'i')
)
WHERE t.company_name LIKE '%.pdf%'
  AND t.deleted_at IS NULL;


-- ============================================================================
-- FIX 2: Link orphaned bulk-upload certificates to matching vendors
-- ============================================================================

-- Match by: exact name (case-insensitive), or one contains the other
UPDATE certificates c
SET vendor_id = matched.vendor_id
FROM (
  SELECT DISTINCT ON (c2.id)
    c2.id AS cert_id,
    v.id AS vendor_id
  FROM certificates c2
  JOIN vendors v
    ON c2.organization_id = v.organization_id
    AND v.deleted_at IS NULL
    AND (
      lower(trim(v.company_name)) = lower(trim(c2.insured_name))
      OR lower(trim(v.company_name)) LIKE '%' || lower(trim(c2.insured_name)) || '%'
      OR lower(trim(c2.insured_name)) LIKE '%' || lower(trim(v.company_name)) || '%'
    )
  WHERE c2.file_path LIKE 'bulk/%'
    AND c2.vendor_id IS NULL
    AND c2.tenant_id IS NULL
    AND c2.processing_status = 'extracted'
    AND c2.insured_name IS NOT NULL
    AND c2.insured_name != ''
  ORDER BY c2.id, v.created_at ASC
) matched
WHERE c.id = matched.cert_id;


-- ============================================================================
-- VERIFY: Check results
-- ============================================================================

-- Should return 0 rows if all .pdf names are fixed:
SELECT id, company_name FROM vendors WHERE company_name LIKE '%.pdf%' AND deleted_at IS NULL;
SELECT id, company_name FROM tenants WHERE company_name LIKE '%.pdf%' AND deleted_at IS NULL;

-- Should return 0 rows if all orphaned certs are linked:
SELECT id, file_path, insured_name
FROM certificates
WHERE file_path LIKE 'bulk/%'
  AND vendor_id IS NULL
  AND tenant_id IS NULL
  AND processing_status = 'extracted';
