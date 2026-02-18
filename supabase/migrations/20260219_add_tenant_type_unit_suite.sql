-- Add missing tenant_type and unit_suite columns to tenants table.
--
-- These columns were present in earlier incremental migrations
-- (20260213_property_insured_tenant_type.sql, 20260215_definitive_schema.sql)
-- but were omitted when 20260217_fresh_setup.sql recreated all tables from scratch.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_type TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS unit_suite TEXT;
