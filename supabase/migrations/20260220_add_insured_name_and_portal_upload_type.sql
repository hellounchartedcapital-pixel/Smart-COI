-- Add insured_name column to certificates for vendor name matching
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS insured_name TEXT;

-- Update notification type constraint to include 'portal_upload'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('expiration_warning', 'gap_notification', 'follow_up_reminder', 'escalation', 'portal_upload'));
