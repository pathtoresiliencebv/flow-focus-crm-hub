-- CLEANUP PLAIN TEXT EMAIL ACCOUNTS
-- Run this in Supabase SQL Editor to remove old accounts with unencrypted passwords

-- ⚠️ WARNING: This will delete ALL existing email accounts!
-- They will need to be re-added through the UI with proper encryption

-- STEP 1: View all existing accounts (CHECK FIRST!)
SELECT 
  id,
  email_address,
  display_name,
  smtp_host,
  imap_host,
  connection_status,
  created_at,
  -- Check if passwords look encrypted (should contain : character)
  CASE 
    WHEN smtp_password LIKE '%:%' THEN 'Encrypted'
    ELSE 'PLAIN TEXT ❌'
  END as smtp_password_status,
  CASE 
    WHEN imap_password LIKE '%:%' THEN 'Encrypted'
    ELSE 'PLAIN TEXT ❌'
  END as imap_password_status
FROM email_accounts
ORDER BY created_at DESC;

-- STEP 2: Delete accounts with plain text passwords
-- ⚠️ UNCOMMENT ONLY AFTER REVIEWING STEP 1 RESULTS!
/*
DELETE FROM email_accounts 
WHERE smtp_password NOT LIKE '%:%' 
   OR imap_password NOT LIKE '%:%';
*/

-- STEP 3: Verify cleanup
-- Should return 0 rows (or only encrypted accounts)
SELECT COUNT(*) as remaining_accounts FROM email_accounts;

-- STEP 4: Also delete related data if needed
/*
DELETE FROM email_threads WHERE account_id NOT IN (SELECT id FROM email_accounts);
DELETE FROM email_messages WHERE thread_id NOT IN (SELECT id FROM email_threads);
*/

---------------------------------------------------
-- AFTER CLEANUP:
-- 1. Make sure EMAIL_ENCRYPTION_KEY is set in Supabase Edge Function Secrets
-- 2. Go to your CRM → Postvak IN
-- 3. Add your email account again
-- 4. It will now be properly encrypted!
---------------------------------------------------

