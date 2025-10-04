-- Fix email_accounts provider constraint to allow 'smtp'
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE email_accounts 
DROP CONSTRAINT IF EXISTS email_accounts_provider_check;

-- Add new constraint that includes 'smtp'
ALTER TABLE email_accounts 
ADD CONSTRAINT email_accounts_provider_check 
CHECK (provider IN ('gmail', 'outlook', 'imap', 'smtp'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'email_accounts'::regclass 
AND conname = 'email_accounts_provider_check';

