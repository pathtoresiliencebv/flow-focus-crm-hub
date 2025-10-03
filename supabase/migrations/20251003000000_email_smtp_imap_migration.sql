-- ================================================================
-- EMAIL SMTP/IMAP MIGRATION
-- ================================================================
-- Purpose: Replace Gmail OAuth with configurable SMTP/IMAP settings
-- Date: 2025-10-03
-- Impact: Medium - Email functionality will be reconfigured
-- ================================================================

-- STEP 1: Backup existing data structure
-- Note: Supabase automatically backs up, but document the old structure
COMMENT ON TABLE email_accounts IS 'Email accounts with SMTP/IMAP configuration (migrated from Gmail OAuth on 2025-10-03)';

-- STEP 2: Check if we need to handle existing OAuth columns
DO $$
BEGIN
  -- Check if old OAuth columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'access_token'
  ) THEN
    RAISE NOTICE 'Old OAuth columns detected - will be dropped';
  END IF;
END $$;

-- STEP 3: Drop OAuth-related columns (if they exist)
ALTER TABLE email_accounts 
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS token_expires_at;

-- STEP 4: Add SMTP configuration columns
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
  ADD COLUMN IF NOT EXISTS smtp_username TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS smtp_password TEXT DEFAULT '', -- Will be encrypted in app
  ADD COLUMN IF NOT EXISTS smtp_encryption TEXT DEFAULT 'tls' CHECK (smtp_encryption IN ('tls', 'ssl', 'none'));

-- STEP 5: Add IMAP configuration columns
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS imap_host TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS imap_port INTEGER DEFAULT 993,
  ADD COLUMN IF NOT EXISTS imap_username TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS imap_password TEXT DEFAULT '', -- Will be encrypted in app
  ADD COLUMN IF NOT EXISTS imap_encryption TEXT DEFAULT 'ssl' CHECK (imap_encryption IN ('ssl', 'tls', 'none'));

-- STEP 6: Add sync configuration
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_interval INTEGER DEFAULT 5, -- minutes
  ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

-- STEP 7: Add connection status tracking
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'unconfigured' 
    CHECK (connection_status IN ('unconfigured', 'testing', 'connected', 'error')),
  ADD COLUMN IF NOT EXISTS last_connection_test TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS connection_test_result JSONB;

-- STEP 8: Make display_name optional (can be derived from email)
ALTER TABLE email_accounts
  ALTER COLUMN display_name DROP NOT NULL;

