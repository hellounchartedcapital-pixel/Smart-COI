-- ============================================================================
-- SmartCOI — Fix ALL certificates CHECK constraints for batch upload flow
--
-- The batch processing flow creates certificate records before entity
-- assignment and uses 'user_upload' as upload_source. Multiple inline CHECK
-- constraints from earlier migrations may block these inserts.
--
-- This migration drops ALL existing CHECK constraints on the certificates
-- table and re-creates them with correct allowed values.
-- ============================================================================

-- ============================================================================
-- 1. Drop all CHECK constraints on the certificates table
--    (Postgres auto-names inline constraints; we need to find and drop them)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'certificates'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'  -- CHECK constraints only
  LOOP
    EXECUTE format('ALTER TABLE certificates DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- ============================================================================
-- 2. Re-create constraints with correct values
-- ============================================================================

-- upload_source: allow 'user_upload' (dashboard/onboarding), 'pm_upload' (legacy), 'portal_upload'
ALTER TABLE certificates
  ADD CONSTRAINT certificates_upload_source_check
  CHECK (upload_source IN ('user_upload', 'pm_upload', 'portal_upload'));

-- processing_status: standard lifecycle states
ALTER TABLE certificates
  ADD CONSTRAINT certificates_processing_status_check
  CHECK (processing_status IN ('processing', 'extracted', 'review_confirmed', 'failed'));

-- entity FK: require at least one entity FK except during initial processing
ALTER TABLE certificates
  ADD CONSTRAINT certificates_has_entity_check
  CHECK (
    processing_status = 'processing'
    OR entity_id IS NOT NULL
    OR vendor_id IS NOT NULL
    OR tenant_id IS NOT NULL
  );
