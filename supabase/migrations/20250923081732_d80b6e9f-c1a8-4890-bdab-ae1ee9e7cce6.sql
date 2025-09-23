-- Create company settings table
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Nederland',
  kvk_number TEXT,
  btw_number TEXT,
  general_terms TEXT,
  default_attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own company settings"
ON public.company_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create update trigger
CREATE OR REPLACE FUNCTION public.update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_company_settings_updated_at();

-- Add attachments column to quotes and invoices tables
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;