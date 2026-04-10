-- ============================================================================
-- SmartCOI — Fix certificates_has_entity_check for batch upload flow
--
-- The batch processing flow (Phase 1B) creates certificate records BEFORE
-- entity assignment — the cert is uploaded to storage first, then extracted,
-- then assigned to an entity. The original CHECK constraint required at
-- least one entity FK to be set at INSERT time, which blocks batch uploads.
--
-- Fix: allow NULL entity FKs when processing_status is 'processing' (cert
-- just created, extraction pending). All other statuses still require at
-- least one entity FK.
-- ============================================================================

-- Drop the existing strict constraint
ALTER TABLE certificates
  DROP CONSTRAINT IF EXISTS certificates_has_entity_check;

-- Add the relaxed constraint: entity required except during initial processing
ALTER TABLE certificates
  ADD CONSTRAINT certificates_has_entity_check
  CHECK (
    processing_status = 'processing'
    OR entity_id IS NOT NULL
    OR vendor_id IS NOT NULL
    OR tenant_id IS NOT NULL
  );
