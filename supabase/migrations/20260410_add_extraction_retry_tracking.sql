-- ============================================================================
-- SmartCOI — Extraction Retry Tracking Columns
-- Tracks per-certificate retry attempts and last error for failed extractions.
-- ============================================================================

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;
