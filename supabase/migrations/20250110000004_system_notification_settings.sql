-- System notification settings for SMTP and SMS
-- Stores credentials and configuration for email and SMS services

CREATE TABLE IF NOT EXISTS public.system_notification_settings (
  id UUID DEFAULT '00000000-0000-0000-0000-000000000001' PRIMARY KEY,
  
  -- SMTP Settings
  smtp_enabled BOOLEAN DEFAULT true,
  smtp_host TEXT DEFAULT 'smtp.hostnet.nl',
  smtp_port INTEGER DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT false, -- Use STARTTLS
  smtp_user TEXT DEFAULT 'info@smansonderhoud.nl',
  smtp_from_email TEXT DEFAULT 'info@smansonderhoud.nl',
  smtp_from_name TEXT DEFAULT 'SMANS Onderhoud',
  smtp_test_email TEXT, -- For testing SMTP connection
  smtp_last_test_at TIMESTAMPTZ,
  smtp_last_test_success BOOLEAN,
  smtp_last_test_error TEXT,
  
  -- SMS Settings  
  sms_enabled BOOLEAN DEFAULT false,
  sms_provider TEXT DEFAULT 'messagebird', -- messagebird, twilio, etc
  sms_from_number TEXT,
  sms_test_number TEXT, -- For testing SMS
  sms_last_test_at TIMESTAMPTZ,
  sms_last_test_success BOOLEAN,
  sms_last_test_error TEXT,
  
  -- Notification Toggles
  notify_planning_email BOOLEAN DEFAULT true,
  notify_planning_sms BOOLEAN DEFAULT false,
  notify_completion_email BOOLEAN DEFAULT true,
  notify_completion_sms BOOLEAN DEFAULT false,
  notify_receipt_approval_email BOOLEAN DEFAULT true,
  notify_quote_approval_email BOOLEAN DEFAULT true,
  notify_invoice_sent_email BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.system_notification_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view system settings
CREATE POLICY "Admins can view system notification settings"
ON public.system_notification_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'Administrator'
  )
);

-- Only admins can update system settings
CREATE POLICY "Admins can update system notification settings"
ON public.system_notification_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'Administrator'
  )
);

-- Add comment
COMMENT ON TABLE public.system_notification_settings IS 'System-wide notification settings including SMTP and SMS configuration';

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_system_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_notification_settings_updated_at
BEFORE UPDATE ON public.system_notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_notification_settings_updated_at();

