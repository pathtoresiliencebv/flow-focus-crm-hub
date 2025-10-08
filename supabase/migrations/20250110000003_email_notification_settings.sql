-- Email notification settings per organization/admin
-- This table stores customizable email templates for system notifications

CREATE TABLE IF NOT EXISTS public.email_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Email content for "project planned"
  planning_email_enabled BOOLEAN DEFAULT true,
  planning_email_subject TEXT DEFAULT 'Uw project is ingepland',
  planning_email_body TEXT DEFAULT 'Beste {customer_name},

Uw project "{project_title}" is ingepland.

📅 Datum: {planning_date}
⏰ Tijd: {planning_time}
👷 Monteur: {monteur_name}
📍 Locatie: {project_location}

Wij zien u graag tegemoet!

Met vriendelijke groet,
SMANS BV',

  -- Email content for "project completed"
  completion_email_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Only one settings record
  CONSTRAINT single_settings_record CHECK (id = id)
);

-- Insert default settings
INSERT INTO public.email_notification_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.email_notification_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view email settings
CREATE POLICY "Admins can view email settings"
ON public.email_notification_settings FOR SELECT
USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

-- Admins can update email settings
CREATE POLICY "Admins can update email settings"
ON public.email_notification_settings FOR UPDATE
USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

-- Add comment
COMMENT ON TABLE public.email_notification_settings IS 'Stores customizable email notification templates for planning and completion emails';

