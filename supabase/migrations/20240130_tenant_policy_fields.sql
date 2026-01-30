-- Add policy data fields to tenants table for storing extracted insurance data

-- Policy information
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_number text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_expiration_date date;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS insurance_company text;

-- Extracted coverage amounts
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_liability_amount numeric DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_property_damage_amount numeric DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_auto_liability_amount numeric DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_employers_liability_amount numeric DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_workers_comp text; -- 'Statutory' or amount

-- Additional insured verification
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_additional_insured text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_additional_insured boolean DEFAULT false;

-- Certificate holder verification
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_certificate_holder text;

-- Document storage
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_document_path text;

-- Full coverage data (JSON for flexibility)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_coverage jsonb;

-- Compliance issues array
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS compliance_issues text[];

-- Raw extracted data
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS raw_policy_data jsonb;

-- Last policy upload timestamp
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS policy_uploaded_at timestamptz;

-- Add comments
COMMENT ON COLUMN tenants.policy_number IS 'Insurance policy number';
COMMENT ON COLUMN tenants.policy_expiration_date IS 'Policy expiration date';
COMMENT ON COLUMN tenants.policy_liability_amount IS 'Personal liability coverage amount from policy';
COMMENT ON COLUMN tenants.policy_coverage IS 'Full coverage breakdown as JSON';
COMMENT ON COLUMN tenants.compliance_issues IS 'Array of compliance issues found';
COMMENT ON COLUMN tenants.policy_uploaded_at IS 'When the policy was last uploaded';
