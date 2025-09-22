-- FASE 1: FIX AUTOMATIC TASK GENERATION TRIGGER
-- Ensure the trigger exists and works properly for quote approval

-- First check if trigger exists, if not create it
CREATE OR REPLACE FUNCTION public.auto_generate_project_tasks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  -- Check if quote status changed to approved and has associated project
  IF NEW.status = 'goedgekeurd' AND OLD.status != 'goedgekeurd' THEN
    -- Find associated project
    DECLARE
      project_record RECORD;
    BEGIN
      SELECT * INTO project_record 
      FROM public.projects 
      WHERE quote_id = NEW.id;
      
      IF FOUND THEN
        -- Generate tasks from quote
        PERFORM public.generate_project_tasks_from_quote(project_record.id, NEW.id);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_generate_project_tasks ON public.quotes;
CREATE TRIGGER trigger_auto_generate_project_tasks
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_project_tasks();

-- FASE 2: ENHANCE PROJECT MATERIALS TABLE
-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Check if material_name column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_materials' AND column_name='material_name') THEN
    ALTER TABLE public.project_materials ADD COLUMN material_name TEXT NOT NULL DEFAULT 'Onbekend materiaal';
  END IF;
  
  -- Check if supplier column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_materials' AND column_name='supplier') THEN
    ALTER TABLE public.project_materials ADD COLUMN supplier TEXT;
  END IF;

  -- Check if receipt_photo_url column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_materials' AND column_name='receipt_photo_url') THEN
    ALTER TABLE public.project_materials ADD COLUMN receipt_photo_url TEXT;
  END IF;
END $$;

-- Enable RLS on project_materials if not already enabled
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view project materials for accessible projects" ON public.project_materials;
DROP POLICY IF EXISTS "Users can create project materials" ON public.project_materials;
DROP POLICY IF EXISTS "Users can update project materials" ON public.project_materials;
DROP POLICY IF EXISTS "Users can delete project materials" ON public.project_materials;

-- Create comprehensive RLS policies for project_materials
CREATE POLICY "Users can view project materials for accessible projects"
ON public.project_materials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_materials.project_id
    AND (
      -- Admin and Administratie can see all
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      -- Installateur can see their assigned projects  
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Users can create project materials"
ON public.project_materials
FOR INSERT
WITH CHECK (
  added_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_materials.project_id
    AND (
      -- Admin and Administratie can add materials to any project
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      -- Installateur can add materials to their assigned projects
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Users can update project materials"
ON public.project_materials
FOR UPDATE
USING (
  (added_by = auth.uid() OR get_user_role(auth.uid()) IN ('Administrator', 'Administratie')) AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_materials.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Users can delete project materials"
ON public.project_materials
FOR DELETE
USING (
  (added_by = auth.uid() OR get_user_role(auth.uid()) IN ('Administrator', 'Administratie')) AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_materials.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

-- FASE 3: ENHANCE PLANNING SYSTEM
-- Update planning_items table to ensure proper structure
DO $$
BEGIN
  -- Check if project_id column is UUID type, if TEXT update it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='planning_items' AND column_name='project_id' AND data_type='text') THEN
    -- First make it nullable to allow conversion
    ALTER TABLE public.planning_items ALTER COLUMN project_id DROP NOT NULL;
    -- Then change type to UUID
    ALTER TABLE public.planning_items ALTER COLUMN project_id TYPE UUID USING project_id::UUID;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_planning_items_project_id ON public.planning_items(project_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_assigned_user ON public.planning_items(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_date ON public.planning_items(start_date);

-- FASE 4: PROJECT RECEIPTS TABLE
-- Create project_receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  receipt_date DATE DEFAULT CURRENT_DATE,
  supplier TEXT,
  total_amount NUMERIC(10,2),
  description TEXT,
  receipt_photo_url TEXT NOT NULL,
  category TEXT DEFAULT 'material' CHECK (category IN ('material', 'tools', 'other')),
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on project_receipts
ALTER TABLE public.project_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_receipts
DROP POLICY IF EXISTS "Users can view project receipts for accessible projects" ON public.project_receipts;
DROP POLICY IF EXISTS "Users can create project receipts" ON public.project_receipts;
DROP POLICY IF EXISTS "Users can update project receipts" ON public.project_receipts;
DROP POLICY IF EXISTS "Users can delete project receipts" ON public.project_receipts;

CREATE POLICY "Users can view project receipts for accessible projects"
ON public.project_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_receipts.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Users can create project receipts"
ON public.project_receipts
FOR INSERT
WITH CHECK (
  added_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_receipts.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Users can update project receipts"
ON public.project_receipts
FOR UPDATE
USING (
  (added_by = auth.uid() OR get_user_role(auth.uid()) IN ('Administrator', 'Administratie')) AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_receipts.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Users can delete project receipts"
ON public.project_receipts
FOR DELETE
USING (
  (added_by = auth.uid() OR get_user_role(auth.uid()) IN ('Administrator', 'Administratie')) AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_receipts.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
      (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_project_receipts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_project_receipts_updated_at ON public.project_receipts;
CREATE TRIGGER trigger_update_project_receipts_updated_at
  BEFORE UPDATE ON public.project_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_receipts_updated_at();