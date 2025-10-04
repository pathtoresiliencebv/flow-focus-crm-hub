-- Update email account to use correct OX Mail servers
-- Run dit in Supabase SQL Editor

UPDATE email_accounts 
SET 
  imap_host = 'imap02.hostnet.nl',
  imap_port = 1143,
  smtp_host = 'smtp02.hostnet.nl',
  smtp_port = 25,
  smtp_encryption = 'none', -- Port 25 = plain or STARTTLS
  imap_encryption = 'none'  -- Port 1143 = plain or STARTTLS
WHERE email_address = 'info@smansonderhoud.nl';

-- Verify
SELECT 
  email_address,
  imap_host,
  imap_port,
  smtp_host,
  smtp_port
FROM email_accounts
WHERE email_address = 'info@smansonderhoud.nl';
