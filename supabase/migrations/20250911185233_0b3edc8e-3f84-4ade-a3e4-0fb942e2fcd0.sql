-- Create quote_templates table
CREATE TABLE public.quote_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  template_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'general'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for quote_templates
CREATE POLICY "Users can view their own templates" 
ON public.quote_templates 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own templates" 
ON public.quote_templates 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" 
ON public.quote_templates 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" 
ON public.quote_templates 
FOR DELETE 
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quote_templates_updated_at
BEFORE UPDATE ON public.quote_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();