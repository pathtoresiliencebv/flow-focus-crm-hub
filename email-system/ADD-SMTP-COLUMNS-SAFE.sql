-- SAFE VERSION: Add SMTP/IMAP configuration columns to email_accounts table
-- This version can be run multiple times without errors
-- Run this in Supabase SQL Editor

-- Add SMTP columns (IF NOT EXISTS to prevent errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='smtp_host') THEN
        ALTER TABLE email_accounts ADD COLUMN smtp_host TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='smtp_port') THEN
        ALTER TABLE email_accounts ADD COLUMN smtp_port INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='smtp_username') THEN
        ALTER TABLE email_accounts ADD COLUMN smtp_username TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='smtp_password') THEN
        ALTER TABLE email_accounts ADD COLUMN smtp_password TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='smtp_secure') THEN
        ALTER TABLE email_accounts ADD COLUMN smtp_secure BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add IMAP columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='imap_host') THEN
        ALTER TABLE email_accounts ADD COLUMN imap_host TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='imap_port') THEN
        ALTER TABLE email_accounts ADD COLUMN imap_port INTEGER DEFAULT 993;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='imap_username') THEN
        ALTER TABLE email_accounts ADD COLUMN imap_username TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='imap_password') THEN
        ALTER TABLE email_accounts ADD COLUMN imap_password TEXT;
    END IF;
END $$;

-- Add display_name column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='email_accounts' AND column_name='display_name') THEN
        ALTER TABLE email_accounts ADD COLUMN display_name TEXT;
    END IF;
END $$;

-- Update provider constraint to allow 'smtp' value
-- First drop the old constraint if it exists
ALTER TABLE email_accounts DROP CONSTRAINT IF EXISTS email_accounts_provider_check;

-- Add new constraint that includes 'smtp'
ALTER TABLE email_accounts 
ADD CONSTRAINT email_accounts_provider_check 
CHECK (provider IN ('gmail', 'outlook', 'imap', 'smtp'));

-- Create indexes for faster lookups (IF NOT EXISTS is built-in)
CREATE INDEX IF NOT EXISTS idx_email_accounts_provider 
ON email_accounts(provider);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user_provider 
ON email_accounts(user_id, provider);

-- Add comments
DO $$
BEGIN
    EXECUTE 'COMMENT ON COLUMN email_accounts.smtp_host IS ''SMTP server hostname (e.g., smtp.gmail.com)''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.smtp_port IS ''SMTP server port (typically 587 for TLS, 465 for SSL)''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.smtp_username IS ''SMTP authentication username''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.smtp_password IS ''SMTP authentication password (encrypted)''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.smtp_secure IS ''Use TLS/SSL for SMTP connection''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.imap_host IS ''IMAP server hostname (e.g., imap.gmail.com)''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.imap_port IS ''IMAP server port (typically 993 for SSL)''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.imap_username IS ''IMAP authentication username''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.imap_password IS ''IMAP authentication password (encrypted)''';
    EXECUTE 'COMMENT ON COLUMN email_accounts.display_name IS ''Display name for email account''';
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_accounts' 
AND column_name IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_secure',
                    'imap_host', 'imap_port', 'imap_username', 'imap_password', 'display_name')
ORDER BY column_name;

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'email_accounts'::regclass 
AND conname = 'email_accounts_provider_check';

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ SMTP/IMAP columns added successfully!';
    RAISE NOTICE '✅ Provider constraint updated to include smtp';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE 'You can now add SMTP accounts via the UI';
END $$;

