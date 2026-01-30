-- Add default tenant insurance requirements to settings table

-- Default coverage requirements
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_liability_min numeric DEFAULT 100000;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_auto_liability_min numeric DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_workers_comp boolean DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_employers_liability_min numeric DEFAULT 0;

-- Default additional insured
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_requires_additional_insured boolean DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_additional_insured_text text DEFAULT '';

-- Default certificate holder
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_certificate_holder_name text DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_certificate_holder_address text DEFAULT '';

-- Default other requirements
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_cancellation_notice_days integer DEFAULT 30;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_requires_declarations_page boolean DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_default_requires_endorsement_pages boolean DEFAULT true;

-- Comments
COMMENT ON COLUMN settings.tenant_default_liability_min IS 'Default personal liability minimum for new tenants';
COMMENT ON COLUMN settings.tenant_default_requires_additional_insured IS 'Default: require additional insured for new tenants';
COMMENT ON COLUMN settings.tenant_default_certificate_holder_name IS 'Default certificate holder name for tenant policies';
