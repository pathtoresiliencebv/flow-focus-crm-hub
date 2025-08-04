-- Email queue system for Supabase-based email handling

-- Email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL DEFAULT 'noreply@smanscrm.nl',
  subject VARCHAR(500) NOT NULL,
  html_content TEXT,
  text_content TEXT,
  email_type VARCHAR(100) NOT NULL, -- 'project_completion', 'welcome', 'notification', etc.
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'sent', 'failed', 'cancelled'
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL UNIQUE,
  subject_template VARCHAR(500) NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of required variables
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications_enabled BOOLEAN DEFAULT true,
  project_completion_emails BOOLEAN DEFAULT true,
  daily_digest_emails BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  email_frequency VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_type ON email_queue(email_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_to_email ON email_queue(to_email);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_queue
CREATE POLICY "Service role can manage all emails" ON email_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all emails" ON email_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Administrator', 'Administratie')
    )
  );

-- RLS Policies for email_templates
CREATE POLICY "Everyone can view active templates" ON email_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Administrator'
    )
  );

-- RLS Policies for email_settings
CREATE POLICY "Users can manage their own email settings" ON email_settings
  FOR ALL USING (auth.uid() = user_id);

-- Insert default email templates
INSERT INTO email_templates (template_name, subject_template, html_template, text_template, variables, description) VALUES
(
  'project_completion',
  'Werkrapport: {{project_title}} - Project Afgerond ✅',
  '<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <title>Werkrapport - {{project_title}}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px 20px; border: 1px solid #e2e8f0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏠 Project Afgerond!</h1>
        <p>Uw werkrapport is gereed</p>
    </div>
    <div class="content">
        <p>Beste {{customer_name}},</p>
        <p>Het project "{{project_title}}" is succesvol afgerond op {{completion_date}}.</p>
        <p><strong>Adres:</strong> {{project_address}}</p>
        <p><strong>Monteur:</strong> {{installer_name}}</p>
        <p><strong>Tevredenheid:</strong> {{customer_satisfaction}}/5 sterren</p>
        <p><strong>Uitgevoerde werkzaamheden:</strong></p>
        <p>{{work_performed}}</p>
        {{#if recommendations}}
        <p><strong>Aanbevelingen:</strong></p>
        <p>{{recommendations}}</p>
        {{/if}}
        <p><a href="{{pdf_url}}" style="background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">📄 Bekijk Volledig Werkrapport</a></p>
        <p>Hartelijk dank voor het vertrouwen in onze dienstverlening.</p>
        <p>Met vriendelijke groet,<br><strong>Het team van Smans CRM</strong></p>
    </div>
    <div class="footer">
        <p><strong>Smans CRM</strong></p>
        <p>📧 info@smanscrm.nl | 📞 020-1234567</p>
    </div>
</body>
</html>',
  'PROJECT AFGEROND - WERKRAPPORT

Beste {{customer_name}},

Het project "{{project_title}}" is succesvol afgerond op {{completion_date}}.

PROJECTDETAILS:
- Adres: {{project_address}}
- Monteur: {{installer_name}}
- Tevredenheid: {{customer_satisfaction}}/5 sterren

UITGEVOERDE WERKZAAMHEDEN:
{{work_performed}}

{{#if recommendations}}
AANBEVELINGEN:
{{recommendations}}
{{/if}}

VOLLEDIG WERKRAPPORT:
{{pdf_url}}

Hartelijk dank voor het vertrouwen in onze dienstverlening.

Met vriendelijke groet,
Het team van Smans CRM',
  '["customer_name", "project_title", "completion_date", "project_address", "installer_name", "customer_satisfaction", "work_performed", "recommendations", "pdf_url"]',
  'Email template voor project afronding rapporten'
),
(
  'welcome',
  'Welkom bij Smans CRM - {{user_name}}',
  '<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><title>Welkom bij Smans CRM</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #3b82f6;">Welkom bij Smans CRM!</h1>
    <p>Beste {{user_name}},</p>
    <p>Welkom bij het Smans CRM systeem. Uw account is succesvol aangemaakt.</p>
    <p><strong>Uw rol:</strong> {{user_role}}</p>
    <p>U kunt nu inloggen op het systeem en aan de slag gaan.</p>
    <p>Met vriendelijke groet,<br>Het Smans CRM team</p>
</body>
</html>',
  'Welkom bij Smans CRM!

Beste {{user_name}},

Welkom bij het Smans CRM systeem. Uw account is succesvol aangemaakt.

Uw rol: {{user_role}}

U kunt nu inloggen op het systeem en aan de slag gaan.

Met vriendelijke groet,
Het Smans CRM team',
  '["user_name", "user_role"]',
  'Welkomstmail voor nieuwe gebruikers'
)
ON CONFLICT (template_name) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
  email_record RECORD;
BEGIN
  -- Process queued emails (in a real implementation, this would integrate with an email service)
  FOR email_record IN 
    SELECT * FROM email_queue 
    WHERE status = 'queued' 
    AND retry_count < max_retries
    ORDER BY created_at ASC
    LIMIT 10
  LOOP
    -- Mark as sent (in production, this would actually send the email)
    UPDATE email_queue 
    SET 
      status = 'sent',
      sent_at = NOW(),
      updated_at = NOW()
    WHERE id = email_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get email statistics
CREATE OR REPLACE FUNCTION get_email_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_emails BIGINT,
  sent_emails BIGINT,
  failed_emails BIGINT,
  queued_emails BIGINT,
  completion_emails BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
    COUNT(*) FILTER (WHERE status = 'queued') as queued_emails,
    COUNT(*) FILTER (WHERE email_type = 'project_completion') as completion_emails
  FROM email_queue
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_email_queue_updated_at 
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at 
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create default email settings for existing users
INSERT INTO email_settings (user_id, email_notifications_enabled, project_completion_emails)
SELECT id, true, true FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM email_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;