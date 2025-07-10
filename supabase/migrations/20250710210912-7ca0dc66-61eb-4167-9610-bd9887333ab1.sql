-- Create audit logs table for comprehensive tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity VARCHAR(20) DEFAULT 'info',
  compliance_relevant BOOLEAN DEFAULT false
);

-- Create consent records table for GDPR compliance
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  purpose TEXT NOT NULL,
  given_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  consent_source VARCHAR(100),
  legal_basis VARCHAR(100),
  data_categories TEXT[],
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data retention policies table
CREATE TABLE public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name VARCHAR(255) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  retention_period_days INTEGER NOT NULL,
  description TEXT,
  legal_basis TEXT,
  automatic_deletion BOOLEAN DEFAULT true,
  archive_before_deletion BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create privacy settings table
CREATE TABLE public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  data_processing_consent JSONB DEFAULT '{}',
  marketing_consent BOOLEAN DEFAULT false,
  analytics_consent BOOLEAN DEFAULT false,
  third_party_sharing BOOLEAN DEFAULT false,
  data_export_requests JSONB DEFAULT '[]',
  deletion_requests JSONB DEFAULT '[]',
  privacy_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance events table
CREATE TABLE public.compliance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  resource_affected VARCHAR(100),
  compliance_standard VARCHAR(100),
  remediation_required BOOLEAN DEFAULT false,
  remediation_status VARCHAR(50) DEFAULT 'pending',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_consent_records_user_id ON public.consent_records(user_id);
CREATE INDEX idx_consent_records_consent_type ON public.consent_records(consent_type);
CREATE INDEX idx_compliance_events_event_type ON public.compliance_events(event_type);
CREATE INDEX idx_compliance_events_detected_at ON public.compliance_events(detected_at);

-- Enable RLS on all tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs FOR SELECT 
USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage audit logs" 
ON public.audit_logs FOR ALL 
USING (get_user_role(auth.uid()) = 'Administrator');

-- RLS policies for consent_records
CREATE POLICY "Users can manage their own consent records" 
ON public.consent_records FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all consent records" 
ON public.consent_records FOR SELECT 
USING (get_user_role(auth.uid()) = 'Administrator');

-- RLS policies for data_retention_policies
CREATE POLICY "Admins can manage retention policies" 
ON public.data_retention_policies FOR ALL 
USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "All users can view active retention policies" 
ON public.data_retention_policies FOR SELECT 
USING (is_active = true);

-- RLS policies for privacy_settings
CREATE POLICY "Users can manage their own privacy settings" 
ON public.privacy_settings FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- RLS policies for compliance_events
CREATE POLICY "Admins can manage compliance events" 
ON public.compliance_events FOR ALL 
USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Users can view compliance events related to them" 
ON public.compliance_events FOR SELECT 
USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'Administrator');

-- Create trigger for updating timestamps
CREATE TRIGGER update_consent_records_updated_at
BEFORE UPDATE ON public.consent_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
BEFORE UPDATE ON public.data_retention_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
BEFORE UPDATE ON public.privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();