-- STEP 9: Add primary account flag if not exists
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- STEP 10: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_sync 
  ON email_accounts(user_id, sync_enabled, last_sync_at);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user_primary 
  ON email_accounts(user_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_email_accounts_status 
  ON email_accounts(connection_status, last_connection_test);

-- STEP 11: Try to migrate existing Gmail accounts to new format
-- This sets reasonable defaults for Gmail, but users must re-enter credentials
UPDATE email_accounts 
SET 
  smtp_host = 'smtp.gmail.com',
  smtp_port = 587,
  smtp_username = email_address,
  smtp_encryption = 'tls',
  imap_host = 'imap.gmail.com',
  imap_port = 993,
  imap_username = email_address,
  imap_encryption = 'ssl',
  sync_enabled = false, -- Disable until user configures
  connection_status = 'unconfigured'
WHERE 
  smtp_host IS NULL OR smtp_host = ''
  OR imap_host IS NULL OR imap_host = '';

-- STEP 12: Add comments for documentation
COMMENT ON COLUMN email_accounts.smtp_host IS 'SMTP server hostname (e.g., smtp.gmail.com)';
COMMENT ON COLUMN email_accounts.smtp_port IS 'SMTP server port (usually 587 for TLS, 465 for SSL)';
COMMENT ON COLUMN email_accounts.smtp_username IS 'SMTP authentication username (usually email address)';
COMMENT ON COLUMN email_accounts.smtp_password IS 'Encrypted SMTP password (AES-256)';
COMMENT ON COLUMN email_accounts.smtp_encryption IS 'SMTP encryption method: tls, ssl, or none';
COMMENT ON COLUMN email_accounts.imap_host IS 'IMAP server hostname (e.g., imap.gmail.com)';
COMMENT ON COLUMN email_accounts.imap_port IS 'IMAP server port (usually 993 for SSL, 143 for TLS)';
COMMENT ON COLUMN email_accounts.imap_username IS 'IMAP authentication username (usually email address)';
COMMENT ON COLUMN email_accounts.imap_password IS 'Encrypted IMAP password (AES-256)';
COMMENT ON COLUMN email_accounts.imap_encryption IS 'IMAP encryption method: ssl, tls, or none';
COMMENT ON COLUMN email_accounts.sync_enabled IS 'Whether automatic email synchronization is enabled';
COMMENT ON COLUMN email_accounts.sync_interval IS 'Sync interval in minutes (default: 5)';
COMMENT ON COLUMN email_accounts.connection_status IS 'Current connection status';
COMMENT ON COLUMN email_accounts.last_error IS 'Last error message from sync or send operation';

-- STEP 13: Create helper function to validate email account configuration
CREATE OR REPLACE FUNCTION validate_email_account_config(account_id UUID)
RETURNS JSONB AS $$
DECLARE
  account RECORD;
  errors TEXT[] := ARRAY[]::TEXT[];
  warnings TEXT[] := ARRAY[]::TEXT[];
  result JSONB;
BEGIN
  SELECT * INTO account FROM email_accounts WHERE id = account_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', jsonb_build_array('Account not found')
    );
  END IF;
  
  -- Check SMTP configuration
  IF account.smtp_host IS NULL OR account.smtp_host = '' THEN
    errors := array_append(errors, 'SMTP host is required');
  END IF;
  
  IF account.smtp_port IS NULL OR account.smtp_port <= 0 THEN
    errors := array_append(errors, 'SMTP port must be a positive number');
  END IF;
  
  IF account.smtp_username IS NULL OR account.smtp_username = '' THEN
    errors := array_append(errors, 'SMTP username is required');
  END IF;
  
  IF account.smtp_password IS NULL OR account.smtp_password = '' THEN
    errors := array_append(errors, 'SMTP password is required');
  END IF;
  
  -- Check IMAP configuration
  IF account.imap_host IS NULL OR account.imap_host = '' THEN
    errors := array_append(errors, 'IMAP host is required');
  END IF;
  
  IF account.imap_port IS NULL OR account.imap_port <= 0 THEN
    errors := array_append(errors, 'IMAP port must be a positive number');
  END IF;
  
  IF account.imap_username IS NULL OR account.imap_username = '' THEN
    errors := array_append(errors, 'IMAP username is required');
  END IF;
  
  IF account.imap_password IS NULL OR account.imap_password = '' THEN
    errors := array_append(errors, 'IMAP password is required');
  END IF;
  
  -- Warnings
  IF account.smtp_port NOT IN (25, 465, 587, 2525) THEN
    warnings := array_append(warnings, 'Unusual SMTP port - verify this is correct');
  END IF;
  
  IF account.imap_port NOT IN (143, 993) THEN
    warnings := array_append(warnings, 'Unusual IMAP port - verify this is correct');
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'valid', array_length(errors, 1) IS NULL,
    'errors', array_to_json(errors),
    'warnings', array_to_json(warnings)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 14: Create function to get email account for sync
CREATE OR REPLACE FUNCTION get_accounts_for_sync()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email_address TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_encryption TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  imap_encryption TEXT,
  last_sync_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ea.id,
    ea.user_id,
    ea.email_address,
    ea.smtp_host,
    ea.smtp_port,
    ea.smtp_username,
    ea.smtp_password,
    ea.smtp_encryption,
    ea.imap_host,
    ea.imap_port,
    ea.imap_username,
    ea.imap_password,
    ea.imap_encryption,
    ea.last_sync_at
  FROM email_accounts ea
  WHERE 
    ea.sync_enabled = true
    AND ea.is_active = true
    AND ea.connection_status = 'connected'
    AND (
      ea.last_sync_at IS NULL 
      OR ea.last_sync_at < NOW() - (ea.sync_interval || ' minutes')::INTERVAL
    )
  ORDER BY ea.last_sync_at ASC NULLS FIRST
  LIMIT 10; -- Process max 10 accounts per run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 15: Update RLS policies (ensure they still work with new columns)
-- The existing RLS policies should still work since we're only adding columns

-- Verify RLS is enabled
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- STEP 16: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON email_accounts TO authenticated;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Next steps:
-- 1. Users must reconfigure their email accounts with SMTP/IMAP settings
-- 2. Deploy new Edge Functions: imap-sync, smtp-send, test-email-connection
-- 3. Update frontend to use new SMTPIMAPSetup component
-- 4. Test with multiple email providers
-- ================================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE '✅ Email SMTP/IMAP migration completed successfully';
  RAISE NOTICE '⚠️  Users must reconfigure email accounts';
  RAISE NOTICE '📝 See: EMAIL-SMTP-IMAP-SETUP.md for setup instructions';
END $$;

