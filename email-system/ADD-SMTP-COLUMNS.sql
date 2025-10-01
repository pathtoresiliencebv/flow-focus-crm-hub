-- Add SMTP/IMAP configuration columns to email_accounts table
-- Run this in Supabase SQL Editor

-- Add SMTP columns
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true;

-- Add IMAP columns
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS imap_host TEXT,
ADD COLUMN IF NOT EXISTS imap_port INTEGER DEFAULT 993,
ADD COLUMN IF NOT EXISTS imap_username TEXT,
ADD COLUMN IF NOT EXISTS imap_password TEXT;

-- Add display_name column if not exists
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update provider to allow 'smtp' value
-- The provider column is already TEXT so it can accept 'smtp' value

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_accounts_provider 
ON email_accounts(provider);

-- Comments
COMMENT ON COLUMN email_accounts.smtp_host IS 'SMTP server hostname (e.g., smtp.gmail.com)';
COMMENT ON COLUMN email_accounts.smtp_port IS 'SMTP server port (typically 587 for TLS, 465 for SSL)';
COMMENT ON COLUMN email_accounts.smtp_username IS 'SMTP authentication username';
COMMENT ON COLUMN email_accounts.smtp_password IS 'SMTP authentication password (encrypted)';
COMMENT ON COLUMN email_accounts.smtp_secure IS 'Use TLS/SSL for SMTP connection';
COMMENT ON COLUMN email_accounts.imap_host IS 'IMAP server hostname (e.g., imap.gmail.com)';
COMMENT ON COLUMN email_accounts.imap_port IS 'IMAP server port (typically 993 for SSL)';
COMMENT ON COLUMN email_accounts.imap_username IS 'IMAP authentication username';
COMMENT ON COLUMN email_accounts.imap_password IS 'IMAP authentication password (encrypted)';
COMMENT ON COLUMN email_accounts.display_name IS 'Display name for email account';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_accounts' 
AND column_name IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_secure',
                    'imap_host', 'imap_port', 'imap_username', 'imap_password', 'display_name')
ORDER BY column_name;

