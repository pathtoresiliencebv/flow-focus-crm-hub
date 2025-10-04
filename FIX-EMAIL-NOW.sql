-- ========================================
-- FIX EMAIL ACCOUNTS - RUN IN SUPABASE SQL EDITOR
-- ========================================

-- STEP 1: Check what accounts exist
SELECT 
  id,
  email_address,
  display_name,
  smtp_host,
  imap_host,
  connection_status,
  created_at
FROM email_accounts
ORDER BY created_at DESC;

-- You should see "info@smansonderhoud.nl" with NULL smtp_host and imap_host

-- STEP 2: Delete the old Gmail OAuth account
-- This is the account causing sync errors!
DELETE FROM email_accounts 
WHERE smtp_host IS NULL 
   OR imap_host IS NULL;

-- STEP 3: Verify deletion
SELECT 
  COUNT(*) as total_accounts,
  COUNT(CASE WHEN smtp_host IS NOT NULL THEN 1 END) as valid_accounts
FROM email_accounts;

-- Expected result: 0 accounts (both total_accounts and valid_accounts should be 0)

-- ========================================
-- After running this:
-- 1. Close Supabase SQL Editor
-- 2. Go to https://smanscrm.nl
-- 3. Hard refresh (Ctrl+Shift+R)
-- 4. Click "E-mail" - you should see the setup wizard!
-- ========================================

