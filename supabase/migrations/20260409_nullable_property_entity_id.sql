-- ============================================================================
-- Migration: Make entity_compliance_results.property_entity_id nullable
--
-- Context: The multi-industry expansion made properties/locations optional.
-- Non-PM entities use organization_default_entities for entity matching,
-- which don't exist in the property_entities table. The NOT NULL constraint
-- on property_entity_id causes FK violations when compliance runs for these
-- entities.
--
-- Safe to run on production — only drops the NOT NULL constraint, does not
-- change existing data or delete anything.
-- ============================================================================

ALTER TABLE entity_compliance_results
  ALTER COLUMN property_entity_id DROP NOT NULL;
