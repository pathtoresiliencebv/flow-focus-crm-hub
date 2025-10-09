-- Receipt Email Automation and Auto-Approval Enhancements
-- Phase 2.1: Database Schema Updates

-- Add new columns to receipts table
DO $$ 
BEGIN
  -- Add auto_approved column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='receipts' 
                 AND column_name='auto_approved') THEN
    ALTER TABLE public.receipts ADD COLUMN auto_approved BOOLEAN DEFAULT false;
  END IF;

  -- Add approval_rule_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='receipts' 
                 AND column_name='approval_rule_id') THEN
    ALTER TABLE public.receipts ADD COLUMN approval_rule_id UUID;
  END IF;
  
  -- Add is_archived column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='receipts' 
                 AND column_name='is_archived') THEN
    ALTER TABLE public.receipts ADD COLUMN is_archived BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create receipt_approval_rules table
CREATE TABLE IF NOT EXISTS public.receipt_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_amount DECIMAL(10,2), -- Maximum amount for auto-approval
  category TEXT, -- Category for auto-approval (null = all categories)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Specific user rule (null = all users)
  role TEXT, -- Specific role rule (null = all roles)
  auto_approve BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules are checked first
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create receipt_email_config table
CREATE TABLE IF NOT EXISTS public.receipt_email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT UNIQUE NOT NULL, -- e.g. bonnetjes@smanscrm.nl
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_username TEXT NOT NULL,
  imap_password TEXT NOT NULL, -- Should be encrypted in production
  imap_use_ssl BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_check_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  check_interval_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create receipt_processing_log table for debugging
CREATE TABLE IF NOT EXISTS public.receipt_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
  email_message_id TEXT,
  action TEXT NOT NULL, -- 'created', 'approved', 'rejected', 'auto_approved', 'error'
  details JSONB,
  error_message TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.receipt_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_processing_log ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint for approval_rule_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'receipts_approval_rule_id_fkey'
    AND table_name = 'receipts'
  ) THEN
    ALTER TABLE public.receipts 
    ADD CONSTRAINT receipts_approval_rule_id_fkey 
    FOREIGN KEY (approval_rule_id) 
    REFERENCES public.receipt_approval_rules(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- RLS Policies for receipt_approval_rules
CREATE POLICY "Admins can view all approval rules"
  ON public.receipt_approval_rules
  FOR SELECT
  USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

CREATE POLICY "Admins can manage approval rules"
  ON public.receipt_approval_rules
  FOR ALL
  USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'))
  WITH CHECK (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

-- RLS Policies for receipt_email_config
CREATE POLICY "Admins can view email config"
  ON public.receipt_email_config
  FOR SELECT
  USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

CREATE POLICY "Admins can manage email config"
  ON public.receipt_email_config
  FOR ALL
  USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'))
  WITH CHECK (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

-- RLS Policies for receipt_processing_log
CREATE POLICY "Admins can view processing log"
  ON public.receipt_processing_log
  FOR SELECT
  USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

CREATE POLICY "System can insert log entries"
  ON public.receipt_processing_log
  FOR INSERT
  WITH CHECK (true); -- Allow Edge Functions to insert logs

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_auto_approved ON public.receipts(auto_approved);
CREATE INDEX IF NOT EXISTS idx_receipts_is_archived ON public.receipts(is_archived);
CREATE INDEX IF NOT EXISTS idx_receipt_approval_rules_active ON public.receipt_approval_rules(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_email_config_active ON public.receipt_email_config(is_active);
CREATE INDEX IF NOT EXISTS idx_receipt_processing_log_receipt ON public.receipt_processing_log(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_processing_log_email ON public.receipt_processing_log(email_message_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_receipt_approval_rules_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_receipt_email_config_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_receipt_approval_rules_updated_at ON public.receipt_approval_rules;
CREATE TRIGGER trigger_update_receipt_approval_rules_updated_at
  BEFORE UPDATE ON public.receipt_approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_approval_rules_updated_at();

DROP TRIGGER IF EXISTS trigger_update_receipt_email_config_updated_at ON public.receipt_email_config;
CREATE TRIGGER trigger_update_receipt_email_config_updated_at
  BEFORE UPDATE ON public.receipt_email_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_email_config_updated_at();

-- Function to check if a receipt should be auto-approved
CREATE OR REPLACE FUNCTION public.check_receipt_auto_approval(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_category TEXT
)
RETURNS TABLE (
  should_auto_approve BOOLEAN,
  rule_id UUID,
  rule_name TEXT
) AS $$
DECLARE
  v_user_role TEXT;
  v_rule RECORD;
BEGIN
  -- Get user role
  SELECT get_user_role(p_user_id) INTO v_user_role;
  
  -- Find matching approval rule with highest priority
  FOR v_rule IN
    SELECT * FROM public.receipt_approval_rules
    WHERE is_active = true
      AND auto_approve = true
      -- Check amount limit
      AND (max_amount IS NULL OR p_amount IS NULL OR p_amount <= max_amount)
      -- Check category
      AND (category IS NULL OR category = p_category)
      -- Check user
      AND (user_id IS NULL OR user_id = p_user_id)
      -- Check role
      AND (role IS NULL OR role = v_user_role)
    ORDER BY priority DESC, created_at DESC
    LIMIT 1
  LOOP
    RETURN QUERY SELECT true, v_rule.id, v_rule.name;
    RETURN;
  END LOOP;
  
  -- No matching rule found
  RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log receipt processing
CREATE OR REPLACE FUNCTION public.log_receipt_processing(
  p_receipt_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL,
  p_email_message_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.receipt_processing_log (
    receipt_id,
    email_message_id,
    action,
    details,
    error_message,
    processed_by
  ) VALUES (
    p_receipt_id,
    p_email_message_id,
    p_action,
    p_details,
    p_error_message,
    p_processed_by
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default approval rules
INSERT INTO public.receipt_approval_rules (name, description, max_amount, auto_approve, priority)
VALUES 
  ('Auto-approve kleine bedragen', 'Bonnetjes tot €50 worden automatisch goedgekeurd', 50.00, true, 10),
  ('Auto-approve monteurs tot €200', 'Monteurs kunnen bonnetjes tot €200 automatisch laten goedkeuren', 200.00, true, 5)
ON CONFLICT DO NOTHING;

-- Comment on tables and important columns
COMMENT ON TABLE public.receipt_approval_rules IS 'Regels voor automatische goedkeuring van bonnetjes';
COMMENT ON TABLE public.receipt_email_config IS 'Email configuratie voor automatisch verwerken van bonnetjes via email';
COMMENT ON TABLE public.receipt_processing_log IS 'Log van alle bonnetjes verwerkingen voor debugging';
COMMENT ON COLUMN public.receipts.auto_approved IS 'Geeft aan of het bonnetje automatisch is goedgekeurd';
COMMENT ON COLUMN public.receipts.approval_rule_id IS 'Verwijzing naar de regel die automatische goedkeuring heeft getriggerd';

