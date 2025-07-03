-- Enhanced project delivery workflow
-- Create project deliveries table for tracking complete delivery process
CREATE TABLE public.project_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  delivered_by uuid NOT NULL, -- References profiles via user_id
  client_name text NOT NULL,
  delivery_summary text NOT NULL,
  client_signature_data text,
  monteur_signature_data text,
  delivery_photos jsonb DEFAULT '[]'::jsonb,
  delivered_at timestamp with time zone DEFAULT now(),
  work_report_generated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on project deliveries
ALTER TABLE public.project_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies for project deliveries
CREATE POLICY "Users can view project deliveries for accessible projects" 
ON public.project_deliveries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_deliveries.project_id
  )
);

CREATE POLICY "Users can create project deliveries" 
ON public.project_deliveries 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_deliveries.project_id
  )
);

CREATE POLICY "Users can update project deliveries" 
ON public.project_deliveries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_deliveries.project_id
  )
);

-- Enhance existing project_work_orders table with delivery features
ALTER TABLE public.project_work_orders 
ADD COLUMN IF NOT EXISTS monteur_signature_data text,
ADD COLUMN IF NOT EXISTS delivery_photos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_delivery_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_id uuid REFERENCES public.project_deliveries(id);

-- Create function to update project status when delivery is created
CREATE OR REPLACE FUNCTION public.update_project_status_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Update project status to 'afgerond' when delivery is completed
  UPDATE public.projects 
  SET 
    status = 'afgerond',
    updated_at = now()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic project status update
CREATE TRIGGER trigger_update_project_status_on_delivery
  AFTER INSERT ON public.project_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_status_on_delivery();

-- Create function to start project (change status to in-uitvoering)
CREATE OR REPLACE FUNCTION public.start_project(p_project_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update project status to 'in-uitvoering'
  UPDATE public.projects 
  SET 
    status = 'in-uitvoering',
    updated_at = now()
  WHERE id = p_project_id;
  
  -- You could add logging or notifications here
END;
$$;

-- Add trigger for updated_at on project_deliveries
CREATE TRIGGER update_project_deliveries_updated_at
  BEFORE UPDATE ON public.project_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();