-- DELETE OLD EMAIL ACCOUNT
-- Run this in Supabase SQL Editor to permanently remove the old Gmail OAuth account

-- First, check what will be deleted
SELECT 
  id,
  email_address,
  display_name,
  smtp_host,
  imap_host,
  created_at
FROM email_accounts
WHERE smtp_host IS NULL OR imap_host IS NULL;

-- If you see "info@smansonderhoud.nl" or other old accounts, delete them:
DELETE FROM email_accounts 
WHERE smtp_host IS NULL OR imap_host IS NULL;

-- Verify deletion
SELECT COUNT(*) as remaining_accounts FROM email_accounts;

-- After running this, refresh your browser and the setup wizard should appear!

