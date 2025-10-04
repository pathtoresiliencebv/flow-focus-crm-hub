-- CLEANUP OLD EMAIL ACCOUNTS
-- Run this in Supabase SQL Editor to remove old Gmail OAuth accounts
-- and prepare for new SMTP/IMAP setup

-- First, let's see what's in the database
SELECT 
  id,
  user_id,
  email_address,
  display_name,
  smtp_host,
  imap_host,
  connection_status,
  created_at
FROM email_accounts
ORDER BY created_at DESC;

-- If you see accounts with NULL smtp_host and imap_host, those are old Gmail OAuth accounts
-- You can safely delete them:

/*
DELETE FROM email_accounts 
WHERE smtp_host IS NULL 
  AND imap_host IS NULL;
*/

-- ⚠️ UNCOMMENT THE DELETE STATEMENT ABOVE AFTER REVIEWING THE SELECT RESULTS

-- After deletion, refresh your browser and the SMTP/IMAP setup wizard should appear!

