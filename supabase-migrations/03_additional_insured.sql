-- Add additional insured verification columns to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS require_additional_insured BOOLEAN DEFAULT TRUE;

-- Add additional insured fields to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS additional_insured TEXT,
ADD COLUMN IF NOT EXISTS certificate_holder TEXT,
ADD COLUMN IF NOT EXISTS has_additional_insured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS missing_additional_insured BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_additional_insured ON vendors(has_additional_insured);
CREATE INDEX IF NOT EXISTS idx_vendors_missing_additional_insured ON vendors(missing_additional_insured);
