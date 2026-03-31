-- ============================================================================
-- Add Additional Insured and Certificate Holder entity name columns to
-- requirement_templates. These store the specific entity names extracted from
-- leases so the compliance engine can match against them.
-- ============================================================================

ALTER TABLE requirement_templates
  ADD COLUMN IF NOT EXISTS additional_insured_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS certificate_holder_name TEXT DEFAULT NULL;
