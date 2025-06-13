
-- Create table for user email settings
CREATE TABLE public.user_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_address TEXT NOT NULL,
  display_name TEXT NOT NULL,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, email_address)
);

-- Create table for emails
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_settings_id UUID REFERENCES public.user_email_settings(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT,
  subject TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  reply_to TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'inbox',
  labels TEXT[] DEFAULT '{}',
  thread_id TEXT,
  in_reply_to TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '{}',
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_email_settings
CREATE POLICY "Users can view their own email settings" ON public.user_email_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email settings" ON public.user_email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email settings" ON public.user_email_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email settings" ON public.user_email_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for emails
CREATE POLICY "Users can view their own emails" ON public.emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails" ON public.emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails" ON public.emails
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails" ON public.emails
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for email_templates
CREATE POLICY "Users can view their own email templates" ON public.email_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email templates" ON public.email_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates" ON public.email_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates" ON public.email_templates
  FOR DELETE USING (auth.uid() = user_id);
