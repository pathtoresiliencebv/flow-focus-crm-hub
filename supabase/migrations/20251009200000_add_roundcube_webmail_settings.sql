-- Add Roundcube Webmail Configuration to Company Settings
-- ===========================================================

-- Add Roundcube webmail columns to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS roundcube_url TEXT,
ADD COLUMN IF NOT EXISTS roundcube_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_login_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webmail_type TEXT DEFAULT 'roundcube'; -- For future: roundcube, gmail, outlook, etc.

-- Add comment explaining the columns
COMMENT ON COLUMN public.company_settings.roundcube_url IS 'External Roundcube Webmail URL (e.g., https://webmail.smanscrm.nl)';
COMMENT ON COLUMN public.company_settings.roundcube_enabled IS 'Enable Roundcube webmail integration';
COMMENT ON COLUMN public.company_settings.auto_login_enabled IS 'Enable automatic login to Roundcube (requires SSO setup)';
COMMENT ON COLUMN public.company_settings.webmail_type IS 'Type of webmail service: roundcube, gmail, outlook, or custom';

-- The RLS policies are already in place for company_settings table
-- Users with proper permissions can read and update these settings

