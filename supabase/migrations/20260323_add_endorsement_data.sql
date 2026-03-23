-- Add endorsement_data JSONB column to certificates table
-- Stores an array of endorsement records extracted from multi-page COI PDFs
-- Each record contains: type, form_number, edition_date, found, named_parties, description
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS endorsement_data JSONB DEFAULT NULL;
