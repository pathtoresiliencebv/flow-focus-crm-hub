-- Create notification templates table for email and system notifications
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'email', -- 'email', 'push', 'system'
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification rules for smart filtering
CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'project_status', 'time_based', 'user_action', etc.
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_users TEXT[] DEFAULT '{}', -- empty array means all users
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email queue for delayed/scheduled email sending
CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  template_id UUID REFERENCES notification_templates(id),
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  template_variables JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend notification_preferences with more granular options
ALTER TABLE public.notification_preferences 
ADD COLUMN browser_notifications BOOLEAN DEFAULT true,
ADD COLUMN email_digest_frequency TEXT DEFAULT 'daily', -- 'immediate', 'hourly', 'daily', 'weekly', 'never'
ADD COLUMN quiet_hours_start TIME DEFAULT '22:00',
ADD COLUMN quiet_hours_end TIME DEFAULT '08:00',
ADD COLUMN weekend_notifications BOOLEAN DEFAULT false,
ADD COLUMN notification_sound BOOLEAN DEFAULT true,
ADD COLUMN marketing_emails BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates (admin only for management)
CREATE POLICY "Admins can manage notification templates" 
ON public.notification_templates 
FOR ALL 
USING (get_user_role(auth.uid()) = 'Administrator'::user_role);

CREATE POLICY "All users can view active templates" 
ON public.notification_templates 
FOR SELECT 
USING (is_active = true);

-- RLS policies for notification_rules (admin only)
CREATE POLICY "Admins can manage notification rules" 
ON public.notification_rules 
FOR ALL 
USING (get_user_role(auth.uid()) = 'Administrator'::user_role);

-- RLS policies for email_queue (users can view their own emails, admins can manage all)
CREATE POLICY "Users can view their own queued emails" 
ON public.email_queue 
FOR SELECT 
USING (recipient_email IN (
  SELECT email FROM auth.users WHERE id = auth.uid()
));

CREATE POLICY "Admins can manage email queue" 
ON public.email_queue 
FOR ALL 
USING (get_user_role(auth.uid()) = 'Administrator'::user_role);

-- Create function to update timestamps
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_rules_updated_at
BEFORE UPDATE ON public.notification_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default notification templates
INSERT INTO public.notification_templates (name, description, template_type, subject_template, body_template, variables) VALUES
('project_status_change', 'Notify when project status changes', 'email', 'Project {{project_title}} status update', 'The project "{{project_title}}" status has been changed to {{new_status}}.', '["project_title", "new_status", "customer_name"]'),
('new_project_assigned', 'Notify when user is assigned to a project', 'email', 'New project assignment: {{project_title}}', 'You have been assigned to the project "{{project_title}}" for customer {{customer_name}}.', '["project_title", "customer_name", "due_date"]'),
('quote_approved', 'Notify when quote is approved by client', 'email', 'Quote {{quote_number}} has been approved', 'Great news! Quote {{quote_number}} for "{{project_title}}" has been approved by the client.', '["quote_number", "project_title", "customer_name", "total_amount"]'),
('system_maintenance', 'System maintenance notifications', 'push', 'System Maintenance', 'System maintenance is scheduled for {{maintenance_date}}.', '["maintenance_date", "duration"]');

-- Insert default notification rules
INSERT INTO public.notification_rules (name, description, rule_type, conditions, actions) VALUES
('urgent_project_deadline', 'Notify about urgent project deadlines', 'time_based', '{"days_before_deadline": 1, "project_status": ["in-uitvoering", "gepland"]}', '{"send_email": true, "send_push": true, "template": "project_deadline_reminder"}'),
('new_chat_message', 'Notify about new chat messages', 'user_action', '{"action": "chat_message", "exclude_sender": true}', '{"send_push": true, "template": "new_chat_message"}'),
('quote_expiry_warning', 'Warn about expiring quotes', 'time_based', '{"days_before_expiry": 3, "quote_status": ["sent"]}', '{"send_email": true, "template": "quote_expiry_warning"}');