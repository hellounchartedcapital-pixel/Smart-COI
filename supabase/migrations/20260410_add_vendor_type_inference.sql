-- ============================================================================
-- SmartCOI — Vendor Type Inference Columns
-- Adds vendor_type_needs_review flag to entities table for AI-inferred types
-- that have low confidence and need manual review. Also adds inferred vendor
-- type fields to certificates table so the data survives between extraction
-- and entity assignment.
-- ============================================================================

-- Add review flag to entities table
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS vendor_type_needs_review BOOLEAN NOT NULL DEFAULT false;

-- Add review flag to legacy vendors table (dual-write compatibility)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS vendor_type_needs_review BOOLEAN NOT NULL DEFAULT false;

-- Store inferred vendor type on certificates for retrieval during entity assignment
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS inferred_vendor_type TEXT,
  ADD COLUMN IF NOT EXISTS vendor_type_needs_review BOOLEAN NOT NULL DEFAULT false;
