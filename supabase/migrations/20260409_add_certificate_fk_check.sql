-- ============================================================================
-- Migration: Add CHECK constraint to certificates table
-- Ensures at least one of entity_id, vendor_id, or tenant_id is non-null
-- ============================================================================
--
-- ⚠️ ACTION REQUIRED: Run this in Supabase SQL Editor
--
-- This prevents orphaned certificates that have no entity association.
-- Existing orphaned certificates (all three FKs null) must be fixed first
-- by running 20260408_fix_orphaned_bulk_upload_certs.sql.
-- ============================================================================

-- First, verify there are no existing violations
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM certificates
  WHERE entity_id IS NULL AND vendor_id IS NULL AND tenant_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % certificates with all three FKs null. Fix these before adding the constraint.', orphan_count;
  END IF;
END $$;

-- Add the CHECK constraint (will fail if orphaned records exist)
ALTER TABLE certificates
  ADD CONSTRAINT certificates_has_entity_check
  CHECK (entity_id IS NOT NULL OR vendor_id IS NOT NULL OR tenant_id IS NOT NULL);
