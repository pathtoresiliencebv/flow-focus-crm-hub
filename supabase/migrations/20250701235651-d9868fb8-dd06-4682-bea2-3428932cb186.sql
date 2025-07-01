-- Fase 1: Database & Backend Uitbreiding voor Offerte-naar-Project Workflow

-- 1. Uitbreiding van projects table met nieuwe statussen en velden
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_user_id uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_status text DEFAULT 'te-plannen';

-- Update project_status enum om nieuwe statussen te ondersteunen
-- We gebruiken een text veld voor flexibiliteit
COMMENT ON COLUMN public.projects.project_status IS 'Status: te-plannen, ingepland, onderweg, bezig, wacht-op-review, afgerond, deel-oplevering';

-- 2. Nieuwe project_tasks table voor afvinkbare taken per project
CREATE TABLE public.project_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  block_title text NOT NULL,
  task_description text,
  is_info_block boolean DEFAULT false,
  info_text text,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  source_quote_item_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies voor project_tasks
CREATE POLICY "Users can view project tasks" 
ON public.project_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_tasks.project_id
  )
);

CREATE POLICY "Users can manage project tasks" 
ON public.project_tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_tasks.project_id
  )
);

-- 3. Uitbreiding van quotes table met handtekening velden (al aanwezig, maar toevoegen als ontbreekt)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_signature_data text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_signed_at timestamp with time zone;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS admin_signature_data text;

-- 4. Nieuwe project_registrations table voor uren/materialen bijhouden
CREATE TABLE public.project_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  registration_type text NOT NULL, -- 'hours', 'materials', 'photos'
  description text,
  quantity numeric,
  unit_price numeric,
  total_cost numeric,
  hours_type text, -- 'travel', 'work', 'overtime'
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  photo_url text,
  is_approved boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for project_registrations
ALTER TABLE public.project_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies voor project_registrations
CREATE POLICY "Users can view project registrations" 
ON public.project_registrations 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_registrations.project_id
  )
);

CREATE POLICY "Users can create project registrations" 
ON public.project_registrations 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their project registrations" 
ON public.project_registrations 
FOR UPDATE 
USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'Administrator');

-- 5. Project work orders table voor digitale werkbonnen
CREATE TABLE public.project_work_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  work_order_number text UNIQUE NOT NULL,
  client_signature_data text,
  client_name text,
  signed_at timestamp with time zone,
  work_photos jsonb DEFAULT '[]',
  summary_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for project_work_orders
ALTER TABLE public.project_work_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies voor project_work_orders
CREATE POLICY "Users can manage work orders" 
ON public.project_work_orders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_work_orders.project_id
  )
);

-- 6. Update triggers voor timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers voor project_tasks
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers voor project_registrations
CREATE TRIGGER update_project_registrations_updated_at
  BEFORE UPDATE ON public.project_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers voor project_work_orders
CREATE TRIGGER update_project_work_orders_updated_at
  BEFORE UPDATE ON public.project_work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Function voor genereren van work order nummers
CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  work_order_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN work_order_number ~ ('^WO-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(work_order_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.project_work_orders
  WHERE work_order_number LIKE ('WO-' || current_year || '-%');
  
  -- Format as WO-YYYY-NNNN
  work_order_number := 'WO-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN work_order_number;
END;
$function$;