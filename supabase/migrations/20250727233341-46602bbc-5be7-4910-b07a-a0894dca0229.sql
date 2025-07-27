-- Tighten RLS policies for better security

-- 1. Fix overly permissive invoices policies
DROP POLICY IF EXISTS "Enable all operations for invoices" ON public.invoices;

-- Add proper role-based policies for invoices
CREATE POLICY "Users can view invoices based on role"
ON public.invoices
FOR SELECT
USING (
  CASE 
    WHEN get_user_role(auth.uid()) = 'Administrator' THEN true
    WHEN get_user_role(auth.uid()) = 'Administratie' THEN true
    ELSE false
  END
);

CREATE POLICY "Admins and Administratie can create invoices"
ON public.invoices
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

CREATE POLICY "Admins and Administratie can update invoices"
ON public.invoices
FOR UPDATE
USING (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

CREATE POLICY "Only administrators can delete invoices"
ON public.invoices
FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);

-- 2. Tighten projects policies to be role-based
DROP POLICY IF EXISTS "Allow authenticated users to view projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON public.projects;

-- Add proper role-based policies for projects
CREATE POLICY "Users can view projects based on role"
ON public.projects
FOR SELECT
USING (
  CASE 
    WHEN get_user_role(auth.uid()) = 'Administrator' THEN true
    WHEN get_user_role(auth.uid()) = 'Administratie' THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN 
      -- Installateurs can only see projects assigned to them
      EXISTS (
        SELECT 1 FROM public.project_personnel pp 
        WHERE pp.project_id = projects.id AND pp.user_id = auth.uid()
      )
    ELSE false
  END
);

CREATE POLICY "Admins and Administratie can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

CREATE POLICY "Authorized users can update projects"
ON public.projects
FOR UPDATE
USING (
  CASE 
    WHEN get_user_role(auth.uid()) IN ('Administrator', 'Administratie') THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN 
      -- Installateurs can update status of their assigned projects
      EXISTS (
        SELECT 1 FROM public.project_personnel pp 
        WHERE pp.project_id = projects.id AND pp.user_id = auth.uid()
      )
    ELSE false
  END
);

CREATE POLICY "Only administrators can delete projects"
ON public.projects
FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);