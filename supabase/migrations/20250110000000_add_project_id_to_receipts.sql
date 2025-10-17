-- Add project_id column to receipts table
-- This allows receipts to be linked to specific projects

-- Add project_id column to receipts table if it doesn't exist
DO $$ 
BEGIN
  -- Check if project_id column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='receipts' 
                 AND column_name='project_id') THEN
    ALTER TABLE public.receipts ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance on project_id lookups
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON public.receipts(project_id);

-- Update RLS policies to include project-based access
-- Users can view receipts for projects they have access to
DROP POLICY IF EXISTS "Users can view receipts" ON public.receipts;
CREATE POLICY "Users can view receipts" 
ON public.receipts 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie') OR
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = receipts.project_id 
    AND (
      p.assigned_user_id = auth.uid() OR 
      p.user_id = auth.uid() OR
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
    )
  ))
);

-- Users can create receipts for projects they have access to
DROP POLICY IF EXISTS "Users can create their own receipts" ON public.receipts;
CREATE POLICY "Users can create their own receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (project_id IS NULL OR EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = receipts.project_id 
    AND (
      p.assigned_user_id = auth.uid() OR 
      p.user_id = auth.uid() OR
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
    )
  ))
);
